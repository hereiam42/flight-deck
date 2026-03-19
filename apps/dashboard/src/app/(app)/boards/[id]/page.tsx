import { createClient } from '@/lib/supabase/server'
import { getCurrentWorkspaceId } from '@/lib/workspace'
import { notFound } from 'next/navigation'
import Link from 'next/link'

interface Props {
  params: Promise<{ id: string }>
}

export default async function BoardDetailPage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()
  const workspaceId = await getCurrentWorkspaceId()

  const { data: board } = await supabase
    .from('boards')
    .select('*')
    .eq('id', id)
    .eq('workspace_id', workspaceId ?? '')
    .single()

  if (!board) notFound()

  const [
    { count: jobCount },
    { count: employerCount },
    { count: candidateCount },
  ] = await Promise.all([
    supabase
      .from('jobs')
      .select('*', { count: 'exact', head: true })
      .eq('board_id', id),
    supabase
      .from('employers')
      .select('*', { count: 'exact', head: true })
      .eq('board_id', id),
    supabase
      .from('candidates')
      .select('*', { count: 'exact', head: true })
      .eq('source_board_id', id),
  ])

  const fields: { label: string; value: string | number | null | undefined }[] = [
    { label: 'Name', value: board.name },
    { label: 'Slug', value: board.slug },
    { label: 'Domain', value: board.domain },
    { label: 'Region', value: board.region },
    { label: 'Country', value: board.country },
    { label: 'Season Type', value: board.season_type },
    { label: 'Season Start', value: board.season_start_month },
    { label: 'Season End', value: board.season_end_month },
    { label: 'Status', value: board.status },
    { label: 'Created', value: board.created_at ? new Date(board.created_at).toLocaleDateString() : null },
  ]

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2 text-sm text-zinc-500">
          <Link href="/boards" className="hover:text-zinc-300">Boards</Link>
          <span className="text-zinc-600">/</span>
          <span className="text-zinc-300">{board.name}</span>
        </div>
        <div className="mt-2 flex items-center gap-3">
          <h1 className="text-lg font-semibold text-zinc-100">{board.name}</h1>
          <span className={`badge-${board.status}`}>{board.status}</span>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <div className="stat-card">
          <p className="text-xs text-zinc-500">Jobs</p>
          <p className="font-mono text-sm text-zinc-200">{jobCount ?? 0}</p>
        </div>
        <div className="stat-card">
          <p className="text-xs text-zinc-500">Employers</p>
          <p className="font-mono text-sm text-zinc-200">{employerCount ?? 0}</p>
        </div>
        <div className="stat-card">
          <p className="text-xs text-zinc-500">Candidates</p>
          <p className="font-mono text-sm text-zinc-200">{candidateCount ?? 0}</p>
        </div>
      </div>

      {/* Board details */}
      <div className="card space-y-3">
        <h2 className="text-sm font-medium text-zinc-300">Board Details</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {fields.map((field) => (
            <div key={field.label}>
              <p className="text-xs text-zinc-500">{field.label}</p>
              <p className="mt-0.5 text-sm text-zinc-300">{field.value ?? '—'}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="flex gap-3 text-sm">
        <Link href="/boards" className="btn-secondary">
          ← Back to boards
        </Link>
      </div>
    </div>
  )
}
