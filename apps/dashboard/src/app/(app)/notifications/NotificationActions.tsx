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

  return (
    <div className="flex shrink-0 gap-2">
      {!read && (
        <button
          onClick={markRead}
          disabled={loading}
          className="btn-ghost text-xs"
        >
          Mark read
        </button>
      )}
      {type === 'approval_required' && (
        <>
          <button
            onClick={() => handleAction('approved')}
            disabled={loading}
            className="btn-primary text-xs"
          >
            Approve
          </button>
          <button
            onClick={() => handleAction('rejected')}
            disabled={loading}
            className="btn-danger text-xs"
          >
            Reject
          </button>
        </>
      )}
    </div>
  )
}
