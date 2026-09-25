import type { Table } from '@tanstack/react-table'
import { X } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

interface FilterableColumn {
  id: string
  title: string
  options: { label: string; value: string }[]
}

interface DataTableFilterPillsProps<TData> {
  table: Table<TData>
  filterableColumns?: FilterableColumn[]
}

export function DataTableFilterPills<TData>({
  table,
  filterableColumns,
}: DataTableFilterPillsProps<TData>) {
  const columnFilters = table.getState().columnFilters

  if (!columnFilters.length || !filterableColumns) {
    return null
  }

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {columnFilters.map((filter) => {
        const column = filterableColumns.find((col) => col.id === filter.id)
        if (!column) return null

        const option = column.options.find((opt) => opt.value === filter.value)
        if (!option) return null

        return (
          <Badge key={filter.id} variant="secondary" className="gap-1">
            <span className="text-xs font-normal">
              {column.title}: {option.label}
            </span>
            <button
              onClick={() => table.getColumn(filter.id)?.setFilterValue(undefined)}
              className="ml-1 rounded-full outline-none ring-offset-background focus:ring-2 focus:ring-ring focus:ring-offset-2"
            >
              <X className="h-3 w-3" />
              <span className="sr-only">Remove {column.title} filter</span>
            </button>
          </Badge>
        )
      })}

      {columnFilters.length >= 2 && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => table.resetColumnFilters()}
          className="h-7 px-2 text-xs"
        >
          Clear all
        </Button>
      )}
    </div>
  )
}
