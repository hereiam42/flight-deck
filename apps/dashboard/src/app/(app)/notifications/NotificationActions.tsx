'use client'

import { createClient } from '@/lib/supabase/client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface Props {
  notificationId: string
  type: string
  read: boolean
  actioned: boolean
  agentName?: string
  payload?: Record<string, unknown> | null
}

export function NotificationActions({ notificationId, type, read, actioned, agentName, payload }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function markRead() {
    setLoading(true)
    const supabase = createClient()
    await supabase
      .from('notifications')
      .update({ read: true })
      .eq('id', notificationId)
    router.refresh()
    setLoading(false)
  }

  async function handleAction(action: 'approved' | 'rejected') {
    setLoading(true)
    const supabase = createClient()

    // If approving content from the SEO content generator, publish the article
    if (action === 'approved' && agentName === 'seo_content_generator' && payload) {
      const article = payload.article as Record<string, unknown> | undefined
      const boardId = payload.board_id as string | undefined

      // Find the pending_review content by title match and publish it
      if (article?.title || boardId) {
        const query = supabase
          .from('content')
          .update({ status: 'published', published_at: new Date().toISOString() })
          .eq('status', 'pending_review')

        if (boardId) query.eq('board_id', boardId)
        if (article?.title) query.eq('title', article.title as string)

        await query
      }
    }

    await supabase
      .from('notifications')
      .update({ read: true, actioned: true, action_taken: action })
      .eq('id', notificationId)
    router.refresh()
    setLoading(false)
  }

  if (actioned) {
    return null
  }

  const needsApproval = type === 'approval_required' || type === 'critical_approval'

  return (
    <div className="flex shrink-0 gap-2">
      {!read && !needsApproval && (
        <button onClick={markRead} disabled={loading} className="btn-ghost text-xs">
          Mark read
        </button>
      )}
      {needsApproval && (
        <>
          <button
            onClick={() => handleAction('approved')}
            disabled={loading}
            className="rounded bg-emerald-600 px-2.5 py-1 text-xs font-medium text-white hover:bg-emerald-500 disabled:opacity-50"
          >
            {agentName === 'seo_content_generator' ? 'Approve & Publish' : 'Approve'}
          </button>
          <button
            onClick={() => handleAction('rejected')}
            disabled={loading}
            className="rounded bg-red-600/80 px-2.5 py-1 text-xs font-medium text-white hover:bg-red-500 disabled:opacity-50"
          >
            Reject
          </button>
        </>
      )}
    </div>
  )
}
