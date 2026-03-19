import { createClient } from '@/lib/supabase/server'
import { getCurrentWorkspaceId } from '@/lib/workspace'
import { notFound } from 'next/navigation'
import Link from 'next/link'

interface Props {
  params: Promise<{ id: string }>
}

export default async function JobDetailPage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()
  const workspaceId = await getCurrentWorkspaceId()

  const { data: job } = await supabase
    .from('jobs')
    .select('*, employers(company_name, id), boards(name, id)')
    .eq('id', id)
    .single()

  if (!job) notFound()

  const employer = job.employers as { company_name: string; id: string } | null
  const board = job.boards as { name: string; id: string } | null

  const { data: applications } = await supabase
    .from('applications')
    .select('*, candidates(first_name, last_name, email, nationality)')
    .eq('job_id', id)
    .order('match_score', { ascending: false })

  // Render requirements (JSON) nicely
  function renderRequirements(requirements: unknown) {
    if (!requirements) return '—'
    if (Array.isArray(requirements)) {
      return (
        <ul className="list-disc list-inside space-y-1">
          {requirements.map((req, i) => (
            <li key={i} className="text-sm text-zinc-300">{String(req)}</li>
          ))}
        </ul>
      )
    }
    if (typeof requirements === 'object') {
      return (
        <pre className="overflow-auto rounded-md bg-[#0a0a0b] p-3 font-mono text-xs text-zinc-300">
          {JSON.stringify(requirements, null, 2)}
        </pre>
      )
    }
    return <span className="text-sm text-zinc-300">{String(requirements)}</span>
  }

  function matchScoreColor(score: number | null) {
    if (score == null) return 'text-zinc-400'
    if (score > 80) return 'text-green-400'
    if (score > 50) return 'text-yellow-400'
    return 'text-red-400'
  }

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2 text-sm text-zinc-500">
          <Link href="/jobs" className="hover:text-zinc-300">Jobs</Link>
          <span className="text-zinc-600">/</span>
          <span className="text-zinc-300">{job.title}</span>
        </div>
        <div className="mt-2 flex items-center gap-3">
          <h1 className="text-lg font-semibold text-zinc-100">{job.title}</h1>
          <span className={`badge-${job.status}`}>{job.status}</span>
        </div>
      </div>

      {/* Job details card */}
      <div className="card space-y-4">
        <h2 className="text-sm font-medium text-zinc-300">Job Details</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <p className="text-xs text-zinc-500">Title</p>
            <p className="mt-0.5 text-sm text-zinc-300">{job.title}</p>
          </div>
          <div>
            <p className="text-xs text-zinc-500">Employer</p>
            <p className="mt-0.5 text-sm">
              {employer ? (
                <Link href={`/employers/${employer.id}`} className="text-indigo-400 hover:text-indigo-300">
                  {employer.company_name}
                </Link>
              ) : '—'}
            </p>
          </div>
          <div>
            <p className="text-xs text-zinc-500">Board</p>
            <p className="mt-0.5 text-sm text-zinc-300">{board?.name ?? '—'}</p>
          </div>
          <div>
            <p className="text-xs text-zinc-500">Location</p>
            <p className="mt-0.5 text-sm text-zinc-300">{job.location ?? '—'}</p>
          </div>
          <div>
            <p className="text-xs text-zinc-500">Salary Range</p>
            <p className="mt-0.5 text-sm text-zinc-300">{job.salary_range ?? '—'}</p>
          </div>
          <div>
            <p className="text-xs text-zinc-500">Accommodation Provided</p>
            <p className="mt-0.5 text-sm text-zinc-300">{job.accommodation_provided ? 'Yes' : 'No'}</p>
          </div>
          <div>
            <p className="text-xs text-zinc-500">Season</p>
            <p className="mt-0.5 text-sm text-zinc-300">{job.season ?? '—'}</p>
          </div>
          <div>
            <p className="text-xs text-zinc-500">Start Date</p>
            <p className="mt-0.5 text-sm text-zinc-300">
              {job.start_date ? new Date(job.start_date).toLocaleDateString() : '—'}
            </p>
          </div>
          <div>
            <p className="text-xs text-zinc-500">End Date</p>
            <p className="mt-0.5 text-sm text-zinc-300">
              {job.end_date ? new Date(job.end_date).toLocaleDateString() : '—'}
            </p>
          </div>
          <div>
            <p className="text-xs text-zinc-500">Slots</p>
            <p className="mt-0.5 text-sm text-zinc-300">
              {job.slots_filled ?? 0} / {job.slots_total ?? 0} filled
            </p>
          </div>
          <div>
            <p className="text-xs text-zinc-500">Status</p>
            <p className="mt-0.5">
              <span className={`badge-${job.status}`}>{job.status}</span>
            </p>
          </div>
          <div className="sm:col-span-2">
            <p className="text-xs text-zinc-500">Description</p>
            <p className="mt-0.5 text-sm text-zinc-300 whitespace-pre-wrap">{job.description ?? '—'}</p>
          </div>
          <div className="sm:col-span-2">
            <p className="text-xs text-zinc-500">Requirements</p>
            <div className="mt-0.5">{renderRequirements(job.requirements)}</div>
          </div>
        </div>
      </div>

      {/* Applications */}
      <div>
        <h2 className="mb-3 text-sm font-medium text-zinc-300">
          Applications ({(applications ?? []).length})
        </h2>
        <div className="card overflow-hidden p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#2e2e32]">
                <th className="px-4 py-2.5 text-left text-xs font-medium text-zinc-500">Candidate</th>
                <th className="px-4 py-2.5 text-left text-xs font-medium text-zinc-500">Email</th>
                <th className="px-4 py-2.5 text-left text-xs font-medium text-zinc-500">Nationality</th>
                <th className="px-4 py-2.5 text-left text-xs font-medium text-zinc-500">Match Score</th>
                <th className="px-4 py-2.5 text-left text-xs font-medium text-zinc-500">Status</th>
                <th className="px-4 py-2.5 text-left text-xs font-medium text-zinc-500">Applied</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2e2e32]">
              {(applications ?? []).length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-6 text-center text-zinc-500">
                    No applications yet
                  </td>
                </tr>
              ) : (
                (applications ?? []).map((app) => {
                  const candidate = app.candidates as { first_name: string; last_name: string; email: string; nationality: string } | null
                  return (
                    <tr key={app.id} className="hover:bg-[#18181b]">
                      <td className="px-4 py-2.5 text-zinc-200">
                        {candidate ? `${candidate.first_name} ${candidate.last_name}` : '—'}
                      </td>
                      <td className="px-4 py-2.5 text-zinc-400">
                        {candidate?.email ?? '—'}
                      </td>
                      <td className="px-4 py-2.5 text-zinc-400">
                        {candidate?.nationality ?? '—'}
                      </td>
                      <td className="px-4 py-2.5">
                        <span className={`font-mono text-sm font-medium ${matchScoreColor(app.match_score)}`}>
                          {app.match_score != null ? app.match_score : '—'}
                        </span>
                      </td>
                      <td className="px-4 py-2.5">
                        <span className={`badge-${app.status}`}>{app.status}</span>
                      </td>
                      <td className="px-4 py-2.5 text-xs text-zinc-500">
                        {app.created_at ? new Date(app.created_at).toLocaleDateString() : '—'}
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Back link */}
      <div className="flex gap-3 text-sm">
        <Link href="/jobs" className="btn-secondary">Back to jobs →</Link>
        {employer && (
          <Link href={`/employers/${employer.id}`} className="btn-secondary">
            View employer →
          </Link>
        )}
      </div>
    </div>
  )
}
