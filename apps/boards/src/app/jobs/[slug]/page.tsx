import { resolveBoard } from '@/lib/board'
import { createClient } from '@/lib/supabase'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import type { Metadata } from 'next'

interface Props {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const board = await resolveBoard()
  const supabase = createClient()
  const { data: job } = await supabase
    .from('jobs').select('title, location, employers(company_name)')
    .eq('id', slug).eq('board_id', board.id).single()
  if (!job) return {}
  const employer = (job.employers as { company_name: string } | null)?.company_name
  return {
    title: `${job.title}${employer ? ` at ${employer}` : ''} — ${board.name}`,
    description: `Apply for ${job.title} in ${job.location ?? board.region}. Seasonal position at ${employer ?? 'a top employer'}.`,
  }
}

export default async function JobDetailPage({ params }: Props) {
  const { slug: id } = await params
  const board = await resolveBoard()
  const supabase = createClient()

  const { data: job } = await supabase
    .from('jobs')
    .select('*, employers(company_name, location, website)')
    .eq('id', id)
    .eq('board_id', board.id)
    .single()

  if (!job) notFound()

  const employer = job.employers as { company_name: string; location: string | null; website: string | null } | null
  const requirements = job.requirements as Record<string, string[]> | null

  // JSON-LD JobPosting schema
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'JobPosting',
    title: job.title,
    description: job.description ?? `${job.title} in ${job.location ?? board.region}`,
    datePosted: job.created_at,
    validThrough: job.expires_at ?? job.end_date,
    employmentType: 'TEMPORARY',
    jobLocation: {
      '@type': 'Place',
      address: { '@type': 'PostalAddress', addressLocality: job.location ?? board.region, addressCountry: board.country },
    },
    hiringOrganization: employer ? {
      '@type': 'Organization',
      name: employer.company_name,
      sameAs: employer.website,
    } : undefined,
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <Link href="/jobs" className="text-sm text-blue-600 hover:text-blue-700">← All jobs</Link>

      <h1 className="mt-4 text-3xl font-bold">{job.title}</h1>
      <p className="mt-2 text-lg text-gray-500">
        {employer?.company_name}{job.location ? ` — ${job.location}` : ''}
      </p>

      <div className="mt-6 flex flex-wrap gap-2">
        {job.start_date && job.end_date && (
          <span className="rounded-lg bg-blue-50 px-3 py-1 text-sm text-blue-600">
            {new Date(job.start_date).toLocaleDateString()} – {new Date(job.end_date).toLocaleDateString()}
          </span>
        )}
        {job.season && <span className="rounded-lg bg-gray-100 px-3 py-1 text-sm text-gray-600">{job.season}</span>}
        {job.accommodation_provided && <span className="rounded-lg bg-green-50 px-3 py-1 text-sm text-green-600">Accommodation provided</span>}
        {job.salary_range && <span className="rounded-lg bg-gray-100 px-3 py-1 text-sm text-gray-600">{job.salary_range}</span>}
        <span className="rounded-lg bg-gray-100 px-3 py-1 text-sm text-gray-600">
          {job.slots_total - job.slots_filled} of {job.slots_total} spots available
        </span>
      </div>

      {job.description && (
        <div className="prose mt-8 max-w-none">
          <h2 className="text-xl font-semibold">About this role</h2>
          <p className="mt-2 whitespace-pre-wrap text-gray-700">{job.description}</p>
        </div>
      )}

      {requirements && (
        <div className="mt-8">
          <h2 className="text-xl font-semibold">Requirements</h2>
          <div className="mt-3 space-y-2">
            {requirements.languages && (
              <p className="text-sm text-gray-600">
                <span className="font-medium">Languages:</span> {(requirements.languages as string[]).join(', ')}
              </p>
            )}
            {requirements.experience && (
              <p className="text-sm text-gray-600">
                <span className="font-medium">Experience:</span> {(requirements.experience as string[]).join(', ')}
              </p>
            )}
            {requirements.visa_types && (
              <p className="text-sm text-gray-600">
                <span className="font-medium">Visa types accepted:</span> {(requirements.visa_types as string[]).map(v => v.replace(/_/g, ' ')).join(', ')}
              </p>
            )}
          </div>
        </div>
      )}

      <div className="mt-10">
        <Link href="/apply" className="inline-block rounded-lg bg-blue-600 px-8 py-3 font-semibold text-white hover:bg-blue-700">
          Apply for this position
        </Link>
      </div>
    </div>
  )
}
