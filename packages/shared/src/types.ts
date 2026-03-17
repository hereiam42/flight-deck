// ============================================================
// Pacific Atlas Flight Deck — Shared Types
// ============================================================

export type WorkspaceRole = 'owner' | 'admin' | 'operator' | 'viewer'

export type AgentStatus = 'active' | 'paused' | 'archived'

export type RunStatus = 'pending' | 'running' | 'completed' | 'failed' | 'cancelled'

export type NotificationType = 'info' | 'approval_required' | 'error' | 'success'

export type ToolType = 'rest_api' | 'scraper' | 'database' | 'email' | 'storage'

export type AuthMethod = 'api_key' | 'oauth2' | 'basic' | 'none'

export type TriggerType = 'cron' | 'webhook' | 'event'

// ---- Workspace ----

export interface Workspace {
  id: string
  name: string
  slug: string
  owner_id: string | null
  settings: WorkspaceSettings
  created_at: string
}

export interface WorkspaceSettings {
  timezone?: string
  default_model?: string
  notification_email?: string
  [key: string]: unknown
}

export interface WorkspaceMember {
  id: string
  workspace_id: string
  user_id: string
  role: WorkspaceRole
  created_at: string
}

// ---- Agent ----

export interface Agent {
  id: string
  workspace_id: string
  name: string
  description: string | null
  system_prompt: string
  model: string
  tools: AgentToolRef[]
  schedule: string | null
  input_schema: JsonSchema | null
  status: AgentStatus
  created_at: string
  updated_at: string
}

export interface AgentToolRef {
  tool_id: string
  name: string
  description?: string
}

export interface CreateAgentInput {
  name: string
  description?: string
  system_prompt: string
  model?: string
  tools?: AgentToolRef[]
  schedule?: string
  input_schema?: JsonSchema
}

// ---- Workflow ----

export interface Workflow {
  id: string
  workspace_id: string
  name: string
  description: string | null
  steps: WorkflowStep[]
  trigger: WorkflowTrigger | null
  status: 'active' | 'paused' | 'archived'
  created_at: string
  updated_at: string
}

export interface WorkflowStep {
  agent_id: string
  input_mapping: Record<string, string>  // {agent_input_key: 'previous_output.field'}
  conditions?: WorkflowCondition[]
  on_error?: 'stop' | 'continue' | 'retry'
}

export interface WorkflowCondition {
  field: string
  operator: 'eq' | 'neq' | 'gt' | 'lt' | 'contains' | 'exists'
  value: unknown
}

export interface WorkflowTrigger {
  type: TriggerType
  config: CronTriggerConfig | WebhookTriggerConfig | EventTriggerConfig
}

export interface CronTriggerConfig {
  expression: string
  timezone?: string
}

export interface WebhookTriggerConfig {
  secret?: string
  allowed_ips?: string[]
}

export interface EventTriggerConfig {
  event_name: string
  filters?: Record<string, unknown>
}

// ---- Run ----

export interface Run {
  id: string
  agent_id: string | null
  workflow_id: string | null
  workspace_id: string
  input: unknown
  output: unknown
  status: RunStatus
  error: string | null
  duration_ms: number | null
  token_count: number | null
  cost_usd: number | null
  triggered_by: string | null
  created_at: string
  completed_at: string | null
}

// ---- Tool ----

export interface Tool {
  id: string
  workspace_id: string
  name: string
  type: ToolType
  config: ToolConfig
  auth_method: AuthMethod | null
  rate_limit: RateLimit | null
  status: 'active' | 'inactive'
  created_at: string
}

export interface ToolConfig {
  endpoint?: string
  headers_template?: Record<string, string>
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  [key: string]: unknown
}

export interface RateLimit {
  requests_per_minute: number
}

// ---- Notification ----

export interface Notification {
  id: string
  workspace_id: string
  agent_id: string | null
  run_id: string | null
  type: NotificationType
  title: string
  payload: unknown
  read: boolean
  actioned: boolean
  action_taken: string | null
  created_at: string
}

// ---- Utility ----

export interface JsonSchema {
  type?: string
  properties?: Record<string, JsonSchema>
  required?: string[]
  [key: string]: unknown
}

export interface PaginatedResponse<T> {
  data: T[]
  count: number
  page: number
  per_page: number
}

export interface ApiError {
  message: string
  code?: string
  details?: unknown
}
