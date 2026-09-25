// components/SlotAllocationCard.tsx
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Users2, Building2, Code2 } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { ErrorHandler } from "@/components/error/ErrorHandler";

interface Partner {
  nickname: ReactNode;
  partnerId: number;
  partnerName: string;
  partnerCode: string;
  contributions: number;
}

export function SlotAllocationCard({data}: {data?: Partner[]}) {
  if (!data || data.length === 0) {
    return (
      <Card className="h-[40vh] sm:h-[35vh] md:h-[30vh] lg:h-[35vh] xl:h-[40vh] p-2 flex flex-col">
        <div className="flex items-center justify-between px-4 py-2 border-b dark:border-gray-700 flex-shrink-0">
          <h4 className="font-semibold text-[#01a982]">Partner Allocation</h4>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <ErrorHandler isEmpty={true} emptyMessage="There is not partner allocated"/>
        </div>
      </Card>
    );
  }

  return (
    <Card className="bg-white h-[40vh] sm:h-[35vh] md:h-[30vh] lg:h-[35vh] xl:h-[40vh] dark:bg-gray-800 my-4 flex flex-col">
      <div className="flex items-center justify-between px-4 py-2 border-b dark:border-gray-700 flex-shrink-0">
        <h4 className="font-semibold text-[#01a982]">Partner Allocation</h4>
        <Badge variant="outline" className="text-xs">
          {data.length} {data.length === 1 ? 'Partner' : 'Partners'}
        </Badge>
      </div>
     
      <div className="flex-1 overflow-hidden">
        <ScrollArea className="h-full">
          <div className="p-3 space-y-2">
            {data?.map((partner) => {
              return (
                <div
                  key={partner.partnerCode}
                  className="bg-gray-50 shadow-sm border border-gray-100 dark:bg-gray-700 flex flex-col rounded-lg overflow-hidden hover:shadow-md transition-shadow"
                >
                  <div className="bg-[#01a982]/5 p-3">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1.5 flex-1">
                        <div className="flex items-center gap-2">
                          <Building2 className="w-4 h-4 text-[#01a982] flex-shrink-0" />
                          <h3 className="font-medium text-gray-900 dark:text-[#00cc99] truncate">
                            {partner.nickname}
                          </h3>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-300">
                          <Users2 className="w-4 h-4 text-[#01a982] flex-shrink-0" />
                          <span>{partner.contributions} Submissions</span>
                        </div>
                      </div>
                      
                      {/* Optional: Add partner code badge */}
                      <Badge variant="secondary" className="text-xs ml-2 flex-shrink-0">
                        {partner.partnerCode}
                      </Badge>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </div>
    </Card>
  );
}
