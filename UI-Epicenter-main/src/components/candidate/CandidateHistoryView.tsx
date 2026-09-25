"use client";
import React, { useState } from "react";
import { Star } from "lucide-react";

import { useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { candidateApi } from "@/services/api/candidate.api";

import CandidateProfile from "./CandidateProfileNew";

const CandidateHistoryView = () => {
  const searchParams = useSearchParams();
  const candidateCode = searchParams.get("id");

  const { data: candidateData, isLoading: isLoadingCandidate } = useQuery({
    queryKey: ["candidateDetails", candidateCode],
    queryFn: () => candidateApi.candidateProfile(String(candidateCode)),
    enabled: !!candidateCode,
  });
  const [expandedHistory, setExpandedHistory] = useState({});

  const toggleHistory = (hrqId) => {
    setExpandedHistory((prev) => ({
      ...prev,
      [hrqId]: !prev[hrqId],
    }));
  };

  const getRatingStars = (rating) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`w-4 h-4 ${
          i < rating ? "text-yellow-400 fill-current" : "text-gray-300"
        }`}
      />
    ));
  };

  if (isLoadingCandidate) {
    return (
      <div className="py-8 px-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
          <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
          <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
          <div className="h-96 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
        </div>
      </div>
    );
  }
  return (
    <div className="min-h-screen ">
      <CandidateProfile data={candidateData} />
    </div>
  );
};

export default CandidateHistoryView;
