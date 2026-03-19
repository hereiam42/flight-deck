import { resolveBoard } from '@/lib/board'
import { createServiceClient } from '@/lib/supabase'
import Link from 'next/link'

export default async function HomePage() {
  const board = await resolveBoard()
  const supabase = createServiceClient()

  const [jobsRes, contentRes] = await Promise.all([
    supabase.from('jobs').select('id, title, location, start_date, end_date, accommodation_provided, employers(company_name)')
      .eq('board_id', board.id).eq('status', 'open').order('created_at', { ascending: false }).limit(6),
    supabase.from('content').select('id, title, slug, type, published_at')
      .eq('board_id', board.id).eq('status', 'published').order('published_at', { ascending: false }).limit(3),
  ])

  const jobs = jobsRes.data ?? []
  const posts = contentRes.data ?? []
  const seasonLabel = board.season_type ? `${board.season_type.charAt(0).toUpperCase()}${board.season_type.slice(1)} Season` : 'Season'

  return (
    <div>
      {/* Hero */}
      <section className="bg-gradient-to-br from-blue-600 to-blue-800 py-24 text-white">
        <div className="mx-auto max-w-6xl px-4 text-center">
          <h1 className="text-4xl font-bold sm:text-5xl">
            {board.region} {seasonLabel} Jobs
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-blue-100">
            Find seasonal work in {board.region}, {board.country}. Hospitality, ski resort, food &amp; beverage, and more.
          </p>
          <div className="mt-8 flex justify-center gap-4">
            <Link href="/jobs" className="rounded-lg bg-white px-6 py-3 font-semibold text-blue-700 hover:bg-blue-50">
              Browse Jobs
            </Link>
            <Link href="/apply" className="rounded-lg border-2 border-white px-6 py-3 font-semibold text-white hover:bg-white/10">
              Apply Now
            </Link>
          </div>
        </div>
      </section>

      {/* Featured jobs */}
      <section className="mx-auto max-w-6xl px-4 py-16">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Open Positions</h2>
          <Link href="/jobs" className="text-sm text-blue-600 hover:text-blue-700">View all →</Link>
        </div>
        {jobs.length === 0 ? (
          <p className="mt-6 text-gray-500">No open positions right now. Check back soon or apply speculatively.</p>
        ) : (
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {jobs.map((job) => (
              <Link key={job.id} href={`/jobs/${job.id}`} className="rounded-lg border border-gray-200 p-5 transition-shadow hover:shadow-md">
                <h3 className="font-semibold text-gray-900">{job.title}</h3>
                <p className="mt-1 text-sm text-gray-500">
                  {(job.employers as { company_name: string } | null)?.company_name}
                </p>
                {job.location && <p className="mt-1 text-sm text-gray-400">{job.location}</p>}
                <div className="mt-3 flex flex-wrap gap-2">
                  {job.start_date && job.end_date && (
                    <span className="rounded bg-blue-50 px-2 py-0.5 text-xs text-blue-600">
                      {new Date(job.start_date).toLocaleDateString('en', { month: 'short' })} – {new Date(job.end_date).toLocaleDateString('en', { month: 'short', year: 'numeric' })}
                    </span>
                  )}
                  {job.accommodation_provided && (
                    <span className="rounded bg-green-50 px-2 py-0.5 text-xs text-green-600">Accommodation</span>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Why work here */}
      <section className="bg-gray-50 py-16">
        <div className="mx-auto max-w-6xl px-4">
          <h2 className="text-2xl font-bold">Why Work in {board.region}?</h2>
          <div className="mt-8 grid gap-6 sm:grid-cols-3">
            <div className="rounded-lg bg-white p-6 shadow-sm">
              <p className="text-3xl">🏔️</p>
              <h3 className="mt-3 font-semibold">World-class destination</h3>
              <p className="mt-1 text-sm text-gray-500">
                {board.region} is one of the top {board.season_type ?? 'seasonal'} destinations globally.
              </p>
            </div>
            <div className="rounded-lg bg-white p-6 shadow-sm">
              <p className="text-3xl">🌏</p>
              <h3 className="mt-3 font-semibold">International community</h3>
              <p className="mt-1 text-sm text-gray-500">
                Work alongside people from around the world in a vibrant seasonal community.
              </p>
            </div>
            <div className="rounded-lg bg-white p-6 shadow-sm">
              <p className="text-3xl">💼</p>
              <h3 className="mt-3 font-semibold">Career experience</h3>
              <p className="mt-1 text-sm text-gray-500">
                Build hospitality skills with leading employers in {board.country}.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Latest blog posts */}
      {posts.length > 0 && (
        <section className="mx-auto max-w-6xl px-4 py-16">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">Latest Guides</h2>
            <Link href="/blog" className="text-sm text-blue-600 hover:text-blue-700">All posts →</Link>
          </div>
          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            {posts.map((post) => (
              <Link key={post.id} href={`/blog/${post.slug}`} className="rounded-lg border border-gray-200 p-5 hover:shadow-md">
                <span className="rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-500">{post.type}</span>
                <h3 className="mt-2 font-semibold text-gray-900">{post.title}</h3>
                {post.published_at && (
                  <p className="mt-1 text-xs text-gray-400">{new Date(post.published_at).toLocaleDateString()}</p>
                )}
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
