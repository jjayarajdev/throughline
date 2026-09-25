import { useEffect, useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { CheckCircle2, XCircle } from 'lucide-react';
import { useVerifyEmail } from '@/features/auth/hooks';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { extractErrorMessage } from '@/lib/error';

export default function VerifyEmailPage() {
  const [params] = useSearchParams();
  const token = params.get('token') ?? '';
  const verify = useVerifyEmail();
  const firedRef = useRef(false);

  useEffect(() => {
    if (!token || firedRef.current) return;
    firedRef.current = true;
    verify.mutate({ token });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  if (!token) {
    return (
      <Card className="text-center">
        <CardHeader>
          <CardTitle>Verify your email</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <p className="text-muted-foreground">
            This page needs a <code>?token=…</code> query parameter from your verification email.
          </p>
          <Button asChild className="w-full">
            <Link to="/login" viewTransition>Go to sign in</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  const errMsg = verify.isError ? extractErrorMessage(verify.error, 'Verification failed') : null;

  return (
    <Card className="text-center">
      <CardHeader>
        <CardTitle>Verify your email</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 text-sm">
        {verify.isPending && (
          <div className="flex flex-col items-center gap-4 py-4">
            <Skeleton variant="avatar" className="h-12 w-12" />
            <Skeleton variant="text" className="w-48" />
            <p className="text-sm text-muted-foreground">Verifying your email…</p>
          </div>
        )}
        {verify.isSuccess && (
          <>
            <div className="flex justify-center">
              <CheckCircle2 className="h-10 w-10 text-success" aria-hidden />
            </div>
            <p>Your email is verified. You can now sign in.</p>
            <Button asChild className="w-full">
              <Link to="/login" viewTransition>Go to sign in</Link>
            </Button>
          </>
        )}
        {verify.isError && (
          <>
            <div className="flex justify-center">
              <XCircle className="h-10 w-10 text-destructive" aria-hidden />
            </div>
            <p className="text-destructive">{errMsg}</p>
            <Button asChild className="w-full">
              <Link to="/login" viewTransition>Back to sign in</Link>
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}
