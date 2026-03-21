'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'

export interface BoardTaskData {
  id: string
  title: string
  category: string
  status: string
  priority: number | null
  assignedTo: string | null
}

export function useBoardTasks(workspaceId: string | null) {
  const [tasksByBoardId, setTasksByBoardId] = useState<Record<string, BoardTaskData[]>>({})
  const [loading, setLoading] = useState(true)

  const refetch = useCallback(() => {
    if (!workspaceId) return
    setLoading(true)
    const supabase = createClient()

    supabase
      .from('board_tasks')
      .select('id, board_id, title, category, status, priority, assigned_to')
      .eq('workspace_id', workspaceId)
      .order('priority', { ascending: true })
      .then(({ data }) => {
        const grouped: Record<string, BoardTaskData[]> = {}
        data?.forEach((t) => {
          if (!grouped[t.board_id]) grouped[t.board_id] = []
          grouped[t.board_id].push({
            id: t.id,
            title: t.title,
            category: t.category,
            status: t.status,
            priority: t.priority,
            assignedTo: t.assigned_to,
          })
        })
        setTasksByBoardId(grouped)
        setLoading(false)
      })
  }, [workspaceId])

  useEffect(() => {
    refetch()
  }, [refetch])

  return { tasksByBoardId, loading, refetch }
}
