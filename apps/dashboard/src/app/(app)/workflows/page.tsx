import { createClient } from '@/lib/supabase/server'
import { getCurrentWorkspaceId } from '@/lib/workspace'

export default async function WorkflowsPage() {
  const supabase = await createClient()
  const workspaceId = await getCurrentWorkspaceId()

  const { data: workflows } = await supabase
    .from('workflows')
    .select('*')
    .eq('workspace_id', workspaceId ?? '')
    .order('created_at', { ascending: false })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-zinc-100">Workflows</h1>
          <p className="text-sm text-zinc-500">{workflows?.length ?? 0} workflows</p>
        </div>
        <button className="btn-primary" disabled>
          New workflow <span className="ml-1 text-xs text-white/50">(coming soon)</span>
        </button>
      </div>

      {(workflows ?? []).length === 0 ? (
        <div className="card py-12 text-center">
          <p className="text-zinc-500">No workflows yet</p>
          <p className="mt-1 text-xs text-zinc-600">
            Multi-agent DAG support is coming in Phase 1
          </p>
        </div>
      ) : (
        <div className="card overflow-hidden p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#2e2e32]">
                <th className="px-4 py-2.5 text-left text-xs font-medium text-zinc-500">Name</th>
                <th className="px-4 py-2.5 text-left text-xs font-medium text-zinc-500">Steps</th>
                <th className="px-4 py-2.5 text-left text-xs font-medium text-zinc-500">Trigger</th>
                <th className="px-4 py-2.5 text-left text-xs font-medium text-zinc-500">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2e2e32]">
              {(workflows ?? []).map((wf) => {
                const steps = Array.isArray(wf.steps) ? wf.steps : []
                const trigger = wf.trigger as { type?: string } | null
                return (
                  <tr key={wf.id} className="hover:bg-[#18181b]">
                    <td className="px-4 py-3 font-medium text-zinc-200">{wf.name}</td>
                    <td className="px-4 py-3 text-zinc-400">{steps.length}</td>
                    <td className="px-4 py-3 text-zinc-400">{trigger?.type ?? '—'}</td>
                    <td className="px-4 py-3">
                      <span className={`badge-${wf.status}`}>{wf.status}</span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
