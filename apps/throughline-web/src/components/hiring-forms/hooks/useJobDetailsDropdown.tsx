import { useQuery } from "@tanstack/react-query";
import { dropdownApi } from "../../../services/api/master";
import { MasterTypes } from "@/constants/masterTypes";

export const useJobDetailsDropdown = () => {
  const hiringActivityQuery = useQuery({
    queryKey: ["hiringActivity"],
    queryFn: () => dropdownApi.fetchDropdown(MasterTypes.HIRING_ACTIVITY_TYPE),
  });
  const jobPriorityQuery = useQuery({
    queryKey: ["jobPriority"],
    queryFn: () => dropdownApi.fetchDropdown(MasterTypes.JOB_PRIORITY),
  });
  return {
    hiringActivity: hiringActivityQuery.data || [],
    jobPriority: jobPriorityQuery.data || [],

    isLoading: hiringActivityQuery.isLoading || jobPriorityQuery.isLoading

  };
};