import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'

interface Props {
  params: Promise<{ id: string }>
}

export default async function RunDetailPage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()

  const { data: run } = await supabase
    .from('runs')
    .select('*, agents(name, id), workflows(name)')
    .eq('id', id)
    .single()

  if (!run) notFound()

  const agent = run.agents as { id: string; name: string } | null
  const workflow = run.workflows as { name: string } | null

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2 text-sm text-zinc-500">
          <Link href="/runs" className="hover:text-zinc-300">Runs</Link>
          <span className="text-zinc-600">/</span>
          <span className="font-mono text-xs text-zinc-400">{run.id}</span>
        </div>
        <div className="mt-2 flex items-center gap-3">
          <h1 className="text-lg font-semibold text-zinc-100">
            {agent?.name ?? 'Unknown agent'}
          </h1>
          <span className={`badge-${run.status}`}>{run.status}</span>
        </div>
      </div>

      {/* Meta row */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="stat-card">
          <p className="text-xs text-zinc-500">Duration</p>
          <p className="font-mono text-sm text-zinc-200">
            {run.duration_ms ? `${(run.duration_ms / 1000).toFixed(2)}s` : '—'}
          </p>
        </div>
        <div className="stat-card">
          <p className="text-xs text-zinc-500">Tokens</p>
          <p className="font-mono text-sm text-zinc-200">{run.token_count ?? '—'}</p>
        </div>
        <div className="stat-card">
          <p className="text-xs text-zinc-500">Cost</p>
          <p className="font-mono text-sm text-zinc-200">
            {run.cost_usd ? `$${Number(run.cost_usd).toFixed(6)}` : '—'}
          </p>
        </div>
        <div className="stat-card">
          <p className="text-xs text-zinc-500">Triggered by</p>
          <p className="text-sm text-zinc-200">{run.triggered_by ?? '—'}</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Input */}
        <div className="card space-y-2">
          <h2 className="text-sm font-medium text-zinc-300">Input</h2>
          <pre className="overflow-auto rounded-md bg-[#0a0a0b] p-3 font-mono text-xs text-zinc-300">
            {run.input ? JSON.stringify(run.input, null, 2) : 'null'}
          </pre>
        </div>

        {/* Output */}
        <div className="card space-y-2">
          <h2 className="text-sm font-medium text-zinc-300">Output</h2>
          {run.error ? (
            <div className="rounded-md bg-red-900/20 p-3">
              <p className="text-xs font-medium text-red-400">Error</p>
              <pre className="mt-1 font-mono text-xs text-red-300">{run.error}</pre>
            </div>
          ) : (
            <pre className="overflow-auto rounded-md bg-[#0a0a0b] p-3 font-mono text-xs text-zinc-300">
              {run.output ? JSON.stringify(run.output, null, 2) : 'null'}
            </pre>
          )}
        </div>
      </div>

      {/* Links */}
      <div className="flex gap-3 text-sm">
        {agent && (
          <Link href={`/agents/${agent.id}`} className="btn-secondary">
            View agent →
          </Link>
        )}
        {workflow && (
          <span className="btn-ghost cursor-default">
            Workflow: {workflow.name}
          </span>
        )}
      </div>
    </div>
  )
}
