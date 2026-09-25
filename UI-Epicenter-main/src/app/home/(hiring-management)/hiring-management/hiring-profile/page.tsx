"use client";
import { useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Card, Col, Empty, Flex, Result, Row, Spin, Tabs } from "antd";
import { HiringDetailsTable } from "@/components/hiring-forms/HiringDetailsTable";
import { SelectedTalentsTable } from "@/components/hiring-forms/profile/SelectedTalentsTable";
import { SlotAllocationCard } from "@/components/hiring-forms/profile/SlotAllocationCard";
import { UpcomingInterviewsCard } from "@/components/hiring-forms/profile/UpcomingInterviewsCard";
import { errorMessage, PathBreadcrumb } from "@/components/hiring-forms/shared";
import { hiringApi } from "@/services/api/hiring.api";

/** Hiring request profile: details, candidate buckets, upcoming interviews and partner allocation. */
export default function HiringProfilePage() {
  const searchParams = useSearchParams();
  const hiring = searchParams.get("id");
  const { data: hiringProfile, isLoading, error } = useQuery({
    queryKey: ["hiringProfile", hiring],
    queryFn: () => hiringApi.getHiringProfile(String(hiring)),
    enabled: !!hiring,
  });

  if (error) return <Result status="error" title="Could not load hiring profile" subTitle={errorMessage(error)} />;
  if (isLoading) return <Spin fullscreen />;
  if (!hiringProfile) return <Empty description="No hiring profile found" className="p-4" />;

  const talentTab = (talents: any[], actionVisible: boolean) => (
    <SelectedTalentsTable actionVisible={actionVisible} talents={talents} onToggleAll={(checked) => console.log("all toggled:", checked)} onToggleOne={(id, checked) => console.log(id, "toggled:", checked)} />
  );

  return (
    <Flex vertical gap={16} className="p-4">
      <PathBreadcrumb />
      <Row gutter={[16, 16]}>
        <Col xs={24} xl={18}>
          <Flex vertical gap={16}>
            <Card>
              <HiringDetailsTable data={hiringProfile?.hiringDetails} />
            </Card>
            <Tabs
              defaultActiveKey="talentBench"
              items={[
                { key: "talentBench", label: `Talent Pool ( ${hiringProfile?.talentBench?.length ?? 0} )`, children: talentTab(hiringProfile?.talentBench, false) },
                { key: "pipeline", label: `Talent Pipeline ( ${hiringProfile?.talentPipeline?.length ?? 0} )`, children: talentTab(hiringProfile?.talentPipeline, false) },
                { key: "selected", label: `Identified Talents ( ${hiringProfile?.selectedTalents?.length ?? 0} )`, children: talentTab(hiringProfile?.selectedTalents, true) },
                { key: "rejected", label: `Rejected Talents ( ${hiringProfile?.rejectedCandidates?.length ?? 0} )`, children: talentTab(hiringProfile?.rejectedCandidates, false) },
              ]}
            />
          </Flex>
        </Col>
        <Col xs={24} xl={6}>
          <Flex vertical gap={16}>
            <UpcomingInterviewsCard interviews={hiringProfile?.upcomingInterviews} onSeeAll={() => {}} />
            <SlotAllocationCard data={hiringProfile.partnerContributions} />
          </Flex>
        </Col>
      </Row>
    </Flex>
  );
}
