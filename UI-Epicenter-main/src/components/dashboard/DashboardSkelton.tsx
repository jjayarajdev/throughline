import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";


export default function DashboardSkeleton() {
  return (
    <div className="p-6 space-y-6">
      {/* Header Row */}
      <div className="flex flex-wrap gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="w-full sm:w-[240px] flex-1">
            <CardContent className="p-4 space-y-2">
              <Skeleton className="h-4 w-1/3" />
              <Skeleton className="h-6 w-1/4" />
              <Skeleton className="h-4 w-1/2" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Chart Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="col-span-1 md:col-span-1">
          <CardContent className="p-4">
            <Skeleton className="h-4 w-1/3 mb-4" />
            <Skeleton className="h-32 w-full" />
          </CardContent>
        </Card>
        <Card className="col-span-1 md:col-span-1">
          <CardContent className="p-4">
            <Skeleton className="h-4 w-1/3 mb-4" />
            <Skeleton className="h-32 w-full" />
          </CardContent>
        </Card>
        <Card className="col-span-1 md:col-span-1">
          <CardContent className="p-4">
            <Skeleton className="h-4 w-1/3 mb-4" />
            <Skeleton className="h-32 w-full" />
          </CardContent>
        </Card>
      </div>

      {/* Candidate Stage Overview */}
      <Card>
        <CardContent className="p-4 space-y-2">
          <Skeleton className="h-4 w-1/3" />
          <div className="flex gap-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-8 w-24 rounded-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
