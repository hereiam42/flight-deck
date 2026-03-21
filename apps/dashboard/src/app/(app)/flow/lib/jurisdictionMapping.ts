// Pure functions for mapping DB data to jurisdiction nodes.
// No side effects, no Supabase calls.

import type { BoardData } from '../hooks/useBoards'
import type { BoardStatus } from '../config/jurisdictions'

/**
 * Group live boards by jurisdiction key using boardSlugs mapping.
 */
export function groupBoardsByJurisdiction(
  boards: BoardData[],
  jurisdictions: Record<string, { boardSlugs: string[] }>,
): Record<string, BoardData[]> {
  const result: Record<string, BoardData[]> = {}

  Object.entries(jurisdictions).forEach(([key, config]) => {
    result[key] = boards.filter((b) => config.boardSlugs.includes(b.slug))
  })

  return result
}

/**
 * Derive the UI launch phase from readiness score.
 * Deterministic — no LLM, no guessing.
 */
export function deriveBoardPhase(readinessScore: number | null, dbStatus: string): BoardStatus {
  if (dbStatus === 'paused' || dbStatus === 'archived') return 'planned'
  if (readinessScore === null) return 'research'
  if (readinessScore >= 90) return 'live'
  if (readinessScore >= 50) return 'building'
  if (readinessScore >= 20) return 'planned'
  return 'research'
}
