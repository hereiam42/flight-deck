import { createClient } from '@/lib/supabase/server'
import { getCurrentWorkspaceId } from '@/lib/workspace'
import { notFound } from 'next/navigation'
import Link from 'next/link'

interface Props {
  params: Promise<{ id: string }>
}

export default async function EmployerDetailPage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()
  const workspaceId = await getCurrentWorkspaceId()

  const { data: employer } = await supabase
    .from('employers')
    .select('*, boards(name)')
    .eq('id', id)
    .single()

  if (!employer) notFound()

  const { data: jobs } = await supabase
    .from('jobs')
    .select('*')
    .eq('employer_id', id)
    .order('created_at', { ascending: false })

  const board = employer.boards as { name: string } | null

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2 text-sm text-zinc-500">
          <Link href="/employers" className="hover:text-zinc-300">Employers</Link>
          <span className="text-zinc-600">/</span>
          <span className="text-zinc-300">{employer.company_name}</span>
        </div>
        <div className="mt-2 flex items-center gap-3">
          <h1 className="text-lg font-semibold text-zinc-100">{employer.company_name}</h1>
          <span className={`badge-${employer.status}`}>{employer.status}</span>
        </div>
      </div>

      {/* Profile card */}
      <div className="card space-y-4">
        <h2 className="text-sm font-medium text-zinc-300">Employer Profile</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <p className="text-xs text-zinc-500">Company Name</p>
            <p className="mt-0.5 text-sm text-zinc-300">{employer.company_name}</p>
          </div>
          <div>
            <p className="text-xs text-zinc-500">Contact Name</p>
            <p className="mt-0.5 text-sm text-zinc-300">{employer.contact_name ?? '—'}</p>
          </div>
          <div>
            <p className="text-xs text-zinc-500">Contact Email</p>
            <p className="mt-0.5 text-sm text-zinc-300">{employer.contact_email ?? '—'}</p>
          </div>
          <div>
            <p className="text-xs text-zinc-500">Contact Phone</p>
            <p className="mt-0.5 text-sm text-zinc-300">{employer.contact_phone ?? '—'}</p>
          </div>
          <div>
            <p className="text-xs text-zinc-500">Instagram</p>
            <p className="mt-0.5 text-sm text-zinc-300">{employer.instagram_handle ?? '—'}</p>
          </div>
          <div>
            <p className="text-xs text-zinc-500">Website</p>
            <p className="mt-0.5 text-sm text-zinc-300">
              {employer.website ? (
                <a href={employer.website} target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:text-indigo-300">
                  {employer.website}
                </a>
              ) : '—'}
            </p>
          </div>
          <div>
            <p className="text-xs text-zinc-500">Location</p>
            <p className="mt-0.5 text-sm text-zinc-300">{employer.location ?? '—'}</p>
          </div>
          <div>
            <p className="text-xs text-zinc-500">Industry</p>
            <p className="mt-0.5 text-sm text-zinc-300">{employer.industry ?? '—'}</p>
          </div>
          <div>
            <p className="text-xs text-zinc-500">Company Size</p>
            <p className="mt-0.5 text-sm text-zinc-300">{employer.company_size ?? '—'}</p>
          </div>
          <div>
            <p className="text-xs text-zinc-500">Plan</p>
            <p className="mt-0.5">
              <span className={`badge-${employer.plan}`}>{employer.plan ?? '—'}</span>
            </p>
          </div>
          <div>
            <p className="text-xs text-zinc-500">Previous Seasons</p>
            <p className="mt-0.5 text-sm text-zinc-300">{employer.previous_seasons ?? 0}</p>
          </div>
          <div>
            <p className="text-xs text-zinc-500">Board</p>
            <p className="mt-0.5 text-sm text-zinc-300">{board?.name ?? '—'}</p>
          </div>
          <div className="sm:col-span-2">
            <p className="text-xs text-zinc-500">Notes</p>
            <p className="mt-0.5 text-sm text-zinc-300 whitespace-pre-wrap">{employer.notes ?? '—'}</p>
          </div>
          <div>
            <p className="text-xs text-zinc-500">Status</p>
            <p className="mt-0.5">
              <span className={`badge-${employer.status}`}>{employer.status}</span>
            </p>
          </div>
        </div>
      </div>

      {/* Jobs */}
      <div>
        <h2 className="mb-3 text-sm font-medium text-zinc-300">Jobs</h2>
        <div className="card overflow-hidden p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#2e2e32]">
                <th className="px-4 py-2.5 text-left text-xs font-medium text-zinc-500">Title</th>
                <th className="px-4 py-2.5 text-left text-xs font-medium text-zinc-500">Location</th>
                <th className="px-4 py-2.5 text-left text-xs font-medium text-zinc-500">Season</th>
                <th className="px-4 py-2.5 text-left text-xs font-medium text-zinc-500">Slots</th>
                <th className="px-4 py-2.5 text-left text-xs font-medium text-zinc-500">Status</th>
                <th className="px-4 py-2.5 text-left text-xs font-medium text-zinc-500">Published</th>
                <th className="px-4 py-2.5" />
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2e2e32]">
              {(jobs ?? []).length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-6 text-center text-zinc-500">
                    No jobs yet
                  </td>
                </tr>
              ) : (
                (jobs ?? []).map((job) => (
                  <tr key={job.id} className="hover:bg-[#18181b]">
                    <td className="px-4 py-2.5">
                      <Link href={`/jobs/${job.id}`} className="font-medium text-zinc-200 hover:text-indigo-400">
                        {job.title}
                      </Link>
                    </td>
                    <td className="px-4 py-2.5 text-zinc-400">{job.location ?? '—'}</td>
                    <td className="px-4 py-2.5 text-zinc-400">{job.season ?? '—'}</td>
                    <td className="px-4 py-2.5 text-zinc-400">
                      {job.slots_filled ?? 0}/{job.slots_total ?? 0}
                    </td>
                    <td className="px-4 py-2.5">
                      <span className={`badge-${job.status}`}>{job.status}</span>
                    </td>
                    <td className="px-4 py-2.5 text-xs text-zinc-500">
                      {job.published_at ? new Date(job.published_at).toLocaleDateString() : '—'}
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      <Link href={`/jobs/${job.id}`} className="btn-ghost text-xs">View →</Link>
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
