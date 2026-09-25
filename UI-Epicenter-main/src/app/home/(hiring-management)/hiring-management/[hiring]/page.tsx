"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { useEffect, useState } from "react";
import HiringForm from "@/components/hiring-forms/Hiring-forms";
import PartnerCategories from "@/components/hiring-forms/PartnerCategoriesForm";
import InterviewRoundsForm from "@/components/hiring-forms/InterviewRounds";
import SkillsCalibrationForm from "@/components/hiring-forms/Calibration";
import { useHiringStore } from "@/store/useHiringStore";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { hiringApi } from "@/services/api/hiring.api";
import dynamic from "next/dynamic";
import { Breadcrumbs } from "@/components/common/Breadcrumbs";

const JobDetailsForm = dynamic(
  () => import("@/components/hiring-forms/JobDetailsForm"),
  {
    ssr: false,
  }
);
export default function Home() {
  const router = useRouter();
  const params = useSearchParams();

  const initial = params.get("tab") ?? "hiring";
  const [activeTab, setActiveTab] = useState(initial);

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    router.replace(`?tab=${value}`);
  };

  const handlePrevious = () => {
    const tabs = [
      "hiring",
      "job_details",
      "partner_categories",
      "interview_rounds",
      "calibration",
    ];
    const currentIndex = tabs.indexOf(activeTab);
    if (currentIndex > 0) {
      setActiveTab(tabs[currentIndex - 1]);
    }
  };

  const handleNext = () => {
    const tabs = [
      "hiring",
      "job_details",
      "partner_categories",
      "interview_rounds",
      "calibration",
    ];

    const currentIndex = tabs.indexOf(activeTab);
    if (currentIndex < tabs.length - 1) {
      setActiveTab(tabs[currentIndex + 1]);
    }
  };

  const { setHrqId, clearHiringStore } = useHiringStore();

  const { hiring } = useParams();
  const [showTabs, setTabs] = useState(
    hiring === "create-hiring" ? true : false
  );

  const {
    data: HiringDatabyid,
    isLoading: isLoadingHiringbyid,
    isError,
  } = useQuery({
    queryKey: ["HiringDatabyid", hiring],
    queryFn: () => hiringApi.gethiringDetailByID(Number(hiring)),
    enabled: !!!showTabs,
  });

  useEffect(() => {
    if (!!HiringDatabyid) {
      setHrqId(HiringDatabyid.hrqId);
    }
    return () => {
      clearHiringStore();
    };
  }, [HiringDatabyid, hiring]);

  const hiringData = {
    hrqid: HiringDatabyid?.hrqId,
    jobDetail: HiringDatabyid?.jobTitle,
    skipScreening: HiringDatabyid?.skipScreening ?? false,
  };
 

  return (
    <div className=" p-6 space-y-6">
      <Breadcrumbs />
      <Card>
        {HiringDatabyid?.parentHrqId && (
          <div className="flex items-center w-48 gap-2 rounded-lg bg-muted p-3 text-sm text-muted-foreground">
            <span className="font-semibold text-primary">Parent HRQID:</span>
            <span>{HiringDatabyid.parentHrqId}</span>
          </div>
        )}

        <CardContent className="pt-6">
          <Tabs
            value={activeTab}
            onValueChange={handleTabChange}
            className="w-full"
          >
            <ScrollArea className="w-full whitespace-nowrap">
              <TabsList className="w-full h-12 bg-[#DFE6E5] dark:border-white/[0.05] dark:bg-white/[0.03]">
                <TabsTrigger value="hiring" className="flex-1">
                  Hiring
                </TabsTrigger>
                <TabsTrigger
                  disabled={showTabs}
                  value="job_details"
                  className="flex-1"
                >
                  Job Details
                </TabsTrigger>
                <TabsTrigger
                  disabled={showTabs}
                  value="partner_categories"
                  className="flex-1"
                >
                  Partner Categories
                </TabsTrigger>
                <TabsTrigger
                  disabled={showTabs}
                  value="interview_rounds"
                  className="flex-1"
                >
                  Interview Rounds
                </TabsTrigger>
                <TabsTrigger
                  disabled={showTabs}
                  value="calibration"
                  className="flex-1"
                >
                  Calibration
                </TabsTrigger>
              </TabsList>
              <ScrollBar orientation="horizontal" className="invisible" />
            </ScrollArea>
            <TabsContent value="hiring">
              <HiringForm
                HiringDatabyid={HiringDatabyid}
                isLoading={isLoadingHiringbyid}
                onNext={handleNext}
                onPrevious={handlePrevious}
              />
            </TabsContent>
            <TabsContent value="job_details">
              {/* <CopyJobdetailsForm  onNext={handleNext} onPrevious={handlePrevious}/> */}
              <JobDetailsForm
                domainId={HiringDatabyid?.domainId}
                onNext={handleNext}
                onPrevious={handlePrevious}
              />
            </TabsContent>
            <TabsContent value="partner_categories">
              <PartnerCategories
                onNext={handleNext}
                onPrevious={handlePrevious}
              />
            </TabsContent>
            <TabsContent value="interview_rounds">
              <InterviewRoundsForm
                hiringData={hiringData}
                onNext={handleNext}
                onPrevious={handlePrevious}
              />
            </TabsContent>
            <TabsContent value="calibration">
              <SkillsCalibrationForm
                hiringData={hiringData}
                onNext={handleNext}
                onPrevious={handlePrevious}
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
