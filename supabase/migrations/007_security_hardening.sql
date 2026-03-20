-- ============================================================
-- Security Hardening
-- Migration: 007_security_hardening
-- ============================================================

-- ============================================================
-- 1. UPDATE trigger_agent() to include x-agent-secret header
-- The AGENT_SECRET env var must be set in Supabase Edge Function secrets
-- and also stored as a Postgres app setting for pg_cron to use.
-- After running this migration, run in SQL Editor:
--   ALTER DATABASE postgres SET app.settings.agent_secret = 'YOUR_SECRET_HERE';
-- ============================================================
CREATE OR REPLACE FUNCTION trigger_agent(agent_id uuid)
RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  PERFORM net.http_post(
    url := current_setting('app.settings.supabase_url', true) || '/functions/v1/agent-runtime',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true),
      'x-agent-secret', current_setting('app.settings.agent_secret', true)
    ),
    body := jsonb_build_object(
      'agent_id', agent_id,
      'input', 'Scheduled run',
      'triggered_by', 'cron'
    )
  );
END;
$$;

-- ============================================================
-- 2. Scoped Postgres role for agent runtime
-- This role can only INSERT/UPDATE on tables agents need.
-- It can NEVER DELETE from candidates, employers, or jobs.
-- ============================================================

-- Create the role (idempotent: DO block checks existence)
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'agent_runtime') THEN
    CREATE ROLE agent_runtime NOLOGIN;
  END IF;
END
$$;

-- Grant usage on the public schema
GRANT USAGE ON SCHEMA public TO agent_runtime;

-- Candidates: SELECT + INSERT + UPDATE only (no DELETE)
GRANT SELECT, INSERT, UPDATE ON candidates TO agent_runtime;

-- Employers: SELECT + INSERT + UPDATE only (no DELETE)
GRANT SELECT, INSERT, UPDATE ON employers TO agent_runtime;

-- Jobs: SELECT + INSERT + UPDATE only (no DELETE)
GRANT SELECT, INSERT, UPDATE ON jobs TO agent_runtime;

-- Applications: SELECT + INSERT + UPDATE (agents create/update applications)
GRANT SELECT, INSERT, UPDATE ON applications TO agent_runtime;

-- Employer leads: full CRUD (agents manage the lead pipeline)
GRANT SELECT, INSERT, UPDATE, DELETE ON employer_leads TO agent_runtime;

-- Content: SELECT + INSERT + UPDATE (agents draft content, don't delete)
GRANT SELECT, INSERT, UPDATE ON content TO agent_runtime;

-- Notifications: SELECT + INSERT (agents create notifications)
GRANT SELECT, INSERT ON notifications TO agent_runtime;

-- Runs: SELECT + INSERT + UPDATE (agents create/update their own runs)
GRANT SELECT, INSERT, UPDATE ON runs TO agent_runtime;

-- Activity log: INSERT only (agents log, don't read/modify logs)
GRANT INSERT ON activity_log TO agent_runtime;

-- Agents: SELECT only (agents read their own config, don't modify)
GRANT SELECT ON agents TO agent_runtime;

-- Boards: SELECT only (for validation lookups)
GRANT SELECT ON boards TO agent_runtime;

-- Workspaces: SELECT only (for workspace scoping)
GRANT SELECT ON workspaces TO agent_runtime;

-- Prompt versions, run feedback, agent metrics: SELECT only
GRANT SELECT ON prompt_versions TO agent_runtime;
GRANT SELECT ON run_feedback TO agent_runtime;
GRANT SELECT ON agent_metrics TO agent_runtime;

-- Explicitly DENY delete on protected tables (belt and suspenders)
REVOKE DELETE ON candidates FROM agent_runtime;
REVOKE DELETE ON employers FROM agent_runtime;
REVOKE DELETE ON jobs FROM agent_runtime;

-- ============================================================
-- 3. Ensure RLS is enabled on activity_log (already in 006,
--    but verify all tables have RLS)
-- ============================================================

-- These should already be enabled, but ensure no gaps
ALTER TABLE workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE workspace_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE tools ENABLE ROW LEVEL SECURITY;
ALTER TABLE secrets ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE boards ENABLE ROW LEVEL SECURITY;
ALTER TABLE candidates ENABLE ROW LEVEL SECURITY;
ALTER TABLE employers ENABLE ROW LEVEL SECURITY;
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE content ENABLE ROW LEVEL SECURITY;
ALTER TABLE employer_leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE market_opportunities ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE prompt_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE run_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE improvement_suggestions ENABLE ROW LEVEL SECURITY;
