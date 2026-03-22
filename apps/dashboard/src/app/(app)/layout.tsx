import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { ShellLayout } from '@/components/layout/MobileNav'
import { cookies } from 'next/headers'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/auth/login')

  // Get user's workspaces
  const { data: memberships } = await supabase
    .from('workspace_members')
    .select('workspace_id, role, workspaces(*)')
    .eq('user_id', user.id)

  const workspaces = (memberships?.flatMap((m) => m.workspaces ? [m.workspaces] : []) ?? [])

  // Resolve current workspace from cookie or first workspace
  const cookieStore = await cookies()
  const workspaceId = cookieStore.get('workspace_id')?.value
  const currentWorkspace = workspaces.find((w) => w.id === workspaceId) ?? workspaces[0] ?? null

  return (
    <ShellLayout workspaces={workspaces} currentWorkspace={currentWorkspace}>
      {children}
    </ShellLayout>
  )
}
