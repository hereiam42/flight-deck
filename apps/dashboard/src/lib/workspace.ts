import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'

export async function getCurrentWorkspaceId(): Promise<string | null> {
  const cookieStore = await cookies()
  const fromCookie = cookieStore.get('workspace_id')?.value
  if (fromCookie) return fromCookie

  // Fall back to first workspace (ordered by name for consistency with layout)
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data } = await supabase
    .from('workspace_members')
    .select('workspace_id, workspaces(name)')
    .eq('user_id', user.id)
    .order('workspace_id')
    .limit(1)
    .single()

  return data?.workspace_id ?? null
}
