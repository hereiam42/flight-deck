import { createClient } from '@/lib/supabase/server'
import { getCurrentWorkspaceId } from '@/lib/workspace'
import Link from 'next/link'

interface SearchParams {
  status?: string
  page?: string
}

const PAGE_SIZE = 25

export default async function LeadsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const { status, page: pageStr } = await searchParams
  const page = parseInt(pageStr ?? '1', 10)
  const supabase = await createClient()
  const workspaceId = await getCurrentWorkspaceId()

  let query = supabase
    .from('employer_leads')
    .select('*, boards(name)', { count: 'exact' })
    .eq('workspace_id', workspaceId ?? '')
    .order('created_at', { ascending: false })
    .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1)

  if (status) query = query.eq('outreach_status', status)

  const { data: leads, count } = await query
  const totalPages = Math.ceil((count ?? 0) / PAGE_SIZE)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-semibold text-zinc-100">Employer Leads</h1>
        <p className="text-sm text-zinc-500">{count ?? 0} leads — sourced by agents</p>
      </div>

      <form className="flex flex-col gap-2 sm:flex-row sm:gap-3">
        <select name="status" defaultValue={status ?? ''} className="input sm:w-44">
          <option value="">All statuses</option>
          {['new', 'contacted', 'follow_up_1', 'follow_up_2', 'responded', 'converted', 'rejected', 'stale'].map((s) => (
            <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>
          ))}
        </select>
        <button type="submit" className="btn-secondary">Filter</button>
        {status && <Link href="/leads" className="btn-ghost">Clear</Link>}
      </form>

      <div className="card overflow-hidden p-0">
        <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-sm">
          <thead>
            <tr className="border-b border-[#2e2e32]">
              <th className="px-4 py-2.5 text-left text-xs font-medium text-zinc-500">Company</th>
              <th className="px-4 py-2.5 text-left text-xs font-medium text-zinc-500">Location</th>
              <th className="px-4 py-2.5 text-left text-xs font-medium text-zinc-500">Industry</th>
              <th className="px-4 py-2.5 text-left text-xs font-medium text-zinc-500">Website</th>
              <th className="px-4 py-2.5 text-left text-xs font-medium text-zinc-500">Status</th>
              <th className="px-4 py-2.5 text-left text-xs font-medium text-zinc-500">Source</th>
              <th className="px-4 py-2.5 text-left text-xs font-medium text-zinc-500">Added</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#2e2e32]">
            {(leads ?? []).length === 0 ? (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-zinc-500">No leads found</td></tr>
            ) : (
              (leads ?? []).map((lead) => (
                <tr key={lead.id} className="hover:bg-[#18181b]">
                  <td className="px-4 py-2.5 text-zinc-200">{lead.company_name}</td>
                  <td className="px-4 py-2.5 text-zinc-400">{lead.location ?? '—'}</td>
                  <td className="px-4 py-2.5 text-zinc-400">{lead.industry ?? '—'}</td>
                  <td className="px-4 py-2.5">
                    {lead.website ? (
                      <a href={lead.website} target="_blank" rel="noopener noreferrer" className="text-xs text-indigo-400 hover:text-indigo-300">
                        {lead.website.replace(/^https?:\/\//, '').replace(/\/$/, '')}
                      </a>
                    ) : '—'}
                  </td>
                  <td className="px-4 py-2.5">
                    <span className="rounded bg-zinc-800 px-1.5 py-0.5 text-xs text-zinc-400">
                      {lead.outreach_status.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-xs text-zinc-500">{lead.source ?? '—'}</td>
                  <td className="px-4 py-2.5 text-xs text-zinc-500">
                    {new Date(lead.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        </div>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm">
          <p className="text-zinc-500">Page {page} of {totalPages}</p>
          <div className="flex gap-2">
            {page > 1 && <Link href={`/leads?page=${page - 1}${status ? `&status=${status}` : ''}`} className="btn-secondary">Previous</Link>}
            {page < totalPages && <Link href={`/leads?page=${page + 1}${status ? `&status=${status}` : ''}`} className="btn-secondary">Next</Link>}
          </div>
        </div>
      )}
    </div>
  )
}
