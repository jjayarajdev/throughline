import type { Table } from '@tanstack/react-table'
import { Search, X } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { DataTableFilterPills } from './DataTableFilterPills'

interface FilterableColumn {
  id: string
  title: string
  options: { label: string; value: string }[]
}

interface DataTableToolbarProps<TData> {
  table: Table<TData>
  filterableColumns?: FilterableColumn[]
  searchColumn?: string
  searchPlaceholder?: string
}

export function DataTableToolbar<TData>({
  table,
  filterableColumns,
  searchColumn,
  searchPlaceholder = 'Search...',
}: DataTableToolbarProps<TData>) {
  const isFiltered = table.getState().columnFilters.length > 0

  return (
    <div className="space-y-2.5">
      <div className="flex items-center justify-between">
        <div className="flex flex-1 items-center space-x-2">
          {/* Search input */}
          {searchColumn && (
            <div className="relative flex items-center flex-1 max-w-sm">
              <Search className="absolute left-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={searchPlaceholder}
                value={
                  (table.getColumn(searchColumn)?.getFilterValue() as string) ??
                  ''
                }
                onChange={(event) =>
                  table
                    .getColumn(searchColumn)
                    ?.setFilterValue(event.target.value)
                }
                className="pl-9 max-w-sm"
              />
            </div>
          )}

          {/* Filter dropdowns */}
          {filterableColumns?.map((column) => {
            const filterValue = table
              .getColumn(column.id)
              ?.getFilterValue() as string
            const selectedOption = column.options.find(
              (opt) => opt.value === filterValue
            )

            return (
              <DropdownMenu key={column.id}>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="h-9">
                    {selectedOption ? selectedOption.label : column.title}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start">
                  {column.options.map((option) => (
                    <DropdownMenuItem
                      key={option.value}
                      onClick={() =>
                        table.getColumn(column.id)?.setFilterValue(option.value)
                      }
                    >
                      {option.label}
                    </DropdownMenuItem>
                  ))}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() =>
                      table.getColumn(column.id)?.setFilterValue(undefined)
                    }
                  >
                    Clear filter
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )
          })}

          {/* Clear all filters */}
          {isFiltered && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => table.resetColumnFilters()}
              className="h-9 px-2 lg:px-3"
            >
              Reset
              <X className="ml-2 h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Active filter pills */}
      <DataTableFilterPills
        table={table}
        filterableColumns={filterableColumns}
      />
    </div>
  )
}
