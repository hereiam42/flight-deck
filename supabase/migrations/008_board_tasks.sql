-- ============================================================
-- Board Tasks & Readiness System
-- Migration: 008_board_tasks
--
-- Creates the board_tasks table (launch prerequisites per board),
-- board_task_audit table (full audit trail), and adds
-- readiness_score JSONB to boards.
-- ============================================================

-- ============================================================
-- BOARD_TASKS — Launch prerequisites tracked per board
-- ============================================================
CREATE TABLE board_tasks (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  board_id        uuid NOT NULL REFERENCES boards(id) ON DELETE CASCADE,
  workspace_id    uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  title           text NOT NULL,
  description     text,
  category        text NOT NULL CHECK (category IN ('legal', 'employer', 'content', 'technical', 'acquisition')),
  status          text NOT NULL DEFAULT 'pending' CHECK (status IN ('proposed', 'pending', 'in_progress', 'blocked', 'done')),
  priority        integer CHECK (priority BETWEEN 1 AND 5),
  due_date        date,
  blocked_by      uuid REFERENCES board_tasks(id),
  assigned_to     text,           -- 'guy', 'agent:lead_scraper', etc.
  created_by      text NOT NULL DEFAULT 'manual',
  evidence        jsonb,          -- how completion is verified: {type, table, filter, threshold} or {type: 'manual'}
  notes           text,
  created_at      timestamptz NOT NULL DEFAULT now(),
  completed_at    timestamptz
);

CREATE INDEX idx_board_tasks_board_id ON board_tasks(board_id);
CREATE INDEX idx_board_tasks_workspace_id ON board_tasks(workspace_id);
CREATE INDEX idx_board_tasks_status ON board_tasks(status);
CREATE INDEX idx_board_tasks_category ON board_tasks(category);

-- ============================================================
-- BOARD_TASK_AUDIT — Every action logged with evidence
-- ============================================================
CREATE TABLE board_task_audit (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id         uuid NOT NULL REFERENCES board_tasks(id) ON DELETE CASCADE,
  action          text NOT NULL,   -- 'created', 'status_changed', 'auto_verified', 'manual_verified', 'score_calculated'
  old_value       text,
  new_value       text,
  performed_by    text NOT NULL,   -- 'agent:readiness_assessor', 'agent:progress_tracker', 'guy'
  evidence_used   jsonb,           -- what query/check justified this action
  confidence      float,           -- for LLM outputs: model confidence
  workspace_id    uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_board_task_audit_task_id ON board_task_audit(task_id);
CREATE INDEX idx_board_task_audit_workspace_id ON board_task_audit(workspace_id);

-- ============================================================
-- ADD readiness_score JSONB to boards table
-- Stores: {score, legal, employer, content, technical, acquisition, calculated_at}
-- ============================================================
ALTER TABLE boards ADD COLUMN IF NOT EXISTS readiness_score jsonb;

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

-- ---- board_tasks ----
ALTER TABLE board_tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "board_tasks_select" ON board_tasks
  FOR SELECT USING (is_workspace_member(workspace_id));

CREATE POLICY "board_tasks_insert" ON board_tasks
  FOR INSERT WITH CHECK (has_workspace_role(workspace_id, 'operator'));

CREATE POLICY "board_tasks_update" ON board_tasks
  FOR UPDATE USING (has_workspace_role(workspace_id, 'operator'));

CREATE POLICY "board_tasks_delete" ON board_tasks
  FOR DELETE USING (has_workspace_role(workspace_id, 'admin'));

-- ---- board_task_audit ----
ALTER TABLE board_task_audit ENABLE ROW LEVEL SECURITY;

CREATE POLICY "board_task_audit_select" ON board_task_audit
  FOR SELECT USING (is_workspace_member(workspace_id));

CREATE POLICY "board_task_audit_insert" ON board_task_audit
  FOR INSERT WITH CHECK (has_workspace_role(workspace_id, 'operator'));
