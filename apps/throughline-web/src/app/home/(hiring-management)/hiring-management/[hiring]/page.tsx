"use client";
import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Card, Flex, Tabs, Tag, Typography } from "antd";
import HiringForm from "@/components/hiring-forms/Hiring-forms";
import PartnerCategories from "@/components/hiring-forms/PartnerCategoriesForm";
import InterviewRoundsForm from "@/components/hiring-forms/InterviewRounds";
import SkillsCalibrationForm from "@/components/hiring-forms/Calibration";
import { PathBreadcrumb } from "@/components/hiring-forms/shared";
import { useHiringStore } from "@/store/useHiringStore";
import { hiringApi } from "@/services/api/hiring.api";

const JobDetailsForm = dynamic(() => import("@/components/hiring-forms/JobDetailsForm"), { ssr: false });

const TABS = ["hiring", "job_details", "partner_categories", "interview_rounds", "calibration"];

/** Create / edit a hiring request across its five steps (tabs). */
export default function HiringRequestPage() {
  const router = useRouter();
  const params = useSearchParams();
  const { hiring } = useParams();
  const { setHrqId, clearHiringStore } = useHiringStore();

  const initial = params.get("tab") ?? "hiring";
  const [activeTab, setActiveTab] = useState(initial);
  const [showTabs] = useState(hiring === "create-hiring");

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    router.replace(`?tab=${value}`);
  };

  const handlePrevious = () => {
    const currentIndex = TABS.indexOf(activeTab);
    if (currentIndex > 0) setActiveTab(TABS[currentIndex - 1]);
  };

  const handleNext = () => {
    const currentIndex = TABS.indexOf(activeTab);
    if (currentIndex < TABS.length - 1) setActiveTab(TABS[currentIndex + 1]);
  };

  const { data: HiringDatabyid, isLoading: isLoadingHiringbyid } = useQuery({
    queryKey: ["HiringDatabyid", hiring],
    queryFn: () => hiringApi.gethiringDetailByID(Number(hiring)),
    enabled: !showTabs,
  });

  useEffect(() => {
    if (HiringDatabyid) setHrqId(HiringDatabyid.hrqId);
    return () => {
      clearHiringStore();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [HiringDatabyid, hiring]);

  const hiringData = {
    hrqid: HiringDatabyid?.hrqId,
    jobDetail: HiringDatabyid?.jobTitle,
    skipScreening: HiringDatabyid?.skipScreening ?? false,
  };

  return (
    <Flex vertical gap={16} className="p-4">
      <PathBreadcrumb />
      <Typography.Title level={4} style={{ margin: 0 }}>
        {showTabs ? "Create Hiring Request" : "Hiring Request"}
      </Typography.Title>
      <Card>
        {HiringDatabyid?.parentHrqId && (
          <Tag className="mb-4">
            <Typography.Text strong>Parent HRQID:</Typography.Text> {HiringDatabyid.parentHrqId}
          </Tag>
        )}
        <Tabs
          activeKey={activeTab}
          onChange={handleTabChange}
          destroyOnHidden
          items={[
            { key: "hiring", label: "Hiring", children: <HiringForm HiringDatabyid={HiringDatabyid} isLoading={isLoadingHiringbyid} onNext={handleNext} onPrevious={handlePrevious} /> },
            { key: "job_details", label: "Job Details", disabled: showTabs, children: <JobDetailsForm domainId={HiringDatabyid?.domainId} onNext={handleNext} onPrevious={handlePrevious} /> },
            { key: "partner_categories", label: "Partner Categories", disabled: showTabs, children: <PartnerCategories onNext={handleNext} onPrevious={handlePrevious} /> },
            { key: "interview_rounds", label: "Interview Rounds", disabled: showTabs, children: <InterviewRoundsForm hiringData={hiringData} onNext={handleNext} onPrevious={handlePrevious} /> },
            { key: "calibration", label: "Calibration", disabled: showTabs, children: <SkillsCalibrationForm hiringData={hiringData} onNext={handleNext} onPrevious={handlePrevious} /> },
          ]}
        />
      </Card>
    </Flex>
  );
}
