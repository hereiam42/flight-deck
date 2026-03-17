import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Sidebar } from '@/components/layout/Sidebar'
import { TopNav } from '@/components/layout/TopNav'
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

  const workspaces = memberships?.map((m) => m.workspaces).filter(Boolean).flat() ?? []

  // Resolve current workspace from cookie or first workspace
  const cookieStore = await cookies()
  const workspaceId = cookieStore.get('workspace_id')?.value
  const currentWorkspace = workspaces.find((w) => w && 'id' in w && w.id === workspaceId)
    ?? workspaces[0]
    ?? null

  return (
    <div className="flex h-screen overflow-hidden bg-[#0a0a0b]">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <TopNav
          workspaces={(workspaces as NonNullable<typeof workspaces[0]>[])}
          currentWorkspace={currentWorkspace as NonNullable<typeof currentWorkspace>}
        />
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
