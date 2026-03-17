import { createClient } from '@/lib/supabase/server'
import { getCurrentWorkspaceId } from '@/lib/workspace'
import Link from 'next/link'

export default async function AgentsPage() {
  const supabase = await createClient()
  const workspaceId = await getCurrentWorkspaceId()

  const { data: agents } = await supabase
    .from('agents')
    .select('*, runs(id, status, created_at)')
    .eq('workspace_id', workspaceId ?? '')
    .order('created_at', { ascending: false })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-zinc-100">Agents</h1>
          <p className="text-sm text-zinc-500">{agents?.length ?? 0} agents in this workspace</p>
        </div>
        <Link href="/agents/new" className="btn-primary">
          <svg className="h-3.5 w-3.5" viewBox="0 0 16 16" fill="currentColor">
            <path d="M8 2a.5.5 0 01.5.5v5h5a.5.5 0 010 1h-5v5a.5.5 0 01-1 0v-5h-5a.5.5 0 010-1h5v-5A.5.5 0 018 2z" />
          </svg>
          New agent
        </Link>
      </div>

      <div className="card overflow-hidden p-0">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#2e2e32]">
              <th className="px-4 py-2.5 text-left text-xs font-medium text-zinc-500">Name</th>
              <th className="px-4 py-2.5 text-left text-xs font-medium text-zinc-500">Model</th>
              <th className="px-4 py-2.5 text-left text-xs font-medium text-zinc-500">Schedule</th>
              <th className="px-4 py-2.5 text-left text-xs font-medium text-zinc-500">Status</th>
              <th className="px-4 py-2.5 text-left text-xs font-medium text-zinc-500">Last run</th>
              <th className="px-4 py-2.5" />
            </tr>
          </thead>
          <tbody className="divide-y divide-[#2e2e32]">
            {(agents ?? []).length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-zinc-500">
                  No agents yet.{' '}
                  <Link href="/agents/new" className="text-indigo-400 hover:text-indigo-300">
                    Create your first agent →
                  </Link>
                </td>
              </tr>
            ) : (
              (agents ?? []).map((agent) => {
                const runs = (agent.runs as { id: string; status: string; created_at: string }[] | null) ?? []
                const lastRun = runs.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0]
                return (
                  <tr key={agent.id} className="hover:bg-[#18181b]">
                    <td className="px-4 py-3">
                      <Link href={`/agents/${agent.id}`} className="font-medium text-zinc-200 hover:text-indigo-400">
                        {agent.name}
                      </Link>
                      {agent.description && (
                        <p className="mt-0.5 text-xs text-zinc-500 line-clamp-1">{agent.description}</p>
                      )}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-zinc-400">{agent.model}</td>
                    <td className="px-4 py-3 font-mono text-xs text-zinc-400">
                      {agent.schedule ?? <span className="text-zinc-600">manual</span>}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`badge-${agent.status}`}>{agent.status}</span>
                    </td>
                    <td className="px-4 py-3 text-xs text-zinc-500">
                      {lastRun
                        ? new Date(lastRun.created_at).toLocaleDateString()
                        : <span className="text-zinc-600">never</span>}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link href={`/agents/${agent.id}`} className="btn-ghost text-xs">
                        View →
                      </Link>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
