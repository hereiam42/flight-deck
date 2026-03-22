-- ============================================================
-- Nexus Flight Deck — Rename Personal → Nexus + add Finance workspace
-- Migration: 013_rename_personal_workspace
-- ============================================================

-- 1. Drop old CHECK constraint first (it still allows 'personal', not 'nexus')
ALTER TABLE missions DROP CONSTRAINT IF EXISTS missions_venture_check;

-- 2. Rename the workspace row
UPDATE workspaces SET name = 'Nexus', slug = 'nexus' WHERE slug = 'personal';

-- 3. Update venture references in missions
UPDATE missions SET venture = 'nexus' WHERE venture = 'personal';

-- 4. Re-add CHECK constraint with 'nexus' instead of 'personal'
ALTER TABLE missions ADD CONSTRAINT missions_venture_check CHECK (venture IN (
  'beyond_peaks', 'pacific_atlas', 'nama_fiji', 'football_mgr', 'nexus', 'finance',
  'barker_wellness', 'trade_intel', 'gov_ai', 'flight_deck'
));

-- 4. Create Finance workspace (fully isolated — personal wealth, crypto research, family office)
DO $$
DECLARE
  owner uuid;
BEGIN
  -- Use the same owner as the Nexus workspace
  SELECT owner_id INTO owner FROM workspaces WHERE slug = 'nexus' LIMIT 1;

  IF owner IS NULL THEN
    RAISE NOTICE 'Nexus workspace not found — cannot determine owner for Finance workspace.';
    RETURN;
  END IF;

  INSERT INTO workspaces (name, slug, owner_id, settings)
  VALUES ('Finance', 'finance', owner, '{"isolated": true}'::jsonb)
  ON CONFLICT (slug) DO NOTHING;

  -- Add owner as workspace member
  INSERT INTO workspace_members (workspace_id, user_id, role)
  SELECT w.id, owner, 'owner'
  FROM workspaces w WHERE w.slug = 'finance'
  ON CONFLICT DO NOTHING;

  RAISE NOTICE 'Finance workspace created (fully isolated).';
END $$;
