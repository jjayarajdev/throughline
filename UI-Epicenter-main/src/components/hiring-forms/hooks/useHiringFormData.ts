// hooks/useHiringDropdownData.ts
import { useQuery } from "@tanstack/react-query";
import { dropdownApi } from "../../../services/api/master";
import { MasterTypes } from "@/constants/masterTypes";

export const useHiringDropdownData = () => {
  const businessQuery = useQuery({
    queryKey: ["business"],
    queryFn: () => dropdownApi.fetchDropdown(MasterTypes.BUSINESS_UNIT),
  });

  const hiringTypeQuery = useQuery({
    queryKey: ["hiringType"],
    queryFn: () => dropdownApi.fetchDropdown(MasterTypes.HIRING_TYPE),
  });

  const hiringStatusQuery = useQuery({
    queryKey: ["partnerStatus"],
    queryFn: () => dropdownApi.fetchDropdown(MasterTypes.HIRING_STATUS),
  });
  const interviewRoundQuery = useQuery({
    queryKey: ["interviewRounds"],
    queryFn: () => dropdownApi.fetchDropdown(MasterTypes.INTERVIEW_ROUND),
  });

  const domainQuery = useQuery({
    queryKey: ["domain"],
    queryFn: () => dropdownApi.fetchDropdown(MasterTypes.DOMAIN),
  });


  return {
    business: businessQuery.data || [],
    hiringType: hiringTypeQuery.data || [],
    hiringStatus: hiringStatusQuery.data || [],
    interviewRounds: interviewRoundQuery.data || [],
    domain: domainQuery.data || [],
    isLoading: businessQuery.isLoading || hiringTypeQuery.isLoading || hiringStatusQuery.isLoading || interviewRoundQuery.isLoading || domainQuery.isLoading ,
    error: businessQuery.error || hiringTypeQuery.error || hiringStatusQuery.error || interviewRoundQuery.error || domainQuery.error 
}}