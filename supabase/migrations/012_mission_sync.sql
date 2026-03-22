-- ============================================================
-- Flight Deck — Mission Sync Infrastructure
-- Migration: 012_mission_sync
-- Notion → missions one-way sync support
-- ============================================================

-- ============================================================
-- 1. Add source_url for deduplication against Notion pages
-- ============================================================
ALTER TABLE missions ADD COLUMN IF NOT EXISTS source_url text UNIQUE;

-- ============================================================
-- 2. Expand venture CHECK to include all Notion ventures
-- ============================================================
ALTER TABLE missions DROP CONSTRAINT IF EXISTS missions_venture_check;
ALTER TABLE missions ADD CONSTRAINT missions_venture_check CHECK (venture IN (
  'beyond_peaks', 'pacific_atlas', 'nama_fiji', 'football_mgr', 'personal', 'finance',
  'barker_wellness', 'trade_intel', 'gov_ai', 'flight_deck'
));

-- ============================================================
-- 3. Grant agent_runtime role access to missions + daily_briefs
-- ============================================================
GRANT SELECT, INSERT, UPDATE ON missions TO agent_runtime;
GRANT SELECT, INSERT, UPDATE ON daily_briefs TO agent_runtime;

-- ============================================================
-- 4. Create Mission Sync Agent
-- ============================================================
DO $$
DECLARE
  ws_id uuid;
  agent_id uuid;
BEGIN
  SELECT id INTO ws_id FROM workspaces WHERE slug = 'personal' LIMIT 1;

  IF ws_id IS NULL THEN
    RAISE NOTICE 'Personal workspace not found. Skipping agent creation.';
    RETURN;
  END IF;

  INSERT INTO agents (workspace_id, name, description, system_prompt, model, tools, schedule, status)
  VALUES (
    ws_id,
    'Mission Sync',
    'Syncs the Notion Project & Task Tracker to the missions table daily. One-way: Notion is source of truth.',
    $PROMPT$You are the Mission Sync agent for Flight Deck. Your job is to synchronize the Notion "Project & Task Tracker" database into the missions table.

## Workflow

1. Call `read_notion_tracker` to fetch all rows from the Notion database.
2. Call `list_all_missions` to get all current missions that have a source_url (i.e. were synced from Notion).
3. For each Notion row, map the fields and upsert into missions:

### Field Mapping

**Status mapping:**
- 🟢 Active → status: "today"
- 🟡 In Progress → status: "in_progress"
- 🔴 Stalled → status: "queued" (set stale_flag: true)
- ✅ Done → status: "done"
- 💡 Idea Only → status: "deferred"
- ⏳ Waiting → status: "queued"

**Venture mapping:**
- Pacific Estate → "pacific_atlas"
- Beyond Peaks → "beyond_peaks"
- NAMA FIJI → "nama_fiji"
- Barker Wellness → "barker_wellness"
- Flight Deck → "flight_deck"
- Trade Intel → "trade_intel"
- Gov AI → "gov_ai"
- Other → "personal"
- (empty/missing) → "personal"

**Priority → scores:**
- P0 — Now → urgency_score: 9, impact_score: 9
- P1 — This Month → urgency_score: 7, impact_score: 7
- P2 — This Quarter → urgency_score: 4, impact_score: 6
- P3 — Backlog → urgency_score: 2, impact_score: 4
- (empty/missing) → urgency_score: 5, impact_score: 5

**Other fields:**
- Project → title
- Next Action + Notes → claude_context (combine: "Next action: {next_action}\n\n{notes}")
- Blocker → notes (if non-empty, prepend "BLOCKED: " to notes)
- Deadline → deadline (date only, no time)
- Last Touched → last_touched (if provided; otherwise leave as default)
- Page URL → source_url (the Notion page URL, used as unique key for upserts)

4. For each mission in the database that has a source_url but NO matching Notion row in this sync, update its status to "killed" — it was removed from Notion.

5. After all upserts, call the rerank function by updating any mission (the trigger handles reranking).

6. Send a notification summary: "Mission Sync complete: X created, Y updated, Z killed, T total active."

## Rules
- Always use source_url as the match key for upserts. Never create duplicates.
- If a Notion row has Status "✅ Done", set completed_at to now() if not already set.
- If a Notion row has Status "🟡 In Progress", set started_at to now() if not already set.
- Do NOT modify missions that have no source_url — those are manually created.
- Keep claude_context concise. If Next Action and Notes are both empty, set claude_context to null.
$PROMPT$,
    'claude-sonnet-4-6',
    '[
      {
        "name": "read_notion_tracker",
        "type": "notion_read",
        "config": {
          "database_id": "6c28bb40-e89b-4a09-a257-aacedfe3c8ea",
          "description": "Read all rows from the Notion Project & Task Tracker database"
        }
      },
      {
        "name": "list_all_missions",
        "type": "database_read",
        "config": {
          "table": "missions",
          "description": "Read all missions from the database to compare against Notion"
        }
      },
      {
        "name": "upsert_mission",
        "type": "database_write",
        "config": {
          "table": "missions",
          "operation": "upsert",
          "conflict": ["source_url"],
          "description": "Create or update a mission synced from Notion. Always include source_url."
        }
      },
      {
        "name": "update_mission",
        "type": "database_write",
        "config": {
          "table": "missions",
          "operation": "update",
          "description": "Update an existing mission (e.g. to mark as killed)"
        }
      },
      {
        "name": "send_summary",
        "type": "send_notification",
        "config": {
          "description": "Send a sync summary notification",
          "type": "info"
        }
      }
    ]'::jsonb,
    '0 21 * * *',
    'active'
  )
  RETURNING id INTO agent_id;

  RAISE NOTICE 'Created Mission Sync agent: %', agent_id;

  -- 5. Register daily cron job (06:00 JST = 21:00 UTC)
  PERFORM cron.schedule(
    'mission_sync_daily',
    '0 21 * * *',
    format('SELECT trigger_agent(%L::uuid)', agent_id)
  );

  RAISE NOTICE 'Registered daily cron job for Mission Sync agent';
END $$;
