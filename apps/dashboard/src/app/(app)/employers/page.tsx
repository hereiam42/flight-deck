'use client'

import { type ColumnDef } from '@tanstack/react-table'
import { useRouter } from 'next/navigation'
import { DataTable } from '@/components/refine/DataTable'
import { PageHeader } from '@/components/refine/PageHeader'
import { StatusBadge } from '@/components/refine/StatusBadge'
import { DateCell } from '@/components/refine/DateCell'

interface Employer {
  id: string
  company_name: string
  contact_name: string | null
  contact_email: string | null
  location: string | null
  plan: string | null
  previous_seasons: number | null
  status: string
  created_at: string
}

const columns: ColumnDef<Employer, unknown>[] = [
  {
    accessorKey: 'company_name',
    header: 'Company',
    cell: ({ getValue }) => <span className="font-medium text-foreground">{getValue() as string}</span>,
  },
  {
    accessorKey: 'contact_name',
    header: 'Contact',
    cell: ({ row }) => (
      <div>
        <p className="text-foreground">{row.original.contact_name ?? '—'}</p>
        {row.original.contact_email && (
          <p className="text-xs text-muted-foreground">{row.original.contact_email}</p>
        )}
      </div>
    ),
  },
  {
    accessorKey: 'location',
    header: 'Location',
    cell: ({ getValue }) => <span className="text-muted-foreground">{(getValue() as string) ?? '—'}</span>,
  },
  {
    accessorKey: 'plan',
    header: 'Plan',
    cell: ({ getValue }) => {
      const p = getValue() as string | null
      return p ? <StatusBadge status={p} /> : <span className="text-muted-foreground">—</span>
    },
  },
  {
    accessorKey: 'previous_seasons',
    header: 'Seasons',
    cell: ({ getValue }) => <span className="font-mono text-sm text-muted-foreground">{(getValue() as number) ?? 0}</span>,
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ getValue }) => <StatusBadge status={getValue() as string} />,
  },
  {
    accessorKey: 'created_at',
    header: 'Added',
    cell: ({ getValue }) => <DateCell value={getValue() as string} />,
  },
]

export default function EmployersPage() {
  const router = useRouter()

  return (
    <div className="space-y-6">
      <PageHeader title="Employers" subtitle="Partner employers across all boards" />
      <DataTable<Employer>
        resource="employers"
        columns={columns}
        searchField="company_name"
        onRowClick={(e) => router.push(`/employers/${e.id}`)}
      />
    </div>
  )
}
