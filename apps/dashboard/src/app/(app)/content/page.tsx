import { createClient } from '@/lib/supabase/server'
import { getCurrentWorkspaceId } from '@/lib/workspace'
import Link from 'next/link'

interface SearchParams {
  status?: string
  type?: string
  board_id?: string
  page?: string
}

const PAGE_SIZE = 25

export default async function ContentPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const { status, type, board_id, page: pageStr } = await searchParams
  const page = parseInt(pageStr ?? '1', 10)
  const supabase = await createClient()
  const workspaceId = await getCurrentWorkspaceId()

  // Main query
  let query = supabase
    .from('content')
    .select('*, boards(name)', { count: 'exact' })
    .eq('workspace_id', workspaceId ?? '')
    .order('updated_at', { ascending: false })
    .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1)

  if (status) query = query.eq('status', status)
  if (type) query = query.eq('type', type)
  if (board_id) query = query.eq('board_id', board_id)

  const { data: content, count } = await query
  const totalPages = Math.ceil((count ?? 0) / PAGE_SIZE)

  // Stat counts
  const [publishedResult, draftsResult, pendingResult] = await Promise.all([
    supabase
      .from('content')
      .select('id', { count: 'exact', head: true })
      .eq('workspace_id', workspaceId ?? '')
      .eq('status', 'published'),
    supabase
      .from('content')
      .select('id', { count: 'exact', head: true })
      .eq('workspace_id', workspaceId ?? '')
      .eq('status', 'draft'),
    supabase
      .from('content')
      .select('id', { count: 'exact', head: true })
      .eq('workspace_id', workspaceId ?? '')
      .eq('status', 'pending_review'),
  ])

  const totalContent = count ?? 0
  const publishedCount = publishedResult.count ?? 0
  const draftsCount = draftsResult.count ?? 0
  const pendingCount = pendingResult.count ?? 0

  // Boards for filter dropdown
  const { data: boards } = await supabase
    .from('boards')
    .select('id, name')
    .eq('workspace_id', workspaceId ?? '')
    .order('name')

  function buildHref(overrides: Record<string, string | undefined>) {
    const params = new URLSearchParams()
    const merged = { status, type, board_id, ...overrides }
    for (const [k, v] of Object.entries(merged)) {
      if (v) params.set(k, v)
    }
    const qs = params.toString()
    return `/content${qs ? `?${qs}` : ''}`
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-semibold text-zinc-100">Content</h1>
        <p className="text-sm text-zinc-500">{totalContent} total content items</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div className="stat-card">
          <p className="text-xs text-zinc-500">Total content</p>
          <p className="text-2xl font-semibold text-zinc-100">{totalContent}</p>
        </div>
        <div className="stat-card">
          <p className="text-xs text-zinc-500">Published</p>
          <p className="text-2xl font-semibold text-zinc-100">{publishedCount}</p>
        </div>
        <div className="stat-card">
          <p className="text-xs text-zinc-500">Drafts</p>
          <p className="text-2xl font-semibold text-zinc-100">{draftsCount}</p>
        </div>
        <div className="stat-card">
          <p className="text-xs text-zinc-500">Pending review</p>
          <p className="text-2xl font-semibold text-zinc-100">{pendingCount}</p>
        </div>
      </div>

      {/* Filters */}
      <form className="flex gap-3">
        <select
          name="status"
          defaultValue={status ?? ''}
          className="input w-40"
        >
          <option value="">All statuses</option>
          {['draft', 'pending_review', 'published', 'archived'].map((s) => (
            <option key={s} value={s}>
              {s.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
            </option>
          ))}
        </select>
        <select
          name="type"
          defaultValue={type ?? ''}
          className="input w-40"
        >
          <option value="">All types</option>
          {['blog', 'guide', 'seo_page', 'social_post'].map((t) => (
            <option key={t} value={t}>
              {t.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
            </option>
          ))}
        </select>
        <select
          name="board_id"
          defaultValue={board_id ?? ''}
          className="input w-48"
        >
          <option value="">All boards</option>
          {(boards ?? []).map((b) => (
            <option key={b.id} value={b.id}>{b.name}</option>
          ))}
        </select>
        <button type="submit" className="btn-secondary">Filter</button>
        {(status || type || board_id) && (
          <Link href="/content" className="btn-ghost">Clear</Link>
        )}
      </form>

      {/* Table */}
      <div className="card overflow-hidden p-0">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#2e2e32]">
              <th className="px-4 py-2.5 text-left text-xs font-medium text-zinc-500">Title</th>
              <th className="px-4 py-2.5 text-left text-xs font-medium text-zinc-500">Type</th>
              <th className="px-4 py-2.5 text-left text-xs font-medium text-zinc-500">Board</th>
              <th className="px-4 py-2.5 text-left text-xs font-medium text-zinc-500">Target Keyword</th>
              <th className="px-4 py-2.5 text-left text-xs font-medium text-zinc-500">Status</th>
              <th className="px-4 py-2.5 text-left text-xs font-medium text-zinc-500">Published</th>
              <th className="px-4 py-2.5 text-left text-xs font-medium text-zinc-500">Updated</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#2e2e32]">
            {(content ?? []).length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-zinc-500">
                  No content found
                </td>
              </tr>
            ) : (
              (content ?? []).map((item) => (
                <tr key={item.id} className="hover:bg-[#18181b]">
                  <td className="px-4 py-3">
                    <span className="font-medium text-zinc-200">{item.title}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="badge-info text-xs">
                      {(item.type as string).replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-zinc-400">
                    {(item.boards as { name: string } | null)?.name ?? '—'}
                  </td>
                  <td className="px-4 py-3 text-sm text-zinc-400">
                    {item.target_keyword ?? '—'}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`badge-${item.status}`}>
                      {(item.status as string).replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-zinc-500">
                    {item.published_at
                      ? new Date(item.published_at).toLocaleDateString()
                      : '—'}
                  </td>
                  <td className="px-4 py-3 text-xs text-zinc-500">
                    {new Date(item.updated_at).toLocaleDateString()}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm">
          <p className="text-zinc-500">
            Page {page} of {totalPages}
          </p>
          <div className="flex gap-2">
            {page > 1 && (
              <Link
                href={buildHref({ page: String(page - 1) })}
                className="btn-secondary"
              >
                Previous
              </Link>
            )}
            {page < totalPages && (
              <Link
                href={buildHref({ page: String(page + 1) })}
                className="btn-secondary"
              >
                Next
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
