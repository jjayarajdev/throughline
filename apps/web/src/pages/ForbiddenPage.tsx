import { Link } from 'react-router-dom';
import { ShieldX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

/**
 * 403 — returned when a signed-in user tries to access a route their
 * role isn't allowed to see. Distinct from the 404 NotFoundPage so
 * users aren't misled about the page existing.
 *
 * Rendered inside RootLayout in Wave 5, so the page no longer needs
 * its own full-screen centering wrapper.
 */
export default function ForbiddenPage() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center p-4">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
            <ShieldX className="h-6 w-6 text-destructive" aria-hidden />
          </div>
          <CardTitle>403 — Forbidden</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            You&apos;re signed in, but your account role doesn&apos;t have access to this page.
          </p>
          <Button asChild>
            <Link to="/" viewTransition>Back to home</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
