import type { MatchResult } from '@gigcruite/types';
import { CheckCircle2, AlertTriangle, XCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

function scoreColor(score: number) {
  if (score >= 75) return 'text-green-600';
  if (score >= 50) return 'text-yellow-600';
  return 'text-red-600';
}

function ScoreIcon({ score }: { score: number }) {
  if (score >= 75) return <CheckCircle2 className="h-5 w-5 text-green-600" />;
  if (score >= 50) return <AlertTriangle className="h-5 w-5 text-yellow-600" />;
  return <XCircle className="h-5 w-5 text-red-600" />;
}

export function MatchScoreCard({ result }: { result: MatchResult }) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">AI Match Score</CardTitle>
          <div className="flex items-center gap-2">
            <ScoreIcon score={result.score} />
            <span className={`text-2xl font-bold ${scoreColor(result.score)}`}>
              {result.score}
            </span>
            <span className="text-sm text-muted-foreground">/ 100</span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-3">
          {(['skills', 'experience', 'qualifications'] as const).map((key) => (
            <div key={key} className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="capitalize text-muted-foreground">{key}</span>
                <span className="font-medium">{result.breakdown[key]}%</span>
              </div>
              <div className="h-1.5 w-full rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary transition-all"
                  style={{ width: `${result.breakdown[key]}%` }}
                />
              </div>
            </div>
          ))}
        </div>

        <p className="text-sm leading-relaxed">{result.explanation}</p>

        {result.missingSkills.length > 0 && (
          <div>
            <h4 className="mb-1 text-xs font-medium text-muted-foreground">Missing Skills</h4>
            <div className="flex flex-wrap gap-1">
              {result.missingSkills.map((s) => (
                <Badge key={s} variant="destructive" className="text-xs">{s}</Badge>
              ))}
            </div>
          </div>
        )}

        {result.missingQualifications.length > 0 && (
          <div>
            <h4 className="mb-1 text-xs font-medium text-muted-foreground">Missing Qualifications</h4>
            <div className="flex flex-wrap gap-1">
              {result.missingQualifications.map((q) => (
                <Badge key={q} variant="outline" className="text-xs">{q}</Badge>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
