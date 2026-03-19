import { createClient } from '@/lib/supabase/server'
import { getCurrentWorkspaceId } from '@/lib/workspace'
import Link from 'next/link'

export default async function BoardsPage() {
  const supabase = await createClient()
  const workspaceId = await getCurrentWorkspaceId()

  const { data: boards } = await supabase
    .from('boards')
    .select('*')
    .eq('workspace_id', workspaceId ?? '')
    .order('created_at', { ascending: false })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-semibold text-zinc-100">Boards</h1>
        <p className="text-sm text-zinc-500">{boards?.length ?? 0} boards in this workspace</p>
      </div>

      <div className="card overflow-hidden p-0">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#2e2e32]">
              <th className="px-4 py-2.5 text-left text-xs font-medium text-zinc-500">Name</th>
              <th className="px-4 py-2.5 text-left text-xs font-medium text-zinc-500">Domain</th>
              <th className="px-4 py-2.5 text-left text-xs font-medium text-zinc-500">Region</th>
              <th className="px-4 py-2.5 text-left text-xs font-medium text-zinc-500">Season Type</th>
              <th className="px-4 py-2.5 text-left text-xs font-medium text-zinc-500">Status</th>
              <th className="px-4 py-2.5" />
            </tr>
          </thead>
          <tbody className="divide-y divide-[#2e2e32]">
            {(boards ?? []).length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-zinc-500">
                  No boards found
                </td>
              </tr>
            ) : (
              (boards ?? []).map((board) => (
                <tr key={board.id} className="hover:bg-[#18181b]">
                  <td className="px-4 py-3">
                    <Link href={`/boards/${board.id}`} className="font-medium text-zinc-200 hover:text-indigo-400">
                      {board.name}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-sm text-zinc-400">
                    {board.domain ?? '—'}
                  </td>
                  <td className="px-4 py-3 text-sm text-zinc-400">
                    {board.region ?? '—'}
                  </td>
                  <td className="px-4 py-3 text-sm text-zinc-400">
                    {board.season_type ?? '—'}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`badge-${board.status}`}>{board.status}</span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link href={`/boards/${board.id}`} className="btn-ghost text-xs">
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
  )
}
