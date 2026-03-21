'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

export interface CandidateStats {
  total: number
  byBoard: Record<string, number>
  byNationality: Record<string, number>
  thisWeek: number
  multiBoard: number // candidates registered on >1 board via preferred_regions
}

export function useCandidates(workspaceId: string | null) {
  const [stats, setStats] = useState<CandidateStats>({
    total: 0,
    byBoard: {},
    byNationality: {},
    thisWeek: 0,
    multiBoard: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!workspaceId) return

    const supabase = createClient()

    async function fetch() {
      setLoading(true)

      const { data: candidates } = await supabase
        .from('candidates')
        .select('id, source_board_id, nationality, preferred_regions, created_at')
        .eq('workspace_id', workspaceId!)

      if (!candidates) {
        setLoading(false)
        return
      }

      const byBoard: Record<string, number> = {}
      const byNationality: Record<string, number> = {}
      let thisWeek = 0
      let multiBoard = 0

      const weekAgo = new Date()
      weekAgo.setDate(weekAgo.getDate() - 7)

      candidates.forEach((c) => {
        // Count by board
        if (c.source_board_id) {
          byBoard[c.source_board_id] = (byBoard[c.source_board_id] || 0) + 1
        }

        // Count by nationality
        if (c.nationality) {
          byNationality[c.nationality] = (byNationality[c.nationality] || 0) + 1
        }

        // This week registrations
        if (new Date(c.created_at) >= weekAgo) {
          thisWeek++
        }

        // Multi-board: candidates with >1 preferred region
        if (c.preferred_regions && c.preferred_regions.length > 1) {
          multiBoard++
        }
      })

      setStats({
        total: candidates.length,
        byBoard,
        byNationality,
        thisWeek,
        multiBoard,
      })
      setLoading(false)
    }

    fetch()
  }, [workspaceId])

  return { stats, loading }
}
