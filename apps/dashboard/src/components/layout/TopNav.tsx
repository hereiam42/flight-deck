'use client'

import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import type { Workspace } from '@flight-deck/shared'

interface TopNavProps {
  workspaces: Workspace[]
  currentWorkspace: Workspace | null
}

export function TopNav({ workspaces, currentWorkspace }: TopNavProps) {
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
          <span className="text-xs text-zinc-500">{currentWorkspace.slug}</span>
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
