import { Link, useMatches } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';

interface BreadcrumbHandle {
  breadcrumb: string;
}

/**
 * Reads breadcrumb labels from route handle metadata.
 * Routes define: handle: { breadcrumb: "Dashboard" }
 * Falls back to "..." for routes without breadcrumb metadata.
 */
export function Breadcrumbs() {
  const matches = useMatches();

  // Filter to routes that have a breadcrumb handle
  const crumbs = matches
    .filter((match) => (match.handle as BreadcrumbHandle)?.breadcrumb)
    .map((match) => ({
      path: match.pathname,
      label: (match.handle as BreadcrumbHandle).breadcrumb,
    }));

  if (crumbs.length <= 1) return null; // Don't show breadcrumbs for root/single level

  return (
    <nav aria-label="Breadcrumb">
      <ol className="flex items-center gap-1.5 text-sm text-muted-foreground">
        {crumbs.map((crumb, index) => {
          const isLast = index === crumbs.length - 1;
          return (
            <li key={crumb.path} className="flex items-center gap-1.5">
              {index > 0 && (
                <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/50" aria-hidden />
              )}
              {isLast ? (
                <span className="font-medium text-foreground" aria-current="page">
                  {crumb.label}
                </span>
              ) : (
                <Link to={crumb.path} viewTransition className="hover:text-foreground transition-colors">
                  {crumb.label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
