'use client'

import { type ColumnDef } from '@tanstack/react-table'
import { DataTable } from '@/components/refine/DataTable'
import { PageHeader } from '@/components/refine/PageHeader'
import { StatusBadge } from '@/components/refine/StatusBadge'
import { DateCell } from '@/components/refine/DateCell'
import { Badge } from '@/components/ui/badge'

interface Lead {
  id: string
  company_name: string
  location: string | null
  website_url: string | null
  roles_hiring: string[] | null
  season: string | null
  contact_email: string | null
  contact_page_url: string | null
  confidence: string | null
  status: string
  notes: string | null
  created_at: string
}

const columns: ColumnDef<Lead, unknown>[] = [
  {
    accessorKey: 'company_name',
    header: 'Company',
    cell: ({ getValue }) => <span className="font-medium text-foreground">{getValue() as string}</span>,
  },
  {
    accessorKey: 'location',
    header: 'Location',
    cell: ({ getValue }) => <span className="text-muted-foreground">{(getValue() as string) ?? '—'}</span>,
  },
  {
    accessorKey: 'season',
    header: 'Season',
    cell: ({ getValue }) => {
      const s = getValue() as string | null
      return s ? <Badge variant="outline" className="capitalize">{s}</Badge> : <span className="text-muted-foreground">—</span>
    },
  },
  {
    accessorKey: 'roles_hiring',
    header: 'Roles',
    cell: ({ getValue }) => {
      const roles = getValue() as string[] | null
      if (!roles?.length) return <span className="text-muted-foreground">—</span>
      return (
        <div className="flex max-w-[200px] flex-wrap gap-1">
          {roles.slice(0, 3).map((r) => (
            <Badge key={r} variant="outline" className="text-[10px]">{r}</Badge>
          ))}
          {roles.length > 3 && <span className="text-[10px] text-muted-foreground">+{roles.length - 3}</span>}
        </div>
      )
    },
  },
  {
    accessorKey: 'confidence',
    header: 'Confidence',
    cell: ({ getValue }) => {
      const c = getValue() as string | null
      if (!c) return <span className="text-muted-foreground">—</span>
      return (
        <Badge variant={c === 'high' ? 'default' : c === 'medium' ? 'secondary' : 'outline'} className="capitalize">
          {c}
        </Badge>
      )
    },
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ getValue }) => <StatusBadge status={getValue() as string} />,
  },
  {
    accessorKey: 'website_url',
    header: 'Website',
    cell: ({ getValue }) => {
      const url = getValue() as string | null
      if (!url) return <span className="text-muted-foreground">—</span>
      return (
        <a href={url} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline">
          {url.replace(/^https?:\/\//, '').replace(/\/$/, '').slice(0, 25)}
        </a>
      )
    },
  },
  {
    accessorKey: 'created_at',
    header: 'Added',
    cell: ({ getValue }) => <DateCell value={getValue() as string} />,
  },
]

export default function LeadsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Leads"
        subtitle="Employer leads found by Managed Agents"
      />
      <DataTable<Lead>
        resource="leads"
        columns={columns}
        searchField="company_name"
      />
    </div>
  )
}
