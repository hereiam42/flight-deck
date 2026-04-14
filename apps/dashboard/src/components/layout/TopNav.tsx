'use client'

import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { Database } from '@flight-deck/shared'

type WorkspaceRow = Database['public']['Tables']['workspaces']['Row']

interface TopNavProps {
  workspaces: WorkspaceRow[]
  currentWorkspace: WorkspaceRow | null
  onToggleSidebar?: () => void
}

export function TopNav({ workspaces, currentWorkspace, onToggleSidebar }: TopNavProps) {
  const router = useRouter()

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/auth/login')
  }

  function handleWorkspaceChange(workspaceId: string | null) {
    if (!workspaceId) return
    document.cookie = `workspace_id=${workspaceId}; path=/; max-age=2592000`
    router.refresh()
  }

  return (
    <header className="flex h-14 items-center justify-between border-b border-border bg-card px-4">
      <div className="flex items-center gap-3">
        {onToggleSidebar && (
          <Button variant="ghost" size="sm" className="md:hidden" onClick={onToggleSidebar}>
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </Button>
        )}
        <Select
          defaultValue={currentWorkspace?.id ?? ''}
          onValueChange={handleWorkspaceChange}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {workspaces.map((ws) => (
              <SelectItem key={ws.id} value={ws.id}>
                {ws.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {currentWorkspace && (
          <span className="hidden text-xs text-muted-foreground sm:inline">
            {currentWorkspace.slug}
          </span>
        )}
      </div>

      <Button variant="ghost" size="sm" onClick={handleSignOut}>
        Sign out
      </Button>
    </header>
  )
}
