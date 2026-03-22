-- ============================================================
-- Flight Deck — Mission Control Schema
-- Migration: 010_mission_control
-- Personal workspace execution layer
-- ============================================================

-- ============================================================
-- MISSIONS — Single ranked stack across all ventures
-- ============================================================
CREATE TABLE missions (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id    uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  title           text NOT NULL,
  description     text,
  venture         text NOT NULL CHECK (venture IN (
    'beyond_peaks', 'pacific_atlas', 'nama_fiji', 'football_mgr', 'personal', 'finance'
  )),
  status          text NOT NULL DEFAULT 'queued' CHECK (status IN (
    'queued', 'today', 'in_progress', 'done', 'killed', 'deferred'
  )),
  rank            integer,
  urgency_score   integer CHECK (urgency_score BETWEEN 1 AND 10),
  impact_score    integer CHECK (impact_score BETWEEN 1 AND 10),
  composite_score float GENERATED ALWAYS AS (
    COALESCE(urgency_score, 5) * 0.35 + COALESCE(impact_score, 5) * 0.45 +
    CASE WHEN status = 'in_progress' THEN 2.0 ELSE 0.0 END
  ) STORED,
  deadline        date,
  blocked_by      uuid REFERENCES missions(id) ON DELETE SET NULL,
  claude_context  text,
  output_url      text,
  created_at      timestamptz NOT NULL DEFAULT now(),
  started_at      timestamptz,
  completed_at    timestamptz,
  last_touched    timestamptz NOT NULL DEFAULT now(),
  stale_flag      boolean NOT NULL DEFAULT false,
  notes           text
);

-- Index for fast stack queries
CREATE INDEX idx_missions_workspace_status ON missions(workspace_id, status);
CREATE INDEX idx_missions_composite ON missions(workspace_id, composite_score DESC NULLS LAST);

-- Trigger for last_touched and status transitions
CREATE OR REPLACE FUNCTION touch_mission()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.last_touched = now();
  -- Auto-set started_at when status moves to in_progress
  IF NEW.status = 'in_progress' AND OLD.status != 'in_progress' THEN
    NEW.started_at = COALESCE(NEW.started_at, now());
  END IF;
  -- Auto-set completed_at when status moves to done
  IF NEW.status = 'done' AND OLD.status != 'done' THEN
    NEW.completed_at = COALESCE(NEW.completed_at, now());
  END IF;
  -- Detect stale: >14 days untouched
  IF NEW.last_touched < now() - interval '14 days' AND NEW.status NOT IN ('done', 'killed') THEN
    NEW.stale_flag = true;
  ELSE
    NEW.stale_flag = false;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER missions_touch
  BEFORE UPDATE ON missions
  FOR EACH ROW EXECUTE FUNCTION touch_mission();

-- ============================================================
-- DAILY_BRIEFS — Morning brief snapshots
-- ============================================================
CREATE TABLE daily_briefs (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id          uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  date                  date NOT NULL,
  top_3                 uuid[] DEFAULT '{}',
  completed_yesterday   uuid[] DEFAULT '{}',
  stale_missions        uuid[] DEFAULT '{}',
  venture_health        jsonb DEFAULT '{}',
  brief_text            text,
  created_at            timestamptz NOT NULL DEFAULT now(),
  UNIQUE (workspace_id, date)
);

-- ============================================================
-- RLS — Workspace isolation
-- ============================================================
ALTER TABLE missions ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_briefs ENABLE ROW LEVEL SECURITY;

CREATE POLICY missions_workspace_isolation ON missions
  FOR ALL USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY daily_briefs_workspace_isolation ON daily_briefs
  FOR ALL USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
    )
  );

-- ============================================================
-- FUNCTION: Rerank missions (called after insert/update/delete)
-- ============================================================
CREATE OR REPLACE FUNCTION rerank_missions(ws_id uuid)
RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  WITH ranked AS (
    SELECT id, ROW_NUMBER() OVER (ORDER BY composite_score DESC NULLS LAST, deadline ASC NULLS LAST, created_at ASC) as new_rank
    FROM missions
    WHERE workspace_id = ws_id AND status IN ('queued', 'today', 'in_progress')
  )
  UPDATE missions m SET rank = r.new_rank
  FROM ranked r WHERE m.id = r.id;
END;
$$;
