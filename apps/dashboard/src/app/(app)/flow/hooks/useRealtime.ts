'use client'

import { useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

type Callback = () => void

interface RealtimeConfig {
  workspaceId: string | null
  onCandidateInsert?: Callback
  onRunInsert?: Callback
}

export function useRealtime({ workspaceId, onCandidateInsert, onRunInsert }: RealtimeConfig) {
  useEffect(() => {
    if (!workspaceId) return

    const supabase = createClient()

    const channel = supabase
      .channel('flow-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'candidates',
          filter: `workspace_id=eq.${workspaceId}`,
        },
        () => {
          onCandidateInsert?.()
        },
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'runs',
          filter: `workspace_id=eq.${workspaceId}`,
        },
        () => {
          onRunInsert?.()
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [workspaceId, onCandidateInsert, onRunInsert])
}
