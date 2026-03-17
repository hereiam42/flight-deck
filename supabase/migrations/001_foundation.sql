-- ============================================================
-- Pacific Atlas Flight Deck — Foundation Schema
-- Migration: 001_foundation
-- ============================================================

-- ============================================================
-- WORKSPACES — Multi-tenant isolation
-- ============================================================
CREATE TABLE workspaces (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text NOT NULL,
  slug        text UNIQUE NOT NULL,
  owner_id    uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  settings    jsonb NOT NULL DEFAULT '{}',
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- WORKSPACE_MEMBERS — Team access
-- ============================================================
CREATE TABLE workspace_members (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id  uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id       uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role          text NOT NULL CHECK (role IN ('owner', 'admin', 'operator', 'viewer')),
  created_at    timestamptz NOT NULL DEFAULT now(),
  UNIQUE (workspace_id, user_id)
);

-- ============================================================
-- AGENTS — Every agent is a row
-- ============================================================
CREATE TABLE agents (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id   uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  name           text NOT NULL,
  description    text,
  system_prompt  text NOT NULL,
  model          text NOT NULL DEFAULT 'claude-sonnet-4-6',
  tools          jsonb NOT NULL DEFAULT '[]',
  schedule       text,        -- cron expression, null = manual only
  input_schema   jsonb,       -- expected input shape (JSON Schema)
  status         text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'archived')),
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now()
);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER agents_updated_at
  BEFORE UPDATE ON agents
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- WORKFLOWS — Multi-agent DAGs
-- ============================================================
CREATE TABLE workflows (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id  uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  name          text NOT NULL,
  description   text,
  steps         jsonb NOT NULL DEFAULT '[]',
  -- steps: [{agent_id, input_mapping, conditions, on_error}]
  trigger       jsonb,
  -- trigger: {type: 'cron'|'webhook'|'event', config: {...}}
  status        text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'archived')),
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER workflows_updated_at
  BEFORE UPDATE ON workflows
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- RUNS — Execution log for every agent run
-- ============================================================
CREATE TABLE runs (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id      uuid REFERENCES agents(id) ON DELETE SET NULL,
  workflow_id   uuid REFERENCES workflows(id) ON DELETE SET NULL,
  workspace_id  uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  input         jsonb,
  output        jsonb,
  status        text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed', 'cancelled')),
  error         text,
  duration_ms   integer,
  token_count   integer,
  cost_usd      numeric(10, 6),
  triggered_by  text,         -- 'manual', 'cron', 'webhook', 'workflow'
  created_at    timestamptz NOT NULL DEFAULT now(),
  completed_at  timestamptz
);

-- ============================================================
-- TOOLS — Registered API connections
-- ============================================================
CREATE TABLE tools (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id  uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  name          text NOT NULL,
  type          text NOT NULL CHECK (type IN ('rest_api', 'scraper', 'database', 'email', 'storage')),
  config        jsonb NOT NULL DEFAULT '{}',
  -- config: {endpoint, headers_template, method, etc.}
  auth_method   text CHECK (auth_method IN ('api_key', 'oauth2', 'basic', 'none')),
  rate_limit    jsonb,
  -- rate_limit: {requests_per_minute: N}
  status        text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at    timestamptz NOT NULL DEFAULT now(),
  UNIQUE (workspace_id, name)
);

-- ============================================================
-- SECRETS — Encrypted API keys (Supabase Vault)
-- ============================================================
CREATE TABLE secrets (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id     uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  key              text NOT NULL,
  encrypted_value  text NOT NULL,  -- stored via vault.create_secret()
  created_at       timestamptz NOT NULL DEFAULT now(),
  UNIQUE (workspace_id, key)
);

-- ============================================================
-- NOTIFICATIONS — Agent outputs needing human review
-- ============================================================
CREATE TABLE notifications (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id  uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  agent_id      uuid REFERENCES agents(id) ON DELETE SET NULL,
  run_id        uuid REFERENCES runs(id) ON DELETE SET NULL,
  type          text NOT NULL CHECK (type IN ('info', 'approval_required', 'error', 'success')),
  title         text NOT NULL,
  payload       jsonb,
  read          boolean NOT NULL DEFAULT false,
  actioned      boolean NOT NULL DEFAULT false,
  action_taken  text,
  created_at    timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX idx_runs_workspace_created    ON runs (workspace_id, created_at DESC);
CREATE INDEX idx_runs_agent_created        ON runs (agent_id, created_at DESC);
CREATE INDEX idx_runs_status               ON runs (workspace_id, status);
CREATE INDEX idx_notifications_workspace   ON notifications (workspace_id, read, created_at DESC);
CREATE INDEX idx_agents_workspace_status   ON agents (workspace_id, status);
CREATE INDEX idx_workflows_workspace       ON workflows (workspace_id, status);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

-- Helper: check workspace membership
CREATE OR REPLACE FUNCTION is_workspace_member(ws_id uuid)
RETURNS boolean LANGUAGE sql SECURITY DEFINER STABLE AS $$
  SELECT EXISTS (
    SELECT 1 FROM workspace_members
    WHERE workspace_id = ws_id
      AND user_id = auth.uid()
  );
$$;

-- Helper: check workspace role
CREATE OR REPLACE FUNCTION has_workspace_role(ws_id uuid, required_role text)
RETURNS boolean LANGUAGE sql SECURITY DEFINER STABLE AS $$
  SELECT EXISTS (
    SELECT 1 FROM workspace_members
    WHERE workspace_id = ws_id
      AND user_id = auth.uid()
      AND CASE required_role
            WHEN 'viewer'   THEN role IN ('owner', 'admin', 'operator', 'viewer')
            WHEN 'operator' THEN role IN ('owner', 'admin', 'operator')
            WHEN 'admin'    THEN role IN ('owner', 'admin')
            WHEN 'owner'    THEN role = 'owner'
            ELSE false
          END
  );
$$;

-- ---- workspaces ----
ALTER TABLE workspaces ENABLE ROW LEVEL SECURITY;

CREATE POLICY "workspaces_select" ON workspaces
  FOR SELECT USING (is_workspace_member(id));

CREATE POLICY "workspaces_insert" ON workspaces
  FOR INSERT WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "workspaces_update" ON workspaces
  FOR UPDATE USING (has_workspace_role(id, 'admin'));

CREATE POLICY "workspaces_delete" ON workspaces
  FOR DELETE USING (has_workspace_role(id, 'owner'));

-- ---- workspace_members ----
ALTER TABLE workspace_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "workspace_members_select" ON workspace_members
  FOR SELECT USING (is_workspace_member(workspace_id));

CREATE POLICY "workspace_members_insert" ON workspace_members
  FOR INSERT WITH CHECK (has_workspace_role(workspace_id, 'admin'));

CREATE POLICY "workspace_members_delete" ON workspace_members
  FOR DELETE USING (has_workspace_role(workspace_id, 'admin'));

-- ---- agents ----
ALTER TABLE agents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "agents_select" ON agents
  FOR SELECT USING (is_workspace_member(workspace_id));

CREATE POLICY "agents_insert" ON agents
  FOR INSERT WITH CHECK (has_workspace_role(workspace_id, 'operator'));

CREATE POLICY "agents_update" ON agents
  FOR UPDATE USING (has_workspace_role(workspace_id, 'operator'));

CREATE POLICY "agents_delete" ON agents
  FOR DELETE USING (has_workspace_role(workspace_id, 'admin'));

-- ---- workflows ----
ALTER TABLE workflows ENABLE ROW LEVEL SECURITY;

CREATE POLICY "workflows_select" ON workflows
  FOR SELECT USING (is_workspace_member(workspace_id));

CREATE POLICY "workflows_insert" ON workflows
  FOR INSERT WITH CHECK (has_workspace_role(workspace_id, 'operator'));

CREATE POLICY "workflows_update" ON workflows
  FOR UPDATE USING (has_workspace_role(workspace_id, 'operator'));

CREATE POLICY "workflows_delete" ON workflows
  FOR DELETE USING (has_workspace_role(workspace_id, 'admin'));

-- ---- runs ----
ALTER TABLE runs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "runs_select" ON runs
  FOR SELECT USING (is_workspace_member(workspace_id));

CREATE POLICY "runs_insert" ON runs
  FOR INSERT WITH CHECK (has_workspace_role(workspace_id, 'operator'));

-- Runs are immutable after creation (only service role can update)
CREATE POLICY "runs_update" ON runs
  FOR UPDATE USING (false);

-- ---- tools ----
ALTER TABLE tools ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tools_select" ON tools
  FOR SELECT USING (is_workspace_member(workspace_id));

CREATE POLICY "tools_insert" ON tools
  FOR INSERT WITH CHECK (has_workspace_role(workspace_id, 'admin'));

CREATE POLICY "tools_update" ON tools
  FOR UPDATE USING (has_workspace_role(workspace_id, 'admin'));

CREATE POLICY "tools_delete" ON tools
  FOR DELETE USING (has_workspace_role(workspace_id, 'admin'));

-- ---- secrets ----
ALTER TABLE secrets ENABLE ROW LEVEL SECURITY;

-- Secrets: only admins can see/manage; values should only be accessed via service role
CREATE POLICY "secrets_select" ON secrets
  FOR SELECT USING (has_workspace_role(workspace_id, 'admin'));

CREATE POLICY "secrets_insert" ON secrets
  FOR INSERT WITH CHECK (has_workspace_role(workspace_id, 'admin'));

CREATE POLICY "secrets_delete" ON secrets
  FOR DELETE USING (has_workspace_role(workspace_id, 'admin'));

-- ---- notifications ----
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "notifications_select" ON notifications
  FOR SELECT USING (is_workspace_member(workspace_id));

CREATE POLICY "notifications_update" ON notifications
  FOR UPDATE USING (has_workspace_role(workspace_id, 'operator'));

-- Notifications created only by service role (edge functions)
CREATE POLICY "notifications_insert" ON notifications
  FOR INSERT WITH CHECK (false);
