import { createClient } from '@/lib/supabase/server'
import { getCurrentWorkspaceId } from '@/lib/workspace'
import { MissionStack } from './MissionStack'
import { AddMissionForm } from './AddMissionForm'

const VENTURE_LABELS: Record<string, { label: string; short: string; badgeCls: string; badgeStackCls: string }> = {
  beyond_peaks:  { label: 'Beyond Peaks',  short: 'BP', badgeCls: 'bg-emerald-500/10 text-emerald-400', badgeStackCls: 'bg-emerald-500/10 text-emerald-400' },
  pacific_atlas:  { label: 'Pacific Atlas', short: 'PA', badgeCls: 'bg-violet-500/10 text-violet-400', badgeStackCls: 'bg-violet-500/10 text-violet-400' },
  nama_fiji:     { label: 'NAMA FIJI',     short: 'NF', badgeCls: 'bg-amber-500/10 text-amber-400', badgeStackCls: 'bg-amber-500/10 text-amber-400' },
  football_mgr:  { label: 'Football Mgr',  short: 'FM', badgeCls: 'bg-sky-500/10 text-sky-400', badgeStackCls: 'bg-sky-500/10 text-sky-400' },
  nexus:         { label: 'Nexus',         short: 'NX', badgeCls: 'bg-zinc-500/10 text-zinc-400', badgeStackCls: 'bg-zinc-500/10 text-zinc-400' },
  finance:       { label: 'Finance',       short: 'FI', badgeCls: 'bg-rose-500/10 text-rose-400', badgeStackCls: 'bg-rose-500/10 text-rose-400' },
  barker_wellness: { label: 'Barker Wellness', short: 'BW', badgeCls: 'bg-pink-500/10 text-pink-400', badgeStackCls: 'bg-pink-500/10 text-pink-400' },
  trade_intel:   { label: 'Trade Intel',   short: 'TI', badgeCls: 'bg-red-500/10 text-red-400', badgeStackCls: 'bg-red-500/10 text-red-400' },
  gov_ai:        { label: 'Gov AI',        short: 'GA', badgeCls: 'bg-yellow-500/10 text-yellow-400', badgeStackCls: 'bg-yellow-500/10 text-yellow-400' },
  flight_deck:   { label: 'Flight Deck',   short: 'FD', badgeCls: 'bg-orange-500/10 text-orange-400', badgeStackCls: 'bg-orange-500/10 text-orange-400' },
}

function formatDate(d: Date): string {
  return d.toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long' })
}

export default async function MissionControlPage() {
  const supabase = await createClient()
  const workspaceId = await getCurrentWorkspaceId()
  if (!workspaceId) return <div className="text-zinc-500">No workspace</div>

  const today = new Date().toISOString().split('T')[0]
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0]

  // Fetch all active missions ranked
  const { data: missions } = await supabase
    .from('missions')
    .select('*')
    .eq('workspace_id', workspaceId)
    .in('status', ['queued', 'today', 'in_progress'])
    .order('composite_score', { ascending: false })

  // Fetch yesterday's completions
  const { data: completedYesterday } = await supabase
    .from('missions')
    .select('*')
    .eq('workspace_id', workspaceId)
    .eq('status', 'done')
    .gte('completed_at', yesterday + 'T00:00:00')
    .lt('completed_at', today + 'T00:00:00')

  // Fetch stale missions
  const { data: staleMissions } = await supabase
    .from('missions')
    .select('*')
    .eq('workspace_id', workspaceId)
    .eq('stale_flag', true)
    .in('status', ['queued', 'today', 'in_progress'])

  const allMissions = missions ?? []
  const todayMissions = allMissions.filter(m => m.status === 'today' || m.status === 'in_progress').slice(0, 3)
  const stackMissions = allMissions.filter(m => !todayMissions.find(t => t.id === m.id))

  // Venture health: count active missions per venture
  const ventureHealth: Record<string, number> = {}
  for (const m of allMissions) {
    ventureHealth[m.venture] = (ventureHealth[m.venture] ?? 0) + 1
  }

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      {/* Header */}
      <div className="flex items-baseline justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">Mission Control</p>
          <h1 className="text-lg font-semibold text-zinc-100">{formatDate(new Date())}</h1>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-zinc-500">
            {todayMissions.length} of {allMissions.length} missions today
          </span>
          <span className={`inline-block h-2 w-2 rounded-full ${
            todayMissions.length > 0 ? 'bg-emerald-500' : 'bg-zinc-600'
          }`} />
        </div>
      </div>

      {/* Today's Missions */}
      <section>
        <h2 className="mb-3 text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
          Today&apos;s missions
        </h2>
        {todayMissions.length === 0 ? (
          <div className="card py-8 text-center">
            <p className="text-sm text-zinc-500">No missions scheduled for today.</p>
            <p className="mt-1 text-xs text-zinc-600">
              Pick up to 3 from the stack below, or add a new one.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {todayMissions.map((mission, i) => {
              const v = VENTURE_LABELS[mission.venture] ?? { label: mission.venture, short: '??', badgeCls: 'bg-zinc-500/10 text-zinc-400', badgeStackCls: 'bg-zinc-500/10 text-zinc-400' }
              return (
                <div key={mission.id} className="card group transition-colors hover:border-zinc-600">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className={`inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-semibold ${v.badgeCls}`}>
                          {v.short}
                        </span>
                        <span className="text-sm font-medium text-zinc-200">{mission.title}</span>
                      </div>
                      <div className="mt-1 flex gap-3 text-[11px] text-zinc-600">
                        <span>Impact {mission.impact_score ?? '—'}</span>
                        <span>Urgency {mission.urgency_score ?? '—'}</span>
                        <span className="text-emerald-500/70">
                          Score {mission.composite_score?.toFixed(1) ?? '—'}
                        </span>
                        {mission.deadline && (
                          <span className="text-amber-500/70">Due {mission.deadline}</span>
                        )}
                      </div>
                    </div>
                    <MissionStack
                      missionId={mission.id}
                      workspaceId={workspaceId}
                      action="complete"
                    />
                  </div>
                  {mission.claude_context && (
                    <div className="mt-2 rounded bg-[#0a0a0b] px-3 py-2 text-[11px] text-zinc-500 opacity-0 transition-opacity group-hover:opacity-100">
                      <span className="text-zinc-600">Claude context:</span> {mission.claude_context.slice(0, 140)}…
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </section>

      {/* The Stack */}
      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
            The stack
          </h2>
          <span className="text-[11px] text-zinc-600">{stackMissions.length} queued</span>
        </div>
        <div className="space-y-1">
          {stackMissions.slice(0, 10).map((mission, i) => {
            const v = VENTURE_LABELS[mission.venture] ?? { label: mission.venture, short: '??', badgeCls: 'bg-zinc-500/10 text-zinc-400', badgeStackCls: 'bg-zinc-500/10 text-zinc-400' }
            return (
              <div key={mission.id} className="flex items-center gap-2 rounded px-2 py-1.5 text-sm transition-colors hover:bg-[#111113]">
                <span className="w-5 text-right text-[11px] text-zinc-600">{todayMissions.length + i + 1}.</span>
                <span className={`rounded px-1 py-0.5 text-[9px] font-semibold ${v.badgeStackCls}`}>
                  {v.short}
                </span>
                <span className="flex-1 truncate text-zinc-400">{mission.title}</span>
                <MissionStack
                  missionId={mission.id}
                  workspaceId={workspaceId}
                  action="promote"
                />
              </div>
            )
          })}
          {stackMissions.length > 10 && (
            <p className="px-2 text-[11px] text-zinc-600">+ {stackMissions.length - 10} more</p>
          )}
        </div>
      </section>

      {/* Stale — Kill or Commit */}
      {(staleMissions?.length ?? 0) > 0 && (
        <section>
          <h2 className="mb-3 text-[10px] font-semibold uppercase tracking-wider text-red-400/70">
            Stale — kill or commit
          </h2>
          <div className="rounded-lg border border-red-500/20 bg-red-500/5 p-3 space-y-2">
            {staleMissions!.map((mission) => {
              const daysIdle = Math.floor((Date.now() - new Date(mission.last_touched).getTime()) / 86400000)
              return (
                <div key={mission.id} className="flex items-center justify-between gap-3">
                  <span className="flex-1 truncate text-sm text-red-300/70">
                    {mission.title} — <span className="text-red-400/50">{daysIdle}d idle</span>
                  </span>
                  <div className="flex gap-1.5">
                    <MissionStack
                      missionId={mission.id}
                      workspaceId={workspaceId}
                      action="kill"
                    />
                    <MissionStack
                      missionId={mission.id}
                      workspaceId={workspaceId}
                      action="commit"
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </section>
      )}

      {/* Yesterday */}
      {(completedYesterday?.length ?? 0) > 0 && (
        <section>
          <h2 className="mb-3 text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
            Yesterday
          </h2>
          <div className="space-y-1">
            {completedYesterday!.map((m) => (
              <div key={m.id} className="flex items-center gap-2 px-2 py-1 text-sm text-emerald-500/60">
                <span>✓</span>
                <span>{m.title}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Venture Pulse */}
      <section>
        <h2 className="mb-3 text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
          Venture pulse
        </h2>
        <div className="grid grid-cols-2 gap-2 lg:grid-cols-3">
          {Object.entries(VENTURE_LABELS)
            .filter(([key]) => ventureHealth[key])
            .map(([key, v]) => (
            <div key={key} className="card !py-3">
              <p className="truncate text-[10px] text-zinc-600">{v.label}</p>
              <p className="text-lg font-semibold text-zinc-200">
                {ventureHealth[key] ?? 0}{' '}
                <span className="text-xs font-normal text-zinc-500">active</span>
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Add Mission */}
      <AddMissionForm workspaceId={workspaceId} ventures={VENTURE_LABELS} />
    </div>
  )
}
