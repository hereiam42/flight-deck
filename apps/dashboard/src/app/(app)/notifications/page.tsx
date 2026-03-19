import { createClient } from '@/lib/supabase/server'
import { getCurrentWorkspaceId } from '@/lib/workspace'
import Link from 'next/link'
import { NotificationActions } from './NotificationActions'

export default async function NotificationsPage() {
  const supabase = await createClient()
  const workspaceId = await getCurrentWorkspaceId()

  const { data: notifications } = await supabase
    .from('notifications')
    .select('*, agents(name)')
    .eq('workspace_id', workspaceId ?? '')
    .order('created_at', { ascending: false })
    .limit(50)

  const unreadCount = (notifications ?? []).filter((n) => !n.read).length

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-semibold text-zinc-100">Notifications</h1>
        <p className="text-sm text-zinc-500">
          {unreadCount} unread · {notifications?.length ?? 0} total
        </p>
      </div>

      <div className="space-y-2">
        {(notifications ?? []).length === 0 ? (
          <div className="card py-10 text-center text-zinc-500">
            No notifications yet
          </div>
        ) : (
          (notifications ?? []).map((n) => (
            <div
              key={n.id}
              className={`card transition-colors ${
                !n.read ? 'border-indigo-500/30 bg-indigo-950/10' : ''
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <span className={`badge-${n.type} mt-0.5 shrink-0`}>{n.type}</span>
                  <div>
                    <p className="text-sm font-medium text-zinc-200">{n.title}</p>
                    {(n.agents as { name: string } | null)?.name && (
                      <p className="mt-0.5 text-xs text-zinc-500">
                        Agent: {(n.agents as { name: string }).name}
                      </p>
                    )}
                    {n.run_id && (
                      <Link
                        href={`/runs/${n.run_id}`}
                        className="mt-0.5 block text-xs text-indigo-400 hover:text-indigo-300"
                      >
                        View run →
                      </Link>
                    )}
                    {n.payload && (
                      <pre className="mt-2 rounded bg-[#0a0a0b] p-2 font-mono text-xs text-zinc-400">
                        {JSON.stringify(n.payload, null, 2)}
                      </pre>
                    )}
                    <p className="mt-1 text-xs text-zinc-600">
                      {new Date(n.created_at).toLocaleString()}
                    </p>
                  </div>
                </div>
                <NotificationActions
                  notificationId={n.id}
                  type={n.type}
                  read={n.read}
                  actioned={n.actioned}
                  agentName={(n.agents as { name: string } | null)?.name}
                  payload={n.payload as Record<string, unknown> | null}
                />
              </div>
              {n.actioned && n.action_taken && (
                <p className="mt-2 text-xs text-zinc-500">
                  Action taken: <span className="text-zinc-400">{n.action_taken}</span>
                </p>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}
