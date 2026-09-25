import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ErrorBoundaryProps {
  children: ReactNode;
  /** Optional custom fallback UI. Receives the error and a `reset` fn. */
  fallback?: (error: Error, reset: () => void) => ReactNode;
}

interface ErrorBoundaryState {
  error: Error | null;
}

/**
 * Last-resort render-error trap. Most runtime errors in our app flow
 * through TanStack Query (network / axios errors), where we surface
 * them inline via `query.error`. This boundary exists to catch the
 * rare render-time throw (invalid props, bad data shape, bug in a
 * child component) so the whole app doesn't white-screen.
 *
 * Class component because React's error-boundary API is still class-only.
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  override state: ErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  override componentDidCatch(error: Error, info: ErrorInfo): void {
    // Wire real telemetry in Phase 6 (observability).
    // eslint-disable-next-line no-console
    console.error('[ErrorBoundary]', error, info.componentStack);
  }

  reset = (): void => this.setState({ error: null });

  override render(): ReactNode {
    const { error } = this.state;
    if (!error) return this.props.children;
    if (this.props.fallback) return this.props.fallback(error, this.reset);
    return (
      <div className="flex min-h-screen items-center justify-center p-6">
        <div className="w-full max-w-md space-y-4 rounded-lg border bg-card p-6 text-card-foreground shadow-sm">
          <div className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" aria-hidden />
            <h2 className="text-lg font-semibold">Something went wrong</h2>
          </div>
          <p className="text-sm text-muted-foreground">
            An unexpected error occurred while rendering this page. You can try again or head
            back to the homepage.
          </p>
          <pre className="max-h-32 overflow-auto rounded bg-muted px-3 py-2 text-xs text-muted-foreground">
            {error.message}
          </pre>
          <div className="flex gap-2">
            <Button onClick={this.reset}>Try again</Button>
            <Button
              variant="outline"
              onClick={() => {
                window.location.href = '/';
              }}
            >
              Go home
            </Button>
          </div>
        </div>
      </div>
    );
  }
}
