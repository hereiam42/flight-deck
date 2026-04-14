'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Separator } from '@/components/ui/separator'

interface NavItem {
  label: string
  href: string
  icon: React.ReactNode
  showFor?: string
}

interface NavSection {
  title?: string
  showFor?: string
  items: NavItem[]
}

// Compact SVG icons
const icons = {
  mission: <svg className="h-4 w-4" viewBox="0 0 16 16" fill="currentColor"><path d="M8 1.5a6.5 6.5 0 100 13 6.5 6.5 0 000-13zM0 8a8 8 0 1116 0A8 8 0 010 8z" /><path d="M8 4a.5.5 0 01.5.5v3.793l1.146-1.147a.5.5 0 01.708.708l-2 2a.5.5 0 01-.708 0l-2-2a.5.5 0 11.708-.708L7.5 8.293V4.5A.5.5 0 018 4z" /></svg>,
  dashboard: <svg className="h-4 w-4" viewBox="0 0 16 16" fill="currentColor"><path d="M2 2h5v5H2V2zm7 0h5v5H9V2zM2 9h5v5H2V9zm7 0h5v5H9V9z" /></svg>,
  flow: <svg className="h-4 w-4" viewBox="0 0 16 16" fill="currentColor"><path d="M6 3.5A1.5 1.5 0 017.5 2h1A1.5 1.5 0 0110 3.5v1A1.5 1.5 0 018.5 6h-1A1.5 1.5 0 016 4.5v-1zM1 8.5A1.5 1.5 0 012.5 7h1A1.5 1.5 0 015 8.5v1A1.5 1.5 0 013.5 11h-1A1.5 1.5 0 011 9.5v-1zm10 0A1.5 1.5 0 0112.5 7h1A1.5 1.5 0 0115 8.5v1a1.5 1.5 0 01-1.5 1.5h-1A1.5 1.5 0 0111 9.5v-1z" /></svg>,
  agents: <svg className="h-4 w-4" viewBox="0 0 16 16" fill="currentColor"><path d="M8 1a4 4 0 100 8A4 4 0 008 1zM3 14s-1 0-1-1 1-4 6-4 6 3 6 4-1 1-1 1H3z" /></svg>,
  workflows: <svg className="h-4 w-4" viewBox="0 0 16 16" fill="currentColor"><path d="M1 2.5A2.5 2.5 0 013.5 0h9A2.5 2.5 0 0115 2.5v11a2.5 2.5 0 01-2.5 2.5h-9A2.5 2.5 0 011 13.5v-11zM5 6a.5.5 0 01.5-.5h5a.5.5 0 010 1h-5A.5.5 0 015 6zm0 3a.5.5 0 01.5-.5h3a.5.5 0 010 1h-3A.5.5 0 015 9z" /></svg>,
  runs: <svg className="h-4 w-4" viewBox="0 0 16 16" fill="currentColor"><path d="M8 15A7 7 0 118 1a7 7 0 010 14zm.5-9.5a.5.5 0 00-1 0v2.793l-1.146-1.147a.5.5 0 00-.708.708l2 1.999a.5.5 0 00.708 0l2-1.999a.5.5 0 00-.708-.708L8.5 8.293V6.5z" /></svg>,
  activity: <svg className="h-4 w-4" viewBox="0 0 16 16" fill="currentColor"><path d="M14 1a1 1 0 011 1v12a1 1 0 01-1 1H2a1 1 0 01-1-1V2a1 1 0 011-1h12zm-10 3.5a.5.5 0 01.5-.5h7a.5.5 0 010 1h-7a.5.5 0 01-.5-.5zm0 3a.5.5 0 01.5-.5h7a.5.5 0 010 1h-7a.5.5 0 01-.5-.5zm0 3a.5.5 0 01.5-.5h4a.5.5 0 010 1h-4a.5.5 0 01-.5-.5z" /></svg>,
  notifications: <svg className="h-4 w-4" viewBox="0 0 16 16" fill="currentColor"><path d="M8 16a2 2 0 001.985-1.75c.017-.137-.097-.25-.235-.25h-3.5c-.138 0-.252.113-.235.25A2 2 0 008 16zm.104-14.096A5.5 5.5 0 002.5 8c0 1.033-.5 3-1.5 4h14c-1-1-1.5-2.967-1.5-4a5.5 5.5 0 00-5.396-5.596z" /></svg>,
  health: <svg className="h-4 w-4" viewBox="0 0 16 16" fill="currentColor"><path d="M8 1a.5.5 0 01.5.5v1.707l1.146-1.147a.5.5 0 01.708.708L8.5 4.621 10.354 6.5H12.5a.5.5 0 010 1h-1.793l1.147 1.146a.5.5 0 01-.708.708L8.5 6.707V8.5a.5.5 0 01-1 0V6.707L4.854 9.354a.5.5 0 01-.708-.708L5.793 7.5H4a.5.5 0 010-1h2.207L4.354 4.646a.5.5 0 11.708-.708L7.5 6.379V1.5A.5.5 0 018 1z" /></svg>,
  boards: <svg className="h-4 w-4" viewBox="0 0 16 16" fill="currentColor"><path d="M0 2a2 2 0 012-2h12a2 2 0 012 2v12a2 2 0 01-2 2H2a2 2 0 01-2-2V2zm3 2a.5.5 0 01.5-.5h9a.5.5 0 010 1h-9A.5.5 0 013 4zm0 4a.5.5 0 01.5-.5h9a.5.5 0 010 1h-9A.5.5 0 013 8zm0 4a.5.5 0 01.5-.5h9a.5.5 0 010 1h-9A.5.5 0 013 12z" /></svg>,
  candidates: <svg className="h-4 w-4" viewBox="0 0 16 16" fill="currentColor"><path d="M7 14s-1 0-1-1 1-4 5-4 5 3 5 4-1 1-1 1H7zm4-6a3 3 0 100-6 3 3 0 000 6zM2 13c0 1 1 1 1 1H1s-1 0-1-1 1-4 4-4 .5.5.5.5a3.48 3.48 0 00-1.5 3zm1-7.5a2.5 2.5 0 115 0 2.5 2.5 0 01-5 0z" /></svg>,
  employers: <svg className="h-4 w-4" viewBox="0 0 16 16" fill="currentColor"><path d="M1 2.5A1.5 1.5 0 012.5 1h3A1.5 1.5 0 017 2.5V5h2V2.5A1.5 1.5 0 0110.5 1h3A1.5 1.5 0 0115 2.5v11a1.5 1.5 0 01-1.5 1.5h-3A1.5 1.5 0 019 13.5V11H7v2.5A1.5 1.5 0 015.5 15h-3A1.5 1.5 0 011 13.5v-11z" /></svg>,
  jobs: <svg className="h-4 w-4" viewBox="0 0 16 16" fill="currentColor"><path d="M6.5 1A1.5 1.5 0 005 2.5V3H1.5A1.5 1.5 0 000 4.5v8A1.5 1.5 0 001.5 14h13a1.5 1.5 0 001.5-1.5v-8A1.5 1.5 0 0014.5 3H11v-.5A1.5 1.5 0 009.5 1h-3zM6 2.5a.5.5 0 01.5-.5h3a.5.5 0 01.5.5V3H6v-.5z" /></svg>,
  applications: <svg className="h-4 w-4" viewBox="0 0 16 16" fill="currentColor"><path d="M5 0a.5.5 0 01.5.5V2h5V.5a.5.5 0 011 0V2h1.5A1.5 1.5 0 0114.5 3.5v11a1.5 1.5 0 01-1.5 1.5H3A1.5 1.5 0 011.5 14.5v-11A1.5 1.5 0 013 2h1.5V.5A.5.5 0 015 0zm5.354 7.854a.5.5 0 00-.708-.708L7 9.793 5.354 8.146a.5.5 0 10-.708.708l2 2a.5.5 0 00.708 0l3-3z" /></svg>,
  content: <svg className="h-4 w-4" viewBox="0 0 16 16" fill="currentColor"><path d="M14.5 3a.5.5 0 01.5.5v9a.5.5 0 01-.5.5h-13a.5.5 0 01-.5-.5v-9a.5.5 0 01.5-.5h13zM3 5.5a.5.5 0 01.5-.5h9a.5.5 0 010 1h-9a.5.5 0 01-.5-.5zM3.5 7a.5.5 0 000 1h9a.5.5 0 000-1h-9zM3 9.5a.5.5 0 01.5-.5h6a.5.5 0 010 1h-6a.5.5 0 01-.5-.5z" /></svg>,
  leads: <svg className="h-4 w-4" viewBox="0 0 16 16" fill="currentColor"><path d="M8.186 1.113a.5.5 0 00-.372 0L1.846 3.5l2.404.961L10.404 2l-2.218-.887zm3.564 1.426L5.596 5 8 5.961 14.154 3.5l-2.404-.961zm3.25 1.7l-6.5 2.6v7.922l6.5-2.6V4.24zM7.5 14.762V6.838L1 4.239v7.923l6.5 2.6z" /></svg>,
  managedAgents: <svg className="h-4 w-4" viewBox="0 0 16 16" fill="currentColor"><path d="M6 .5a.5.5 0 01.5-.5h3a.5.5 0 010 1H9v1.07a7.001 7.001 0 013.274 12.474.5.5 0 01-.548-.836A6 6 0 107 13.655v-1.577a.5.5 0 011 0v3a.5.5 0 01-.146.354l-1.5 1.5a.5.5 0 01-.708-.708L6.793 15H6.5A7.5 7.5 0 017 1.07V1H6.5a.5.5 0 01-.5-.5zM8 4a.5.5 0 01.5.5v3.793l1.854 1.853a.5.5 0 01-.708.708l-2-2A.5.5 0 017.5 8.5v-4A.5.5 0 018 4z" /></svg>,
  atlas: <svg className="h-4 w-4" viewBox="0 0 16 16" fill="currentColor"><path d="M8 0l1.8 5.5H16l-5 3.6 1.9 5.9L8 11.4 3.1 15l1.9-5.9-5-3.6h6.2L8 0z" /></svg>,
  settings: <svg className="h-4 w-4" viewBox="0 0 16 16" fill="currentColor"><path d="M9.405 1.05c-.413-1.4-2.397-1.4-2.81 0l-.1.34a1.464 1.464 0 01-2.105.872l-.31-.17c-1.283-.698-2.686.705-1.987 1.987l.169.311c.446.82.023 1.841-.872 2.105l-.34.1c-1.4.413-1.4 2.397 0 2.81l.34.1a1.464 1.464 0 01.872 2.105l-.17.31c-.698 1.283.705 2.686 1.987 1.987l.311-.169a1.464 1.464 0 012.105.872l.1.34c.413 1.4 2.397 1.4 2.81 0l.1-.34a1.464 1.464 0 012.105-.872l.31.17c1.283.698 2.686-.705 1.987-1.987l-.169-.311a1.464 1.464 0 01.872-2.105l.34-.1c1.4-.413 1.4-2.397 0-2.81l-.34-.1a1.464 1.464 0 01-.872-2.105l.17-.31c.698-1.283-.705-2.686-1.987-1.987l-.311.169a1.464 1.464 0 01-2.105-.872l-.1-.34zM8 10.93a2.929 2.929 0 110-5.86 2.929 2.929 0 010 5.858z" /></svg>,
}

const sections: NavSection[] = [
  {
    title: 'Command',
    showFor: 'nexus',
    items: [
      { label: 'Mission Control', href: '/mission-control', icon: icons.mission },
    ],
  },
  {
    items: [
      { label: 'Dashboard', href: '/dashboard', icon: icons.dashboard },
      { label: 'Flow', href: '/flow', icon: icons.flow, showFor: 'beyond-peaks' },
      { label: 'Agents', href: '/agents', icon: icons.agents },
      { label: 'Workflows', href: '/workflows', icon: icons.workflows },
      { label: 'Runs', href: '/runs', icon: icons.runs },
      { label: 'Activity', href: '/activity', icon: icons.activity },
      { label: 'Notifications', href: '/notifications', icon: icons.notifications },
      { label: 'Health', href: '/health', icon: icons.health },
    ],
  },
  {
    title: 'Seasonal Labor',
    showFor: 'beyond-peaks',
    items: [
      { label: 'Boards', href: '/boards', icon: icons.boards },
      { label: 'Candidates', href: '/candidates', icon: icons.candidates },
      { label: 'Employers', href: '/employers', icon: icons.employers },
      { label: 'Jobs', href: '/jobs', icon: icons.jobs },
      { label: 'Applications', href: '/applications', icon: icons.applications },
      { label: 'Content', href: '/content', icon: icons.content },
      { label: 'Leads', href: '/leads', icon: icons.leads },
      { label: 'Managed Agents', href: '/managed-agents', icon: icons.managedAgents },
    ],
  },
  {
    title: 'Pacific Atlas',
    showFor: 'pacific-atlas',
    items: [
      { label: 'Atlas', href: '/atlas', icon: icons.atlas },
    ],
  },
  {
    items: [
      { label: 'Settings', href: '/settings', icon: icons.settings },
    ],
  },
]

interface SidebarProps {
  workspaceSlug?: string
  mobile?: boolean
  onClose?: () => void
}

export function Sidebar({ workspaceSlug, mobile, onClose }: SidebarProps) {
  const pathname = usePathname()

  const visibleSections = sections.filter((section) => {
    if (section.showFor) return workspaceSlug === section.showFor
    if (section.title === 'Seasonal Labor') return workspaceSlug === 'beyond-peaks'
    if (section.title === 'Pacific Atlas') return workspaceSlug === 'pacific-atlas'
    return true
  })

  return (
    <aside className="flex h-full w-56 flex-col border-r border-border bg-card">
      {/* Logo */}
      <div className="flex h-14 items-center gap-2.5 border-b border-border px-4">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary">
          <svg className="h-4 w-4 text-primary-foreground" viewBox="0 0 16 16" fill="currentColor">
            <path d="M8 1.5a6.5 6.5 0 100 13 6.5 6.5 0 000-13zM0 8a8 8 0 1116 0A8 8 0 010 8z" />
            <path d="M8 5a.5.5 0 01.5.5v2.793l1.146-1.147a.5.5 0 01.708.708l-2 2a.5.5 0 01-.708 0l-2-2a.5.5 0 11.708-.708L7.5 8.293V5.5A.5.5 0 018 5z" />
          </svg>
        </div>
        <div>
          <p className="text-xs font-semibold text-foreground">Flight Deck</p>
          <p className="text-[10px] text-muted-foreground">Nexus株式会社</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-2">
        {visibleSections.map((section, si) => (
          <div key={si} className={section.title ? 'mt-4' : ''}>
            {section.title && (
              <p className="mb-1.5 px-2.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                {section.title}
              </p>
            )}
            <div className="space-y-0.5">
              {section.items
                .filter((item) => !item.showFor || item.showFor === workspaceSlug)
                .map((item) => {
                  const active = pathname === item.href || (pathname?.startsWith(item.href + '/') ?? false)
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={mobile ? onClose : undefined}
                      className={`flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-sm transition-colors ${
                        active
                          ? 'bg-secondary text-foreground'
                          : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                      }`}
                    >
                      {item.icon}
                      {item.label}
                    </Link>
                  )
                })}
            </div>
            {si < visibleSections.length - 1 && section.title && (
              <Separator className="mt-3" />
            )}
          </div>
        ))}
      </nav>
    </aside>
  )
}
