import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@flight-deck/shared'

let cachedClient: ReturnType<typeof createBrowserClient<Database>> | null = null

export function createClient() {
  if (typeof window === 'undefined') {
    throw new Error(
      'createClient() from @/lib/supabase/client was called on the server. ' +
      'Use @/lib/supabase/server instead, or move this call inside useEffect/an event handler.'
    )
  }
  if (cachedClient) return cachedClient
  cachedClient = createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )
  return cachedClient
}
