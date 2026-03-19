-- ============================================================
-- Pacific Atlas Flight Deck — Self-Review Support
-- Migration: 005_self_review
-- ============================================================

-- Add reviewed flag to runs (set by runtime after self-review passes)
ALTER TABLE runs ADD COLUMN IF NOT EXISTS reviewed boolean NOT NULL DEFAULT false;
