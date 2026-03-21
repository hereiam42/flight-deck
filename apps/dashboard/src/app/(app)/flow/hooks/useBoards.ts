'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

export interface BoardData {
  id: string
  name: string
  slug: string
  country: string
  region: string
  status: string
  candidateCount: number
  jobCount: number
  employerCount: number
}

export function useBoards(workspaceId: string | null) {
  const [boards, setBoards] = useState<BoardData[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!workspaceId) return

    const supabase = createClient()

    async function fetch() {
      setLoading(true)

      // Fetch boards
      const { data: boardRows } = await supabase
        .from('boards')
        .select('id, name, slug, country, region, status')
        .eq('workspace_id', workspaceId!)

      if (!boardRows || boardRows.length === 0) {
        setBoards([])
        setLoading(false)
        return
      }

      const boardIds = boardRows.map((b) => b.id)

      // Parallel count queries
      const [candidateCounts, jobCounts, employerCounts] = await Promise.all([
        supabase
          .from('candidates')
          .select('source_board_id', { count: 'exact', head: false })
          .eq('workspace_id', workspaceId!)
          .in('source_board_id', boardIds)
          .then(({ data }) => {
            const counts: Record<string, number> = {}
            data?.forEach((c) => {
              if (c.source_board_id) {
                counts[c.source_board_id] = (counts[c.source_board_id] || 0) + 1
              }
            })
            return counts
          }),
        supabase
          .from('jobs')
          .select('board_id')
          .eq('workspace_id', workspaceId!)
          .in('board_id', boardIds)
          .then(({ data }) => {
            const counts: Record<string, number> = {}
            data?.forEach((j) => {
              counts[j.board_id] = (counts[j.board_id] || 0) + 1
            })
            return counts
          }),
        supabase
          .from('employers')
          .select('board_id')
          .eq('workspace_id', workspaceId!)
          .not('board_id', 'is', null)
          .in('board_id', boardIds)
          .then(({ data }) => {
            const counts: Record<string, number> = {}
            data?.forEach((e) => {
              if (e.board_id) {
                counts[e.board_id] = (counts[e.board_id] || 0) + 1
              }
            })
            return counts
          }),
      ])

      const result: BoardData[] = boardRows.map((b) => ({
        id: b.id,
        name: b.name,
        slug: b.slug,
        country: b.country,
        region: b.region,
        status: b.status,
        candidateCount: candidateCounts[b.id] || 0,
        jobCount: jobCounts[b.id] || 0,
        employerCount: employerCounts[b.id] || 0,
      }))

      setBoards(result)
      setLoading(false)
    }

    fetch()
  }, [workspaceId])

  return { boards, loading }
}
