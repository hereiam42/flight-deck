-- ============================================================
-- 016_agent_progress.sql
--
-- Add progress tracking columns to agent_sessions so the
-- frontend can render a live execution timeline via Supabase
-- Realtime (or polling).
-- ============================================================

ALTER TABLE agent_sessions
  ADD COLUMN IF NOT EXISTS progress_steps jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS current_step text,
  ADD COLUMN IF NOT EXISTS progress_pct smallint NOT NULL DEFAULT 0;

COMMENT ON COLUMN agent_sessions.progress_steps
  IS 'Array of {step, status, detail, ts} objects tracking execution progress';
COMMENT ON COLUMN agent_sessions.current_step
  IS 'Human-readable label for the current step';
COMMENT ON COLUMN agent_sessions.progress_pct
  IS 'Overall progress 0-100';
