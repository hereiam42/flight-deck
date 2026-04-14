import { createClient } from '@/lib/supabase/server'
import { getCurrentWorkspaceId } from '@/lib/workspace'
import { notFound } from 'next/navigation'
import Link from 'next/link'

export default async function SessionDetailPage({
  params,
}: {
  params: Promise<{ id: string; sessionId: string }>
}) {
  const { id: agentId, sessionId } = await params
  const supabase = await createClient()
  const workspaceId = await getCurrentWorkspaceId()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any

  const { data: session } = await db
    .from('agent_sessions')
    .select('*, managed_agents(name)')
    .eq('workspace_id', workspaceId ?? '')
    .eq('id', sessionId)
    .single()

  if (!session) notFound()

  const { data: leads } = await db
    .from('leads')
    .select('*')
    .eq('session_id', sessionId)
    .order('created_at')

  const duration = session.completed_at
    ? Math.round((new Date(session.completed_at).getTime() - new Date(session.started_at).getTime()) / 1000)
    : null

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const toolUses: string[] = (session.output_raw as any)?.toolUses ?? []

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div>
        <div className="flex items-center gap-2 text-sm">
          <Link href="/managed-agents" className="text-zinc-500 hover:text-zinc-300">Managed Agents</Link>
          <span className="text-zinc-600">/</span>
          <Link href={`/managed-agents/${agentId}`} className="text-zinc-500 hover:text-zinc-300">
            {session.managed_agents?.name ?? 'Agent'}
          </Link>
          <span className="text-zinc-600">/</span>
          <span className="text-zinc-300">Session</span>
        </div>
        <h1 className="mt-1 text-lg font-semibold text-zinc-100">
          {session.title ?? `Session ${sessionId.slice(0, 8)}`}
        </h1>
      </div>

      {/* Status bar */}
      <div className="card">
        <div className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-5">
          <div>
            <p className="text-xs text-zinc-500">Status</p>
            <span className={`inline-flex items-center gap-1.5 rounded px-1.5 py-0.5 text-xs ${
              session.status === 'completed' ? 'bg-emerald-900/30 text-emerald-400' :
              session.status === 'running' ? 'bg-yellow-900/30 text-yellow-400' :
              'bg-red-900/30 text-red-400'
            }`}>
              {session.status}
            </span>
          </div>
          <div>
            <p className="text-xs text-zinc-500">Trigger</p>
            <p className="text-zinc-300">{session.trigger_type}</p>
          </div>
          <div>
            <p className="text-xs text-zinc-500">Duration</p>
            <p className="font-mono text-zinc-300">{duration != null ? `${duration}s` : '...'}</p>
          </div>
          <div>
            <p className="text-xs text-zinc-500">Tool calls</p>
            <p className="font-mono text-zinc-300">{toolUses.length}</p>
          </div>
          <div>
            <p className="text-xs text-zinc-500">Started</p>
            <p className="text-xs text-zinc-300">{new Date(session.started_at).toLocaleString()}</p>
          </div>
        </div>
      </div>

      {/* Input */}
      <div className="card space-y-2">
        <h2 className="text-sm font-medium text-zinc-300">Input</h2>
        <p className="text-sm text-zinc-400">{session.input_message ?? '—'}</p>
      </div>

      {/* Parsed leads */}
      {(leads ?? []).length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-medium text-zinc-300">Parsed Leads ({leads.length})</h2>
          <div className="card overflow-hidden p-0">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[800px] text-sm">
                <thead>
                  <tr className="border-b border-[#2e2e32]">
                    <th className="px-4 py-2.5 text-left text-xs font-medium text-zinc-500">Company</th>
                    <th className="px-4 py-2.5 text-left text-xs font-medium text-zinc-500">Location</th>
                    <th className="px-4 py-2.5 text-left text-xs font-medium text-zinc-500">Season</th>
                    <th className="px-4 py-2.5 text-left text-xs font-medium text-zinc-500">Roles</th>
                    <th className="px-4 py-2.5 text-left text-xs font-medium text-zinc-500">Confidence</th>
                    <th className="px-4 py-2.5 text-left text-xs font-medium text-zinc-500">Website</th>
                    <th className="px-4 py-2.5 text-left text-xs font-medium text-zinc-500">Contact</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#2e2e32]">
                  {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                  {leads.map((lead: any) => (
                    <tr key={lead.id} className="hover:bg-[#18181b]">
                      <td className="px-4 py-2.5 font-medium text-zinc-200">{lead.company_name}</td>
                      <td className="px-4 py-2.5 text-zinc-400">{lead.location ?? '—'}</td>
                      <td className="px-4 py-2.5 text-xs text-zinc-400">{lead.season ?? '—'}</td>
                      <td className="max-w-[200px] px-4 py-2.5 text-xs text-zinc-400">
                        {Array.isArray(lead.roles_hiring)
                          ? lead.roles_hiring.join(', ')
                          : '—'}
                      </td>
                      <td className="px-4 py-2.5">
                        <span className={`rounded px-1.5 py-0.5 text-xs ${
                          lead.confidence === 'high' ? 'bg-emerald-900/30 text-emerald-400' :
                          lead.confidence === 'medium' ? 'bg-yellow-900/30 text-yellow-400' :
                          'bg-zinc-800 text-zinc-500'
                        }`}>
                          {lead.confidence ?? '—'}
                        </span>
                      </td>
                      <td className="px-4 py-2.5">
                        {lead.website_url ? (
                          <a href={lead.website_url} target="_blank" rel="noopener noreferrer"
                            className="text-xs text-indigo-400 hover:text-indigo-300">
                            {lead.website_url.replace(/^https?:\/\//, '').replace(/\/$/, '').slice(0, 30)}
                          </a>
                        ) : '—'}
                      </td>
                      <td className="px-4 py-2.5 text-xs text-zinc-400">
                        {lead.contact_email ?? (lead.contact_page_url ? (
                          <a href={lead.contact_page_url} target="_blank" rel="noopener noreferrer"
                            className="text-indigo-400 hover:text-indigo-300">
                            contact page
                          </a>
                        ) : '—')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tool uses */}
      {toolUses.length > 0 && (
        <div className="card space-y-2">
          <h2 className="text-sm font-medium text-zinc-300">Tool Uses</h2>
          <div className="flex flex-wrap gap-1.5">
            {toolUses.map((t, i) => (
              <span key={i} className="rounded bg-zinc-800 px-2 py-0.5 font-mono text-xs text-zinc-400">
                {t}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Agent output */}
      {session.output_text && (
        <details className="card group">
          <summary className="cursor-pointer text-sm font-medium text-zinc-300">
            Full agent output
          </summary>
          <pre className="mt-3 max-h-96 overflow-auto whitespace-pre-wrap rounded bg-[#0a0a0b] p-3 font-mono text-[11px] text-zinc-400">
            {session.output_text}
          </pre>
        </details>
      )}

      {/* Error */}
      {session.error && (
        <div className="card border-red-900/30">
          <h2 className="text-sm font-medium text-red-400">Error</h2>
          <pre className="mt-2 whitespace-pre-wrap font-mono text-xs text-red-300">{session.error}</pre>
        </div>
      )}
    </div>
  )
}
