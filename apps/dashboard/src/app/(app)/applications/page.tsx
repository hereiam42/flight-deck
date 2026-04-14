'use client'

import { type ColumnDef } from '@tanstack/react-table'
import { DataTable } from '@/components/refine/DataTable'
import { PageHeader } from '@/components/refine/PageHeader'
import { StatusBadge } from '@/components/refine/StatusBadge'
import { DateCell } from '@/components/refine/DateCell'

interface Application {
  id: string
  match_score: number | null
  status: string
  scoring_factors: Record<string, number> | null
  created_at: string
}

function scoreColor(score: number): string {
  if (score >= 80) return 'text-emerald-400'
  if (score >= 50) return 'text-yellow-400'
  return 'text-muted-foreground'
}

const columns: ColumnDef<Application, unknown>[] = [
  {
    accessorKey: 'match_score',
    header: 'Match',
    cell: ({ getValue }) => {
      const score = getValue() as number | null
      return score != null
        ? <span className={`font-mono font-semibold ${scoreColor(score)}`}>{score}</span>
        : <span className="text-muted-foreground">—</span>
    },
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ getValue }) => <StatusBadge status={getValue() as string} />,
  },
  {
    accessorKey: 'scoring_factors',
    header: 'Scoring Factors',
    cell: ({ getValue }) => {
      const factors = getValue() as Record<string, number> | null
      if (!factors) return <span className="text-muted-foreground">—</span>
      return (
        <div className="flex flex-wrap gap-1">
          {Object.entries(factors).map(([key, val]) => (
            <span key={key} className={`rounded px-1 py-0.5 text-[10px] ${
              val >= 80 ? 'bg-emerald-900/30 text-emerald-400' :
              val >= 50 ? 'bg-yellow-900/30 text-yellow-400' :
              'bg-zinc-800 text-muted-foreground'
            }`}>
              {key}: {val}
            </span>
          ))}
        </div>
      )
    },
  },
  {
    accessorKey: 'created_at',
    header: 'Applied',
    cell: ({ getValue }) => <DateCell value={getValue() as string} />,
  },
]

export default function ApplicationsPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Applications" subtitle="Scored by agents" />
      <DataTable<Application>
        resource="applications"
        columns={columns}
      />
    </div>
  )
}
