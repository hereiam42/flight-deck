/**
 * Managed Agents service layer.
 *
 * Thin wrapper over the Anthropic Managed Agents beta SDK
 * (`client.beta.agents`, `client.beta.environments`, `client.beta.sessions`).
 *
 * The SDK automatically attaches the `managed-agents-2026-04-01` beta header.
 *
 * Verified against:
 *   https://platform.claude.com/docs/en/managed-agents/quickstart
 */

import Anthropic from '@anthropic-ai/sdk'

let _client: Anthropic | null = null

export function getAnthropicClient(): Anthropic {
  if (_client) return _client
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY is not set')
  }
  _client = new Anthropic({ apiKey })
  return _client
}

// ---------------------------------------------------------------------------
// Agents
// ---------------------------------------------------------------------------

export interface CreateAgentInput {
  name: string
  systemPrompt: string
  model?: string
  /** Tool entries forwarded to the SDK. Defaults to the full toolset. */
  tools?: Array<{ type: string }>
}

export async function createAgent(input: CreateAgentInput) {
  const client = getAnthropicClient()
  // SDK call shape verified from quickstart docs.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const agent = await (client as any).beta.agents.create({
    name: input.name,
    model: input.model ?? 'claude-sonnet-4-6',
    system: input.systemPrompt,
    tools: input.tools ?? [{ type: 'agent_toolset_20260401' }],
  })
  return agent as { id: string; version: number; name: string }
}

export async function listAgents() {
  const client = getAnthropicClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (client as any).beta.agents.list()
}

export async function getAgent(agentId: string) {
  const client = getAnthropicClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (client as any).beta.agents.retrieve(agentId)
}

// ---------------------------------------------------------------------------
// Environments
// ---------------------------------------------------------------------------

export interface CreateEnvironmentInput {
  name: string
  /** Defaults to a cloud container with unrestricted networking. */
  config?: Record<string, unknown>
}

export async function createEnvironment(input: CreateEnvironmentInput) {
  const client = getAnthropicClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const env = await (client as any).beta.environments.create({
    name: input.name,
    config: input.config ?? {
      type: 'cloud',
      networking: { type: 'unrestricted' },
    },
  })
  return env as { id: string; name: string }
}

// ---------------------------------------------------------------------------
// Sessions
// ---------------------------------------------------------------------------

export interface CreateSessionInput {
  agentId: string
  environmentId: string
  title?: string
}

export async function createSession(input: CreateSessionInput) {
  const client = getAnthropicClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const session = await (client as any).beta.sessions.create({
    agent: input.agentId,
    environment_id: input.environmentId,
    title: input.title,
  })
  return session as { id: string; title?: string }
}

export async function sendUserMessage(sessionId: string, text: string) {
  const client = getAnthropicClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (client as any).beta.sessions.events.send(sessionId, {
    events: [
      {
        type: 'user.message',
        content: [{ type: 'text', text }],
      },
    ],
  })
}

/**
 * Open the SSE event stream for a session.
 *
 * IMPORTANT: per the docs, you should open the stream BEFORE calling
 * `sendUserMessage` so the API can attach buffered events.
 */
export async function streamSessionEvents(sessionId: string) {
  const client = getAnthropicClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (client as any).beta.sessions.events.stream(sessionId) as AsyncIterable<ManagedAgentEvent>
}

export async function listSessionEvents(sessionId: string) {
  const client = getAnthropicClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (client as any).beta.sessions.events.list(sessionId)
}

export async function listSessions(agentId?: string) {
  const client = getAnthropicClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (client as any).beta.sessions.list(agentId ? { agent: agentId } : undefined)
}

// ---------------------------------------------------------------------------
// High-level: run an agent to completion and collect output text
// ---------------------------------------------------------------------------

export interface ManagedAgentEvent {
  type: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any
}

export interface RunResult {
  text: string
  events: ManagedAgentEvent[]
  toolUses: string[]
}

/**
 * Open the stream, send the message, and collect events until the agent
 * emits `session.status_idle`. Returns concatenated text + raw event log.
 */
export async function runAgentToCompletion(
  sessionId: string,
  message: string,
): Promise<RunResult> {
  const stream = await streamSessionEvents(sessionId)
  await sendUserMessage(sessionId, message)

  const events: ManagedAgentEvent[] = []
  const toolUses: string[] = []
  let text = ''

  for await (const event of stream) {
    events.push(event)
    if (event.type === 'agent.message') {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const blocks = (event.content ?? []) as Array<any>
      for (const block of blocks) {
        if (block?.type === 'text' && typeof block.text === 'string') {
          text += block.text
        }
      }
    } else if (event.type === 'agent.tool_use') {
      if (typeof event.name === 'string') toolUses.push(event.name)
    } else if (event.type === 'session.status_idle') {
      break
    }
  }

  return { text, events, toolUses }
}

// ---------------------------------------------------------------------------
// Output parsing — Lead Finder
// ---------------------------------------------------------------------------

export interface ParsedLead {
  company_name: string
  location?: string
  website_url?: string
  roles_hiring?: string[]
  season?: string
  contact_email?: string
  contact_page_url?: string
  source_url?: string
  confidence?: 'high' | 'medium' | 'low'
  notes?: string
}

/**
 * Extract a JSON array of leads from a ```json fenced code block in the
 * agent's final text output.
 */
export function extractLeadsFromOutput(text: string): ParsedLead[] {
  const fenceRegex = /```json\s*([\s\S]*?)```/gi
  let match: RegExpExecArray | null
  let lastParsed: ParsedLead[] = []
  while ((match = fenceRegex.exec(text)) !== null) {
    try {
      const parsed = JSON.parse(match[1].trim())
      if (Array.isArray(parsed)) lastParsed = parsed as ParsedLead[]
    } catch {
      // ignore non-JSON fences
    }
  }
  return lastParsed
}
