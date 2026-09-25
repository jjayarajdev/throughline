"use client";
import { Card, Descriptions, Tag } from "antd";
import { FileDoneOutlined } from "@ant-design/icons";

interface CandidateProfileData {
  profileCreatedOn?: string;
  smartProfileId?: string;
  profileApprovalDate?: string;
  lhccCode?: string;
  costCenter?: string;
  employeeId?: number;
  employeeNameAsPerId?: string;
  hpeEmailId?: string;
  isEmployeeIdGenerated?: boolean;
  candidatePersonalDetailsId?: number;
  costCenterName?: string;
}

export default function ProfileTrackerViewProfile({ candidateData }: { candidateData: CandidateProfileData }) {
  const items = [
    { key: "employeeId", label: "Employee ID", children: candidateData?.employeeId?.toString() || "N/A" },
    { key: "employeeName", label: "Employee Name As Per ID", children: candidateData?.employeeNameAsPerId || "N/A" },
    { key: "hpeEmailId", label: "Company Email ID", children: candidateData?.hpeEmailId || "N/A" },
    { key: "smartProfileId", label: "Smart Profile ID", children: candidateData?.smartProfileId || "N/A" },
    { key: "lhcc", label: "LHCC (IN97/IN99)", children: candidateData?.lhccCode || "N/A" },
    { key: "costCenter", label: "Cost Center", children: candidateData?.costCenterName || "N/A" },
    { key: "createdOn", label: "Profile Created On", children: formatDate(candidateData?.profileCreatedOn) },
    { key: "approvalDate", label: "Profile Approval Date", children: formatDate(candidateData?.profileApprovalDate) },
    {
      key: "generated",
      label: "Employee ID Generated",
      children: <Tag color={candidateData?.isEmployeeIdGenerated ? "green" : "default"}>{candidateData?.isEmployeeIdGenerated ? "Yes" : "No"}</Tag>,
    },
  ];

  return (
    <Card
      title={
        <span className="inline-flex items-center gap-2">
          <FileDoneOutlined /> Profile Tracker
        </span>
      }
    >
      <Descriptions bordered size="small" column={{ xs: 1, md: 2, lg: 3 }} items={items} />
    </Card>
  );
}

function formatDate(dateStr?: string): string {
  if (!dateStr) return "-";
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-IN", { year: "numeric", month: "short", day: "numeric" });
}
