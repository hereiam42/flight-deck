-- ============================================================
-- Nexus Flight Deck — Rename Personal → Nexus workspace
-- Migration: 013_rename_personal_workspace
-- ============================================================

-- 1. Rename the workspace row
UPDATE workspaces SET name = 'Nexus', slug = 'nexus' WHERE slug = 'personal';

-- 2. Update venture references in missions
UPDATE missions SET venture = 'nexus' WHERE venture = 'personal';

-- 3. Update venture CHECK constraint to use 'nexus' instead of 'personal'
ALTER TABLE missions DROP CONSTRAINT IF EXISTS missions_venture_check;
ALTER TABLE missions ADD CONSTRAINT missions_venture_check CHECK (venture IN (
  'beyond_peaks', 'pacific_atlas', 'nama_fiji', 'football_mgr', 'nexus', 'finance',
  'barker_wellness', 'trade_intel', 'gov_ai', 'flight_deck'
));
