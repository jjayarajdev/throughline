"use client";
import { CandidateHiringRequests } from "@/components/candidate/Hiring-Table";
import React from "react";
import { useSearchParams } from "next/navigation";
import { Breadcrumbs } from "@/components/common/Breadcrumbs";
import { FilterTypeEnum } from "@/constants/FilterTypeEnum";

export default function page() {
  const searchParams = useSearchParams();
  const id = searchParams.get("id");
 
  if (!id) {
    return <div>Invalid or missing ID</div>; 
  }
  return (
    <div className="py-10 px-4 sm:px-6">
        <Breadcrumbs/>
      <CandidateHiringRequests filterType={FilterTypeEnum.All_HRQID}  id={id} />
    </div>
  );
}
