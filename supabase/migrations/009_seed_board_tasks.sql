-- ============================================================
-- Seed: Board records + initial task backlog
-- Migration: 009_seed_board_tasks
--
-- Creates missing board records for expansion markets, then
-- seeds the board_tasks backlog from the Board Launch Director spec.
-- ============================================================

-- Use Beyond Peaks workspace
DO $$
DECLARE
  ws_id uuid := '47242148-d7c9-407b-8433-51cf6a571507';
  -- Existing boards
  b_niseko uuid;
  -- New boards
  b_hakuba uuid;
  b_furano uuid;
  b_queenstown uuid;
  b_alps uuid;
  b_whistler uuid;
  b_thredbo uuid;
BEGIN

  -- Resolve existing Niseko board (niseko-winter is the main one)
  SELECT id INTO b_niseko FROM boards WHERE slug = 'niseko-winter' AND workspace_id = ws_id;

  -- Create missing boards (idempotent — skip if slug exists)
  INSERT INTO boards (id, workspace_id, name, slug, region, country, status)
  VALUES (gen_random_uuid(), ws_id, 'Hakuba', 'hakuba', 'Nagano', 'Japan', 'active')
  ON CONFLICT (slug) DO NOTHING
  RETURNING id INTO b_hakuba;
  IF b_hakuba IS NULL THEN SELECT id INTO b_hakuba FROM boards WHERE slug = 'hakuba'; END IF;

  INSERT INTO boards (id, workspace_id, name, slug, region, country, status)
  VALUES (gen_random_uuid(), ws_id, 'Furano', 'furano', 'Hokkaido', 'Japan', 'active')
  ON CONFLICT (slug) DO NOTHING
  RETURNING id INTO b_furano;
  IF b_furano IS NULL THEN SELECT id INTO b_furano FROM boards WHERE slug = 'furano'; END IF;

  INSERT INTO boards (id, workspace_id, name, slug, region, country, status)
  VALUES (gen_random_uuid(), ws_id, 'Queenstown', 'queenstown', 'Otago', 'New Zealand', 'active')
  ON CONFLICT (slug) DO NOTHING
  RETURNING id INTO b_queenstown;
  IF b_queenstown IS NULL THEN SELECT id INTO b_queenstown FROM boards WHERE slug = 'queenstown'; END IF;

  INSERT INTO boards (id, workspace_id, name, slug, region, country, status)
  VALUES (gen_random_uuid(), ws_id, 'French Alps', 'french-alps', 'Rhône-Alpes', 'France', 'active')
  ON CONFLICT (slug) DO NOTHING
  RETURNING id INTO b_alps;
  IF b_alps IS NULL THEN SELECT id INTO b_alps FROM boards WHERE slug = 'french-alps'; END IF;

  INSERT INTO boards (id, workspace_id, name, slug, region, country, status)
  VALUES (gen_random_uuid(), ws_id, 'Whistler', 'whistler', 'British Columbia', 'Canada', 'active')
  ON CONFLICT (slug) DO NOTHING
  RETURNING id INTO b_whistler;
  IF b_whistler IS NULL THEN SELECT id INTO b_whistler FROM boards WHERE slug = 'whistler'; END IF;

  INSERT INTO boards (id, workspace_id, name, slug, region, country, status)
  VALUES (gen_random_uuid(), ws_id, 'Thredbo/Perisher', 'thredbo', 'NSW', 'Australia', 'active')
  ON CONFLICT (slug) DO NOTHING
  RETURNING id INTO b_thredbo;
  IF b_thredbo IS NULL THEN SELECT id INTO b_thredbo FROM boards WHERE slug = 'thredbo'; END IF;

  -- ============================================================
  -- NISEKO — live, mostly done
  -- ============================================================
  INSERT INTO board_tasks (board_id, workspace_id, title, category, status, priority, assigned_to, created_by, evidence) VALUES
  (b_niseko, ws_id, 'APPI purpose specification drafted', 'legal', 'done', 2, 'guy', 'manual', '{"type": "manual", "reason": "Legal document review"}'),
  (b_niseko, ws_id, 'Employer third-party consent mechanism', 'legal', 'done', 1, 'guy', 'manual', '{"type": "manual", "reason": "Consent flow implementation"}'),
  (b_niseko, ws_id, 'Board scaffolded, domain live', 'technical', 'done', 1, 'agent:board_scaffolder', 'manual', '{"type": "field_check", "table": "boards", "field": "domain", "expected": "not_null"}'),
  (b_niseko, ws_id, 'Job board template deployed', 'content', 'done', 1, 'agent:board_scaffolder', 'manual', '{"type": "manual", "reason": "Template deployment verified"}'),
  (b_niseko, ws_id, 'Onboard 3 new ski resorts', 'employer', 'in_progress', 2, 'guy', 'manual', '{"type": "row_count", "table": "employers", "filter": {"board_id": "NISEKO_ID"}, "threshold": 17}'),
  (b_niseko, ws_id, 'Launch premium job tier', 'employer', 'in_progress', 3, 'guy', 'manual', '{"type": "manual", "reason": "Feature requires product decision"}'),
  (b_niseko, ws_id, 'AI matching disclosure page (How Matching Works)', 'legal', 'pending', 2, 'guy', 'manual', '{"type": "manual", "reason": "Legal content requires review"}'),
  (b_niseko, ws_id, 'Referral programme for returning candidates', 'acquisition', 'pending', 3, 'guy', 'manual', '{"type": "manual", "reason": "Programme design required"}');

  -- ============================================================
  -- HAKUBA — live, growth phase
  -- ============================================================
  INSERT INTO board_tasks (board_id, workspace_id, title, category, status, priority, assigned_to, created_by, evidence) VALUES
  (b_hakuba, ws_id, 'Board live', 'technical', 'done', 1, 'agent:board_scaffolder', 'manual', '{"type": "field_check", "table": "boards", "field": "status", "expected": "active"}'),
  (b_hakuba, ws_id, 'Summer season content refresh', 'content', 'in_progress', 2, 'guy', 'manual', '{"type": "manual", "reason": "Content review required"}'),
  (b_hakuba, ws_id, 'Hakuba Valley Lodge follow-up', 'employer', 'in_progress', 2, 'guy', 'manual', '{"type": "manual", "reason": "Employer relationship management"}'),
  (b_hakuba, ws_id, 'Cross-promote from Niseko candidates (requires opt-in)', 'acquisition', 'pending', 3, 'guy', 'manual', '{"type": "manual", "reason": "Requires candidate consent mechanism"}');

  -- ============================================================
  -- FURANO — building, ~65%
  -- ============================================================
  INSERT INTO board_tasks (board_id, workspace_id, title, category, status, priority, assigned_to, created_by, evidence) VALUES
  (b_furano, ws_id, 'Supabase board record created', 'technical', 'done', 1, 'agent:board_scaffolder', 'manual', '{"type": "field_check", "table": "boards", "field": "id", "expected": "not_null"}'),
  (b_furano, ws_id, 'Job board template customisation', 'content', 'in_progress', 2, 'guy', 'manual', '{"type": "manual", "reason": "Design customisation"}'),
  (b_furano, ws_id, 'Destination photography', 'content', 'in_progress', 3, 'guy', 'manual', '{"type": "manual", "reason": "Requires on-site photo shoot"}'),
  (b_furano, ws_id, 'First 5 employer sign-ups', 'employer', 'pending', 1, 'guy', 'manual', '{"type": "row_count", "table": "employers", "filter": {"board_id": "FURANO_ID"}, "threshold": 5}'),
  (b_furano, ws_id, 'Domain configuration', 'technical', 'pending', 2, 'guy', 'manual', '{"type": "field_check", "table": "boards", "field": "domain", "expected": "not_null"}'),
  (b_furano, ws_id, 'Marketing channel identification', 'acquisition', 'pending', 2, 'guy', 'manual', '{"type": "manual", "reason": "Market research required"}');

  -- ============================================================
  -- QUEENSTOWN — building, ~80% but needs legal
  -- ============================================================
  INSERT INTO board_tasks (board_id, workspace_id, title, category, status, priority, assigned_to, created_by, evidence) VALUES
  (b_queenstown, ws_id, 'Employer partnership negotiations', 'employer', 'in_progress', 1, 'guy', 'manual', '{"type": "row_count", "table": "employers", "filter": {"board_id": "QUEENSTOWN_ID"}, "threshold": 3}'),
  (b_queenstown, ws_id, 'Lifestyle + job guides', 'content', 'in_progress', 2, 'guy', 'manual', '{"type": "manual", "reason": "Content creation"}'),
  (b_queenstown, ws_id, 'IPP 12 contractual clauses', 'legal', 'pending', 1, 'guy', 'manual', '{"type": "manual", "reason": "Requires legal counsel review"}'),
  (b_queenstown, ws_id, 'NZ Privacy Act compliance review', 'legal', 'pending', 1, 'guy', 'manual', '{"type": "manual", "reason": "Requires legal counsel review"}'),
  (b_queenstown, ws_id, 'Board scaffolding', 'technical', 'pending', 2, 'agent:board_scaffolder', 'manual', '{"type": "field_check", "table": "boards", "field": "domain", "expected": "not_null"}'),
  (b_queenstown, ws_id, 'Anti-discrimination review (nationality filtering)', 'legal', 'pending', 1, 'guy', 'manual', '{"type": "manual", "reason": "Requires legal review of matching criteria"}'),
  (b_queenstown, ws_id, 'Soft launch target May 2026', 'technical', 'blocked', 2, 'guy', 'manual', '{"type": "manual", "reason": "Blocked by legal tasks"}');

  -- ============================================================
  -- FRENCH ALPS — planned, ~25%
  -- ============================================================
  INSERT INTO board_tasks (board_id, workspace_id, title, category, status, priority, assigned_to, created_by, evidence) VALUES
  (b_alps, ws_id, 'Appoint EU Representative (Art. 27)', 'legal', 'pending', 1, 'guy', 'manual', '{"type": "manual", "reason": "Requires legal entity appointment"}'),
  (b_alps, ws_id, 'Complete DPIA (Art. 35)', 'legal', 'pending', 1, 'guy', 'manual', '{"type": "manual", "reason": "GDPR Data Protection Impact Assessment"}'),
  (b_alps, ws_id, 'EU AI Act conformity assessment', 'legal', 'pending', 1, 'guy', 'manual', '{"type": "manual", "reason": "High-risk AI system assessment, deadline Aug 2026"}'),
  (b_alps, ws_id, 'Draft French privacy policy supplement', 'legal', 'pending', 2, 'guy', 'manual', '{"type": "manual", "reason": "French language legal document"}'),
  (b_alps, ws_id, 'French Labour Code disclosure (Art. L.1221-8)', 'legal', 'pending', 2, 'guy', 'manual', '{"type": "manual", "reason": "Employment law compliance"}'),
  (b_alps, ws_id, 'Identify first 10 employer targets', 'employer', 'pending', 2, 'guy', 'manual', '{"type": "row_count", "table": "employer_leads", "filter": {"board_id": "ALPS_ID"}, "threshold": 10}'),
  (b_alps, ws_id, 'Board template for French market', 'content', 'pending', 3, 'guy', 'manual', '{"type": "manual", "reason": "French localisation required"}'),
  (b_alps, ws_id, 'Domain + French language setup', 'technical', 'pending', 3, 'guy', 'manual', '{"type": "field_check", "table": "boards", "field": "domain", "expected": "not_null"}'),
  (b_alps, ws_id, 'All non-legal tasks blocked until DPIA complete', 'technical', 'blocked', 1, 'guy', 'manual', '{"type": "manual", "reason": "DPIA is a gate for all EU operations"}');

  -- ============================================================
  -- WHISTLER — planned, ~10%
  -- ============================================================
  INSERT INTO board_tasks (board_id, workspace_id, title, category, status, priority, assigned_to, created_by, evidence) VALUES
  (b_whistler, ws_id, 'Quebec PIA before any data collection', 'legal', 'pending', 1, 'guy', 'manual', '{"type": "manual", "reason": "Quebec Law 25 mandatory PIA"}'),
  (b_whistler, ws_id, 'Transfer Risk Assessment (Japan APPI evaluation)', 'legal', 'pending', 1, 'guy', 'manual', '{"type": "manual", "reason": "Cross-border transfer assessment"}'),
  (b_whistler, ws_id, 'Canadian legal counsel engagement', 'legal', 'pending', 1, 'guy', 'manual', '{"type": "manual", "reason": "Requires external legal engagement"}'),
  (b_whistler, ws_id, 'Market research Whistler employer landscape', 'employer', 'pending', 2, 'guy', 'manual', '{"type": "manual", "reason": "Market research required"}'),
  (b_whistler, ws_id, 'All tasks blocked until Quebec PIA complete', 'technical', 'blocked', 1, 'guy', 'manual', '{"type": "manual", "reason": "Quebec PIA is a gate"}');

  -- ============================================================
  -- THREDBO/PERISHER — research, ~15%
  -- ============================================================
  INSERT INTO board_tasks (board_id, workspace_id, title, category, status, priority, assigned_to, created_by, evidence) VALUES
  (b_thredbo, ws_id, 'AU ski employment volume assessment', 'acquisition', 'pending', 1, 'guy', 'manual', '{"type": "manual", "reason": "Market research"}'),
  (b_thredbo, ws_id, 'Evaluate APP 8 contractual safeguards', 'legal', 'pending', 1, 'guy', 'manual', '{"type": "manual", "reason": "Australian Privacy Principle 8 analysis"}'),
  (b_thredbo, ws_id, 'APEC CBPR certification assessment', 'legal', 'pending', 2, 'guy', 'manual', '{"type": "manual", "reason": "Cross-border privacy certification"}'),
  (b_thredbo, ws_id, 'Competitor analysis AU seasonal platforms', 'acquisition', 'pending', 2, 'guy', 'manual', '{"type": "manual", "reason": "Market research"}'),
  (b_thredbo, ws_id, 'All build tasks blocked until research complete', 'technical', 'blocked', 1, 'guy', 'manual', '{"type": "manual", "reason": "Research phase gate"}');

END $$;
