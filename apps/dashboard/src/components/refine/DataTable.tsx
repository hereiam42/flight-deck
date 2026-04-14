'use client'

import { useTable } from '@refinedev/react-table'
import { type ColumnDef, flexRender } from '@tanstack/react-table'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useState } from 'react'

interface DataTableProps<T> {
  resource: string
  columns: ColumnDef<T, unknown>[]
  /** Extra Supabase filters: [{ field, operator, value }] */
  filters?: Array<{ field: string; operator: string; value: unknown }>
  /** Page size, default 25 */
  pageSize?: number
  /** Whether to show the search bar */
  searchField?: string
  /** If provided, clicking a row calls this */
  onRowClick?: (row: T) => void
}

export function DataTable<T extends { id: string }>({
  resource,
  columns,
  filters: permanentFilters,
  pageSize = 25,
  searchField,
  onRowClick,
}: DataTableProps<T>) {
  const [search, setSearch] = useState('')

  const table = useTable<T>({
    columns,
    refineCoreProps: {
      resource,
      pagination: { pageSize },
      filters: {
        permanent: permanentFilters as never,
      },
      sorters: { initial: [{ field: 'created_at', order: 'desc' }] },
    },
  })

  const rt = table.reactTable

  const { pagination } = rt.getState()
  const rows = rt.getRowModel().rows

  // Client-side search filtering (simple text match)
  const filteredRows = searchField && search
    ? rows.filter((row) => {
        const val = row.getValue(searchField)
        return typeof val === 'string' && val.toLowerCase().includes(search.toLowerCase())
      })
    : rows

  return (
    <div className="space-y-4">
      {searchField && (
        <div className="flex items-center gap-3">
          <Input
            placeholder="Search…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-sm"
          />
        </div>
      )}

      <div className="rounded-lg border border-border">
        <Table>
          <TableHeader>
            {rt.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id} className="text-xs font-medium text-muted-foreground">
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {filteredRows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center text-muted-foreground">
                  No results.
                </TableCell>
              </TableRow>
            ) : (
              filteredRows.map((row) => (
                <TableRow
                  key={row.id}
                  className={onRowClick ? 'cursor-pointer' : undefined}
                  onClick={() => onRowClick?.(row.original)}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {rt.getPageCount() > 1 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>
            Page {pagination.pageIndex + 1} of {rt.getPageCount()}
          </span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => rt.previousPage()}
              disabled={!rt.getCanPreviousPage()}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => rt.nextPage()}
              disabled={!rt.getCanNextPage()}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
