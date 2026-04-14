'use client'

import { type ColumnDef } from '@tanstack/react-table'
import { useRouter } from 'next/navigation'
import { DataTable } from '@/components/refine/DataTable'
import { PageHeader } from '@/components/refine/PageHeader'
import { StatusBadge } from '@/components/refine/StatusBadge'
import { DateCell } from '@/components/refine/DateCell'
import { Badge } from '@/components/ui/badge'

interface Candidate {
  id: string
  first_name: string
  last_name: string | null
  nationality: string | null
  languages: string[] | null
  visa_status: string | null
  available_from: string | null
  available_to: string | null
  source_channel: string | null
  status: string
  created_at: string
}

const columns: ColumnDef<Candidate, unknown>[] = [
  {
    accessorKey: 'first_name',
    header: 'Name',
    cell: ({ row }) => (
      <span className="font-medium text-foreground">
        {row.original.first_name} {row.original.last_name ?? ''}
      </span>
    ),
  },
  {
    accessorKey: 'nationality',
    header: 'Nationality',
    cell: ({ getValue }) => getValue() ?? <span className="text-muted-foreground">—</span>,
  },
  {
    accessorKey: 'languages',
    header: 'Languages',
    cell: ({ getValue }) => {
      const langs = getValue() as string[] | null
      if (!langs?.length) return <span className="text-muted-foreground">—</span>
      return (
        <div className="flex flex-wrap gap-1">
          {langs.map((l) => (
            <Badge key={l} variant="outline" className="text-xs">{l}</Badge>
          ))}
        </div>
      )
    },
  },
  {
    accessorKey: 'visa_status',
    header: 'Visa',
    cell: ({ getValue }) => {
      const v = getValue() as string | null
      return v ? <StatusBadge status={v} /> : <span className="text-muted-foreground">—</span>
    },
  },
  {
    accessorKey: 'available_from',
    header: 'Available',
    cell: ({ row }) => {
      const from = row.original.available_from
      const to = row.original.available_to
      if (!from) return <span className="text-muted-foreground">—</span>
      return (
        <span className="text-sm text-muted-foreground">
          {new Date(from).toLocaleDateString()} – {to ? new Date(to).toLocaleDateString() : '?'}
        </span>
      )
    },
  },
  {
    accessorKey: 'source_channel',
    header: 'Source',
    cell: ({ getValue }) => (
      <span className="text-sm text-muted-foreground">{(getValue() as string) ?? '—'}</span>
    ),
  },
  {
    accessorKey: 'created_at',
    header: 'Added',
    cell: ({ getValue }) => <DateCell value={getValue() as string} />,
  },
]

export default function CandidatesPage() {
  const router = useRouter()

  return (
    <div className="space-y-6">
      <PageHeader
        title="Candidates"
        subtitle="Seasonal worker profiles processed by agents"
      />
      <DataTable<Candidate>
        resource="candidates"
        columns={columns}
        searchField="first_name"
        onRowClick={(c) => router.push(`/candidates/${c.id}`)}
      />
    </div>
  )
}
