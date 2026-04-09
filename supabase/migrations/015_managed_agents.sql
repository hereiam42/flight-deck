-- ============================================================
-- 015_managed_agents.sql
--
-- Integration with Anthropic Managed Agents (beta).
--
-- - managed_agents:  agent definitions registered with Anthropic
-- - agent_sessions:  one row per session run (manual / cron / event)
-- - leads:           parsed output from Lead Finder agent runs
--
-- All tables are workspace-scoped via workspace_members for RLS,
-- matching the convention used in 010_mission_control.sql.
-- ============================================================

-- ------------------------------------------------------------
-- managed_agents
-- ------------------------------------------------------------
CREATE TABLE managed_agents (
  id                       uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id             uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  name                     text NOT NULL,
  description              text,
  anthropic_agent_id       text NOT NULL,
  anthropic_environment_id text NOT NULL,
  venture                  text NOT NULL DEFAULT 'beyond_peaks' CHECK (venture IN (
    'beyond_peaks', 'pacific_atlas', 'nama_fiji', 'football_mgr', 'personal', 'finance'
  )),
  model                    text NOT NULL DEFAULT 'claude-sonnet-4-6',
  system_prompt            text,
  tools                    jsonb NOT NULL DEFAULT '[{"type":"agent_toolset_20260401"}]'::jsonb,
  status                   text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'archived')),
  created_at               timestamptz NOT NULL DEFAULT now(),
  updated_at               timestamptz NOT NULL DEFAULT now(),
  UNIQUE (workspace_id, name)
);

CREATE INDEX managed_agents_workspace_idx ON managed_agents(workspace_id);
CREATE INDEX managed_agents_venture_idx ON managed_agents(venture);

-- ------------------------------------------------------------
-- agent_sessions
-- ------------------------------------------------------------
CREATE TABLE agent_sessions (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id          uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  agent_id              uuid NOT NULL REFERENCES managed_agents(id) ON DELETE CASCADE,
  anthropic_session_id  text NOT NULL,
  title                 text,
  trigger_type          text NOT NULL DEFAULT 'manual' CHECK (trigger_type IN ('manual', 'cron', 'event')),
  input_message         text,
  status                text NOT NULL DEFAULT 'running' CHECK (status IN ('running', 'completed', 'failed')),
  output_text           text,
  output_summary        text,
  output_raw            jsonb,
  error                 text,
  started_at            timestamptz NOT NULL DEFAULT now(),
  completed_at          timestamptz,
  created_at            timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX agent_sessions_agent_idx ON agent_sessions(agent_id);
CREATE INDEX agent_sessions_workspace_idx ON agent_sessions(workspace_id);
CREATE INDEX agent_sessions_status_idx ON agent_sessions(status);

-- ------------------------------------------------------------
-- leads (output destination for Lead Finder agent)
-- ------------------------------------------------------------
CREATE TABLE leads (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id      uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  session_id        uuid REFERENCES agent_sessions(id) ON DELETE SET NULL,
  company_name      text NOT NULL,
  location          text,
  website_url       text,
  roles_hiring      jsonb,
  season            text,
  contact_email     text,
  contact_page_url  text,
  source_url        text,
  confidence        text CHECK (confidence IN ('high', 'medium', 'low')),
  notes             text,
  status            text NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'converted', 'rejected')),
  created_at        timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX leads_workspace_idx ON leads(workspace_id);
CREATE INDEX leads_session_idx ON leads(session_id);
CREATE INDEX leads_status_idx ON leads(status);

-- ------------------------------------------------------------
-- RLS
-- ------------------------------------------------------------
ALTER TABLE managed_agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads          ENABLE ROW LEVEL SECURITY;

CREATE POLICY "managed_agents_workspace_access" ON managed_agents
  FOR ALL
  USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "agent_sessions_workspace_access" ON agent_sessions
  FOR ALL
  USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "leads_workspace_access" ON leads
  FOR ALL
  USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
    )
  );
