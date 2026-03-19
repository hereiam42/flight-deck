import { createClient } from '@/lib/supabase/server'
import { getCurrentWorkspaceId } from '@/lib/workspace'
import { notFound } from 'next/navigation'
import Link from 'next/link'

interface Props {
  params: Promise<{ id: string }>
}

export default async function CandidateDetailPage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()
  const workspaceId = await getCurrentWorkspaceId()

  const { data: candidate } = await supabase
    .from('candidates')
    .select('*, boards:source_board_id(name)')
    .eq('id', id)
    .eq('workspace_id', workspaceId ?? '')
    .single()

  if (!candidate) notFound()

  const board = candidate.boards as { name: string } | null

  const { data: applications } = await supabase
    .from('applications')
    .select('*, jobs(title, employers(company_name))')
    .eq('candidate_id', id)
    .order('created_at', { ascending: false })

  const languages = Array.isArray(candidate.languages)
    ? candidate.languages.join(', ')
    : candidate.languages ?? '—'

  const skills = Array.isArray(candidate.skills)
    ? candidate.skills.join(', ')
    : candidate.skills ?? '—'

  const preferredRegions = Array.isArray(candidate.preferred_regions)
    ? candidate.preferred_regions.join(', ')
    : candidate.preferred_regions ?? '—'

  const completeness = candidate.profile_completeness ?? 0

  const profileFields: { label: string; value: string | null | undefined }[] = [
    { label: 'First Name', value: candidate.first_name },
    { label: 'Last Name', value: candidate.last_name },
    { label: 'Email', value: candidate.email },
    { label: 'Phone', value: candidate.phone },
    { label: 'Nationality', value: candidate.nationality },
    { label: 'Visa Status', value: candidate.visa_status },
    { label: 'Languages', value: languages },
    { label: 'Skills', value: skills },
    { label: 'Available From', value: candidate.available_from ? new Date(candidate.available_from).toLocaleDateString() : null },
    { label: 'Available To', value: candidate.available_to ? new Date(candidate.available_to).toLocaleDateString() : null },
    { label: 'Preferred Regions', value: preferredRegions },
    { label: 'Source Channel', value: candidate.source_channel },
    { label: 'Source Board', value: board?.name },
    { label: 'Returning Candidate', value: candidate.returning_candidate ? 'Yes' : 'No' },
    { label: 'Seasons Completed', value: candidate.seasons_completed?.toString() },
  ]

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2 text-sm text-zinc-500">
          <Link href="/candidates" className="hover:text-zinc-300">Candidates</Link>
          <span className="text-zinc-600">/</span>
          <span className="text-zinc-300">{candidate.first_name} {candidate.last_name}</span>
        </div>
        <div className="mt-2 flex items-center gap-3">
          <h1 className="text-lg font-semibold text-zinc-100">
            {candidate.first_name} {candidate.last_name}
          </h1>
          <span className={`badge-${candidate.status}`}>{candidate.status}</span>
        </div>
      </div>

      {/* Profile card */}
      <div className="card space-y-4">
        <h2 className="text-sm font-medium text-zinc-300">Profile</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {profileFields.map((field) => (
            <div key={field.label}>
              <p className="text-xs text-zinc-500">{field.label}</p>
              <p className="mt-0.5 text-sm text-zinc-300">{field.value ?? '—'}</p>
            </div>
          ))}
        </div>

        {/* Bio */}
        {candidate.bio && (
          <div>
            <p className="text-xs text-zinc-500">Bio</p>
            <p className="mt-0.5 text-sm text-zinc-300">{candidate.bio}</p>
          </div>
        )}

        {/* Profile completeness bar */}
        <div>
          <p className="text-xs text-zinc-500">Profile Completeness</p>
          <div className="mt-1.5 flex items-center gap-3">
            <div className="h-2 flex-1 overflow-hidden rounded-full bg-[#2e2e32]">
              <div
                className="h-full rounded-full bg-indigo-500"
                style={{ width: `${completeness}%` }}
              />
            </div>
            <span className="font-mono text-xs text-zinc-400">{completeness}%</span>
          </div>
        </div>
      </div>

      {/* Application history */}
      <div>
        <h2 className="mb-3 text-sm font-medium text-zinc-300">Application History</h2>
        <div className="card overflow-hidden p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#2e2e32]">
                <th className="px-4 py-2.5 text-left text-xs font-medium text-zinc-500">Job Title</th>
                <th className="px-4 py-2.5 text-left text-xs font-medium text-zinc-500">Employer</th>
                <th className="px-4 py-2.5 text-left text-xs font-medium text-zinc-500">Match Score</th>
                <th className="px-4 py-2.5 text-left text-xs font-medium text-zinc-500">Status</th>
                <th className="px-4 py-2.5 text-left text-xs font-medium text-zinc-500">Applied</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2e2e32]">
              {(applications ?? []).length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-zinc-500">
                    No applications yet
                  </td>
                </tr>
              ) : (
                (applications ?? []).map((app) => {
                  const job = app.jobs as { title: string; employers: { company_name: string } | null } | null
                  return (
                    <tr key={app.id} className="hover:bg-[#18181b]">
                      <td className="px-4 py-2.5 text-zinc-300">
                        {job?.title ?? '—'}
                      </td>
                      <td className="px-4 py-2.5 text-zinc-400">
                        {job?.employers?.company_name ?? '—'}
                      </td>
                      <td className="px-4 py-2.5 font-mono text-xs text-zinc-400">
                        {app.match_score != null ? `${app.match_score}%` : '—'}
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

      <div className="flex gap-3 text-sm">
        <Link href="/candidates" className="btn-secondary">
          ← Back to candidates
        </Link>
      </div>
    </div>
  )
}
