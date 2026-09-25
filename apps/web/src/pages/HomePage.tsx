import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowRight, ShieldCheck, Sparkles, Wallet } from 'lucide-react';
import { apiGet } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuthStore } from '@/stores/auth-store';

/**
 * HomePage
 * --------
 * Public landing. Three value-props + a live API health badge so a
 * fresh clone can verify end-to-end connectivity without leaving the
 * homepage.
 *
 * When the visitor is already signed in, the primary CTA switches
 * from "Create account" to "Go to dashboard".
 */
interface HealthPayload {
  status: string;
  service: string;
  version: string;
  uptimeSec: number;
  nodeEnv: string;
  timestamp: string;
}

export default function HomePage() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const user = useAuthStore((s) => s.user);

  const health = useQuery({
    queryKey: ['health'],
    queryFn: () => apiGet<HealthPayload>('/health'),
    staleTime: 30_000,
  });

  const dashboardPath =
    user?.role === 'recruiter'
      ? '/r/dashboard'
      : user?.role === 'company'
        ? '/c/dashboard'
        : user?.role === 'admin'
          ? '/a/dashboard'
          : '/';

  return (
    <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
      <section className="mx-auto max-w-3xl text-center">
        <Badge variant="secondary" className="mb-4">
          Trust-first gig recruiting
        </Badge>
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
          Hire faster with recruiters you can trust.
        </h1>
        <p className="mt-4 text-lg text-muted-foreground">
          fastalent pairs vetted independent recruiters with companies hiring at speed — with
          escrowed fees, reputation scoring, and AI-assisted shortlisting baked in.
        </p>
        <div className="mt-8 flex items-center justify-center gap-3">
          {isAuthenticated ? (
            <Button size="lg" asChild>
              <Link to={dashboardPath} viewTransition>
                Go to dashboard <ArrowRight className="ml-2 h-4 w-4" aria-hidden />
              </Link>
            </Button>
          ) : (
            <>
              <Button size="lg" asChild>
                <Link to="/register/recruiter" viewTransition>
                  Get started <ArrowRight className="ml-2 h-4 w-4" aria-hidden />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link to="/login" viewTransition>Sign in</Link>
              </Button>
            </>
          )}
        </div>
      </section>

      <section className="mt-16 grid gap-6 md:grid-cols-3">
        <FeatureCard
          icon={<ShieldCheck className="h-5 w-5 text-primary" aria-hidden />}
          title="Trust-first"
          description="KYC, PAN verification, and reputation scoring built in from day one."
        />
        <FeatureCard
          icon={<Sparkles className="h-5 w-5 text-primary" aria-hidden />}
          title="AI-assisted"
          description="Smart shortlisting, gig-recruiter matching, and fraud signals."
        />
        <FeatureCard
          icon={<Wallet className="h-5 w-5 text-primary" aria-hidden />}
          title="Escrowed payouts"
          description="Agency fees held in escrow, released on verified placements."
        />
      </section>

      <section className="mt-16">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2">
            <div>
              <CardTitle className="text-base">API connectivity</CardTitle>
              <CardDescription>
                Live ping to{' '}
                <code className="rounded bg-muted px-1.5 py-0.5 text-xs">
                  {import.meta.env.VITE_API_URL}/health
                </code>
              </CardDescription>
            </div>
            {health.isSuccess && <Badge variant="success">Healthy</Badge>}
            {health.isError && <Badge variant="destructive">Unreachable</Badge>}
            {health.isPending && <Badge variant="secondary">Checking…</Badge>}
          </CardHeader>
          <CardContent>
            {health.isError && (
              <p className="text-sm text-destructive">
                API unreachable: {(health.error as Error).message}
              </p>
            )}
            {health.isSuccess && (
              <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm sm:grid-cols-4">
                <div>
                  <dt className="text-xs text-muted-foreground">Service</dt>
                  <dd className="font-mono text-sm">{health.data.service}</dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">Version</dt>
                  <dd className="font-mono text-sm">{health.data.version}</dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">Uptime</dt>
                  <dd className="font-mono text-sm">{health.data.uptimeSec}s</dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">Environment</dt>
                  <dd className="font-mono text-sm">{health.data.nodeEnv}</dd>
                </div>
              </dl>
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <Card>
      <CardHeader className="space-y-2">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
          {icon}
        </div>
        <CardTitle className="text-lg">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
    </Card>
  );
}
