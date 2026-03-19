import Anthropic from 'npm:@anthropic-ai/sdk@0.30.0'
import { createClient } from 'jsr:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// ---- Tool type definitions ----

interface ToolDef {
  name: string
  type: 'database_read' | 'database_write' | 'web_search' | 'send_notification'
  config: Record<string, unknown>
}

interface ToolCallLog {
  tool_name: string
  tool_type: string
  input: unknown
  output: unknown
  duration_ms: number
  tier: number
}

// ---- Input schemas per tool type ----

function buildAnthropicTools(toolDefs: ToolDef[]): Anthropic.Tool[] {
  return toolDefs.map((t) => {
    switch (t.type) {
      case 'database_read':
        return {
          name: t.name,
          description: (t.config.description as string) ?? `Read from ${t.config.table}`,
          input_schema: {
            type: 'object' as const,
            properties: {
              select: { type: 'string', description: 'Comma-separated columns to select. Default: *' },
              filter: {
                type: 'object',
                description: 'Key-value pairs for eq filters. e.g. {"status": "active", "email": "foo@bar.com"}',
              },
              ilike: {
                type: 'object',
                description: 'Key-value pairs for ilike (case-insensitive partial match) filters. e.g. {"email": "%@gmail.com"}',
              },
              order: { type: 'string', description: 'Column to order by. Prefix with - for descending. e.g. "-created_at"' },
              limit: { type: 'number', description: 'Max rows to return. Default: 50' },
            },
          },
        }
      case 'database_write':
        return {
          name: t.name,
          description: (t.config.description as string) ?? `Write to ${t.config.table}`,
          input_schema: {
            type: 'object' as const,
            properties: {
              data: {
                type: 'object',
                description: 'The row data to insert or update. For update, include the filter fields too.',
              },
              match: {
                type: 'object',
                description: 'For update/upsert: key-value pairs identifying which row(s) to match.',
              },
            },
            required: ['data'],
          },
        }
      case 'web_search':
        return {
          name: t.name,
          description: (t.config.description as string) ?? 'Search the web',
          input_schema: {
            type: 'object' as const,
            properties: {
              query: { type: 'string', description: 'The search query' },
              num_results: { type: 'number', description: 'Number of results. Default: 5' },
            },
            required: ['query'],
          },
        }
      case 'send_notification':
        return {
          name: t.name,
          description: (t.config.description as string) ?? 'Send a notification for human review',
          input_schema: {
            type: 'object' as const,
            properties: {
              title: { type: 'string', description: 'Notification title' },
              message: { type: 'string', description: 'Notification body/details' },
              type: { type: 'string', description: 'Notification type: info, warning, approval_required, critical_approval' },
            },
            required: ['title'],
          },
        }
      default:
        return {
          name: t.name,
          description: `Unknown tool type: ${t.type}`,
          input_schema: { type: 'object' as const, properties: {} },
        }
    }
  })
}

// ---- Tool executors ----

async function executeDatabaseRead(
  input: Record<string, unknown>,
  config: Record<string, unknown>,
  // deno-lint-ignore no-explicit-any
  supabase: any,
  workspaceId: string,
): Promise<unknown> {
  const table = config.table as string
  if (!table) throw new Error('database_read tool missing table in config')

  const selectCols = (input.select as string) ?? '*'
  const joinTables = config.join as string[] | undefined

  // Build select with joins
  let selectStr = selectCols
  if (joinTables?.length) {
    selectStr = `${selectCols}, ${joinTables.map((j) => `${j}(*)`).join(', ')}`
  }

  let query = supabase.from(table).select(selectStr)

  // Always scope to workspace
  query = query.eq('workspace_id', workspaceId)

  // Apply eq filters
  const filter = input.filter as Record<string, unknown> | undefined
  if (filter) {
    for (const [key, value] of Object.entries(filter)) {
      query = query.eq(key, value)
    }
  }

  // Apply config-level default filters
  const configFilter = config.filter as Record<string, unknown> | undefined
  if (configFilter) {
    for (const [key, value] of Object.entries(configFilter)) {
      // Don't override input filters
      if (!filter || !(key in filter)) {
        query = query.eq(key, value)
      }
    }
  }

  // Apply ilike filters
  const ilike = input.ilike as Record<string, string> | undefined
  if (ilike) {
    for (const [key, value] of Object.entries(ilike)) {
      query = query.ilike(key, value)
    }
  }

  // Ordering
  const order = input.order as string | undefined
  if (order) {
    const desc = order.startsWith('-')
    const col = desc ? order.slice(1) : order
    query = query.order(col, { ascending: !desc })
  } else {
    query = query.order('created_at', { ascending: false })
  }

  // Limit
  const limit = (input.limit as number) ?? 50
  query = query.limit(limit)

  const { data, error } = await query
  if (error) throw new Error(`database_read error: ${error.message}`)
  return data
}

async function executeDatabaseWrite(
  input: Record<string, unknown>,
  config: Record<string, unknown>,
  // deno-lint-ignore no-explicit-any
  supabase: any,
  workspaceId: string,
): Promise<unknown> {
  const table = config.table as string
  if (!table) throw new Error('database_write tool missing table in config')

  const operation = (config.operation as string) ?? 'insert'
  const data = input.data as Record<string, unknown>
  if (!data) throw new Error('database_write requires data field')

  // Always inject workspace_id
  data.workspace_id = workspaceId

  if (operation === 'insert') {
    const { data: result, error } = await supabase
      .from(table)
      .insert(data)
      .select()
      .single()
    if (error) throw new Error(`database_write insert error: ${error.message}`)
    return result
  }

  if (operation === 'update') {
    const match = input.match as Record<string, unknown>
    if (!match) throw new Error('database_write update requires match field')

    let query = supabase.from(table).update(data)
    query = query.eq('workspace_id', workspaceId)
    for (const [key, value] of Object.entries(match)) {
      query = query.eq(key, value)
    }
    const { data: result, error } = await query.select()
    if (error) throw new Error(`database_write update error: ${error.message}`)
    return result
  }

  if (operation === 'upsert') {
    const conflictCols = config.conflict as string[] | undefined
    const opts: Record<string, unknown> = {}
    if (conflictCols) opts.onConflict = conflictCols.join(',')

    const { data: result, error } = await supabase
      .from(table)
      .upsert(data, opts)
      .select()
    if (error) throw new Error(`database_write upsert error: ${error.message}`)
    return result
  }

  throw new Error(`Unknown database_write operation: ${operation}`)
}

async function executeSendNotification(
  input: Record<string, unknown>,
  config: Record<string, unknown>,
  // deno-lint-ignore no-explicit-any
  supabase: any,
  workspaceId: string,
  agentId: string,
  runId: string,
): Promise<unknown> {
  const notifType = (input.type as string) ?? (config.type as string) ?? 'info'

  const { data, error } = await supabase
    .from('notifications')
    .insert({
      workspace_id: workspaceId,
      agent_id: agentId,
      run_id: runId,
      type: notifType,
      title: input.title as string,
      payload: { message: input.message },
    })
    .select()
    .single()

  if (error) throw new Error(`send_notification error: ${error.message}`)
  return { notification_id: data.id, status: 'sent' }
}

async function executeWebSearch(
  input: Record<string, unknown>,
): Promise<unknown> {
  const query = input.query as string
  if (!query) throw new Error('web_search requires a query')

  const numResults = (input.num_results as number) ?? 5

  // Try Serper API if key is available
  const serperKey = Deno.env.get('SERPER_API_KEY')
  if (serperKey) {
    const res = await fetch('https://google.serper.dev/search', {
      method: 'POST',
      headers: {
        'X-API-KEY': serperKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ q: query, num: numResults }),
    })
    if (res.ok) {
      const data = await res.json()
      return (data.organic ?? []).map((r: Record<string, unknown>) => ({
        title: r.title,
        url: r.link,
        snippet: r.snippet,
      }))
    }
  }

  // Fallback: return a message that web search isn't configured
  return {
    error: 'Web search not configured. Set SERPER_API_KEY in Supabase secrets to enable.',
    query,
  }
}

// ---- Main handler ----

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

    // ---- 3. Resolve tool definitions from agent config ----
    const toolDefs: ToolDef[] = Array.isArray(agent.tools) ? agent.tools : []
    const anthropicTools = buildAnthropicTools(toolDefs)
    const toolMap = new Map<string, ToolDef>(toolDefs.map((t) => [t.name, t]))

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
    const toolCallLogs: ToolCallLog[] = []
    const MAX_ITERATIONS = 10

    for (let i = 0; i < MAX_ITERATIONS; i++) {
      const response = await anthropic.messages.create({
        model: agent.model,
        max_tokens: 4096,
        system: agent.system_prompt,
        tools: anthropicTools.length > 0 ? anthropicTools : undefined,
        messages,
      })

      totalInputTokens += response.usage.input_tokens
      totalOutputTokens += response.usage.output_tokens

      // Append assistant response
      messages.push({ role: 'assistant', content: response.content })

      if (response.stop_reason === 'end_turn') {
        const textBlock = response.content.find(
          (b): b is Anthropic.TextBlock => b.type === 'text',
        )
        finalOutput = textBlock?.text ?? null
        break
      }

      if (response.stop_reason === 'tool_use') {
        const toolResults: Anthropic.ToolResultBlockParam[] = []

        for (const block of response.content) {
          if (block.type !== 'tool_use') continue

          const toolDef = toolMap.get(block.name)
          const toolStart = Date.now()
          let result: unknown

          try {
            if (!toolDef) {
              result = { error: `Tool "${block.name}" not found in agent config` }
            } else {
              const inp = block.input as Record<string, unknown>

              switch (toolDef.type) {
                case 'database_read':
                  result = await executeDatabaseRead(inp, toolDef.config, supabase, agent.workspace_id)
                  break
                case 'database_write':
                  result = await executeDatabaseWrite(inp, toolDef.config, supabase, agent.workspace_id)
                  break
                case 'send_notification':
                  result = await executeSendNotification(
                    inp, toolDef.config, supabase, agent.workspace_id, agent.id, runId!,
                  )
                  break
                case 'web_search':
                  result = await executeWebSearch(inp)
                  break
                default:
                  result = { error: `Unknown tool type: ${toolDef.type}` }
              }
            }
          } catch (err) {
            result = { error: err instanceof Error ? err.message : String(err) }
          }

          const toolDuration = Date.now() - toolStart
          toolCallLogs.push({
            tool_name: block.name,
            tool_type: toolDef?.type ?? 'unknown',
            input: block.input,
            output: result,
            duration_ms: toolDuration,
            tier: 1,
          })

          toolResults.push({
            type: 'tool_result',
            tool_use_id: block.id,
            content: JSON.stringify(result),
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

    // Cost estimate: Sonnet input $3/MTok, output $15/MTok
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
        metadata: { tool_calls: toolCallLogs },
      })
      .eq('id', runId)

    // ---- 7. Auto-create notification if output signals review needed ----
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
      JSON.stringify({
        run_id: runId,
        output: finalOutput,
        tool_calls: toolCallLogs,
        token_count: tokenCount,
        cost_usd: costUsd,
        duration_ms: durationMs,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)

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

// ---- Heuristic: does this output need human review? ----

function needsHumanReview(output: unknown): boolean {
  if (!output || typeof output !== 'string') return false
  const lower = output.toLowerCase()
  return (
    lower.includes('"needs_review": true') ||
    lower.includes('"needs_review":true') ||
    lower.includes('approval required') ||
    lower.includes('please review') ||
    lower.includes('needs human') ||
    lower.includes('action required')
  )
}
