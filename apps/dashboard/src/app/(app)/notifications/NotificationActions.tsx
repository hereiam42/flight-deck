'use client'

import { createClient } from '@/lib/supabase/client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface Props {
  notificationId: string
  type: string
  read: boolean
  actioned: boolean
}

export function NotificationActions({ notificationId, type, read, actioned }: Props) {
  const supabase = createClient()
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function markRead() {
    setLoading(true)
    await supabase
      .from('notifications')
      .update({ read: true })
      .eq('id', notificationId)
    router.refresh()
    setLoading(false)
  }

  async function handleAction(action: 'approved' | 'rejected') {
    setLoading(true)
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
            Approve
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
