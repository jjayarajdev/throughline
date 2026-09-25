import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Building } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import InfoBlock from "./InfoBlock";
import { useQuery } from "@tanstack/react-query";
import { MasterTypes } from "@/constants/masterTypes";
import { onboarding } from "@/services/api/onboarding.api";

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
  subDomainName?:string;
  resourceTypeName?:string
  nameAsPerAadhar?:string
  candidateName?:string
}

export default function OnboardingViewProfile({ candidateData }: { candidateData: CandidateData }) {
  const { data: categoryOptions = [] } = useQuery({
    queryKey: ["getEmployeeCategoryData", MasterTypes.EMPLOYEE_CATEGORY_TYPE],
    queryFn: () => onboarding.getEmployeeCategory(MasterTypes.EMPLOYEE_CATEGORY_TYPE).then(res => res.data),
    retry: 1,
  });

  const { data: employeeStatusOptions = [] } = useQuery({
    queryKey: ["getEmployeeStatusData", MasterTypes.EMPLOYEE_STATUS],
    queryFn: () => onboarding.getEmployeeCategory(MasterTypes.EMPLOYEE_STATUS).then(res => res.data),
    retry: 1,
  });

  const categoryName = getLabelById(categoryOptions, candidateData?.categoryId);
  // const employeeStatus = getLabelById(employeeStatusOptions, candidateData?.employeeStatusId);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Building className="h-5 w-5 mr-2" />
          Candidate Onboarding
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <InfoBlock label="Candidate Code" value={candidateData?.candidateName || "N/A"} />
          <InfoBlock label="Aadhar Last 4 Digits" value={candidateData?.aadharLast4Digits || "N/A"} />
          <InfoBlock label="Resource Category" value={candidateData?.resourceTypeName} />
          <InfoBlock label="Date Of Birth" value={candidateData?.dob} />
          <InfoBlock label="Name As Per Aadhar" value={candidateData?.nameAsPerAadhar} />
          <InfoBlock label="Final Onboarding Date" value={formatDate(candidateData?.finalOnboaridngDate)} />
          <InfoBlock label="Date of Joining" value={formatDate(candidateData?.dateOfJoining)} />
          {/* <InfoBlock label="HRQ ID" value={candidateData?.hrqId || "N/A"} /> */}
          <InfoBlock label="Hiring Manager" value={candidateData?.hiringManagerName || "N/A"} />
          <InfoBlock label="Role Hired For" value={candidateData?.roleHiredFor || "N/A"} />
          <InfoBlock label="Domain" value={candidateData?.domainName || "N/A"} />
          <InfoBlock label="Sub Domain" value={candidateData?.subDomainName || "N/A"} />
          <InfoBlock label="Current Address" value={candidateData?.currentAddress || "N/A"} />
          <InfoBlock label="Job Location" value={candidateData?.jobLocation || "N/A"} />
          <InfoBlock label="City" value={candidateData?.cityName || "N/A"} />
          <InfoBlock label="State" value={candidateData?.stateName || "N/A"} />
          <InfoBlock label="Country" value={candidateData?.countryName || "N/A"} />
          <InfoBlock label="Gender" value={candidateData?.genderName || "N/A"} />
          <InfoBlock label="Email" value={candidateData?.personalMailId || "N/A"} />
          <InfoBlock label="Phone" value={candidateData?.phone || "N/A"} />
          <InfoBlock label="Transport Requirement" value={candidateData?.transportRequirementName || "N/A"} />
          {/* <div>
            <p className="text-sm font-medium text-muted-foreground">Employee Status</p>
            <Badge className={cn("mt-1")}>{employeeStatus}</Badge>
          </div> */}
        </div>
      </CardContent>
    </Card>
  );
}

function getLabelById(list: { id: number; name: string }[], id?: number): string {
  if (!id) return "N/A";
  const item = list.find(option => option.id === Number(id));
  return item?.name || "N/A";
}

function formatDate(dateStr?: string): string {
  if (!dateStr) return "N/A";
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-IN", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}
