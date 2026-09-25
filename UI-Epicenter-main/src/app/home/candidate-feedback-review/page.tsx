"use client";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Star, User, MoveLeft } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";

import { candidateApi } from "@/services/api/candidate.api";
import SubmitFormLoader from "@/components/common/SubmitFormLoader";
import { ErrorHandler } from "@/components/error/ErrorHandler";
import { StatusBadge } from "@/components/status-badge";
import {
  formatDate,
  formatTime,
  getTatHours,
  tatBetween,
  tatFormat,
} from "@/helpers/helper";
import Link from "next/link";
import { format, parseISO } from "date-fns";
import { EnumType } from "@/constants/slot-status";

// Simple star rating component with HPE styling
const StarRating = ({ rating }: { rating: number }) => (
  <div className="flex items-center">
    {[...Array(5)].map((_, i) => (
      <Star
        key={i}
        size={14}
        className={
          i < rating ? "fill-[#01A982] text-[#01A982]" : "text-gray-300"
        }
      />
    ))}
    <span className="ml-1 text-sm font-medium">{rating}/5</span>
  </div>
);

export default function CandidateFeedbackReview() {
  const searchParams = useSearchParams();
  const candidateId = searchParams.get("candidateId")?.toString() || "";
  const {
    data: candidateFeedbackData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["hiringViewData", candidateId],
    queryFn: () => candidateApi.getCandidateFeedback(candidateId),
  });

  if (isLoading) {
    return <SubmitFormLoader />;
  }
    if (error) return <ErrorHandler error={error} />;
  const isEmpty = Object.keys(candidateFeedbackData).length === 0;

  if (isEmpty)
    return (
      <ErrorHandler
        isEmpty={isEmpty}
        emptyMessage="No feedback data available for this candidate."
      />
    );



  const {
    candidateName,
    candidateCode,
    getCnadidateInterviewRoundFeedbackDetailsDtos,
  } = candidateFeedbackData;

  // Calculate overall average rating
  const calculateOverallRating = () => {
    const allFeedback = getCnadidateInterviewRoundFeedbackDetailsDtos?.flatMap(
      (round) => round?.feedbackCategoryDetails
    );

    return allFeedback.length > 0
      ? Math.round(
          (allFeedback.reduce((sum, item) => sum + item.rating, 0) /
            allFeedback.length) *
            10
        ) / 10
      : 0;
  };

  return (
    <div className="p-6">
      <div
        onClick={() => window.history.back()}
        className="cursor-pointer flex px-2 mb-4 text-sm text-green-600 hover:underline"
      >
        <MoveLeft /> Go Back
      </div>
      {/* HPE-styled header */}
      <div className="mb-6 pb-4 border-b border-gray-200">
        <div className="flex items-center gap-2 mb-1">
          <User className="text-[#01A982] h-5 w-5" />
          <h1 className="text-xl font-bold text-gray-800">
            Candidate Feedback Summary
          </h1>
        </div>
        <div className="flex justify-between items-center mt-1">
          <div>
            <h2 className="text-sm font-semibold">{candidateName} (<span onClick={() => window.history.back()}  className="cursor-pointer text-bold text-green-500">{candidateCode}</span>)</h2>
            <p></p>
          </div>
          <div className="grid grid-cols-4 gap-4 text-center">
            <div className="p-1">
              <p className="text-sm text-gray-500 mb-1">Interview Rounds</p>
              <p className="text-md font-bold text-[#01A982]">
                {getCnadidateInterviewRoundFeedbackDetailsDtos?.length}
              </p>
            </div>

            {calculateOverallRating() > 0 && (
              <div className="p-1">
                <p className="text-sm text-gray-500 mb-1">Average Rating</p>
                <div className="flex justify-center">
                  <StarRating
                    rating={
                      candidateFeedbackData?.finalStatus === "Rejected"
                        ? 0
                        : calculateOverallRating()
                    }
                  />
                </div>
              </div>
            )}
            <div className="p-1 border-x border-gray-100">
              <p className="text-sm text-gray-500 mb-1">Final Status</p>
              <StatusBadge status={candidateFeedbackData?.finalStatus} />
            </div>
          </div>
        </div>
      </div>
      <div className="space-y-2">
        {getCnadidateInterviewRoundFeedbackDetailsDtos?.map((round, index) =>{

       const tat = tatBetween(round?.interviewDate, round?.feedbackGivenOn ?? round?.interviewDate);
         return(
          <Card
            key={round?.interviewSlotId}
            className="shadow-sm border border-gray-200 py-4 gap-1"
          >
            <CardHeader className="pb-1 bg-gray-50">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <div className="flex items-center justify-center bg-[#01A982] text-white w-6 h-6 rounded-full text-xs font-medium">
                    {index + 1}
                  </div>
                  <h2 className="font-semibold text-gray-800">
                    {round?.interviewRoundName}
                  </h2>
                </div>
                <div className="text-sm font-semibold text-green-600">
                  <span className="text-gray-800">Interview Mode:</span>{" "}
                  {round?.interviewModeName}
                </div>

                <p className="font-semibold text-sm  text-green-600">
                  <span className="text-gray-800">Interview Date: </span>{" "}
                  {formatDate(round?.interviewDate)}
                  <span className="text-gray-800">, Time: </span>
                  {formatTime(round?.interviewTime)}
                </p>
             
                  <StatusBadge
                     color={(getTatHours(round?.interviewDate,round?.feedbackGivenOn ? round?.feedbackGivenOn : round?.interviewDate) > EnumType.tat) ? "red" : "green"}
                    status={tat}
                  />

                {/* <p className="font-semibold text-sm text-gray-800">
                 {tatFormat( round?.interviewDate ? round?.interviewDate : new Date())}
                </p> */}
                <StatusBadge status={round?.candidateInterviewStatusName} />
              </div>
            </CardHeader>
            <CardContent className="pt-1 py-0">
              {round?.panelFeedbackComments &&
                round?.feedbackCategoryDetails.length === 0 && (
                  <div className="">
                    <h3 className="text-sm font-medium mb-1 text-gray-700">
                      Feedback Comments : {round?.panelFeedbackComments}
                    </h3>
                  </div>
                )}
                 <div className="flex justify-between items-center">
              
                {round?.feedbackGivenByUserName && (
                  <div className="mt-2">
                    <h3 className="text-sm font-medium mb-1 text-gray-700">
                      Feedback Given By :{" "}
                      <span className="font-semibold text-green-600">
                        {round?.feedbackGivenByUserName}
                      </span>{" "}
                      (
                      <span className="font-semibold text-green-600">
                        {round?.feedbackGivenByUserRoleName}
                      </span>
                      )
                    </h3>
                  </div>
                )}
                {round?.feedbackGivenOn && (
                  <div className="mt-2">
                    <h3 className="text-sm font-medium mb-1 text-gray-700">
                      Feedback given On :{" "}
                      <span className="font-semibold text-green-600">
                        {format(
                          parseISO(round?.feedbackGivenOn),
                          "dd MMM yyyy, hh:mm a"
                        )}
                      </span>
                    </h3>
                  </div>
                )}
                {round?.interviewPanelNames && (
                  <div className="mt-2">
                    <h3 className="text-sm font-medium mb-1 text-gray-700">
                      Panel :{" "}
                      <span className="font-semibold text-green-600">
                        {round?.interviewPanelNames}
                      </span>
                    </h3>
                  </div>
                )}
                {round?.interviewAdditionalPanelNames && (
                  <div className="mt-2">
                    <h3 className="text-sm font-medium mb-1 text-gray-700">
                      Additional Panel :{" "}
                      <span className="font-semibold text-green-600">
                        {round?.interviewAdditionalPanelNames}
                      </span>
                    </h3>
                  </div>
                )}
              </div>

              {/* Feedback details */}
              {round?.feedbackCategoryDetails?.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium mb-1 text-gray-700">
                    Feedback Categories
                  </h3>
                  <div className="space-y-4">
                    {round?.feedbackCategoryDetails?.map((feedback, idx) => (
                      <div
                        key={idx}
                        className="pb-1 border-b border-gray-100 last:border-0 last:pb-0"
                      >
                        <div className="flex justify-between items-center ">
                          <p className="text-sm font-medium">
                            {/* <span className="mr-1 w-5 h-5 rounded-full  font-medium">
                                    {idx + 1}
                                </span> */}
                            {feedback.criteriaOptionName} :{" "}
                            <span className="text-xs text-gray-600 bg-gray-50  rounded">
                              {feedback.comments}
                            </span>
                          </p>
                          <StarRating rating={feedback.rating} />
                        </div>
                        {/* <p className="text-xs text-gray-600 bg-gray-50 p-2 rounded">
                          {feedback.comments}
                        </p> */}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )})}
      </div>
    </div>
  );
}
