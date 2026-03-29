-- ============================================================
-- Nexus Flight Deck — Hardening Sprint
-- Migration: 014_hardening_sprint
-- ============================================================

-- ============================================================
-- 1. Enforce isolated workspace access (Finance workspace)
--
-- For workspaces with settings->>'isolated' = 'true', only the
-- workspace owner can access data. Standard workspace_members
-- membership is not sufficient — the user must also be the
-- workspace owner_id.
--
-- This enforces the README's "FULLY ISOLATED / Guy-only access"
-- claim at the database level rather than relying on app code.
-- ============================================================

CREATE OR REPLACE FUNCTION is_workspace_member(ws_id uuid)
RETURNS boolean LANGUAGE sql SECURITY DEFINER STABLE AS $$
  SELECT EXISTS (
    SELECT 1 FROM workspace_members wm
    JOIN workspaces w ON w.id = wm.workspace_id
    WHERE wm.workspace_id = ws_id
      AND wm.user_id = auth.uid()
      AND (
        -- Non-isolated workspaces: standard membership check
        COALESCE(w.settings->>'isolated', 'false') <> 'true'
        -- Isolated workspaces: must be the workspace owner
        OR w.owner_id = auth.uid()
      )
  );
$$;

CREATE OR REPLACE FUNCTION has_workspace_role(ws_id uuid, required_role text)
RETURNS boolean LANGUAGE sql SECURITY DEFINER STABLE AS $$
  SELECT EXISTS (
    SELECT 1 FROM workspace_members wm
    JOIN workspaces w ON w.id = wm.workspace_id
    WHERE wm.workspace_id = ws_id
      AND wm.user_id = auth.uid()
      AND (
        -- Non-isolated workspaces: standard role check
        COALESCE(w.settings->>'isolated', 'false') <> 'true'
        -- Isolated workspaces: must be the workspace owner
        OR w.owner_id = auth.uid()
      )
      AND CASE required_role
            WHEN 'viewer'   THEN wm.role IN ('owner', 'admin', 'operator', 'viewer')
            WHEN 'operator' THEN wm.role IN ('owner', 'admin', 'operator')
            WHEN 'admin'    THEN wm.role IN ('owner', 'admin')
            WHEN 'owner'    THEN wm.role = 'owner'
            ELSE false
          END
  );
$$;

-- ============================================================
-- 2. Public read policies for boards app (Task 7)
--
-- Allow unauthenticated reads on public board data so the
-- boards app can use the anon key instead of service-role.
-- Scoped to active boards and open/published content only.
-- ============================================================

-- Boards: public can read active boards
CREATE POLICY "boards_public_read" ON boards
  FOR SELECT
  TO anon
  USING (status = 'active');

-- Jobs: public can read open jobs on active boards
CREATE POLICY "jobs_public_read" ON jobs
  FOR SELECT
  TO anon
  USING (
    status IN ('open', 'filled')
    AND EXISTS (
      SELECT 1 FROM boards WHERE boards.id = jobs.board_id AND boards.status = 'active'
    )
  );

-- Content: public can read published content
CREATE POLICY "content_public_read" ON content
  FOR SELECT
  TO anon
  USING (status = 'published');

-- Employers: public can read active employer names (for job listings)
CREATE POLICY "employers_public_read" ON employers
  FOR SELECT
  TO anon
  USING (
    status = 'active'
    AND EXISTS (
      SELECT 1 FROM boards WHERE boards.id = employers.board_id AND boards.status = 'active'
    )
  );
