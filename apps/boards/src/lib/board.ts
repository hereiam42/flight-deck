import { headers } from 'next/headers'
import { createClient } from './supabase'
import { notFound } from 'next/navigation'

// Domain → slug mapping for production custom domains
const DOMAIN_MAP: Record<string, string> = {
  'nisekojobs.com': 'niseko-winter',
  'www.nisekojobs.com': 'niseko-winter',
  // Add more as boards launch
}

export async function resolveBoard() {
  const headerList = await headers()
  const host = headerList.get('host') ?? ''

  // 1. Check domain map (custom domains)
  let slug: string | undefined = DOMAIN_MAP[host]

  // 2. Check ?board= query param
  if (!slug) {
    try {
      const url = headerList.get('x-url') ?? ''
      if (url) {
        const params = new URL(url).searchParams
        slug = params.get('board') ?? undefined
      }
    } catch { /* ignore */ }
  }

  // 3. Fallback: use first active board (vercel.app previews, localhost)
  if (!slug) {
    const supabase = createClient()
    const { data } = await supabase
      .from('boards')
      .select('slug')
      .eq('status', 'active')
      .limit(1)
      .single()
    slug = data?.slug ?? undefined
  }

  if (!slug) notFound()

  const supabase = createClient()
  const { data: board } = await supabase
    .from('boards')
    .select('*')
    .eq('slug', slug)
    .eq('status', 'active')
    .single()

  if (!board) notFound()

  return board
}
