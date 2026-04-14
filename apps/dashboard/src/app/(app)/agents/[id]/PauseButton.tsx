'use client'

import { createClient } from '@/lib/supabase/client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export function PauseButton({ agentId, currentStatus }: { agentId: string; currentStatus: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const isPaused = currentStatus === 'paused'

  async function handleToggle() {
    setLoading(true)
    const supabase = createClient()
    const newStatus = isPaused ? 'active' : 'paused'

    await supabase
      .from('agents')
      .update({ status: newStatus })
      .eq('id', agentId)

    router.refresh()
    setLoading(false)
  }

  return (
    <button
      onClick={handleToggle}
      disabled={loading || currentStatus === 'archived'}
      className={isPaused ? 'btn-primary text-xs' : 'btn-ghost text-xs text-yellow-400 hover:bg-yellow-900/20'}
    >
      {loading ? '...' : isPaused ? 'Resume agent' : 'Pause agent'}
    </button>
  )
}
