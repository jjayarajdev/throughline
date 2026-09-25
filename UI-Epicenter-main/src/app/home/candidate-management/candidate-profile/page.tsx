"use client";
import { Flex, Typography } from "antd";
import CandidateHistoryView from "@/components/candidate/CandidateHistoryView";
import { CandidateBreadcrumb } from "@/components/candidate/CandidateBreadcrumb";

export default function CandidateProfilePage() {
  return (
    <Flex vertical gap={16} className="p-4">
      <CandidateBreadcrumb />
      <Typography.Title level={4} style={{ margin: 0 }}>
        Candidate Profile
      </Typography.Title>
      <CandidateHistoryView />
    </Flex>
  );
}
