'use client'

import { type ColumnDef } from '@tanstack/react-table'
import { useRouter } from 'next/navigation'
import { DataTable } from '@/components/refine/DataTable'
import { PageHeader } from '@/components/refine/PageHeader'
import { StatusBadge } from '@/components/refine/StatusBadge'

interface Job {
  id: string
  title: string
  status: string
  season: string | null
  slots_total: number
  slots_filled: number
  created_at: string
}

const columns: ColumnDef<Job, unknown>[] = [
  {
    accessorKey: 'title',
    header: 'Title',
    cell: ({ getValue }) => <span className="font-medium text-foreground">{getValue() as string}</span>,
  },
  {
    accessorKey: 'slots_total',
    header: 'Slots',
    cell: ({ row }) => (
      <span className="font-mono text-sm text-muted-foreground">
        {row.original.slots_filled}/{row.original.slots_total}
      </span>
    ),
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ getValue }) => <StatusBadge status={getValue() as string} />,
  },
  {
    accessorKey: 'season',
    header: 'Season',
    cell: ({ getValue }) => <span className="text-sm text-muted-foreground">{(getValue() as string) ?? '—'}</span>,
  },
]

export default function JobsPage() {
  const router = useRouter()

  return (
    <div className="space-y-6">
      <PageHeader title="Jobs" subtitle="Seasonal positions across all boards" />
      <DataTable<Job>
        resource="jobs"
        columns={columns}
        searchField="title"
        onRowClick={(j) => router.push(`/jobs/${j.id}`)}
      />
    </div>
  )
}
