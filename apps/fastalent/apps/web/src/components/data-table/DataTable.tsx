import * as React from 'react'
import {
  type ColumnDef,
  type SortingState,
  type PaginationState,
  type ColumnFiltersState,
  type OnChangeFn,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  useReactTable,
} from '@tanstack/react-table'

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Skeleton } from '@/components/ui/skeleton'
import { DataTableEmptyState } from './DataTableEmptyState'
import { DataTablePagination } from './DataTablePagination'

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
  pageCount?: number
  rowCount?: number
  pagination?: PaginationState
  onPaginationChange?: OnChangeFn<PaginationState>
  sorting?: SortingState
  onSortingChange?: OnChangeFn<SortingState>
  columnFilters?: ColumnFiltersState
  onColumnFiltersChange?: OnChangeFn<ColumnFiltersState>
  onRowClick?: (row: TData) => void
  loading?: boolean
  emptyIcon?: React.ReactNode
  emptyTitle?: string
  emptyDescription?: string
  emptyCta?: React.ReactNode
  toolbar?: React.ReactNode
}

export function DataTable<TData, TValue>({
  columns,
  data,
  pageCount,
  rowCount,
  pagination,
  onPaginationChange,
  sorting,
  onSortingChange,
  columnFilters,
  onColumnFiltersChange,
  onRowClick,
  loading = false,
  emptyIcon,
  emptyTitle,
  emptyDescription,
  emptyCta,
  toolbar,
}: DataTableProps<TData, TValue>) {
  const isManualPagination = pageCount !== undefined
  const isManualSorting = onSortingChange !== undefined
  const isManualFiltering = onColumnFiltersChange !== undefined

  const table = useReactTable({
    data,
    columns,
    pageCount,
    rowCount,
    state: {
      ...(pagination !== undefined && { pagination }),
      ...(sorting !== undefined && { sorting }),
      ...(columnFilters !== undefined && { columnFilters }),
    },
    onPaginationChange,
    onSortingChange,
    onColumnFiltersChange,
    getCoreRowModel: getCoreRowModel(),
    // Client-side row models (only when not in manual mode)
    getSortedRowModel: !isManualSorting ? getSortedRowModel() : undefined,
    getFilteredRowModel: !isManualFiltering ? getFilteredRowModel() : undefined,
    getPaginationRowModel: !isManualPagination ? getPaginationRowModel() : undefined,
    manualPagination: isManualPagination,
    manualSorting: isManualSorting,
    manualFiltering: isManualFiltering,
  })

  const pageSize = pagination?.pageSize ?? 10

  return (
    <div className="space-y-4">
      {toolbar && <div>{toolbar}</div>}

      <div className="relative">
        {/* Mobile horizontal scroll hint gradient */}
        <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-background to-transparent z-10 sm:hidden" />

        <div className="overflow-x-auto rounded-md border">
          <Table>
            <TableHeader className="sticky top-0 bg-background z-10 border-b">
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {loading ? (
                // Loading skeleton rows
                Array.from({ length: pageSize }).map((_, index) => (
                  <TableRow key={`skeleton-${index}`}>
                    {columns.map((_, cellIndex) => (
                      <TableCell key={`skeleton-${index}-${cellIndex}`}>
                        <Skeleton className="h-5 w-full" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : table.getRowModel().rows?.length ? (
                // Actual data rows
                table.getRowModel().rows.map((row) => (
                  <TableRow
                    key={row.id}
                    data-state={row.getIsSelected() && 'selected'}
                    className={onRowClick ? 'cursor-pointer' : undefined}
                    onClick={onRowClick ? () => onRowClick(row.original) : undefined}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                // Empty state
                <TableRow>
                  <TableCell colSpan={columns.length} className="h-48">
                    <DataTableEmptyState
                      icon={emptyIcon}
                      title={emptyTitle}
                      description={emptyDescription}
                      cta={emptyCta}
                    />
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <DataTablePagination table={table} rowCount={rowCount} />
    </div>
  )
}
