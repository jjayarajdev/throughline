// components/HiringDetailsSkeleton.tsx
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";

export function HiringDetailsSkeleton() {
  return (
    <div className="space-y-8 p-8">
      {/* Header Skeleton */}
      <Card className="bg-white dark:bg-gray-800">
        <CardContent className="space-y-4">
          {/* Title */}
          <Skeleton className="h-6 w-48" />

          <Separator />

          {/* Grid of fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {Array(8)
              .fill(0)
              .map((_, i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-5 w-32" />
                </div>
              ))}
          </div>
        </CardContent>
      </Card>

      {/* Tabs Skeleton */}
      <div className="flex space-x-2">
        {Array(3)
          .fill(0)
          .map((_, i) => (
            <Skeleton key={i} className="h-10 w-32 rounded-full" />
          ))}
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Table Skeleton */}
        <div className="lg:col-span-2 space-y-4">
          <Skeleton className="h-10 w-full" /> {/* header */}
          {Array(5)
            .fill(0)
            .map((_, row) => (
              <Skeleton key={row} className="h-10 w-full" />
            ))}
        </div>

        {/* Right: Cards Skeleton */}
        <div className="space-y-6">
          {Array(2)
            .fill(0)
            .map((_, i) => (
              <Card key={i} className="bg-white dark:bg-gray-800">
                <div className="flex items-center justify-between p-4 border-b dark:border-gray-700">
                  <Skeleton className="h-5 w-1/2" />
                  <Skeleton className="h-4 w-16" />
                </div>
                <CardContent className="space-y-4 p-4">
                  {Array(3)
                    .fill(0)
                    .map((_, item) => (
                      <div key={item} className="flex items-center space-x-4">
                        <Skeleton className="h-10 w-10 rounded-full" />
                        <div className="flex-1 space-y-2">
                          <Skeleton className="h-4 w-32" />
                          <Skeleton className="h-3 w-48" />
                          <Skeleton className="h-3 w-40" />
                        </div>
                      </div>
                    ))}
                </CardContent>
              </Card>
            ))}
        </div>
      </div>
    </div>
  );
}
