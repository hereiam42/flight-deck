import Anthropic from 'npm:@anthropic-ai/sdk@0.30.0'
import { createClient } from 'jsr:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const runStartedAt = Date.now()
  let runId: string | null = null

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  )

  const anthropic = new Anthropic({
    apiKey: Deno.env.get('ANTHROPIC_API_KEY')!,
  })

  try {
    const body = await req.json()
    const { agent_id, input, triggered_by = 'manual', workflow_id } = body

    if (!agent_id) {
      return new Response(JSON.stringify({ error: 'agent_id is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // ---- 1. Load agent config ----
    const { data: agent, error: agentError } = await supabase
      .from('agents')
      .select('*')
      .eq('id', agent_id)
      .single()

    if (agentError || !agent) {
      return new Response(JSON.stringify({ error: 'Agent not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (agent.status !== 'active') {
      return new Response(JSON.stringify({ error: `Agent is ${agent.status}` }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // ---- 2. Create run record ----
    const { data: run, error: runCreateError } = await supabase
      .from('runs')
      .insert({
        agent_id,
        workflow_id: workflow_id ?? null,
        workspace_id: agent.workspace_id,
        input: input ?? {},
        status: 'running',
        triggered_by,
      })
      .select()
      .single()

    if (runCreateError || !run) {
      throw new Error(`Failed to create run: ${runCreateError?.message}`)
    }
    runId = run.id

    // ---- 3. Resolve tool definitions ----
    const toolRefs: Array<{ tool_id?: string; name: string; description?: string }> =
      Array.isArray(agent.tools) ? agent.tools : []

    const toolDefinitions: Anthropic.Tool[] = []
    const toolConfigs: Record<string, { config: unknown; auth_method: string | null }> = {}

    if (toolRefs.length > 0) {
      const toolIds = toolRefs.map((t) => t.tool_id).filter(Boolean)
      if (toolIds.length > 0) {
        const { data: tools } = await supabase
          .from('tools')
          .select('*')
          .in('id', toolIds)
          .eq('status', 'active')

        for (const tool of tools ?? []) {
          const cfg = tool.config as {
            endpoint?: string
            input_schema?: Anthropic.Tool['input_schema']
            description?: string
          }
          toolDefinitions.push({
            name: tool.name,
            description: cfg.description ?? `Tool: ${tool.name}`,
            input_schema: cfg.input_schema ?? {
              type: 'object',
              properties: {},
            },
          })
          toolConfigs[tool.name] = {
            config: tool.config,
            auth_method: tool.auth_method,
          }
        }
      }
    }

    // ---- 4. Build initial messages ----
    const userContent = typeof input === 'string'
      ? input
      : JSON.stringify(input ?? {})

    const messages: Anthropic.MessageParam[] = [
      { role: 'user', content: userContent },
    ]

    // ---- 5. Agentic loop ----
    let totalInputTokens = 0
    let totalOutputTokens = 0
    let finalOutput: unknown = null
    const MAX_ITERATIONS = 10

    for (let i = 0; i < MAX_ITERATIONS; i++) {
      const response = await anthropic.messages.create({
        model: agent.model,
        max_tokens: 8192,
        system: agent.system_prompt,
        tools: toolDefinitions.length > 0 ? toolDefinitions : undefined,
        messages,
      })

      totalInputTokens += response.usage.input_tokens
      totalOutputTokens += response.usage.output_tokens

      // Append assistant response to messages
      messages.push({ role: 'assistant', content: response.content })

      if (response.stop_reason === 'end_turn') {
        // Extract text output
        const textBlock = response.content.find((b): b is Anthropic.TextBlock => b.type === 'text')
        finalOutput = textBlock?.text ?? null
        break
      }

      if (response.stop_reason === 'tool_use') {
        const toolResults: Anthropic.ToolResultBlockParam[] = []

        for (const block of response.content) {
          if (block.type !== 'tool_use') continue

          const toolResult = await executeTool(block, toolConfigs, supabase, agent.workspace_id)
          toolResults.push({
            type: 'tool_result',
            tool_use_id: block.id,
            content: toolResult,
          })
        }

        messages.push({ role: 'user', content: toolResults })
      } else {
        // Unexpected stop reason
        break
      }
    }

    const durationMs = Date.now() - runStartedAt
    const tokenCount = totalInputTokens + totalOutputTokens

    // Rough cost estimate for claude-sonnet-4-6 ($3/$15 per MTok in/out)
    const costUsd = (totalInputTokens * 3 + totalOutputTokens * 15) / 1_000_000

    // ---- 6. Update run record ----
    await supabase
      .from('runs')
      .update({
        output: finalOutput,
        status: 'completed',
        duration_ms: durationMs,
        token_count: tokenCount,
        cost_usd: costUsd,
        completed_at: new Date().toISOString(),
      })
      .eq('id', runId)

    // ---- 7. Auto-create notification if output needs review ----
    if (needsHumanReview(finalOutput)) {
      await supabase.from('notifications').insert({
        workspace_id: agent.workspace_id,
        agent_id: agent.id,
        run_id: runId,
        type: 'approval_required',
        title: `${agent.name} completed — review required`,
        payload: { output: finalOutput },
      })
    }

    return new Response(
      JSON.stringify({ run_id: runId, output: finalOutput, token_count: tokenCount, cost_usd: costUsd }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)

    // Mark run as failed if we created one
    if (runId) {
      await supabase
        .from('runs')
        .update({
          status: 'failed',
          error: message,
          duration_ms: Date.now() - runStartedAt,
          completed_at: new Date().toISOString(),
        })
        .eq('id', runId)
    }

    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})

// ---- Tool executor ----

async function executeTool(
  block: Anthropic.ToolUseBlock,
  toolConfigs: Record<string, { config: unknown; auth_method: string | null }>,
  // deno-lint-ignore no-explicit-any
  supabase: any,
  workspaceId: string,
): Promise<string> {
  const cfg = toolConfigs[block.name]
  if (!cfg) {
    return JSON.stringify({ error: `Tool "${block.name}" not found in this agent's tool set` })
  }

  const toolConfig = cfg.config as {
    endpoint?: string
    method?: string
    headers_template?: Record<string, string>
    secret_key?: string  // key name in secrets table
  }

  if (!toolConfig.endpoint) {
    return JSON.stringify({ error: `Tool "${block.name}" has no endpoint configured` })
  }

  try {
    // Resolve secret value if needed
    let resolvedHeaders: Record<string, string> = {}
    if (toolConfig.headers_template) {
      resolvedHeaders = { ...toolConfig.headers_template }

      // Replace {{SECRET:key_name}} placeholders
      for (const [headerName, headerValue] of Object.entries(resolvedHeaders)) {
        const secretMatch = headerValue.match(/\{\{SECRET:(.+?)\}\}/)
        if (secretMatch) {
          const secretKey = secretMatch[1]
          const { data: secret } = await supabase
            .from('secrets')
            .select('encrypted_value')
            .eq('workspace_id', workspaceId)
            .eq('key', secretKey)
            .single()

          resolvedHeaders[headerName] = secret?.encrypted_value ?? headerValue
        }
      }
    }

    const method = (toolConfig.method ?? 'POST').toUpperCase()
    const input = block.input as Record<string, unknown>

    let url = toolConfig.endpoint
    let body: string | undefined

    if (method === 'GET' && Object.keys(input).length > 0) {
      const params = new URLSearchParams(
        Object.entries(input).map(([k, v]) => [k, String(v)]),
      )
      url = `${url}?${params}`
    } else if (method !== 'GET') {
      body = JSON.stringify(input)
      resolvedHeaders['Content-Type'] = 'application/json'
    }

    const res = await fetch(url, {
      method,
      headers: resolvedHeaders,
      body,
    })

    const responseText = await res.text()

    if (!res.ok) {
      return JSON.stringify({ error: `HTTP ${res.status}`, body: responseText })
    }

    // Try to parse as JSON, fall back to text
    try {
      return JSON.stringify(JSON.parse(responseText))
    } catch {
      return responseText
    }
  } catch (err) {
    return JSON.stringify({ error: err instanceof Error ? err.message : String(err) })
  }
}

// ---- Heuristic: does this output need human review? ----

function needsHumanReview(output: unknown): boolean {
  if (!output || typeof output !== 'string') return false
  const lower = output.toLowerCase()
  return (
    lower.includes('approval required') ||
    lower.includes('please review') ||
    lower.includes('needs human') ||
    lower.includes('action required')
  )
}
