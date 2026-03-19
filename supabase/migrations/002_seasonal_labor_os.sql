-- ============================================================
-- Seasonal Labor OS — Domain Tables
-- Migration: 002_seasonal_labor_os
-- ============================================================

-- ============================================================
-- BOARDS — Vertical job boards
-- ============================================================
CREATE TABLE boards (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id        uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  name                text NOT NULL,
  slug                text UNIQUE NOT NULL,
  domain              text,
  region              text NOT NULL,
  country             text NOT NULL,
  season_type         text,
  season_start_month  integer,
  season_end_month    integer,
  template_id         text,
  seo_config          jsonb NOT NULL DEFAULT '{}',
  settings            jsonb NOT NULL DEFAULT '{}',
  status              text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'archived')),
  created_at          timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- CANDIDATES — Unified candidate pool across all boards
-- ============================================================
CREATE TABLE candidates (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id          uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  first_name            text NOT NULL,
  last_name             text,
  email                 text NOT NULL,
  phone                 text,
  nationality           text,
  languages             text[] NOT NULL DEFAULT '{}',
  visa_status           text,
  experience_categories text[] NOT NULL DEFAULT '{}',
  skills                text[] NOT NULL DEFAULT '{}',
  available_from        date,
  available_to          date,
  preferred_regions     text[] NOT NULL DEFAULT '{}',
  bio                   text,
  resume_url            text,
  source_board_id       uuid REFERENCES boards(id) ON DELETE SET NULL,
  source_channel        text,
  returning_candidate   boolean NOT NULL DEFAULT false,
  seasons_completed     integer NOT NULL DEFAULT 0,
  profile_completeness  integer NOT NULL DEFAULT 0,
  status                text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'placed', 'inactive', 'archived')),
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now(),
  UNIQUE (workspace_id, email)
);

CREATE TRIGGER candidates_updated_at
  BEFORE UPDATE ON candidates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- EMPLOYERS — Employer accounts
-- ============================================================
CREATE TABLE employers (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id      uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  board_id          uuid REFERENCES boards(id) ON DELETE SET NULL,
  user_id           uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  company_name      text NOT NULL,
  location          text,
  industry          text,
  contact_name      text,
  contact_email     text NOT NULL,
  contact_phone     text,
  instagram_handle  text,
  website           text,
  company_size      text,
  plan              text NOT NULL DEFAULT 'free' CHECK (plan IN ('free', 'basic', 'premium')),
  previous_seasons  integer NOT NULL DEFAULT 0,
  notes             text,
  status            text NOT NULL DEFAULT 'active' CHECK (status IN ('pending', 'active', 'inactive', 'archived')),
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER employers_updated_at
  BEFORE UPDATE ON employers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- JOBS — Job listings
-- ============================================================
CREATE TABLE jobs (
  id                      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id            uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  employer_id             uuid NOT NULL REFERENCES employers(id) ON DELETE CASCADE,
  board_id                uuid NOT NULL REFERENCES boards(id) ON DELETE CASCADE,
  title                   text NOT NULL,
  description             text,
  requirements            jsonb NOT NULL DEFAULT '{}',
  location                text,
  salary_range            text,
  accommodation_provided  boolean NOT NULL DEFAULT false,
  season                  text,
  start_date              date,
  end_date                date,
  slots_total             integer NOT NULL DEFAULT 1,
  slots_filled            integer NOT NULL DEFAULT 0,
  status                  text NOT NULL DEFAULT 'open' CHECK (status IN ('draft', 'open', 'filled', 'closed', 'expired')),
  published_at            timestamptz,
  expires_at              timestamptz,
  created_at              timestamptz NOT NULL DEFAULT now(),
  updated_at              timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER jobs_updated_at
  BEFORE UPDATE ON jobs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- APPLICATIONS — Candidate applies to a job
-- ============================================================
CREATE TABLE applications (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id      uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  candidate_id      uuid NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
  job_id            uuid NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  match_score       numeric(5, 2),
  scoring_factors   jsonb,
  cover_letter      text,
  employer_notes    text,
  status            text NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'reviewed', 'shortlisted', 'interviewing', 'offered', 'hired', 'rejected', 'withdrawn')),
  status_changed_at timestamptz,
  created_at        timestamptz NOT NULL DEFAULT now(),
  UNIQUE (candidate_id, job_id)
);

-- ============================================================
-- CONTENT — Blog posts, guides, SEO content per board
-- ============================================================
CREATE TABLE content (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id    uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  board_id        uuid NOT NULL REFERENCES boards(id) ON DELETE CASCADE,
  type            text NOT NULL,
  title           text NOT NULL,
  slug            text,
  body            text,
  seo_meta        jsonb NOT NULL DEFAULT '{}',
  target_keyword  text,
  status          text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'pending_review', 'published', 'archived')),
  published_at    timestamptz,
  performance     jsonb NOT NULL DEFAULT '{}',
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER content_updated_at
  BEFORE UPDATE ON content
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- EMPLOYER_LEADS — BD pipeline for employer acquisition
-- ============================================================
CREATE TABLE employer_leads (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id      uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  board_id          uuid REFERENCES boards(id) ON DELETE SET NULL,
  company_name      text NOT NULL,
  location          text,
  industry          text,
  source            text,
  contact_name      text,
  contact_email     text,
  contact_phone     text,
  instagram_handle  text,
  website           text,
  current_hiring    boolean,
  outreach_status   text NOT NULL DEFAULT 'new' CHECK (outreach_status IN ('new', 'contacted', 'follow_up_1', 'follow_up_2', 'responded', 'converted', 'rejected', 'stale')),
  last_contacted_at timestamptz,
  next_follow_up_at timestamptz,
  notes             text,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER employer_leads_updated_at
  BEFORE UPDATE ON employer_leads
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- MARKET_OPPORTUNITIES — Scanner output for new board launches
-- ============================================================
CREATE TABLE market_opportunities (
  id                            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id                  uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  region                        text NOT NULL,
  country                       text NOT NULL,
  season_type                   text,
  search_volume_monthly         integer,
  competition_level             text,
  existing_competitors          jsonb NOT NULL DEFAULT '[]',
  recommended_domain            text,
  estimated_employers           integer,
  estimated_candidates_year_1   integer,
  score                         numeric(5, 2),
  analysis                      text,
  status                        text NOT NULL DEFAULT 'identified' CHECK (status IN ('identified', 'approved', 'launched', 'rejected')),
  created_at                    timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX idx_candidates_workspace_status   ON candidates (workspace_id, status);
CREATE INDEX idx_candidates_workspace_email    ON candidates (workspace_id, email);
CREATE INDEX idx_candidates_workspace_board    ON candidates (workspace_id, source_board_id);
CREATE INDEX idx_jobs_workspace_board_status   ON jobs (workspace_id, board_id, status);
CREATE INDEX idx_jobs_workspace_employer       ON jobs (workspace_id, employer_id);
CREATE INDEX idx_applications_workspace_job    ON applications (workspace_id, job_id, status);
CREATE INDEX idx_applications_workspace_cand   ON applications (workspace_id, candidate_id);
CREATE INDEX idx_employer_leads_workspace      ON employer_leads (workspace_id, board_id, outreach_status);
CREATE INDEX idx_content_workspace_board       ON content (workspace_id, board_id, status);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

-- ---- boards ----
ALTER TABLE boards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "boards_select" ON boards
  FOR SELECT USING (is_workspace_member(workspace_id));

CREATE POLICY "boards_insert" ON boards
  FOR INSERT WITH CHECK (has_workspace_role(workspace_id, 'operator'));

CREATE POLICY "boards_update" ON boards
  FOR UPDATE USING (has_workspace_role(workspace_id, 'operator'));

CREATE POLICY "boards_delete" ON boards
  FOR DELETE USING (has_workspace_role(workspace_id, 'admin'));

-- ---- candidates ----
ALTER TABLE candidates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "candidates_select" ON candidates
  FOR SELECT USING (is_workspace_member(workspace_id));

CREATE POLICY "candidates_insert" ON candidates
  FOR INSERT WITH CHECK (has_workspace_role(workspace_id, 'operator'));

CREATE POLICY "candidates_update" ON candidates
  FOR UPDATE USING (has_workspace_role(workspace_id, 'operator'));

CREATE POLICY "candidates_delete" ON candidates
  FOR DELETE USING (has_workspace_role(workspace_id, 'admin'));

-- ---- employers ----
ALTER TABLE employers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "employers_select" ON employers
  FOR SELECT USING (is_workspace_member(workspace_id));

CREATE POLICY "employers_insert" ON employers
  FOR INSERT WITH CHECK (has_workspace_role(workspace_id, 'operator'));

CREATE POLICY "employers_update" ON employers
  FOR UPDATE USING (has_workspace_role(workspace_id, 'operator'));

CREATE POLICY "employers_delete" ON employers
  FOR DELETE USING (has_workspace_role(workspace_id, 'admin'));

-- ---- jobs ----
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "jobs_select" ON jobs
  FOR SELECT USING (is_workspace_member(workspace_id));

CREATE POLICY "jobs_insert" ON jobs
  FOR INSERT WITH CHECK (has_workspace_role(workspace_id, 'operator'));

CREATE POLICY "jobs_update" ON jobs
  FOR UPDATE USING (has_workspace_role(workspace_id, 'operator'));

CREATE POLICY "jobs_delete" ON jobs
  FOR DELETE USING (has_workspace_role(workspace_id, 'admin'));

-- ---- applications ----
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "applications_select" ON applications
  FOR SELECT USING (is_workspace_member(workspace_id));

CREATE POLICY "applications_insert" ON applications
  FOR INSERT WITH CHECK (has_workspace_role(workspace_id, 'operator'));

CREATE POLICY "applications_update" ON applications
  FOR UPDATE USING (has_workspace_role(workspace_id, 'operator'));

CREATE POLICY "applications_delete" ON applications
  FOR DELETE USING (has_workspace_role(workspace_id, 'admin'));

-- ---- content ----
ALTER TABLE content ENABLE ROW LEVEL SECURITY;

CREATE POLICY "content_select" ON content
  FOR SELECT USING (is_workspace_member(workspace_id));

CREATE POLICY "content_insert" ON content
  FOR INSERT WITH CHECK (has_workspace_role(workspace_id, 'operator'));

CREATE POLICY "content_update" ON content
  FOR UPDATE USING (has_workspace_role(workspace_id, 'operator'));

CREATE POLICY "content_delete" ON content
  FOR DELETE USING (has_workspace_role(workspace_id, 'admin'));

-- ---- employer_leads ----
ALTER TABLE employer_leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "employer_leads_select" ON employer_leads
  FOR SELECT USING (is_workspace_member(workspace_id));

CREATE POLICY "employer_leads_insert" ON employer_leads
  FOR INSERT WITH CHECK (has_workspace_role(workspace_id, 'operator'));

CREATE POLICY "employer_leads_update" ON employer_leads
  FOR UPDATE USING (has_workspace_role(workspace_id, 'operator'));

CREATE POLICY "employer_leads_delete" ON employer_leads
  FOR DELETE USING (has_workspace_role(workspace_id, 'admin'));

-- ---- market_opportunities ----
ALTER TABLE market_opportunities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "market_opportunities_select" ON market_opportunities
  FOR SELECT USING (is_workspace_member(workspace_id));

CREATE POLICY "market_opportunities_insert" ON market_opportunities
  FOR INSERT WITH CHECK (has_workspace_role(workspace_id, 'operator'));

CREATE POLICY "market_opportunities_update" ON market_opportunities
  FOR UPDATE USING (has_workspace_role(workspace_id, 'operator'));

CREATE POLICY "market_opportunities_delete" ON market_opportunities
  FOR DELETE USING (has_workspace_role(workspace_id, 'admin'));
