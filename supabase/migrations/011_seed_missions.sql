-- ============================================================
-- Mission Control — Initial Mission Seed
-- Migration: 011_seed_missions
-- Run AFTER creating the Personal workspace
-- Replace WORKSPACE_ID with the actual personal workspace UUID
-- ============================================================

-- To get your personal workspace ID:
-- SELECT id FROM workspaces WHERE slug = 'personal';

DO $$
DECLARE
  ws_id uuid;
BEGIN
  SELECT id INTO ws_id FROM workspaces WHERE slug = 'personal' LIMIT 1;

  IF ws_id IS NULL THEN
    RAISE NOTICE 'Personal workspace not found. Create it first, then re-run this migration.';
    RETURN;
  END IF;

  -- ============================================
  -- BEYOND PEAKS — Seasonal Labor Infrastructure
  -- ============================================

  INSERT INTO missions (workspace_id, title, venture, status, urgency_score, impact_score, claude_context) VALUES

  -- Active / Today
  (ws_id, 'Write employer outreach email sequence — Hakuba', 'beyond_peaks', 'today', 7, 9,
   'Beyond Peaks seasonal labor infrastructure. Hakuba board is live but needs more employer sign-ups. Target: ski schools, hotels, property managers in Hakuba Valley. Tone: professional but warm, emphasizing free job posting + AI matching. Output: 3-email sequence (cold intro → value prop → soft close).'),

  (ws_id, 'Phase 3 spec: SEO content engine for job boards', 'beyond_peaks', 'queued', 6, 9,
   'Flightdeck Phase 3 for Beyond Peaks. Need spec for: automated SEO content generation per board (destination guides, job category pages, visa info pages). Should integrate with existing content table in Supabase. Reference Phase 2 board scaffolder pattern.'),

  (ws_id, 'CTO candidate follow-up — equity conversation prep', 'beyond_peaks', 'queued', 8, 8,
   'Niseko.Jobs CTO candidate identified. Need to prep for equity restructuring conversation. 50/50 co-founder split with partner. Scenarios: dilution model, vesting schedule, CTO equity carve-out. Keep it founder-friendly.'),

  (ws_id, 'Employer self-serve interface wireframe', 'beyond_peaks', 'queued', 5, 8,
   'Phase 3 deliverable. Employers should be able to: create account, post jobs, manage applications, view candidate matches. Design the interface spec. Reference existing employers + jobs tables in Supabase.'),

  (ws_id, 'Gmail integration for employer outreach sequencer', 'beyond_peaks', 'queued', 5, 7,
   'Phase 3. Build an agent that sends outreach emails via Gmail API on a drip schedule. Needs: OAuth setup, template system, send tracking, reply detection. Tier 2 action (requires approval before sending).'),

  (ws_id, 'Queenstown board — NZ Privacy Act compliance review', 'beyond_peaks', 'queued', 7, 7,
   'Queenstown expansion blocked by legal. Need: IPP 12 contractual clauses review, NZ Privacy Act compliance check, anti-discrimination review for nationality filtering. Reference board_tasks seed data for full checklist.'),

  (ws_id, 'French Alps board — DPIA draft', 'beyond_peaks', 'queued', 4, 7,
   'EU expansion. Required before any data collection. Need: Art. 35 DPIA, Art. 27 EU Representative appointment, EU AI Act conformity assessment, French Labour Code disclosure. All other French Alps tasks blocked until this is done.'),

  (ws_id, 'Re-run Niseko.Jobs demand signal harvest — September pre-season', 'beyond_peaks', 'queued', 2, 6,
   'Scheduled for September 2026. Re-run the demand signal harvesting workflow against Reddit, forums, and employer sites to capture fresh pain signals before the 2026-27 hiring season.'),

  -- ============================================
  -- PACIFIC ATLAS — Trade, NAMA, BWJ, CIDESCO
  -- ============================================

  (ws_id, 'Prep Beauty World Japan booth materials list for PIC', 'pacific_atlas', 'today', 9, 8,
   'NAMA FIJI exhibiting at Beauty World Japan, May 2026, Hall S2 Booth B017. Coordinating with PIC (Pacific Islands Centre) and 加藤さん. Need: signage specs, product sample inventory, collateral design brief, display furniture, staffing plan, electrical requirements. Deadline: materials order by mid-April.'),

  (ws_id, 'CIDESCO World Congress Mana Island — logistics confirmation', 'pacific_atlas', 'queued', 7, 8,
   'August 2026 wellness tour at Mana Island, Fiji. Coordinate with Debra Sadranu at NAMA HQ. Confirm: accommodation block, transport (Nadi → Mana), activity programming, cultural protocol briefing, attendee registration flow. Pacific Atlas Terminal is the coordination tool.'),

  (ws_id, 'CustomerCloud follow-up with 橋本さん', 'pacific_atlas', 'queued', 6, 6,
   'Stakeholder management. Follow up on CustomerCloud integration/partnership discussion. Keep tone professional, senior. Reference prior correspondence context.'),

  (ws_id, 'Metaverse trade show planning — January 2027 scope', 'pacific_atlas', 'queued', 3, 7,
   'Virtual trade show connecting Pacific Island producers with Japanese buyers. Need: platform selection, exhibitor recruitment plan, pricing model, timeline. Long lead time → scope definition phase.'),

  (ws_id, 'Sasakawa Peace Foundation follow-up', 'pacific_atlas', 'queued', 5, 7,
   'Follow up on the NAMA FIJI case study presentation. Pacific-Japan trade narrative. Use the existing deck as reference. Tone: institutional, strategic.'),

  -- ============================================
  -- NAMA FIJI
  -- ============================================

  (ws_id, 'Finalize Rakuten Ichiba listing copy', 'nama_fiji', 'today', 6, 7,
   'NAMA FIJI Japan distribution. Rakuten Ichiba launch. Need: Japanese-language product titles, descriptions, key selling points for each SKU. Premium positioning, niche wellness brand. Reference the financial model (¥200-250K working capital, platform-cost-only model).'),

  (ws_id, 'Barker Wellness Miyazaki proposal — LTV strategy revision', 'nama_fiji', 'queued', 5, 6,
   'Repeat-visit LTV strategy for Miyazaki cryotherapy salon partnership. Revise the tiered membership incentive structure. Both internal and client-facing versions needed.'),

  (ws_id, 'Post-Beauty World debrief template', 'nama_fiji', 'queued', 3, 6,
   'Prepare a structured debrief template to capture: buyer conversations, order interest, competitor observations, follow-up actions, demand validation signals. To be filled immediately after BWJ in May.'),

  -- ============================================
  -- FOOTBALL MANAGER SAAS
  -- ============================================

  (ws_id, 'Japanese-language signal harvest — 草サッカー management apps', 'football_mgr', 'queued', 4, 7,
   'Run demand signal harvesting workflow in Japanese. Sources: 5ch スポーツ板, note.com, Twitter JP. Search terms: 草サッカー 管理 アプリ, サッカーチーム LINE グループ 不便, 社会人サッカー 出欠 管理. Looking for: complaints about LINE groups for team management, requests for better tools, evidence of willingness to pay.'),

  -- ============================================
  -- PERSONAL / META
  -- ============================================

  (ws_id, 'Mission Control — deploy to Flightdeck production', 'personal', 'queued', 8, 9,
   'Run migration 010_mission_control.sql and 011_seed_missions.sql against production Supabase. Verify RLS policies. Create Personal workspace if not exists. Deploy dashboard code to Vercel.'),

  (ws_id, 'Morning Brief agent — build and deploy', 'personal', 'queued', 6, 8,
   'Supabase Edge Function. Trigger: daily 06:00 JST cron. Process: query missions, re-rank, pick top 3, detect stale, summarize yesterday, generate brief_text. Write to daily_briefs table. Reference agent patterns from Phase 1B agents.');

  -- Rerank everything
  PERFORM rerank_missions(ws_id);

  RAISE NOTICE 'Seeded % missions into Personal workspace', (SELECT COUNT(*) FROM missions WHERE workspace_id = ws_id);
END $$;
