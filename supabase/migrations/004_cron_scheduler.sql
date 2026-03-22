-- ============================================================
-- Nexus Flight Deck — Cron Scheduler
-- Migration: 004_cron_scheduler
-- Uses pg_cron + pg_net to trigger agent-runtime edge function
-- ============================================================

CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Helper function: triggers an agent run via HTTP POST to the edge function
CREATE OR REPLACE FUNCTION trigger_agent(agent_id uuid)
RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  PERFORM net.http_post(
    url := current_setting('app.settings.supabase_url', true) || '/functions/v1/agent-runtime',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
    ),
    body := jsonb_build_object(
      'agent_id', agent_id,
      'input', 'Scheduled run',
      'triggered_by', 'cron'
    )
  );
END;
$$;

-- NOTE: Cron jobs reference agent UUIDs directly.
-- These were created via SQL after migration, not in migration itself,
-- because agent IDs are generated at insert time.
-- See cron.job table for active schedules:
--   candidate_job_matcher:      0 18 * * *   (daily 3am JST)
--   employer_lead_scraper:      0 21 * * 1   (Monday 6am JST)
--   market_opportunity_scanner: 0 21 * * 0   (Sunday 6am JST)
