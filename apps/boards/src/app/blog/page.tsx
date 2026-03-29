import { resolveBoard } from '@/lib/board'
import { createClient } from '@/lib/supabase'
import Link from 'next/link'

export default async function BlogPage() {
  const board = await resolveBoard()
  const supabase = createClient()

  const { data: posts } = await supabase
    .from('content')
    .select('id, title, slug, type, body, published_at, seo_meta')
    .eq('board_id', board.id)
    .eq('status', 'published')
    .order('published_at', { ascending: false })

  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <h1 className="text-3xl font-bold">{board.region} Guides &amp; Blog</h1>
      <p className="mt-2 text-gray-500">Everything you need to know about working in {board.region}.</p>

      <div className="mt-8 space-y-6">
        {(posts ?? []).length === 0 ? (
          <p className="text-gray-500">No posts yet. Check back soon!</p>
        ) : (
          (posts ?? []).map((post) => {
            const seo = post.seo_meta as Record<string, string> | null
            const excerpt = seo?.description ?? (typeof post.body === 'string' ? post.body.slice(0, 200) : '')
            return (
              <Link key={post.id} href={`/blog/${post.slug}`} className="block rounded-lg border border-gray-200 p-6 transition-shadow hover:shadow-md">
                <div className="flex items-center gap-2">
                  <span className="rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-500">{post.type}</span>
                  {post.published_at && (
                    <span className="text-xs text-gray-400">{new Date(post.published_at).toLocaleDateString()}</span>
                  )}
                </div>
                <h2 className="mt-2 text-xl font-semibold text-gray-900">{post.title}</h2>
                {excerpt && <p className="mt-2 line-clamp-2 text-sm text-gray-600">{excerpt}</p>}
              </Link>
            )
          })
        )}
      </div>
    </div>
  )
}
