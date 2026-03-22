-- ============================================================
-- Nexus Flight Deck — Learning System + Runtime Enhancements
-- Migration: 003_learning_system
-- ============================================================

-- ---- Add metadata column to runs for tool call logs ----
ALTER TABLE runs ADD COLUMN IF NOT EXISTS metadata jsonb;

-- ---- Add tier column to tools table ----
ALTER TABLE tools ADD COLUMN IF NOT EXISTS tier integer NOT NULL DEFAULT 1
  CHECK (tier IN (1, 2, 3));
COMMENT ON COLUMN tools.tier IS '1=autonomous, 2=approval_required, 3=double_confirmation';

-- ---- Add critical_approval to notifications type check ----
ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_type_check;
ALTER TABLE notifications ADD CONSTRAINT notifications_type_check
  CHECK (type IN ('info', 'warning', 'approval_required', 'critical_approval', 'error', 'success'));

-- ============================================================
-- PROMPT_VERSIONS — Track system prompt evolution per agent
-- ============================================================
CREATE TABLE prompt_versions (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id         uuid NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  workspace_id     uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  version_number   integer NOT NULL,
  system_prompt    text NOT NULL,
  change_note      text,
  performance_score numeric(5, 2),
  status           text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'testing', 'archived')),
  created_at       timestamptz NOT NULL DEFAULT now(),
  created_by       text NOT NULL DEFAULT 'manual' CHECK (created_by IN ('manual', 'performance_reviewer', 'a_b_test')),
  UNIQUE (agent_id, version_number)
);

-- ============================================================
-- RUN_FEEDBACK — Thumbs up/down + corrections on runs
-- ============================================================
CREATE TABLE run_feedback (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id          uuid NOT NULL REFERENCES runs(id) ON DELETE CASCADE,
  agent_id        uuid NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  workspace_id    uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  feedback_type   text NOT NULL CHECK (feedback_type IN ('thumbs_up', 'thumbs_down', 'correction', 'rejection')),
  feedback_note   text,
  correction_diff jsonb,
  created_at      timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- AGENT_METRICS — Weekly aggregates per agent
-- ============================================================
CREATE TABLE agent_metrics (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id         uuid NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  workspace_id     uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  week_ending      date NOT NULL,
  total_runs       integer NOT NULL DEFAULT 0,
  successful_runs  integer NOT NULL DEFAULT 0,
  failed_runs      integer NOT NULL DEFAULT 0,
  avg_confidence   numeric(5, 2),
  avg_feedback_score numeric(5, 2),
  correction_rate  numeric(5, 4),
  trend            text CHECK (trend IN ('improving', 'stable', 'degrading')),
  created_at       timestamptz NOT NULL DEFAULT now(),
  UNIQUE (agent_id, week_ending)
);

-- ============================================================
-- IMPROVEMENT_SUGGESTIONS — AI-generated improvement proposals
-- ============================================================
CREATE TABLE improvement_suggestions (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id          uuid NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  workspace_id      uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  suggestion_type   text NOT NULL CHECK (suggestion_type IN ('prompt_patch', 'tool_addition', 'workflow_change', 'retire')),
  title             text NOT NULL,
  description       text,
  proposed_change   jsonb,
  estimated_impact  text,
  status            text NOT NULL DEFAULT 'proposed' CHECK (status IN ('proposed', 'approved', 'implemented', 'rejected')),
  created_at        timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX idx_prompt_versions_agent     ON prompt_versions (agent_id, version_number DESC);
CREATE INDEX idx_run_feedback_run          ON run_feedback (run_id);
CREATE INDEX idx_run_feedback_agent        ON run_feedback (agent_id, created_at DESC);
CREATE INDEX idx_agent_metrics_agent_week  ON agent_metrics (agent_id, week_ending DESC);
CREATE INDEX idx_improvement_suggestions   ON improvement_suggestions (agent_id, status);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
ALTER TABLE prompt_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE run_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE improvement_suggestions ENABLE ROW LEVEL SECURITY;

-- prompt_versions
CREATE POLICY "Members can read prompt versions"
  ON prompt_versions FOR SELECT USING (is_workspace_member(workspace_id));
CREATE POLICY "Operators can insert prompt versions"
  ON prompt_versions FOR INSERT WITH CHECK (has_workspace_role(workspace_id, 'operator'));
CREATE POLICY "Operators can update prompt versions"
  ON prompt_versions FOR UPDATE USING (has_workspace_role(workspace_id, 'operator'));
CREATE POLICY "Admins can delete prompt versions"
  ON prompt_versions FOR DELETE USING (has_workspace_role(workspace_id, 'admin'));

-- run_feedback
CREATE POLICY "Members can read feedback"
  ON run_feedback FOR SELECT USING (is_workspace_member(workspace_id));
CREATE POLICY "Operators can insert feedback"
  ON run_feedback FOR INSERT WITH CHECK (has_workspace_role(workspace_id, 'operator'));
CREATE POLICY "Operators can update feedback"
  ON run_feedback FOR UPDATE USING (has_workspace_role(workspace_id, 'operator'));
CREATE POLICY "Admins can delete feedback"
  ON run_feedback FOR DELETE USING (has_workspace_role(workspace_id, 'admin'));

-- agent_metrics
CREATE POLICY "Members can read metrics"
  ON agent_metrics FOR SELECT USING (is_workspace_member(workspace_id));
CREATE POLICY "Operators can insert metrics"
  ON agent_metrics FOR INSERT WITH CHECK (has_workspace_role(workspace_id, 'operator'));
CREATE POLICY "Operators can update metrics"
  ON agent_metrics FOR UPDATE USING (has_workspace_role(workspace_id, 'operator'));
CREATE POLICY "Admins can delete metrics"
  ON agent_metrics FOR DELETE USING (has_workspace_role(workspace_id, 'admin'));

-- improvement_suggestions
CREATE POLICY "Members can read suggestions"
  ON improvement_suggestions FOR SELECT USING (is_workspace_member(workspace_id));
CREATE POLICY "Operators can insert suggestions"
  ON improvement_suggestions FOR INSERT WITH CHECK (has_workspace_role(workspace_id, 'operator'));
CREATE POLICY "Operators can update suggestions"
  ON improvement_suggestions FOR UPDATE USING (has_workspace_role(workspace_id, 'operator'));
CREATE POLICY "Admins can delete suggestions"
  ON improvement_suggestions FOR DELETE USING (has_workspace_role(workspace_id, 'admin'));
