"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Clock, Calendar } from "lucide-react";

import PartnerSlotPagination from "@/components/slot-management/PartnerslotPagination";
import UnAllooatedCandidate from "@/components/slot-management/UnAllocatedPagination";
import { isPartner } from "@/store/userStore";
import ScreeningPagination from "@/components/slot-management/ScreeningPagination";
import FeebackPendingPagination from "@/components/slot-management/FeedbackPendingPagination";



export default function page() {
  const DEFAULT_TAB = isPartner?  "screening_assessment" : "assignslot";
  const router = useRouter();
  const params = useSearchParams();
  const [tab, setTab] = useState(params.get("tab") ?? DEFAULT_TAB);

  // Update state when the URL param changes
  useEffect(() => {
    const urlTab = params.get("tab");
    if (urlTab && urlTab !== tab) {
      setTab(urlTab);
    }
  }, [params]);

  // When tab changes, update the URL
  const handleTabChange = (value: string) => {
    setTab(value);
    router.replace(`?tab=${value}`);
  };

  return (
    <div className="py-5 px-4 sm:px-6">
      <h1 className="text-2xl pb-4">Slot Allocation</h1>
      <Card>
        <CardContent className="pt-6">
          <Tabs value={tab} onValueChange={handleTabChange} >
            <ScrollArea className="w-full whitespace-nowrap">
              <TabsList className="w-full h-12 mb-4 ">
            
             
                {isPartner && (

                  <>
                     <TabsTrigger value="screening_assessment" className="flex-1 gap-2">
                  <Clock className="h-4 w-4" />
                  Screening/Assessment
                </TabsTrigger>
                  
                  <TabsTrigger value="awaitingslot" className="flex-1 gap-2">
                    <Clock className="h-4 w-4" />
                    Awaiting Slots
                  </TabsTrigger>
                        <TabsTrigger value="feedback_pending" className="flex-1 gap-2">
                  <Clock className="h-4 w-4" />
                  Feedback Pending
                </TabsTrigger>
                  </>
                )}
                  <TabsTrigger value="assignslot" className="flex-1 gap-2">
                  <Clock className="h-4 w-4" />
                  Accept Slots
                </TabsTrigger>
            
                <TabsTrigger value="scheduled" className="flex-1 gap-2">
                  <Calendar className="h-4 w-4" />
                  Scheduled Interviews
                </TabsTrigger>
              </TabsList>
              <ScrollBar orientation="horizontal" className="invisible" />
            </ScrollArea>

            <TabsContent value="screening_assessment">
              <ScreeningPagination />
            </TabsContent>
            <TabsContent value="assignslot">
              <PartnerSlotPagination slotStatusTypeId={1} />
            </TabsContent>
            <TabsContent value="scheduled">
              <PartnerSlotPagination slotStatusTypeId={2} />
            </TabsContent>
            <TabsContent value="feedback_pending">
              <FeebackPendingPagination />
            </TabsContent>
            <TabsContent value="awaitingslot">
              <UnAllooatedCandidate />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
