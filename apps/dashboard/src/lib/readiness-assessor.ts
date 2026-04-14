'use client'

// Readiness Assessor — deterministic TypeScript function.
// NOT an LLM. Scoring is math: SQL counts and weighted averages.
//
// Per the Agent Safety Architecture (Notion):
//   "This is a SQL query or a TypeScript function, NOT an LLM prompt.
//    No hallucination possible. The score is exactly what the data says."

import { createClient } from '@/lib/supabase/client'

// Category weights from the Board Launch Director spec
const CATEGORY_WEIGHTS: Record<string, number> = {
  legal: 0.25,
  employer: 0.25,
  content: 0.20,
  technical: 0.15,
  acquisition: 0.15,
}

const ALL_CATEGORIES = Object.keys(CATEGORY_WEIGHTS)

export interface CategoryScore {
  category: string
  weight: number
  total: number
  done: number
  in_progress: number
  pending: number
  blocked: number
  score: number // 0-100, percentage of done tasks
}

export interface ReadinessResult {
  board_id: string
  board_name: string
  overall_score: number // 0-100 weighted average
  categories: CategoryScore[]
  calculated_at: string
}

interface TaskRow {
  category: string
  status: string
  count: number
}

/**
 * Calculate readiness score for a single board.
 * Pure function: takes task counts, returns score. No side effects.
 */
export function calculateReadiness(
  boardId: string,
  boardName: string,
  taskCounts: TaskRow[],
): ReadinessResult {
  const categories: CategoryScore[] = ALL_CATEGORIES.map((category) => {
    const rows = taskCounts.filter((r) => r.category === category)
    const total = rows.reduce((sum, r) => sum + r.count, 0)
    const done = rows.find((r) => r.status === 'done')?.count ?? 0
    const in_progress = rows.find((r) => r.status === 'in_progress')?.count ?? 0
    const pending = rows.find((r) => r.status === 'pending')?.count ?? 0
    const blocked = rows.find((r) => r.status === 'blocked')?.count ?? 0

    // Score = done / total * 100. If no tasks in category, score is 0.
    const score = total > 0 ? (done / total) * 100 : 0

    return {
      category,
      weight: CATEGORY_WEIGHTS[category],
      total,
      done,
      in_progress,
      pending,
      blocked,
      score: Math.round(score * 10) / 10,
    }
  })

  // Weighted average — only categories with tasks contribute
  const activeCategories = categories.filter((c) => c.total > 0)
  let overall_score = 0

  if (activeCategories.length > 0) {
    // Renormalize weights for categories that have tasks
    const totalWeight = activeCategories.reduce((sum, c) => sum + c.weight, 0)
    overall_score = activeCategories.reduce(
      (sum, c) => sum + (c.score * c.weight) / totalWeight,
      0,
    )
  }

  return {
    board_id: boardId,
    board_name: boardName,
    overall_score: Math.round(overall_score * 10) / 10,
    categories,
    calculated_at: new Date().toISOString(),
  }
}

/**
 * Fetch task counts from Supabase and calculate readiness for one board.
 * This is the entry point — calls the pure calculateReadiness function.
 */
export async function assessBoard(boardId: string, boardName: string): Promise<ReadinessResult> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('board_tasks')
    .select('category, status')
    .eq('board_id', boardId)

  if (error || !data) {
    // Return zero scores — system works even if query fails (graceful degradation)
    return calculateReadiness(boardId, boardName, [])
  }

  // Group by category + status and count
  const counts: Record<string, Record<string, number>> = {}
  data.forEach((row) => {
    if (!counts[row.category]) counts[row.category] = {}
    counts[row.category][row.status] = (counts[row.category][row.status] || 0) + 1
  })

  const taskCounts: TaskRow[] = []
  Object.entries(counts).forEach(([category, statuses]) => {
    Object.entries(statuses).forEach(([status, count]) => {
      taskCounts.push({ category, status, count })
    })
  })

  return calculateReadiness(boardId, boardName, taskCounts)
}

/**
 * Assess all boards in a workspace. Returns readiness for every board.
 */
export async function assessAllBoards(workspaceId: string): Promise<ReadinessResult[]> {
  const supabase = createClient()

  // Fetch all boards
  const { data: boards } = await supabase
    .from('boards')
    .select('id, name')
    .eq('workspace_id', workspaceId)

  if (!boards || boards.length === 0) return []

  // Fetch ALL tasks for the workspace in one query (efficient)
  const { data: tasks } = await supabase
    .from('board_tasks')
    .select('board_id, category, status')
    .eq('workspace_id', workspaceId)

  if (!tasks) return boards.map((b) => calculateReadiness(b.id, b.name, []))

  // Group tasks by board
  const tasksByBoard: Record<string, TaskRow[]> = {}
  const rawCounts: Record<string, Record<string, Record<string, number>>> = {}

  tasks.forEach((t) => {
    if (!rawCounts[t.board_id]) rawCounts[t.board_id] = {}
    if (!rawCounts[t.board_id][t.category]) rawCounts[t.board_id][t.category] = {}
    rawCounts[t.board_id][t.category][t.status] = (rawCounts[t.board_id][t.category][t.status] || 0) + 1
  })

  Object.entries(rawCounts).forEach(([boardId, categories]) => {
    tasksByBoard[boardId] = []
    Object.entries(categories).forEach(([category, statuses]) => {
      Object.entries(statuses).forEach(([status, count]) => {
        tasksByBoard[boardId].push({ category, status, count })
      })
    })
  })

  return boards.map((b) => calculateReadiness(b.id, b.name, tasksByBoard[b.id] || []))
}

/**
 * Write readiness scores back to the boards table.
 * This is the "write" side — still deterministic, just persists the calculated scores.
 */
export async function persistReadinessScores(results: ReadinessResult[]): Promise<void> {
  const supabase = createClient()

  for (const result of results) {
    await supabase
      .from('boards')
      .update({
        readiness_score: {
          score: result.overall_score,
          legal: result.categories.find((c) => c.category === 'legal')?.score ?? 0,
          employer: result.categories.find((c) => c.category === 'employer')?.score ?? 0,
          content: result.categories.find((c) => c.category === 'content')?.score ?? 0,
          technical: result.categories.find((c) => c.category === 'technical')?.score ?? 0,
          acquisition: result.categories.find((c) => c.category === 'acquisition')?.score ?? 0,
          calculated_at: result.calculated_at,
        },
      })
      .eq('id', result.board_id)
  }
}
