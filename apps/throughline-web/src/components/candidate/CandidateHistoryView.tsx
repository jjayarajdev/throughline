"use client";
import { Spin } from "antd";
import { useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { candidateApi } from "@/services/api/candidate.api";
import CandidateProfile from "./CandidateProfileNew";

/** Loads the candidate profile (by candidate code in `?id=`) and renders it. */
const CandidateHistoryView = () => {
  const searchParams = useSearchParams();
  const candidateCode = searchParams.get("id");

  const { data: candidateData, isLoading: isLoadingCandidate } = useQuery({
    queryKey: ["candidateDetails", candidateCode],
    queryFn: () => candidateApi.candidateProfile(String(candidateCode)),
    enabled: !!candidateCode,
  });

  if (isLoadingCandidate) {
    return (
      <div className="flex justify-center p-8">
        <Spin size="large" />
      </div>
    );
  }
  return <CandidateProfile data={candidateData} />;
};

export default CandidateHistoryView;
