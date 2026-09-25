"use client";
import { useQuery } from "@tanstack/react-query";
import { dropdownApi } from "@/services/api/master";
import type { FilterTypeEnum } from "@/constants/FilterTypeEnum";

/** The API's searchable columns for a grid (`/SearchColumn/list/{gridId}`) as Select options. */
export function useSearchColumns(filterType: FilterTypeEnum) {
  const { data = [] } = useQuery({
    queryKey: ["filterOptions", filterType],
    queryFn: () => dropdownApi.fetchFilter(filterType),
    staleTime: 5 * 60 * 1000,
  });
  return (data as { value?: string | number; name?: string; id?: number }[]).map((o) => ({
    value: String(o.value ?? o.name ?? o.id),
    label: String(o.name ?? o.value),
  }));
}
