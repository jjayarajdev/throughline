import * as React from 'react'
import { FileQuestion } from 'lucide-react'

interface DataTableEmptyStateProps {
  icon?: React.ReactNode
  title?: string
  description?: string
  cta?: React.ReactNode
}

export function DataTableEmptyState({
  icon,
  title = 'No results found',
  description = 'Try adjusting your search or filters.',
  cta,
}: DataTableEmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-12">
      <div className="mb-4 text-muted-foreground">
        {icon ?? <FileQuestion className="h-12 w-12" />}
      </div>
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground mb-4 max-w-md">
        {description}
      </p>
      {cta && <div>{cta}</div>}
    </div>
  )
}
