'use client'

import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import type { Database } from '@flight-deck/shared'

type WorkspaceRow = Database['public']['Tables']['workspaces']['Row']

interface TopNavProps {
  workspaces: WorkspaceRow[]
  currentWorkspace: WorkspaceRow | null
  onToggleSidebar?: () => void
}

export function TopNav({ workspaces, currentWorkspace, onToggleSidebar }: TopNavProps) {
  const router = useRouter()
  const supabase = createClient()

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/auth/login')
  }

  return (
    <header className="flex h-14 items-center justify-between border-b border-[#2e2e32] bg-[#111113] px-4">
      {/* Workspace switcher */}
      <div className="flex items-center gap-2">
        {onToggleSidebar && (
          <button className="mr-2 md:hidden" onClick={onToggleSidebar}>
            <svg className="h-5 w-5 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        )}
        <select
          className="rounded-md border border-[#2e2e32] bg-[#18181b] px-2.5 py-1.5 text-sm text-zinc-300 focus:border-indigo-500 focus:outline-none"
          defaultValue={currentWorkspace?.id ?? ''}
          onChange={(e) => {
            const ws = workspaces.find((w) => w.id === e.target.value)
            if (ws) {
              document.cookie = `workspace_id=${ws.id}; path=/; max-age=2592000`
              router.refresh()
            }
          }}
        >
          {workspaces.map((ws) => (
            <option key={ws.id} value={ws.id}>
              {ws.name}
            </option>
          ))}
        </select>
        {currentWorkspace && (
          <span className="hidden text-xs text-zinc-500 sm:inline">{currentWorkspace.slug}</span>
        )}
      </div>

      {/* Right actions */}
      <div className="flex items-center gap-2">
        <button
          onClick={handleSignOut}
          className="btn-ghost text-xs"
        >
          Sign out
        </button>
      </div>
    </header>
  )
}
