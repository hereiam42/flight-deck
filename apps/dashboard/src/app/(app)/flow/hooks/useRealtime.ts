'use client'

import { useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

type Callback = () => void

interface RealtimeConfig {
  workspaceId: string | null
  onCandidateInsert?: Callback
  onRunInsert?: Callback
  onBoardTaskChange?: Callback
}

export function useRealtime({ workspaceId, onCandidateInsert, onRunInsert, onBoardTaskChange }: RealtimeConfig) {
  useEffect(() => {
    if (!workspaceId) return

    const supabase = createClient()

    const channel = supabase
      .channel('flow-realtime')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'candidates', filter: `workspace_id=eq.${workspaceId}` },
        () => { onCandidateInsert?.() },
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'runs', filter: `workspace_id=eq.${workspaceId}` },
        () => { onRunInsert?.() },
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'board_tasks', filter: `workspace_id=eq.${workspaceId}` },
        () => { onBoardTaskChange?.() },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [workspaceId, onCandidateInsert, onRunInsert, onBoardTaskChange])
}
