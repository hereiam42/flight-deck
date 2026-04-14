'use client'

import { Refine } from '@refinedev/core'
import { dataProvider } from '@refinedev/supabase'
import routerProvider from '@refinedev/nextjs-router'
import { supabaseClient } from '@/lib/refine/supabaseClient'
import { authProvider } from '@/lib/refine/authProvider'

const resources = [
  {
    name: 'candidates',
    list: '/candidates',
    show: '/candidates/:id',
    meta: { label: 'Candidates' },
  },
  {
    name: 'employers',
    list: '/employers',
    show: '/employers/:id',
    meta: { label: 'Employers' },
  },
  {
    name: 'jobs',
    list: '/jobs',
    show: '/jobs/:id',
    meta: { label: 'Jobs' },
  },
  {
    name: 'applications',
    list: '/applications',
    meta: { label: 'Applications' },
  },
  {
    name: 'leads',
    list: '/leads',
    meta: { label: 'Leads' },
  },
  {
    name: 'managed_agents',
    list: '/managed-agents',
    show: '/managed-agents/:id',
    meta: { label: 'Managed Agents' },
  },
  {
    name: 'agent_sessions',
    list: '/managed-agents/sessions',
    show: '/managed-agents/sessions/:id',
    meta: { label: 'Agent Sessions' },
  },
  {
    name: 'boards',
    list: '/boards',
    show: '/boards/:id',
    meta: { label: 'Boards' },
  },
  {
    name: 'content',
    list: '/content',
    meta: { label: 'Content' },
  },
]

export function RefineProvider({ children }: { children: React.ReactNode }) {
  return (
    <Refine
      dataProvider={dataProvider(supabaseClient)}
      routerProvider={routerProvider}
      authProvider={authProvider}
      resources={resources}
      options={{
        syncWithLocation: true,
        warnWhenUnsavedChanges: false,
      }}
    >
      {children}
    </Refine>
  )
}
