"use client";
import { useSearchParams } from "next/navigation";
import { Flex, Result } from "antd";
import { CandidateHiringRequests } from "@/components/candidate/Hiring-Table";
import { PathBreadcrumb } from "@/components/hiring-forms/shared";
import { FilterTypeEnum } from "@/constants/FilterTypeEnum";

export default function PartnerHiringRequestsPage() {
  const searchParams = useSearchParams();
  const id = searchParams.get("id");

  if (!id) return <Result status="warning" title="Invalid or missing ID" />;

  return (
    <Flex vertical gap={16} className="p-4">
      <PathBreadcrumb />
      <CandidateHiringRequests filterType={FilterTypeEnum.All_HRQID} id={id} />
    </Flex>
  );
}
