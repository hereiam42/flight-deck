import { resolveBoard } from '@/lib/board'
import { createClient } from '@/lib/supabase'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import type { Metadata } from 'next'

interface Props { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const board = await resolveBoard()
  const supabase = createClient()
  const { data } = await supabase.from('content').select('title, seo_meta').eq('slug', slug).eq('board_id', board.id).single()
  if (!data) return {}
  const seo = data.seo_meta as Record<string, string> | null
  return { title: `${data.title} — ${board.name}`, description: seo?.description }
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params
  const board = await resolveBoard()
  const supabase = createClient()

  const { data: post } = await supabase
    .from('content')
    .select('*')
    .eq('slug', slug)
    .eq('board_id', board.id)
    .eq('status', 'published')
    .single()

  if (!post) notFound()

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    datePublished: post.published_at,
    author: { '@type': 'Organization', name: 'Beyond Peaks' },
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <Link href="/blog" className="text-sm text-blue-600 hover:text-blue-700">← All posts</Link>

      <article className="mt-6">
        <div className="flex items-center gap-2">
          <span className="rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-500">{post.type}</span>
          {post.published_at && (
            <span className="text-sm text-gray-400">{new Date(post.published_at).toLocaleDateString()}</span>
          )}
        </div>
        <h1 className="mt-3 text-3xl font-bold">{post.title}</h1>
        {post.body && (
          <div className="prose prose-gray mt-8 max-w-none whitespace-pre-wrap">
            {post.body}
          </div>
        )}
      </article>
    </div>
  )
}
