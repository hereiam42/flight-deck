-- ============================================================
-- Agent Guardrails — Activity Log & Safety Infrastructure
-- Migration: 006_guardrails
-- ============================================================

-- ============================================================
-- ACTIVITY_LOG — Every database write by any agent, with before/after
-- ============================================================
CREATE TABLE activity_log (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id    uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  run_id          uuid REFERENCES runs(id) ON DELETE SET NULL,
  agent_id        uuid REFERENCES agents(id) ON DELETE SET NULL,
  table_name      text NOT NULL,
  operation       text NOT NULL CHECK (operation IN ('insert', 'update', 'upsert')),
  record_id       text,
  before_data     jsonb,
  after_data      jsonb,
  dry_run         boolean NOT NULL DEFAULT false,
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_activity_log_workspace   ON activity_log (workspace_id, created_at DESC);
CREATE INDEX idx_activity_log_run         ON activity_log (run_id);
CREATE INDEX idx_activity_log_agent       ON activity_log (agent_id, created_at DESC);
CREATE INDEX idx_activity_log_table       ON activity_log (workspace_id, table_name, created_at DESC);

-- RLS
ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "activity_log_select" ON activity_log
  FOR SELECT USING (is_workspace_member(workspace_id));

-- Only service role can insert (edge functions)
CREATE POLICY "activity_log_insert" ON activity_log
  FOR INSERT WITH CHECK (false);
