"use client";
import { Card, Descriptions } from "antd";
import { BankOutlined } from "@ant-design/icons";

interface CandidateData {
  id?: number;
  candidateCode?: string;
  aadharLast4Digits?: string;
  categoryId?: number;
  cityName?: string;
  stateName?: string;
  countryName?: string;
  currentAddress?: string;
  dob?: string;
  dateOfJoining?: string;
  finalOnboaridngDate?: string;
  genderName?: string;
  domainName?: string;
  hiringManagerName?: string;
  hrqId?: string;
  roleHiredFor?: string;
  jobLocation?: string;
  personalMailId?: string;
  phone?: string;
  transportRequirementName?: string;
  employeeStatusId?: number;
  subDomainName?: string;
  resourceTypeName?: string;
  nameAsPerAadhar?: string;
  candidateName?: string;
}

export default function OnboardingViewProfile({ candidateData }: { candidateData: CandidateData }) {
  const items = [
    { key: "candidateName", label: "Candidate Code", children: candidateData?.candidateName || "N/A" },
    { key: "aadhar", label: "Aadhar Last 4 Digits", children: candidateData?.aadharLast4Digits || "N/A" },
    { key: "resourceType", label: "Resource Category", children: candidateData?.resourceTypeName || "N/A" },
    { key: "dob", label: "Date Of Birth", children: candidateData?.dob || "N/A" },
    { key: "nameAsPerAadhar", label: "Name As Per Aadhar", children: candidateData?.nameAsPerAadhar || "N/A" },
    { key: "finalOnboarding", label: "Final Onboarding Date", children: formatDate(candidateData?.finalOnboaridngDate) },
    { key: "doj", label: "Date of Joining", children: formatDate(candidateData?.dateOfJoining) },
    { key: "hiringManager", label: "Hiring Manager", children: candidateData?.hiringManagerName || "N/A" },
    { key: "role", label: "Role Hired For", children: candidateData?.roleHiredFor || "N/A" },
    { key: "domain", label: "Domain", children: candidateData?.domainName || "N/A" },
    { key: "subDomain", label: "Sub Domain", children: candidateData?.subDomainName || "N/A" },
    { key: "address", label: "Current Address", children: candidateData?.currentAddress || "N/A" },
    { key: "jobLocation", label: "Job Location", children: candidateData?.jobLocation || "N/A" },
    { key: "city", label: "City", children: candidateData?.cityName || "N/A" },
    { key: "state", label: "State", children: candidateData?.stateName || "N/A" },
    { key: "country", label: "Country", children: candidateData?.countryName || "N/A" },
    { key: "gender", label: "Gender", children: candidateData?.genderName || "N/A" },
    { key: "email", label: "Email", children: candidateData?.personalMailId || "N/A" },
    { key: "phone", label: "Phone", children: candidateData?.phone || "N/A" },
    { key: "transport", label: "Transport Requirement", children: candidateData?.transportRequirementName || "N/A" },
  ];

  return (
    <Card
      title={
        <span className="inline-flex items-center gap-2">
          <BankOutlined /> Candidate Onboarding
        </span>
      }
    >
      <Descriptions bordered size="small" column={{ xs: 1, md: 2, lg: 3 }} items={items} />
    </Card>
  );
}

function formatDate(dateStr?: string): string {
  if (!dateStr) return "N/A";
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-IN", { year: "numeric", month: "short", day: "numeric" });
}
