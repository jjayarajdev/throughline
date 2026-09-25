import { Brain, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useJdCrux } from '@/features/matching';

export function JdCruxPanel({ roleId }: { roleId: string }) {
  const { data: crux, isPending } = useJdCrux(roleId);

  if (isPending) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (!crux || crux.status !== 'completed') return null;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Brain className="h-4 w-4 text-primary" aria-hidden />
          <CardTitle className="text-base">AI-Summarized Brief</CardTitle>
        </div>
        <CardDescription>
          Key requirements extracted by AI from the job description.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {crux.summary && (
          <p className="text-sm leading-relaxed">{crux.summary}</p>
        )}

        {crux.seniorityLevel && (
          <div>
            <h3 className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Seniority
            </h3>
            <Badge variant="secondary" className="capitalize">
              {crux.seniorityLevel}
            </Badge>
          </div>
        )}

        {(crux.experienceMin !== null || crux.experienceMax !== null) && (
          <div>
            <h3 className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Experience
            </h3>
            <p className="text-sm">
              {crux.experienceMax
                ? `${crux.experienceMin ?? 0}–${crux.experienceMax} years`
                : `${crux.experienceMin}+ years`}
            </p>
          </div>
        )}

        {crux.keySkills.length > 0 && (
          <div>
            <h3 className="mb-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Key Skills
            </h3>
            <div className="flex flex-wrap gap-1.5">
              {crux.keySkills.map((s) => (
                <Badge key={s} variant="default" className="text-xs">
                  {s}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {crux.niceToHaveSkills.length > 0 && (
          <div>
            <h3 className="mb-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Nice to Have
            </h3>
            <div className="flex flex-wrap gap-1.5">
              {crux.niceToHaveSkills.map((s) => (
                <Badge key={s} variant="outline" className="text-xs">
                  {s}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {crux.mustHaves.length > 0 && (
          <div>
            <h3 className="mb-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Must-Haves
            </h3>
            <ul className="list-inside list-disc space-y-0.5 text-sm">
              {crux.mustHaves.map((m) => (
                <li key={m}>{m}</li>
              ))}
            </ul>
          </div>
        )}

        {crux.qualifications.length > 0 && (
          <div>
            <h3 className="mb-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Qualifications
            </h3>
            <ul className="list-inside list-disc space-y-0.5 text-sm">
              {crux.qualifications.map((q) => (
                <li key={q}>{q}</li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
