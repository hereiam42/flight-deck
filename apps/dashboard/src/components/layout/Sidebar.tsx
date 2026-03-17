'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const nav = [
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
    label: 'Notifications',
    href: '/notifications',
    Icon: () => (
      <svg className="h-4 w-4" viewBox="0 0 16 16" fill="currentColor">
        <path d="M8 16a2 2 0 001.985-1.75c.017-.137-.097-.25-.235-.25h-3.5c-.138 0-.252.113-.235.25A2 2 0 008 16zm.104-14.096A5.5 5.5 0 002.5 8c0 1.033-.5 3-1.5 4h14c-1-1-1.5-2.967-1.5-4a5.5 5.5 0 00-5.396-5.596z" />
      </svg>
    ),
  },
  {
    label: 'Settings',
    href: '/settings',
    Icon: () => (
      <svg className="h-4 w-4" viewBox="0 0 16 16" fill="currentColor">
        <path d="M9.405 1.05c-.413-1.4-2.397-1.4-2.81 0l-.1.34a1.464 1.464 0 01-2.105.872l-.31-.17c-1.283-.698-2.686.705-1.987 1.987l.169.311c.446.82.023 1.841-.872 2.105l-.34.1c-1.4.413-1.4 2.397 0 2.81l.34.1a1.464 1.464 0 01.872 2.105l-.17.31c-.698 1.283.705 2.686 1.987 1.987l.311-.169a1.464 1.464 0 012.105.872l.1.34c.413 1.4 2.397 1.4 2.81 0l.1-.34a1.464 1.464 0 012.105-.872l.31.17c1.283.698 2.686-.705 1.987-1.987l-.169-.311a1.464 1.464 0 01.872-2.105l.34-.1c1.4-.413 1.4-2.397 0-2.81l-.34-.1a1.464 1.464 0 01-.872-2.105l.17-.31c.698-1.283-.705-2.686-1.987-1.987l-.311.169a1.464 1.464 0 01-2.105-.872l-.1-.34zM8 10.93a2.929 2.929 0 110-5.86 2.929 2.929 0 010 5.858z" />
      </svg>
    ),
  },
]

export function Sidebar() {
  const pathname = usePathname()

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
      <nav className="flex-1 space-y-0.5 p-2">
        {nav.map((item) => {
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
      </nav>
    </aside>
  )
}
