"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Users,
  CalendarRange,
  ClipboardCheck,
  CheckCircle2,
  Clock,
  Calendar,
} from "lucide-react";
import ScreeningPagination from "@/components/slot-management/ScreeningPagination";
import CompletedPagination from "@/components/slot-management/CompletedPagination";
import FeebackPendingPagination from "@/components/slot-management/FeedbackPendingPagination";
import InterviewListPagination from "@/components/slot-management/InterviewListPagination";
import { Breadcrumbs } from "@/components/common/Breadcrumbs";
import { isDomainManager, isHiringManager, isPanel, isShowslotAllocation, useUserStore } from "@/store/userStore";
import { FilterTypeEnum, SlotAllocationType } from "@/constants/FilterTypeEnum";
import PanelScheduled from "@/components/slot-management/PanelScheduled";
const DEFAULT_SECTION = "evaluation";
const DEFAULT_EVALUATION_TAB = "screening";
const DEFAULT_SLOT_ALLOCATION_TAB = "assignslot";
export default function Home() {
  const { roles } = useUserStore();

  // const isPanel = roles.some((role) => role.name === "PANEL");

  const router = useRouter();
  const params = useSearchParams();
  const [activeMainTab, setActiveMainTab] = useState(
    params.get("section") ?? DEFAULT_SECTION
  );
  const [evaluationTab, setEvaluationTab] = useState(
    DEFAULT_EVALUATION_TAB
  );
  const [slotAllocationTab, setSlotAllocationTab] = useState(
    DEFAULT_SLOT_ALLOCATION_TAB
  );

  useEffect(() => {
    if (!params.get("section") && !params.get("tab")) {
      router.replace(
        `?section=${DEFAULT_SECTION}&tab=${DEFAULT_EVALUATION_TAB}`
      );
    }
  }, []);
  const handleMainTabChange = (value: string) => {
    setActiveMainTab(value);
    if (value === "evaluation") {
      router.replace(
        `?section=${value}&tab=${evaluationTab || DEFAULT_EVALUATION_TAB}`
      );
    } else if(value === "slot-allocation") {
      router.replace(
        `?section=${value}&tab=${DEFAULT_SLOT_ALLOCATION_TAB
        }`
      );
    }
  };

  const handleEvaluationTabChange = (value: string) => {
    setEvaluationTab(value);
    router.replace(`?section=evaluation&tab=${value}`);
  };

  const handleSlotAllocationTabChange = (value: string) => {
    setSlotAllocationTab(value);
    router.replace(`?section=slot-allocation&tab=${value}`);
  };

  return (
    <div className="py-5 px-4 sm:px-6">
      {/* <Breadcrumbs /> */}
      <Card>
        <CardContent className="pt-6">
          <Tabs value={activeMainTab} onValueChange={handleMainTabChange}>
            {isShowslotAllocation && (
              <TabsList className="w-full h-12 bg-[#DFE6E5]  dark:bg-gray-800 mb-6">
                <>
                  <TabsTrigger value="evaluation" className="flex-1 gap-2">
                    <Users className="h-4 w-4" />
                    Evaluation
                  </TabsTrigger>

                  <TabsTrigger value="slot-allocation" className="flex-1 gap-2">
                    <CalendarRange className="h-4 w-4" />
                    Slot Allocation
                  </TabsTrigger>
                </>
              </TabsList>
            )}
            <TabsContent value="evaluation">
              <Tabs
                value={evaluationTab}
                onValueChange={handleEvaluationTabChange}
              >
                <ScrollArea className="w-full whitespace-nowrap">
                  <TabsList className="w-full h-12 bg-[#DFE6E5]  dark:bg-gray-800">
                    <TabsTrigger value="screening" className="flex-1 gap-2">
                      <Users className="h-4 w-4" />
                      Screening/Assessment
                    </TabsTrigger>
                    <TabsTrigger
                      value="feedback-pending"
                      className="flex-1 gap-2"
                    >
                      <ClipboardCheck className="h-4 w-4" />
                      Feedback Pending
                    </TabsTrigger>
                    {(isPanel || isHiringManager || isDomainManager)  && (
                      <TabsTrigger
                        value="panelsheduled"
                        className="flex-1 gap-2"
                      >
                        <CheckCircle2 className="h-4 w-4" />
                        Interview Scheduled
                      </TabsTrigger>
                    )}
                    {!isPanel && (
                      <TabsTrigger value="completed" className="flex-1 gap-2">
                        <CheckCircle2 className="h-4 w-4" />
                        Completed
                      </TabsTrigger>
                    )}
                  </TabsList>
                  <ScrollBar orientation="horizontal" className="invisible" />
                </ScrollArea>

                <TabsContent value="screening">
                  <ScreeningPagination />
                </TabsContent>
                <TabsContent value="feedback-pending">
                  <FeebackPendingPagination />
                </TabsContent>
                {(!isPanel ) && (
                  <TabsContent value="completed">
                    <CompletedPagination />
                  </TabsContent>
                )}

                {(isPanel || isHiringManager || isDomainManager)   && (
                  <TabsContent value="panelsheduled">
                    <PanelScheduled />
                  </TabsContent>
                )}
              </Tabs>
            </TabsContent>

            {/* Slot Allocation section */}
            {!isPanel && (
              <TabsContent value="slot-allocation">
                <Tabs
                  value={slotAllocationTab}
                  onValueChange={handleSlotAllocationTabChange}
                >
                  <ScrollArea className="w-full whitespace-nowrap">
                    <TabsList className="w-full h-12 bg-[#DFE6E5]  dark:bg-gray-800">
                      <TabsTrigger value="assignslot" className="flex-1 gap-2">
                        <Clock className="h-4 w-4" />
                        Assign Slots
                      </TabsTrigger>
                      <TabsTrigger value="pending" className="flex-1 gap-2">
                        <CalendarRange className="h-4 w-4" />
                        Pending
                      </TabsTrigger>
                      <TabsTrigger value="declined" className="flex-1 gap-2">
                        <Calendar className="h-4 w-4" />
                        Declined
                      </TabsTrigger>
                      <TabsTrigger value="scheduled" className="flex-1 gap-2">
                        <Calendar className="h-4 w-4" />
                        Interview Scheduled
                      </TabsTrigger>
                    </TabsList>
                    <ScrollBar orientation="horizontal" className="invisible" />
                  </ScrollArea>

                  <TabsContent value="assignslot">
                    <InterviewListPagination
                      filterType={FilterTypeEnum.SlotAllocation_AssignSlots}
                      slotStatusTypeId={SlotAllocationType.assignslot}
                    />
                  </TabsContent>
                  <TabsContent value="pending">
                    <InterviewListPagination
                      filterType={FilterTypeEnum.SlotAllocation_Pending}
                      slotStatusTypeId={SlotAllocationType.pending}
                    />
                  </TabsContent>
                  <TabsContent value="declined">
                    <InterviewListPagination
                      filterType={FilterTypeEnum.SlotAllocation_Declined}
                      slotStatusTypeId={SlotAllocationType.declined}
                    />
                  </TabsContent>
                  <TabsContent value="scheduled">
                    <InterviewListPagination
                      filterType={FilterTypeEnum.SlotAllocation_Scheduled}
                      slotStatusTypeId={SlotAllocationType.scheduled}
                    />
                  </TabsContent>
                </Tabs>
              </TabsContent>
            )}
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
