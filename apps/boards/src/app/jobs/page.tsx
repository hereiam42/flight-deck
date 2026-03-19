import { resolveBoard } from '@/lib/board'
import { createServiceClient } from '@/lib/supabase'
import Link from 'next/link'

export default async function JobsPage() {
  const board = await resolveBoard()
  const supabase = createServiceClient()

  const { data: jobs } = await supabase
    .from('jobs')
    .select('id, title, description, location, start_date, end_date, salary_range, accommodation_provided, slots_total, slots_filled, employers(company_name)')
    .eq('board_id', board.id)
    .eq('status', 'open')
    .order('created_at', { ascending: false })

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <h1 className="text-3xl font-bold">{board.region} Jobs</h1>
      <p className="mt-2 text-gray-500">{(jobs ?? []).length} open positions</p>

      <div className="mt-8 space-y-4">
        {(jobs ?? []).length === 0 ? (
          <div className="rounded-lg border border-gray-200 p-8 text-center text-gray-500">
            No open positions right now.{' '}
            <Link href="/apply" className="text-blue-600 hover:underline">Apply speculatively →</Link>
          </div>
        ) : (
          (jobs ?? []).map((job) => (
            <Link key={job.id} href={`/jobs/${job.id}`} className="block rounded-lg border border-gray-200 p-6 transition-shadow hover:shadow-md">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">{job.title}</h2>
                  <p className="mt-1 text-sm text-gray-500">
                    {(job.employers as { company_name: string } | null)?.company_name}
                    {job.location ? ` — ${job.location}` : ''}
                  </p>
                  {job.description && (
                    <p className="mt-2 line-clamp-2 text-sm text-gray-600">{job.description}</p>
                  )}
                </div>
                <span className="shrink-0 rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium text-white">
                  Apply
                </span>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {job.start_date && job.end_date && (
                  <span className="rounded bg-blue-50 px-2 py-0.5 text-xs text-blue-600">
                    {new Date(job.start_date).toLocaleDateString('en', { month: 'short', day: 'numeric' })} – {new Date(job.end_date).toLocaleDateString('en', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </span>
                )}
                {job.accommodation_provided && (
                  <span className="rounded bg-green-50 px-2 py-0.5 text-xs text-green-600">Accommodation provided</span>
                )}
                {job.salary_range && (
                  <span className="rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-600">{job.salary_range}</span>
                )}
                {job.slots_total > 0 && (
                  <span className="rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
                    {job.slots_total - job.slots_filled} spots left
                  </span>
                )}
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  )
}
