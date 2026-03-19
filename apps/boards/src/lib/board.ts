import { headers } from 'next/headers'
import { createServiceClient } from './supabase'
import { notFound } from 'next/navigation'

// Domain → slug mapping for production
const DOMAIN_MAP: Record<string, string> = {
  'nisekojobs.com': 'niseko-winter',
  'www.nisekojobs.com': 'niseko-winter',
  // Add more as boards launch
}

export async function resolveBoard() {
  const headerList = await headers()
  const host = headerList.get('host') ?? ''

  // 1. Check domain map
  let slug: string | undefined = DOMAIN_MAP[host]

  // 2. Dev: check ?board= query param (for local testing)
  if (!slug) {
    try {
      const url = headerList.get('x-url') ?? headerList.get('x-forwarded-url') ?? ''
      const params = new URL(url || `http://${host}`).searchParams
      slug = params.get('board') ?? undefined
    } catch { /* ignore URL parse errors */ }
  }

  // 3. Dev: check subdomain (e.g. niseko-winter.localhost:3001)
  if (!slug && host.includes('.')) {
    const subdomain = host.split('.')[0]
    if (subdomain !== 'www' && subdomain !== 'localhost') {
      slug = subdomain
    }
  }

  // 4. Fallback: use first active board (dev, preview deployments, or no custom domain yet)
  if (!slug && (host.includes('localhost') || host.includes('127.0.0.1') || host.includes('vercel.app'))) {
    const supabase = createServiceClient()
    const { data } = await supabase
      .from('boards')
      .select('slug')
      .eq('status', 'active')
      .limit(1)
      .single()
    slug = data?.slug ?? undefined
  }

  if (!slug) notFound()

  const supabase = createServiceClient()
  const { data: board } = await supabase
    .from('boards')
    .select('*')
    .eq('slug', slug)
    .eq('status', 'active')
    .single()

  if (!board) notFound()

  return board
}
