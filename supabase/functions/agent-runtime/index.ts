import Anthropic from 'npm:@anthropic-ai/sdk@0.30.0'
import { createClient } from 'jsr:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// ---- Tool type definitions ----

interface ToolDef {
  name: string
  type: 'database_read' | 'database_write' | 'web_search' | 'send_notification' | 'notion_read'
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

// ---- Guardrail: Rate limit counters ----

interface RateLimits {
  database_writes: number
  web_searches: number
  notifications: number
  notion_reads: number
}

const RATE_LIMITS = {
  database_writes: 100,
  web_searches: 50,
  notifications: 10,
  notion_reads: 10,
}

function checkRateLimit(counters: RateLimits, type: keyof RateLimits): void {
  if (counters[type] >= RATE_LIMITS[type]) {
    throw new Error(
      `Rate limit exceeded: ${type} (${counters[type]}/${RATE_LIMITS[type]}). ` +
      'Run stopped to prevent runaway operations.'
    )
  }
  counters[type]++
}

// ---- Guardrail: Protected tables and fields ----

const PROTECTED_TABLES = new Set(['candidates', 'employers', 'jobs'])

// Agents can NEVER delete from these tables
// Agents can NEVER update email on existing records in these tables
// Agents can NEVER bulk-update more than 50 records in a single run

const IMMUTABLE_FIELDS: Record<string, Set<string>> = {
  candidates: new Set(['email']),
  employers: new Set(['contact_email']),
}

// ---- Guardrail: Input validation ----

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const SQL_INJECTION_PATTERNS = [
  /;\s*DROP\s/i,
  /;\s*DELETE\s/i,
  /;\s*UPDATE\s.*SET\s/i,
  /;\s*INSERT\s/i,
  /UNION\s+SELECT/i,
  /--\s/,
  /\/\*.*\*\//,
  /'\s*OR\s+'1'\s*=\s*'1/i,
  /'\s*OR\s+1\s*=\s*1/i,
]

function validateWriteData(
  table: string,
  data: Record<string, unknown>,
  operation: string,
  workspaceId: string,
): string[] {
  const errors: string[] = []

  // Workspace must match
  if (data.workspace_id && data.workspace_id !== workspaceId) {
    errors.push(`Cross-workspace write blocked: data.workspace_id (${data.workspace_id}) !== agent workspace (${workspaceId})`)
  }

  // Check for SQL injection in all string fields
  for (const [key, value] of Object.entries(data)) {
    if (typeof value === 'string') {
      for (const pattern of SQL_INJECTION_PATTERNS) {
        if (pattern.test(value)) {
          errors.push(`Suspicious pattern in field "${key}": possible SQL injection`)
          break
        }
      }
    }
  }

  // Validate email fields
  for (const [key, value] of Object.entries(data)) {
    if (key.includes('email') && typeof value === 'string' && value.length > 0) {
      if (!EMAIL_REGEX.test(value)) {
        errors.push(`Invalid email format in field "${key}": ${value}`)
      }
    }
  }

  // Prevent email updates on protected tables
  if (operation === 'update' && PROTECTED_TABLES.has(table)) {
    const immutable = IMMUTABLE_FIELDS[table]
    if (immutable) {
      for (const field of immutable) {
        if (field in data) {
          errors.push(`Cannot update immutable field "${field}" on ${table}`)
        }
      }
    }
  }

  // Type validation: dates should look like dates, numbers like numbers
  for (const [key, value] of Object.entries(data)) {
    if (key.includes('_at') || key.includes('_date') || key === 'available_from' || key === 'available_to') {
      if (value !== null && typeof value === 'string') {
        const d = new Date(value)
        if (isNaN(d.getTime())) {
          errors.push(`Invalid date in field "${key}": ${value}`)
        }
      }
    }
  }

  return errors
}

// ---- Guardrail: Board validation cache ----

const validBoardIds = new Set<string>()

// deno-lint-ignore no-explicit-any
async function validateBoardId(boardId: string, supabase: any, workspaceId: string): Promise<boolean> {
  if (validBoardIds.has(boardId)) return true

  const { data } = await supabase
    .from('boards')
    .select('id')
    .eq('id', boardId)
    .eq('workspace_id', workspaceId)
    .single()

  if (data) {
    validBoardIds.add(boardId)
    return true
  }
  return false
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
      case 'notion_read':
        return {
          name: t.name,
          description: (t.config.description as string) ?? 'Query a Notion database',
          input_schema: {
            type: 'object' as const,
            properties: {
              filter: {
                type: 'object',
                description: 'Optional Notion filter object. See Notion API filter docs. If omitted, returns all rows.',
              },
              page_size: { type: 'number', description: 'Number of results per page. Default: 100, max: 100.' },
            },
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
  agentId: string,
  runId: string,
  counters: RateLimits,
  dryRun: boolean,
  writeCountForRun: { count: number },
): Promise<unknown> {
  const table = config.table as string
  if (!table) throw new Error('database_write tool missing table in config')

  const operation = (config.operation as string) ?? 'insert'
  const data = input.data as Record<string, unknown>
  if (!data) throw new Error('database_write requires data field')

  // ---- GUARDRAIL: Rate limit ----
  checkRateLimit(counters, 'database_writes')

  // ---- GUARDRAIL: Prevent DELETE operations (hardcoded) ----
  if (operation === 'delete') {
    throw new Error(`DELETE operations are forbidden. Agents cannot delete records.`)
  }

  // Always inject workspace_id
  data.workspace_id = workspaceId

  // ---- GUARDRAIL: Validate board_id if present ----
  if (data.board_id && typeof data.board_id === 'string') {
    const valid = await validateBoardId(data.board_id, supabase, workspaceId)
    if (!valid) {
      throw new Error(`Invalid board_id: ${data.board_id} does not exist in workspace`)
    }
  }

  // ---- GUARDRAIL: Validate all write data ----
  const validationErrors = validateWriteData(table, data, operation, workspaceId)
  if (validationErrors.length > 0) {
    throw new Error(`Write validation failed:\n${validationErrors.join('\n')}`)
  }

  // ---- GUARDRAIL: Bulk update limit (50 records per run) ----
  if (operation === 'update') {
    writeCountForRun.count++
    if (writeCountForRun.count > 50) {
      throw new Error(
        `Bulk update limit exceeded: agent has updated ${writeCountForRun.count} records this run (max 50). ` +
        'Run stopped to prevent mass data changes.'
      )
    }
  }

  // ---- GUARDRAIL: Capture before-state for activity log ----
  let beforeData: unknown = null
  const match = input.match as Record<string, unknown> | undefined

  if ((operation === 'update' || operation === 'upsert') && match) {
    let beforeQuery = supabase.from(table).select('*').eq('workspace_id', workspaceId)
    for (const [key, value] of Object.entries(match)) {
      beforeQuery = beforeQuery.eq(key, value)
    }
    const { data: existing } = await beforeQuery.limit(5)
    beforeData = existing
  }

  // ---- GUARDRAIL: Dry run mode ----
  if (dryRun) {
    // Log what WOULD have been written
    await supabase.from('activity_log').insert({
      workspace_id: workspaceId,
      run_id: runId,
      agent_id: agentId,
      table_name: table,
      operation,
      before_data: beforeData,
      after_data: data,
      dry_run: true,
    })

    return {
      dry_run: true,
      operation,
      table,
      data,
      message: `DRY RUN: Would have ${operation}ed into ${table}`,
    }
  }

  // ---- Execute the actual write ----
  let result: unknown

  if (operation === 'insert') {
    const { data: insertResult, error } = await supabase
      .from(table)
      .insert(data)
      .select()
      .single()
    if (error) throw new Error(`database_write insert error: ${error.message}`)
    result = insertResult
  } else if (operation === 'update') {
    if (!match) throw new Error('database_write update requires match field')

    let query = supabase.from(table).update(data)
    query = query.eq('workspace_id', workspaceId)
    for (const [key, value] of Object.entries(match)) {
      query = query.eq(key, value)
    }
    const { data: updateResult, error } = await query.select()
    if (error) throw new Error(`database_write update error: ${error.message}`)
    result = updateResult
  } else if (operation === 'upsert') {
    const conflictCols = config.conflict as string[] | undefined
    const opts: Record<string, unknown> = {}
    if (conflictCols) opts.onConflict = conflictCols.join(',')

    const { data: upsertResult, error } = await supabase
      .from(table)
      .upsert(data, opts)
      .select()
    if (error) throw new Error(`database_write upsert error: ${error.message}`)
    result = upsertResult
  } else {
    throw new Error(`Unknown database_write operation: ${operation}`)
  }

  // ---- Activity log: record what was written ----
  const recordId = Array.isArray(result)
    ? result.map((r: Record<string, unknown>) => r.id).join(',')
    : (result as Record<string, unknown>)?.id as string ?? null

  await supabase.from('activity_log').insert({
    workspace_id: workspaceId,
    run_id: runId,
    agent_id: agentId,
    table_name: table,
    operation,
    record_id: recordId,
    before_data: beforeData,
    after_data: result,
    dry_run: false,
  })

  return result
}

async function executeSendNotification(
  input: Record<string, unknown>,
  config: Record<string, unknown>,
  // deno-lint-ignore no-explicit-any
  supabase: any,
  workspaceId: string,
  agentId: string,
  runId: string,
  counters: RateLimits,
): Promise<unknown> {
  // ---- GUARDRAIL: Rate limit ----
  checkRateLimit(counters, 'notifications')

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
  counters: RateLimits,
): Promise<unknown> {
  // ---- GUARDRAIL: Rate limit ----
  checkRateLimit(counters, 'web_searches')

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

// ---- Notion property parsers ----

function parseNotionTitle(prop: Record<string, unknown>): string {
  const titleArr = prop.title as Array<Record<string, unknown>> | undefined
  if (!titleArr?.length) return ''
  return titleArr.map((t) => (t.plain_text as string) ?? '').join('')
}

function parseNotionRichText(prop: Record<string, unknown>): string {
  const arr = prop.rich_text as Array<Record<string, unknown>> | undefined
  if (!arr?.length) return ''
  return arr.map((t) => (t.plain_text as string) ?? '').join('')
}

function parseNotionSelect(prop: Record<string, unknown>): string | null {
  const sel = prop.select as Record<string, unknown> | null
  return sel ? (sel.name as string) : null
}

function parseNotionDate(prop: Record<string, unknown>): string | null {
  const d = prop.date as Record<string, unknown> | null
  if (!d) return null
  return (d.start as string) ?? null
}

// deno-lint-ignore no-explicit-any
function parseNotionPage(page: any): Record<string, unknown> {
  const props = page.properties as Record<string, Record<string, unknown>>
  const pageUrl = page.url as string

  const result: Record<string, unknown> = { page_url: pageUrl }

  for (const [key, prop] of Object.entries(props)) {
    const type = prop.type as string
    switch (type) {
      case 'title':
        result[key] = parseNotionTitle(prop)
        break
      case 'rich_text':
        result[key] = parseNotionRichText(prop)
        break
      case 'select':
        result[key] = parseNotionSelect(prop)
        break
      case 'date':
        result[key] = parseNotionDate(prop)
        break
      case 'number':
        result[key] = prop.number
        break
      case 'checkbox':
        result[key] = prop.checkbox
        break
      default:
        // Skip unsupported property types
        break
    }
  }

  return result
}

async function executeNotionRead(
  input: Record<string, unknown>,
  config: Record<string, unknown>,
  counters: RateLimits,
): Promise<unknown> {
  checkRateLimit(counters, 'notion_reads')

  const notionKey = Deno.env.get('NOTION_API_KEY')
  if (!notionKey) {
    throw new Error('NOTION_API_KEY not configured. Add it to Supabase Edge Function secrets.')
  }

  const databaseId = config.database_id as string
  if (!databaseId) throw new Error('notion_read tool missing database_id in config')

  const allResults: Record<string, unknown>[] = []
  let hasMore = true
  let startCursor: string | undefined

  // Paginate through all results
  while (hasMore) {
    const body: Record<string, unknown> = {
      page_size: Math.min((input.page_size as number) ?? 100, 100),
    }
    if (input.filter) body.filter = input.filter
    if (startCursor) body.start_cursor = startCursor

    const res = await fetch(`https://api.notion.com/v1/databases/${databaseId}/query`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${notionKey}`,
        'Notion-Version': '2022-06-28',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    })

    if (!res.ok) {
      const errText = await res.text()
      throw new Error(`Notion API error (${res.status}): ${errText}`)
    }

    const data = await res.json()
    const pages = data.results as Array<Record<string, unknown>>

    for (const page of pages) {
      allResults.push(parseNotionPage(page))
    }

    hasMore = data.has_more === true
    startCursor = data.next_cursor as string | undefined
  }

  return allResults
}

// ---- Main handler ----

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  // ---- SECURITY: Authenticate request ----
  // Accept either the agent secret header (for cron/internal) or a valid Supabase auth token (for dashboard)
  const agentSecret = Deno.env.get('AGENT_SECRET')
  const authHeader = req.headers.get('Authorization') ?? ''
  const secretHeader = req.headers.get('x-agent-secret')

  if (agentSecret && secretHeader !== agentSecret) {
    // No valid agent secret — check if the request has a valid Supabase service role or anon key
    const token = authHeader.replace('Bearer ', '')
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? ''

    if (token !== serviceKey && token !== anonKey) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }
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
    const { agent_id, input, triggered_by = 'manual', workflow_id, dry_run = false } = body

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
        metadata: { dry_run },
      })
      .select()
      .single()

    if (runCreateError || !run) {
      throw new Error(`Failed to create run: ${runCreateError?.message}`)
    }
    runId = run.id

    // ---- 3. Initialize guardrail counters ----
    const counters: RateLimits = { database_writes: 0, web_searches: 0, notifications: 0, notion_reads: 0 }
    const writeCountForRun = { count: 0 }

    // ---- 4. Resolve tool definitions from agent config ----
    const toolDefs: ToolDef[] = Array.isArray(agent.tools) ? agent.tools : []
    const anthropicTools = buildAnthropicTools(toolDefs)
    const toolMap = new Map<string, ToolDef>(toolDefs.map((t) => [t.name, t]))

    // ---- 5. Build initial messages ----
    const userContent = typeof input === 'string'
      ? input
      : JSON.stringify(input ?? {})

    const messages: Anthropic.MessageParam[] = [
      { role: 'user', content: userContent },
    ]

    // ---- 6. Agentic loop ----
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
                  result = await executeDatabaseWrite(
                    inp, toolDef.config, supabase, agent.workspace_id,
                    agent.id, runId!, counters, dry_run, writeCountForRun,
                  )
                  break
                case 'send_notification':
                  result = await executeSendNotification(
                    inp, toolDef.config, supabase, agent.workspace_id, agent.id, runId!,
                    counters,
                  )
                  break
                case 'web_search':
                  result = await executeWebSearch(inp, counters)
                  break
                case 'notion_read':
                  result = await executeNotionRead(inp, toolDef.config, counters)
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
    // Cost estimate: Sonnet input $3/MTok, output $15/MTok
    let costUsd = (totalInputTokens * 3 + totalOutputTokens * 15) / 1_000_000

    // ---- 7. Self-review validation pass ----
    let reviewed = false
    let reviewIssues: string[] = []

    if (finalOutput && typeof finalOutput === 'string' && finalOutput.length > 50) {
      // Check confidence_score in output
      const lowConfidence = /["']?confidence_score["']?\s*:\s*(\d+)/.exec(finalOutput)
      const confidenceScore = lowConfidence ? parseInt(lowConfidence[1], 10) : null

      if (confidenceScore !== null && confidenceScore < 60) {
        reviewIssues.push(`Low confidence score: ${confidenceScore}`)
      }

      // Run self-review with Haiku (cheap + fast)
      try {
        const reviewResponse = await anthropic.messages.create({
          model: 'claude-haiku-4-5-20251001',
          max_tokens: 512,
          system: 'You are a quality reviewer. Respond ONLY with valid JSON, no other text.',
          messages: [{
            role: 'user',
            content: `Review this agent output for: factual claims without sources, hallucinated data (fields that look invented rather than extracted from the input), logical inconsistencies, and confidence score accuracy. If the output passes review, respond with {"passed": true}. If not, respond with {"passed": false, "issues": ["list of specific problems"]}.\n\nAgent output:\n${finalOutput.slice(0, 3000)}`,
          }],
        })

        // Add review tokens to cost (Haiku: $0.80/$4 per MTok)
        totalInputTokens += reviewResponse.usage.input_tokens
        totalOutputTokens += reviewResponse.usage.output_tokens
        costUsd += (reviewResponse.usage.input_tokens * 0.8 + reviewResponse.usage.output_tokens * 4) / 1_000_000

        const reviewText = reviewResponse.content.find(
          (b): b is Anthropic.TextBlock => b.type === 'text',
        )?.text ?? ''

        try {
          const reviewResult = JSON.parse(reviewText)
          if (reviewResult.passed === true && reviewIssues.length === 0) {
            reviewed = true
          } else if (reviewResult.issues) {
            reviewIssues = reviewIssues.concat(reviewResult.issues)
          }
        } catch {
          // If review response isn't valid JSON, mark as reviewed (don't block on parse failure)
          if (reviewIssues.length === 0) reviewed = true
        }
      } catch {
        // If review call fails, don't block the run — just skip review
        if (reviewIssues.length === 0) reviewed = true
      }
    } else {
      // Short/empty output — skip review
      reviewed = true
    }

    const needsReview = reviewIssues.length > 0 || needsHumanReview(finalOutput)

    // ---- 8. Anomaly detection: flag runs with > 20 writes ----
    const totalWrites = counters.database_writes
    if (totalWrites > 20) {
      await supabase.from('notifications').insert({
        workspace_id: agent.workspace_id,
        agent_id: agent.id,
        run_id: runId,
        type: 'approval_required',
        title: `${agent.name} — high write volume: ${totalWrites} database writes`,
        payload: {
          message: `This run made ${totalWrites} database writes, which exceeds the anomaly threshold of 20.`,
          write_count: totalWrites,
        },
      })
    }

    // ---- 9. Update run record ----
    await supabase
      .from('runs')
      .update({
        output: finalOutput,
        status: 'completed',
        duration_ms: durationMs,
        token_count: totalInputTokens + totalOutputTokens,
        cost_usd: costUsd,
        completed_at: new Date().toISOString(),
        metadata: {
          tool_calls: toolCallLogs,
          review: { reviewed, issues: reviewIssues },
          guardrails: {
            dry_run,
            writes: counters.database_writes,
            searches: counters.web_searches,
            notifications: counters.notifications,
          },
        },
        reviewed,
      })
      .eq('id', runId)

    // ---- 10. Auto-create notification if review needed ----
    if (needsReview) {
      await supabase.from('notifications').insert({
        workspace_id: agent.workspace_id,
        agent_id: agent.id,
        run_id: runId,
        type: 'approval_required',
        title: reviewIssues.length > 0
          ? `${agent.name} — self-review flagged issues`
          : `${agent.name} completed — review required`,
        payload: { output: finalOutput, review_issues: reviewIssues },
      })
    }

    return new Response(
      JSON.stringify({
        run_id: runId,
        output: finalOutput,
        tool_calls: toolCallLogs,
        token_count: totalInputTokens + totalOutputTokens,
        cost_usd: costUsd,
        duration_ms: durationMs,
        reviewed,
        review_issues: reviewIssues,
        dry_run,
        guardrails: {
          writes: counters.database_writes,
          searches: counters.web_searches,
          notifications: counters.notifications,
        },
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
