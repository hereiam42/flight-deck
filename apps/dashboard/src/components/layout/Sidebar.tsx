'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

interface NavItem {
  label: string
  href: string
  Icon: () => React.ReactNode
  showFor?: string
}

interface NavSection {
  title?: string
  showFor?: string
  items: NavItem[]
}

const sections: NavSection[] = [
  {
    title: 'Command',
    showFor: 'personal',
    items: [
      {
        label: 'Mission Control',
        href: '/mission-control',
        Icon: () => (
          <svg className="h-4 w-4" viewBox="0 0 16 16" fill="currentColor">
            <path d="M8 1.5a6.5 6.5 0 100 13 6.5 6.5 0 000-13zM0 8a8 8 0 1116 0A8 8 0 010 8zm6.5-.25A.75.75 0 018 7h.01a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5zm-.25-2.25a1.25 1.25 0 112.5 0 1.25 1.25 0 01-2.5 0z" />
          </svg>
        ),
      },
    ],
  } as NavSection,
  {
    items: [
      {
        label: 'Dashboard',
        href: '/dashboard',
        Icon: () => (
          <svg className="h-4 w-4" viewBox="0 0 16 16" fill="currentColor">
            <path d="M2 2h5v5H2V2zm7 0h5v5H9V2zM2 9h5v5H2V9zm7 0h5v5H9V9z" />
          </svg>
        ),
      },
      {
        label: 'Flow',
        href: '/flow',
        showFor: 'beyond-peaks',
        Icon: () => (
          <svg className="h-4 w-4" viewBox="0 0 16 16" fill="currentColor">
            <path d="M6 3.5A1.5 1.5 0 017.5 2h1A1.5 1.5 0 0110 3.5v1A1.5 1.5 0 018.5 6h-1A1.5 1.5 0 016 4.5v-1zM1 8.5A1.5 1.5 0 012.5 7h1A1.5 1.5 0 015 8.5v1A1.5 1.5 0 013.5 11h-1A1.5 1.5 0 011 9.5v-1zm10 0A1.5 1.5 0 0112.5 7h1A1.5 1.5 0 0115 8.5v1a1.5 1.5 0 01-1.5 1.5h-1A1.5 1.5 0 0111 9.5v-1zM8 4.5v3m-4.5 2L7 6.5m5.5 3L9 6.5" />
          </svg>
        ),
      },
      {
        label: 'Agents',
        href: '/agents',
        Icon: () => (
          <svg className="h-4 w-4" viewBox="0 0 16 16" fill="currentColor">
            <path d="M8 1a4 4 0 100 8A4 4 0 008 1zM3 14s-1 0-1-1 1-4 6-4 6 3 6 4-1 1-1 1H3z" />
          </svg>
        ),
      },
      {
        label: 'Workflows',
        href: '/workflows',
        Icon: () => (
          <svg className="h-4 w-4" viewBox="0 0 16 16" fill="currentColor">
            <path d="M1 2.5A2.5 2.5 0 013.5 0h9A2.5 2.5 0 0115 2.5v11a2.5 2.5 0 01-2.5 2.5h-9A2.5 2.5 0 011 13.5v-11zM3.5 1A1.5 1.5 0 002 2.5v11A1.5 1.5 0 003.5 15h9A1.5 1.5 0 0014 13.5v-11A1.5 1.5 0 0012.5 1h-9zM5 6a.5.5 0 01.5-.5h5a.5.5 0 010 1h-5A.5.5 0 015 6zm0 3a.5.5 0 01.5-.5h3a.5.5 0 010 1h-3A.5.5 0 015 9z" />
          </svg>
        ),
      },
      {
        label: 'Runs',
        href: '/runs',
        Icon: () => (
          <svg className="h-4 w-4" viewBox="0 0 16 16" fill="currentColor">
            <path d="M8 15A7 7 0 118 1a7 7 0 010 14zm0 1A8 8 0 108 0a8 8 0 000 16zm.5-9.5a.5.5 0 00-1 0v2.793l-1.146-1.147a.5.5 0 00-.708.708l2 1.999a.5.5 0 00.708 0l2-1.999a.5.5 0 00-.708-.708L8.5 8.293V6.5z" />
          </svg>
        ),
      },
      {
        label: 'Activity Log',
        href: '/activity',
        Icon: () => (
          <svg className="h-4 w-4" viewBox="0 0 16 16" fill="currentColor">
            <path d="M14 1a1 1 0 011 1v12a1 1 0 01-1 1H2a1 1 0 01-1-1V2a1 1 0 011-1h12zM2 0a2 2 0 00-2 2v12a2 2 0 002 2h12a2 2 0 002-2V2a2 2 0 00-2-2H2zm2 4.5a.5.5 0 01.5-.5h7a.5.5 0 010 1h-7a.5.5 0 01-.5-.5zm0 3a.5.5 0 01.5-.5h7a.5.5 0 010 1h-7a.5.5 0 01-.5-.5zm0 3a.5.5 0 01.5-.5h4a.5.5 0 010 1h-4a.5.5 0 01-.5-.5z" />
          </svg>
        ),
      },
      {
        label: 'Notifications',
        href: '/notifications',
        Icon: () => (
          <svg className="h-4 w-4" viewBox="0 0 16 16" fill="currentColor">
            <path d="M8 16a2 2 0 001.985-1.75c.017-.137-.097-.25-.235-.25h-3.5c-.138 0-.252.113-.235.25A2 2 0 008 16zm.104-14.096A5.5 5.5 0 002.5 8c0 1.033-.5 3-1.5 4h14c-1-1-1.5-2.967-1.5-4a5.5 5.5 0 00-5.396-5.596z" />
          </svg>
        ),
      },
      {
        label: 'Health',
        href: '/health',
        Icon: () => (
          <svg className="h-4 w-4" viewBox="0 0 16 16" fill="currentColor">
            <path d="M8 1a.5.5 0 01.5.5v1.707l1.146-1.147a.5.5 0 01.708.708L8.5 4.621 10.354 6.5H12.5a.5.5 0 010 1h-1.793l1.147 1.146a.5.5 0 01-.708.708L8.5 6.707V8.5a.5.5 0 01-1 0V6.707L4.854 9.354a.5.5 0 01-.708-.708L5.793 7.5H4a.5.5 0 010-1h2.207L4.354 4.646a.5.5 0 11.708-.708L7.5 6.379V1.5A.5.5 0 018 1z" />
          </svg>
        ),
      },
    ],
  },
  {
    title: 'Seasonal Labor',
    items: [
      {
        label: 'Boards',
        href: '/boards',
        Icon: () => (
          <svg className="h-4 w-4" viewBox="0 0 16 16" fill="currentColor">
            <path d="M0 2a2 2 0 012-2h12a2 2 0 012 2v12a2 2 0 01-2 2H2a2 2 0 01-2-2V2zm2-1a1 1 0 00-1 1v12a1 1 0 001 1h12a1 1 0 001-1V2a1 1 0 00-1-1H2zm1 3a.5.5 0 01.5-.5h9a.5.5 0 010 1h-9A.5.5 0 013 4zm0 4a.5.5 0 01.5-.5h9a.5.5 0 010 1h-9A.5.5 0 013 8zm0 4a.5.5 0 01.5-.5h9a.5.5 0 010 1h-9A.5.5 0 013 12z" />
          </svg>
        ),
      },
      {
        label: 'Candidates',
        href: '/candidates',
        Icon: () => (
          <svg className="h-4 w-4" viewBox="0 0 16 16" fill="currentColor">
            <path d="M7 14s-1 0-1-1 1-4 5-4 5 3 5 4-1 1-1 1H7zm4-6a3 3 0 100-6 3 3 0 000 6zM2 13c0 1 1 1 1 1H1s-1 0-1-1 1-4 4-4 .5.5.5.5a3.48 3.48 0 00-1.5 3zm1-7.5a2.5 2.5 0 115 0 2.5 2.5 0 01-5 0z" />
          </svg>
        ),
      },
      {
        label: 'Employers',
        href: '/employers',
        Icon: () => (
          <svg className="h-4 w-4" viewBox="0 0 16 16" fill="currentColor">
            <path d="M1 2.5A1.5 1.5 0 012.5 1h3A1.5 1.5 0 017 2.5V5h2V2.5A1.5 1.5 0 0110.5 1h3A1.5 1.5 0 0115 2.5v11a1.5 1.5 0 01-1.5 1.5h-3A1.5 1.5 0 019 13.5V11H7v2.5A1.5 1.5 0 015.5 15h-3A1.5 1.5 0 011 13.5v-11zM7 10V6H5.5a.5.5 0 010-1h5a.5.5 0 010 1H9v4H7z" />
          </svg>
        ),
      },
      {
        label: 'Jobs',
        href: '/jobs',
        Icon: () => (
          <svg className="h-4 w-4" viewBox="0 0 16 16" fill="currentColor">
            <path d="M6.5 1A1.5 1.5 0 005 2.5V3H1.5A1.5 1.5 0 000 4.5v8A1.5 1.5 0 001.5 14h13a1.5 1.5 0 001.5-1.5v-8A1.5 1.5 0 0014.5 3H11v-.5A1.5 1.5 0 009.5 1h-3zM6 2.5a.5.5 0 01.5-.5h3a.5.5 0 01.5.5V3H6v-.5z" />
          </svg>
        ),
      },
      {
        label: 'Applications',
        href: '/applications',
        Icon: () => (
          <svg className="h-4 w-4" viewBox="0 0 16 16" fill="currentColor">
            <path d="M5 0a.5.5 0 01.5.5V2h5V.5a.5.5 0 011 0V2h1.5A1.5 1.5 0 0114.5 3.5v11a1.5 1.5 0 01-1.5 1.5H3A1.5 1.5 0 011.5 14.5v-11A1.5 1.5 0 013 2h1.5V.5A.5.5 0 015 0zm5.354 7.854a.5.5 0 00-.708-.708L7 9.793 5.354 8.146a.5.5 0 10-.708.708l2 2a.5.5 0 00.708 0l3-3z" />
          </svg>
        ),
      },
      {
        label: 'Content',
        href: '/content',
        Icon: () => (
          <svg className="h-4 w-4" viewBox="0 0 16 16" fill="currentColor">
            <path d="M14.5 3a.5.5 0 01.5.5v9a.5.5 0 01-.5.5h-13a.5.5 0 01-.5-.5v-9a.5.5 0 01.5-.5h13zm-13-1A1.5 1.5 0 000 3.5v9A1.5 1.5 0 001.5 14h13a1.5 1.5 0 001.5-1.5v-9A1.5 1.5 0 0014.5 2h-13zM3 5.5a.5.5 0 01.5-.5h9a.5.5 0 010 1h-9a.5.5 0 01-.5-.5zM3.5 7a.5.5 0 000 1h9a.5.5 0 000-1h-9zM3 9.5a.5.5 0 01.5-.5h6a.5.5 0 010 1h-6a.5.5 0 01-.5-.5z" />
          </svg>
        ),
      },
      {
        label: 'Leads',
        href: '/leads',
        Icon: () => (
          <svg className="h-4 w-4" viewBox="0 0 16 16" fill="currentColor">
            <path d="M8.186 1.113a.5.5 0 00-.372 0L1.846 3.5l2.404.961L10.404 2l-2.218-.887zm3.564 1.426L5.596 5 8 5.961 14.154 3.5l-2.404-.961zm3.25 1.7l-6.5 2.6v7.922l6.5-2.6V4.24zM7.5 14.762V6.838L1 4.239v7.923l6.5 2.6zM7.443.184a1.5 1.5 0 011.114 0l7.129 2.852A.5.5 0 0116 3.5v8.662a1 1 0 01-.629.928l-7.185 2.874a.5.5 0 01-.372 0l-7.185-2.874A1 1 0 010 12.162V3.5a.5.5 0 01.314-.464L7.443.184z" />
          </svg>
        ),
      },
    ],
  },
  {
    title: 'Pacific Atlas',
    items: [
      {
        label: 'Atlas',
        href: '/atlas',
        Icon: () => (
          <svg className="h-4 w-4" viewBox="0 0 16 16" fill="currentColor">
            <path d="M8 0l1.8 5.5H16l-5 3.6 1.9 5.9L8 11.4 3.1 15l1.9-5.9-5-3.6h6.2L8 0z" />
          </svg>
        ),
      },
    ],
  },
  {
    items: [
      {
        label: 'Settings',
        href: '/settings',
        Icon: () => (
          <svg className="h-4 w-4" viewBox="0 0 16 16" fill="currentColor">
            <path d="M9.405 1.05c-.413-1.4-2.397-1.4-2.81 0l-.1.34a1.464 1.464 0 01-2.105.872l-.31-.17c-1.283-.698-2.686.705-1.987 1.987l.169.311c.446.82.023 1.841-.872 2.105l-.34.1c-1.4.413-1.4 2.397 0 2.81l.34.1a1.464 1.464 0 01.872 2.105l-.17.31c-.698 1.283.705 2.686 1.987 1.987l.311-.169a1.464 1.464 0 012.105.872l.1.34c.413 1.4 2.397 1.4 2.81 0l.1-.34a1.464 1.464 0 012.105-.872l.31.17c1.283.698 2.686-.705 1.987-1.987l-.169-.311a1.464 1.464 0 01.872-2.105l.34-.1c1.4-.413 1.4-2.397 0-2.81l-.34-.1a1.464 1.464 0 01-.872-2.105l.17-.31c.698-1.283-.705-2.686-1.987-1.987l-.311.169a1.464 1.464 0 01-2.105-.872l-.1-.34zM8 10.93a2.929 2.929 0 110-5.86 2.929 2.929 0 010 5.858z" />
          </svg>
        ),
      },
    ],
  },
]

export function Sidebar({ workspaceSlug }: { workspaceSlug?: string }) {
  const pathname = usePathname()

  const visibleSections = sections.filter((section) => {
    if (section.showFor) {
      return workspaceSlug === section.showFor
    }
    if (section.title === 'Seasonal Labor') {
      return workspaceSlug === 'beyond-peaks'
    }
    if (section.title === 'Pacific Atlas') {
      return workspaceSlug === 'pacific-atlas'
    }
    return true
  })

  return (
    <aside className="flex h-full w-56 flex-col border-r border-[#2e2e32] bg-[#111113]">
      {/* Logo */}
      <div className="flex h-14 items-center gap-2.5 border-b border-[#2e2e32] px-4">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-600">
          <svg className="h-4 w-4 text-white" viewBox="0 0 16 16" fill="currentColor">
            <path d="M8 1.5a6.5 6.5 0 100 13 6.5 6.5 0 000-13zM0 8a8 8 0 1116 0A8 8 0 010 8z" />
            <path d="M8 5a.5.5 0 01.5.5v2.793l1.146-1.147a.5.5 0 01.708.708l-2 2a.5.5 0 01-.708 0l-2-2a.5.5 0 11.708-.708L7.5 8.293V5.5A.5.5 0 018 5z" />
          </svg>
        </div>
        <div>
          <p className="text-xs font-semibold text-zinc-200">Flight Deck</p>
          <p className="text-[10px] text-zinc-500">Pacific Atlas</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto p-2">
        {visibleSections.map((section, si) => (
          <div key={si} className={section.title ? 'mt-4' : ''}>
            {section.title && (
              <p className="mb-1 px-2.5 text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
                {section.title}
              </p>
            )}
            <div className="space-y-0.5">
              {section.items.filter((item) => !item.showFor || item.showFor === workspaceSlug).map((item) => {
                const active = pathname === item.href || (pathname?.startsWith(item.href + '/') ?? false)
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-sm transition-colors ${
                      active
                        ? 'bg-indigo-600/20 text-indigo-300'
                        : 'text-zinc-400 hover:bg-[#18181b] hover:text-zinc-200'
                    }`}
                  >
                    <item.Icon />
                    {item.label}
                  </Link>
                )
              })}
            </div>
          </div>
        ))}
      </nav>
    </aside>
  )
}
