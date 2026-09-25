"use client";

import React, { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useParams, useRouter } from "next/navigation";
import { toast } from "@/lib/toast";
import { FeedbackPayload, slotApi } from "@/services/api/slot.api";
import { dropdownApi } from "@/services/api/master";
import { MasterTypes } from "@/constants/masterTypes";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import SubmitFormLoader from "@/components/common/SubmitFormLoader";
import { LoadingSpinner } from "@/components/ui/spinner";
import FeedbackError from "@/components/error/FeedbackError";
import { formatDate } from "@/helpers/helper";

const formSchema = z.object({
  candidateInterviewStatus: z.number().min(1, "Status is required"),
  feedback: z.array(
    z.object({
      criteriaOptionId: z.number(),
      rating: z.number().min(1, "Rating is required").max(5, "Max rating is 5"),
      comments: z.string().min(1,"Detailed feedback is required"),
    })
  ),
});

type FormValues = z.infer<typeof formSchema>;

type CriteriaOption = { id: number; name: string };

type InterviewGetResponse = {
  interviewSlotId: number;
  candidateId: number;
  candidateName: string;
  candidateCode: string;
  interviewRoundNumber: number;
  interviewPanelMember: string;
  interviewDate: string;
  interviewType: { id: number; name: string };
  interviewMode: { id: number; name: string };
  candidateInterviewStatus: { id: number; name: string };
  feedbackCategory: { id: number; name: string };
  feedbackCritriaOptions: CriteriaOption[];
};

type PanelFeedbackResponse = {
  status: boolean;
  statusCode: string;
  message: string;
  data?: InterviewGetResponse;
};

export default function Page() {
  const params = useParams();
  const router = useRouter();
  const [submitted, setSubmitted] = useState(false);

  const {
    data: queryData,
    isLoading: fetching,
    error,
  } = useQuery<PanelFeedbackResponse>({
    queryKey: ["getPanelFeedback", params.id],
    queryFn: () => slotApi.getpanelFeedback(Number(params.id)),
    enabled: Boolean(params.id),
  });

  const interviewData = queryData?.data;

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      candidateInterviewStatus:
        interviewData?.candidateInterviewStatus?.id ?? 0,
      feedback: [],
    },
  });

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = form;
  const { fields } = useFieldArray({ control, name: "feedback" });

  useEffect(() => {
    if (interviewData) {
      reset({
        feedback: interviewData.feedbackCritriaOptions.map((opt) => ({
          criteriaOptionId: opt.id,
          rating: 0,
          comments: "",
        })),
      });
    }
  }, [interviewData, reset]);

  const { data: interviewStatus = [] } = useQuery({
    queryKey: ["interviewStatus"],
    queryFn: () => dropdownApi.fetchDropdown(MasterTypes.INTERVIEW_STATUS),
  });

  const queryClient = useQueryClient();
  const { mutate: panelFeedbackSubmit, isPending } = useMutation({
    mutationFn: (values: FeedbackPayload) =>
      slotApi.submitPanelFeedback(values),
    onSuccess: (data) => {
      toast.success(data?.message || "Feedback Submitted successfully");
      setSubmitted(true);
      queryClient.invalidateQueries({
        queryKey: ["feedbackPending", params.id],
      });
    },
    onError: (error) => {
      toast.error("Failed to update hiring");
      console.error("Error updating hiring:", error);
    },
  });

  const onSubmit = (values: FormValues) => {
    if (!interviewData) return;
    const payload = values.feedback.map((f) => ({
      interviewSlotId: interviewData.interviewSlotId,
      candidateId: interviewData.candidateId,
      candidateInterviewStatusId: values.candidateInterviewStatus,
      criteriaOptionId: f.criteriaOptionId,
      rating: f.rating,
      comments: f.comments ?? "",
      isActive: true,
    }));
    panelFeedbackSubmit(payload);
  };

  if (submitted) {
    return (
      <div className="flex flex-col items-center justify-center h-screen text-center">
        <h2 className="text-2xl font-semibold mb-4">
          Thank you for your feedback!
        </h2>
        <Button
          variant="hpButton"
          onClick={() => router.back()}
          className="mt-2"
        >
          Close
        </Button>
      </div>
    );
  }

  if (fetching) return <LoadingSpinner />;

  if (!queryData || queryData.status === false || !interviewData)
    return <FeedbackError message={queryData?.message} />;

  const filteredStatuses = interviewStatus.filter(
    (status: { name: string }) =>
      status.name === "Selected" 
    || status.name === "Rejected"
    || status.name === "Onhold"
  );
  return (
    <>
      <h1 className="text-2xl font-semibold mb-6 text-gray-900 dark:text-gray-100">
        Interview Feedback Form
      </h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 text-gray-800 dark:text-gray-200">
        <div>
          <p>
            <strong>Candidate Name:</strong> {interviewData.candidateName}
          </p>
          <p>
            <strong>Candidate ID:</strong> {interviewData.candidateCode}
          </p>
          <p>
            <strong>Round:</strong> {interviewData.interviewRoundNumber}
          </p>
          <p>
            <strong>Panel:</strong> {interviewData.interviewPanelNames}
          </p>
        </div>
        <div>
          <p>
            <strong>Schedule:</strong> {formatDate(interviewData.interviewDate)}
          </p>
          <p>
            <strong>Type:</strong> {interviewData.interviewType.name}
          </p>
          <p>
            <strong>Mode:</strong> {interviewData.interviewMode.name}
          </p>
        </div>
      </div>
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="relative  mx-auto p-6 bg-gray-50 dark:bg-gray-900 rounded-lg shadow"
      >
        {isPending && <SubmitFormLoader />}

        {/* Candidate Info */}

        {/* Interview Status Dropdown */}
        <div className="mb-6">
          <Controller
            name="candidateInterviewStatus"
            control={control}
            render={({ field, fieldState: { error } }) => {
              const selected = filteredStatuses.find(
                (s) => s.id === field.value
              );
              return (
                <div>
                  <label className="block mb-1 font-medium">
                    Interview Status*
                  </label>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-64 justify-between"
                      >
                        {selected?.name ?? "Select status…"}
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-full">
                      {filteredStatuses.map((status) => (
                        <DropdownMenuItem
                          key={status.id}
                          onSelect={() => field.onChange(status.id)}
                        >
                          {status.name}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                  {error && (
                    <p className="text-sm text-red-500 mt-1">{error.message}</p>
                  )}
                </div>
              );
            }}
          />
        </div>

        {/* Feedback Questions */}
        <div className="space-y-6">
          {interviewData?.feedbackCritriaOptions.map((opt, idx) => (
            <div
              key={opt.id}
              className="p-4 bg-gray-50 dark:bg-gray-800 rounded"
            >
              <p className="font-medium mb-3 text-gray-900 dark:text-gray-100">
                {opt.name}
              </p>

              <div className="flex items-center justify-between mb-3 text-gray-700 dark:text-gray-300">
                {[1, 2, 3, 4, 5].map((val) => (
                  <label key={val} className="flex items-center space-x-1">
                    <Controller
                      name={`feedback.${idx}.rating`}
                      control={control}
                      render={({ field }) => (
                        <input
                          type="radio"
                          value={val}
                          checked={field.value === val}
                          onChange={() => field.onChange(val)}
                          className="accent-black dark:accent-white"
                        />
                      )}
                    />
                    <span className="text-sm">
                      {val} –{" "}
                      {
                        [
                          "Poor",
                          "Below Average",
                          "Average",
                          "Good",
                          "Excellent",
                        ][val - 1]
                      }
                    </span>
                  </label>
                ))}
              </div>
              {errors.feedback?.[idx]?.rating && (
                <p className="text-red-500">
                  {errors.feedback[idx]!.rating!.message}
                </p>
              )}

              <Controller
                name={`feedback.${idx}.comments`}
                control={control}
                render={({ field }) => (
                  <textarea
                    {...field}
                  placeholder="Enter your detailed feedback here..."
                    className="w-full border rounded p-2 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200"
                  />
                )}
              />
            </div>
          ))}
        </div>
        <div className="mt-8 text-right">
          <Button type="submit" variant="hpButton" disabled={isPending}>
            {isPending ? "Submitting…" : "Submit Feedback"}
          </Button>
        </div>
      </form>
    </>
  );
}
