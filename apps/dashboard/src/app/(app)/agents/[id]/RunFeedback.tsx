'use client'

import { createClient } from '@/lib/supabase/client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface Props {
  runId: string
  agentId: string
  workspaceId: string
  existingFeedback?: string | null
}

export function RunFeedback({ runId, agentId, workspaceId, existingFeedback }: Props) {
  const supabase = createClient()
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function submit(feedbackType: 'thumbs_up' | 'thumbs_down') {
    setLoading(true)
    await supabase.from('run_feedback').insert({
      run_id: runId,
      agent_id: agentId,
      workspace_id: workspaceId,
      feedback_type: feedbackType,
    })
    router.refresh()
    setLoading(false)
  }

  if (existingFeedback) {
    return (
      <span className={`text-xs ${existingFeedback === 'thumbs_up' ? 'text-emerald-500' : 'text-red-400'}`}>
        {existingFeedback === 'thumbs_up' ? '👍' : '👎'}
      </span>
    )
  }

  return (
    <span className="inline-flex gap-1">
      <button
        onClick={() => submit('thumbs_up')}
        disabled={loading}
        className="rounded px-1 py-0.5 text-xs text-zinc-500 hover:bg-emerald-900/30 hover:text-emerald-400 disabled:opacity-50"
        title="Good output"
      >
        👍
      </button>
      <button
        onClick={() => submit('thumbs_down')}
        disabled={loading}
        className="rounded px-1 py-0.5 text-xs text-zinc-500 hover:bg-red-900/30 hover:text-red-400 disabled:opacity-50"
        title="Bad output"
      >
        👎
      </button>
    </span>
  )
}
