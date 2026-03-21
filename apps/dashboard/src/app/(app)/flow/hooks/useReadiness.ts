'use client'

import { useState, useEffect, useCallback } from 'react'
import { assessAllBoards } from '@/lib/readiness-assessor'
import type { ReadinessResult } from '@/lib/readiness-assessor'

export type { ReadinessResult }

export interface ReadinessData {
  byBoardId: Record<string, ReadinessResult>
}

export function useReadiness(workspaceId: string | null) {
  const [readiness, setReadiness] = useState<ReadinessData>({ byBoardId: {} })
  const [loading, setLoading] = useState(true)

  const refetch = useCallback(() => {
    if (!workspaceId) return
    setLoading(true)
    assessAllBoards(workspaceId).then((results) => {
      const byBoardId: Record<string, ReadinessResult> = {}
      results.forEach((r) => { byBoardId[r.board_id] = r })
      setReadiness({ byBoardId })
      setLoading(false)
    })
  }, [workspaceId])

  useEffect(() => {
    refetch()
  }, [refetch])

  return { readiness, loading, refetch }
}
