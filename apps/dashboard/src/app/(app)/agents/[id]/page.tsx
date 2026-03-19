import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { AgentEditForm } from './AgentEditForm'
import { TestPanel } from './TestPanel'
import { PromptVersions } from './PromptVersions'
import { RunFeedback } from './RunFeedback'

interface Props {
  params: Promise<{ id: string }>
}

export default async function AgentDetailPage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()

  const { data: agent } = await supabase
    .from('agents')
    .select('*')
    .eq('id', id)
    .single()

  if (!agent) notFound()

  // Get last 20 runs, prompt versions, and feedback in parallel
  const [runsRes, versionsRes, feedbackRes] = await Promise.all([
    supabase.from('runs').select('*').eq('agent_id', id).order('created_at', { ascending: false }).limit(20),
    supabase.from('prompt_versions').select('*').eq('agent_id', id).order('version_number', { ascending: false }),
    supabase.from('run_feedback').select('run_id, feedback_type').eq('agent_id', id),
  ])

  const runs = runsRes.data
  const versions = versionsRes.data ?? []
  const feedbackMap = new Map<string, string>()
  for (const fb of feedbackRes.data ?? []) {
    feedbackMap.set(fb.run_id, fb.feedback_type)
  }

  // Compute health metrics
  const recentRuns = (runs ?? []).slice(0, 10)
  const successCount = recentRuns.filter((r) => r.status === 'completed').length
  const failCount = recentRuns.filter((r) => r.status === 'failed').length
  const successRate = recentRuns.length > 0 ? Math.round((successCount / recentRuns.length) * 100) : null
  const avgCost = recentRuns.length > 0
    ? recentRuns.reduce((sum, r) => sum + (Number(r.cost_usd) || 0), 0) / recentRuns.length
    : null
  const totalRuns = runs?.length ?? 0

  const healthColor = successRate === null
    ? 'bg-zinc-600'
    : successRate >= 80 ? 'bg-emerald-500' : successRate >= 50 ? 'bg-yellow-500' : 'bg-red-500'

  const tools = Array.isArray(agent.tools) ? agent.tools as { name: string; type: string }[] : []

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Link href="/agents" className="text-sm text-zinc-500 hover:text-zinc-300">Agents</Link>
            <span className="text-zinc-600">/</span>
            <span className="text-sm text-zinc-300">{agent.name}</span>
          </div>
          <div className="mt-1 flex items-center gap-3">
            <h1 className="text-lg font-semibold text-zinc-100">{agent.name}</h1>
            <span className={`inline-block h-2.5 w-2.5 rounded-full ${healthColor}`} title={`${successRate ?? 0}% success`} />
            <span className={`badge-${agent.status}`}>{agent.status}</span>
          </div>
          {agent.description && (
            <p className="mt-0.5 text-sm text-zinc-500">{agent.description}</p>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        <div className="stat-card">
          <p className="text-xs text-zinc-500">Total runs</p>
          <p className="font-mono text-lg text-zinc-200">{totalRuns}</p>
        </div>
        <div className="stat-card">
          <p className="text-xs text-zinc-500">Success rate</p>
          <p className="font-mono text-lg text-zinc-200">{successRate !== null ? `${successRate}%` : '—'}</p>
        </div>
        <div className="stat-card">
          <p className="text-xs text-zinc-500">Failures</p>
          <p className="font-mono text-lg text-zinc-200">{failCount}</p>
        </div>
        <div className="stat-card">
          <p className="text-xs text-zinc-500">Avg cost</p>
          <p className="font-mono text-lg text-zinc-200">{avgCost !== null ? `$${avgCost.toFixed(4)}` : '—'}</p>
        </div>
        <div className="stat-card">
          <p className="text-xs text-zinc-500">Tools</p>
          <p className="font-mono text-lg text-zinc-200">{tools.length}</p>
        </div>
      </div>

      {/* Test Panel — the most important feature */}
      <TestPanel agentId={agent.id} />

      {/* Config + Details side by side */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <AgentEditForm agent={agent} />
        </div>
        <div className="space-y-4">
          <div className="card space-y-3 text-sm">
            <h3 className="font-medium text-zinc-300">Details</h3>
            <div>
              <p className="text-xs text-zinc-500">Model</p>
              <p className="mt-0.5 font-mono text-xs text-zinc-300">{agent.model}</p>
            </div>
            <div>
              <p className="text-xs text-zinc-500">Schedule</p>
              <p className="mt-0.5 font-mono text-xs text-zinc-300">{agent.schedule ?? 'manual only'}</p>
            </div>
            <div>
              <p className="text-xs text-zinc-500">Created</p>
              <p className="mt-0.5 text-xs text-zinc-300">{new Date(agent.created_at).toLocaleDateString()}</p>
            </div>
            <div>
              <p className="text-xs text-zinc-500">Last updated</p>
              <p className="mt-0.5 text-xs text-zinc-300">{new Date(agent.updated_at).toLocaleDateString()}</p>
            </div>
          </div>

          {/* Tools list */}
          {tools.length > 0 && (
            <div className="card space-y-2 text-sm">
              <h3 className="font-medium text-zinc-300">Tools</h3>
              <div className="space-y-1">
                {tools.map((t, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <span className="font-mono text-xs text-indigo-400">{t.name}</span>
                    <span className="rounded bg-zinc-800 px-1.5 py-0.5 text-[10px] text-zinc-500">{t.type}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Prompt versions */}
          <PromptVersions agentId={agent.id} versions={versions} />
        </div>
      </div>

      {/* Run history */}
      <div>
        <h2 className="mb-3 text-sm font-medium text-zinc-300">Run history</h2>
        <div className="card overflow-hidden p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#2e2e32]">
                <th className="px-4 py-2.5 text-left text-xs font-medium text-zinc-500">Status</th>
                <th className="px-4 py-2.5 text-left text-xs font-medium text-zinc-500">Reviewed</th>
                <th className="px-4 py-2.5 text-left text-xs font-medium text-zinc-500">Duration</th>
                <th className="px-4 py-2.5 text-left text-xs font-medium text-zinc-500">Cost</th>
                <th className="px-4 py-2.5 text-left text-xs font-medium text-zinc-500">Started</th>
                <th className="px-4 py-2.5 text-left text-xs font-medium text-zinc-500">Feedback</th>
                <th className="px-4 py-2.5" />
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2e2e32]">
              {(runs ?? []).length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-6 text-center text-zinc-500">
                    No runs yet — use the test panel above to trigger your first run
                  </td>
                </tr>
              ) : (
                (runs ?? []).map((run) => (
                  <tr key={run.id} className="hover:bg-[#18181b]">
                    <td className="px-4 py-2.5">
                      <span className={`badge-${run.status}`}>{run.status}</span>
                    </td>
                    <td className="px-4 py-2.5 text-center">
                      {run.reviewed
                        ? <span className="text-emerald-500" title="Self-review passed">✓</span>
                        : run.status === 'completed'
                          ? <span className="text-zinc-600" title="Not reviewed">—</span>
                          : null}
                    </td>
                    <td className="px-4 py-2.5 font-mono text-xs text-zinc-400">
                      {run.duration_ms ? `${(run.duration_ms / 1000).toFixed(1)}s` : '—'}
                    </td>
                    <td className="px-4 py-2.5 font-mono text-xs text-zinc-400">
                      {run.cost_usd ? `$${Number(run.cost_usd).toFixed(4)}` : '—'}
                    </td>
                    <td className="px-4 py-2.5 text-xs text-zinc-500">
                      {new Date(run.created_at).toLocaleString()}
                    </td>
                    <td className="px-4 py-2.5">
                      <RunFeedback
                        runId={run.id}
                        agentId={agent.id}
                        workspaceId={agent.workspace_id}
                        existingFeedback={feedbackMap.get(run.id) ?? null}
                      />
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      <Link href={`/runs/${run.id}`} className="btn-ghost text-xs">View →</Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
