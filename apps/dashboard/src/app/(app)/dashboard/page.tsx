import { createClient } from '@/lib/supabase/server'
import { getCurrentWorkspaceId } from '@/lib/workspace'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

function timeAgo(date: string): string {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000)
  if (seconds < 60) return 'just now'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days === 1) return 'yesterday'
  if (days < 7) return `${days}d ago`
  return new Date(date).toLocaleDateString()
}

export default async function DashboardPage() {
  const supabase = await createClient()
  const workspaceId = await getCurrentWorkspaceId()

  if (!workspaceId) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-muted-foreground">No workspace found.</p>
      </div>
    )
  }

  const today = new Date(new Date().setHours(0, 0, 0, 0)).toISOString()

  const [agentsRes, runsTodayRes, notifsRes, activityRes] = await Promise.all([
    supabase.from('agents').select('id', { count: 'exact' }).eq('workspace_id', workspaceId).eq('status', 'active'),
    supabase.from('runs').select('id, cost_usd', { count: 'exact' }).eq('workspace_id', workspaceId).gte('created_at', today),
    supabase.from('notifications').select('id', { count: 'exact' }).eq('workspace_id', workspaceId).eq('read', false),
    supabase.from('runs').select('id, status, created_at, duration_ms, cost_usd, token_count, output, error, triggered_by, agents(name)').eq('workspace_id', workspaceId).order('created_at', { ascending: false }).limit(20),
  ])

  const activeAgents = agentsRes.count ?? 0
  const runsToday = runsTodayRes.count ?? 0
  const costToday = (runsTodayRes.data ?? []).reduce((s, r) => s + (Number(r.cost_usd) || 0), 0)
  const pendingNotifs = notifsRes.count ?? 0
  const activity = activityRes.data ?? []

  const stats = [
    { label: 'Active agents', value: activeAgents },
    { label: 'Runs today', value: runsToday },
    { label: 'Pending review', value: pendingNotifs, warn: pendingNotifs > 0 },
    { label: 'Cost today', value: `$${costToday.toFixed(4)}` },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-semibold text-foreground">Flight Deck</h1>
        <p className="text-sm text-muted-foreground">What happened while you were away</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {stats.map((s) => (
          <Card key={s.label}>
            <CardContent className="pt-4 pb-4">
              <p className="text-xs text-muted-foreground">{s.label}</p>
              <p className={`text-2xl font-semibold ${s.warn ? 'text-amber-400' : 'text-foreground'}`}>
                {s.value}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Activity feed */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-medium text-foreground">Activity feed</h2>
          <Link href="/runs" className="text-xs text-primary hover:underline">All runs →</Link>
        </div>
        <div className="space-y-2">
          {activity.length === 0 ? (
            <Card>
              <CardContent className="py-10 text-center text-muted-foreground">
                No agent runs yet
              </CardContent>
            </Card>
          ) : (
            activity.map((run) => {
              const agentName = (run.agents as { name: string } | null)?.name ?? 'Unknown'
              const output = typeof run.output === 'string' ? run.output : run.output ? JSON.stringify(run.output) : null
              const summary = run.error
                ? run.error.slice(0, 120)
                : output
                  ? output.replace(/[#*`\n]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 120)
                  : null

              return (
                <Link key={run.id} href={`/runs/${run.id}`}>
                  <Card className="transition-colors hover:border-muted">
                    <CardContent className="py-3">
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className={`inline-block h-2 w-2 rounded-full ${
                              run.status === 'completed' ? 'bg-emerald-500' :
                              run.status === 'failed' ? 'bg-red-500' :
                              run.status === 'running' ? 'bg-yellow-500' : 'bg-muted'
                            }`} />
                            <span className="text-sm font-medium text-foreground">{agentName}</span>
                            <span className="text-xs text-muted-foreground">{timeAgo(run.created_at)}</span>
                            {run.triggered_by === 'cron' && (
                              <Badge variant="outline" className="text-[10px]">cron</Badge>
                            )}
                          </div>
                          {summary && (
                            <p className="mt-1 truncate text-xs text-muted-foreground">{summary}…</p>
                          )}
                        </div>
                        <div className="shrink-0 text-right">
                          {run.cost_usd && (
                            <p className="font-mono text-xs text-muted-foreground">${Number(run.cost_usd).toFixed(4)}</p>
                          )}
                          {run.duration_ms && (
                            <p className="font-mono text-[10px] text-muted-foreground">{(run.duration_ms / 1000).toFixed(1)}s</p>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}
