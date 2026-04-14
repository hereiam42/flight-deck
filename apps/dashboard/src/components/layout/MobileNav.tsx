'use client'

import { useState, useCallback } from 'react'
import { Sidebar } from './Sidebar'
import { TopNav } from './TopNav'
import { Sheet, SheetContent } from '@/components/ui/sheet'
import type { Database } from '@flight-deck/shared'

type WorkspaceRow = Database['public']['Tables']['workspaces']['Row']

interface ShellLayoutProps {
  workspaces: WorkspaceRow[]
  currentWorkspace: WorkspaceRow | null
  children: React.ReactNode
}

export function ShellLayout({ workspaces, currentWorkspace, children }: ShellLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const openSidebar = useCallback(() => setSidebarOpen(true), [])
  const closeSidebar = useCallback(() => setSidebarOpen(false), [])

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Desktop sidebar */}
      <div className="hidden md:flex">
        <Sidebar workspaceSlug={currentWorkspace?.slug} />
      </div>

      <div className="flex flex-1 flex-col overflow-hidden">
        <TopNav
          workspaces={workspaces}
          currentWorkspace={currentWorkspace}
          onToggleSidebar={openSidebar}
        />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6">
          {children}
        </main>
      </div>

      {/* Mobile sidebar drawer */}
      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetContent side="left" className="w-56 p-0">
          <Sidebar workspaceSlug={currentWorkspace?.slug} mobile onClose={closeSidebar} />
        </SheetContent>
      </Sheet>
    </div>
  )
}
