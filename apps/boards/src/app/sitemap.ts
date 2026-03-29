import { resolveBoard } from '@/lib/board'
import { createClient } from '@/lib/supabase'
import type { MetadataRoute } from 'next'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const board = await resolveBoard()
  const supabase = createClient()
  const baseUrl = board.domain ? `https://${board.domain}` : 'http://localhost:3001'

  const [jobsRes, postsRes] = await Promise.all([
    supabase.from('jobs').select('id, updated_at').eq('board_id', board.id).eq('status', 'open'),
    supabase.from('content').select('slug, updated_at').eq('board_id', board.id).eq('status', 'published'),
  ])

  const pages: MetadataRoute.Sitemap = [
    { url: baseUrl, lastModified: new Date(), changeFrequency: 'daily', priority: 1 },
    { url: `${baseUrl}/jobs`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.9 },
    { url: `${baseUrl}/apply`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.8 },
    { url: `${baseUrl}/blog`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.7 },
    { url: `${baseUrl}/about`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
  ]

  for (const job of jobsRes.data ?? []) {
    pages.push({
      url: `${baseUrl}/jobs/${job.id}`,
      lastModified: new Date(job.updated_at),
      changeFrequency: 'weekly',
      priority: 0.8,
    })
  }

  for (const post of postsRes.data ?? []) {
    if (post.slug) {
      pages.push({
        url: `${baseUrl}/blog/${post.slug}`,
        lastModified: new Date(post.updated_at),
        changeFrequency: 'monthly',
        priority: 0.6,
      })
    }
  }

  return pages
}
