import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { AgentEditForm } from './AgentEditForm'
import { RunAgentButton } from './RunAgentButton'

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

  const { data: runs } = await supabase
    .from('runs')
    .select('*')
    .eq('agent_id', id)
    .order('created_at', { ascending: false })
    .limit(20)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Link href="/agents" className="text-sm text-zinc-500 hover:text-zinc-300">
              Agents
            </Link>
            <span className="text-zinc-600">/</span>
            <span className="text-sm text-zinc-300">{agent.name}</span>
          </div>
          <h1 className="mt-1 text-lg font-semibold text-zinc-100">{agent.name}</h1>
        </div>
        <div className="flex gap-2">
          <span className={`badge-${agent.status} self-center`}>{agent.status}</span>
          <RunAgentButton agentId={agent.id} />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Edit form */}
        <div className="lg:col-span-2">
          <AgentEditForm agent={agent} />
        </div>

        {/* Meta */}
        <div className="space-y-4">
          <div className="card space-y-3 text-sm">
            <h3 className="font-medium text-zinc-300">Details</h3>
            <div>
              <p className="text-xs text-zinc-500">Model</p>
              <p className="mt-0.5 font-mono text-xs text-zinc-300">{agent.model}</p>
            </div>
            <div>
              <p className="text-xs text-zinc-500">Schedule</p>
              <p className="mt-0.5 font-mono text-xs text-zinc-300">
                {agent.schedule ?? 'manual only'}
              </p>
            </div>
            <div>
              <p className="text-xs text-zinc-500">Created</p>
              <p className="mt-0.5 text-xs text-zinc-300">
                {new Date(agent.created_at).toLocaleDateString()}
              </p>
            </div>
          </div>
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
                <th className="px-4 py-2.5 text-left text-xs font-medium text-zinc-500">Duration</th>
                <th className="px-4 py-2.5 text-left text-xs font-medium text-zinc-500">Tokens</th>
                <th className="px-4 py-2.5 text-left text-xs font-medium text-zinc-500">Cost</th>
                <th className="px-4 py-2.5 text-left text-xs font-medium text-zinc-500">Started</th>
                <th className="px-4 py-2.5" />
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2e2e32]">
              {(runs ?? []).length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-6 text-center text-zinc-500">
                    No runs yet
                  </td>
                </tr>
              ) : (
                (runs ?? []).map((run) => (
                  <tr key={run.id} className="hover:bg-[#18181b]">
                    <td className="px-4 py-2.5">
                      <span className={`badge-${run.status}`}>{run.status}</span>
                    </td>
                    <td className="px-4 py-2.5 font-mono text-xs text-zinc-400">
                      {run.duration_ms ? `${(run.duration_ms / 1000).toFixed(1)}s` : '—'}
                    </td>
                    <td className="px-4 py-2.5 font-mono text-xs text-zinc-400">
                      {run.token_count ?? '—'}
                    </td>
                    <td className="px-4 py-2.5 font-mono text-xs text-zinc-400">
                      {run.cost_usd ? `$${Number(run.cost_usd).toFixed(4)}` : '—'}
                    </td>
                    <td className="px-4 py-2.5 text-xs text-zinc-500">
                      {new Date(run.created_at).toLocaleString()}
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      <Link href={`/runs/${run.id}`} className="btn-ghost text-xs">
                        View →
                      </Link>
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
