"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { Plus } from "lucide-react";
import { InputField } from "../form-fields/InputField";
import { SelectField } from "../form-fields/SelectField";
import { MultiSelectField } from "../form-fields/MultiSelectField";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { MasterTypes } from "@/constants/masterTypes";
import { dropdownApi } from "@/services/api/master";
import { toast } from "sonner";
import { useParams, useRouter } from "next/navigation";
import { hiringApi, InterviewRoundPayload } from "@/services/api/hiring.api";
import { PencilIcon } from "lucide-react";
import { Label } from "../ui/label";
import { Checkbox } from "../ui/checkbox";
import { HiringSummaryProps } from "./types";
import SubmitFormLoader from "../common/SubmitFormLoader";
import { LoadingButton } from "../form-fields/LoadingButton";
import { DaySelector } from "../form-fields/DaySelector";
import TooltipWrapper from "../tooltio-wrapper";

// Schema for a single interview round
const roundSchema = z.object({
  round: z.coerce
    .string()
    .min(1, "At least one round required")
    .max(10, "Maximum 10 rounds allowed"),
  roundName: z.string().min(1, "Round Name is required"),
  panel: z
    .array(z.object({ id: z.number(), name: z.string() }))
    .min(1, "At least one panel member required"),
  mode: z.string().min(1, "mode is required"),
  comments: z.string().optional(),
  screeningCap: z.string().optional(),
  panelAvailability: z
    .array(z.string())
    .min(1, "Please select at least one day"),
  addCandidate: z.boolean(),
  candidates: z
    .array(
      z.object({
        id: z.number(),
        name: z.string(),
      })
    )
    .optional(),
  addFeedback: z.boolean(),
  feedbackCategory: z.string().optional(),
  feedbackCriteria: z
    .array(
      z.object({
        id: z.number(),
        name: z.string(),
      })
    )
    .optional(),
  skipScreening: z.boolean().optional(),
});

type RoundValues = z.infer<typeof roundSchema>;

interface InterviewRoundFormProps {
  onNext?: () => void;
  onPrevious?: () => void;
  hiringData: HiringSummaryProps;
}

interface Option {
  id: number;
  name: string;
  isActive?: boolean;
}

// Add this type at the top with other interfaces
interface InterviewRoundQueryKey {
  queryKey: ["getInterviewRounds", string | undefined];
}

export default function InterviewRoundForm({
  onNext,
  onPrevious,
  hiringData,
}: InterviewRoundFormProps) {
  const [showForm, setShowForm] = useState(false);
  const { hiring } = useParams();

  // Fetch dropdown data
  const { data: interviewRoundName = [] } = useQuery({
    queryKey: ["interviewRound"],
    queryFn: () => dropdownApi.fetchDropdown(MasterTypes.INTERVIEW_ROUND),
  });
  const form = useForm<RoundValues>({
    resolver: zodResolver(roundSchema),
    defaultValues: {
      round: "1",
      roundName: "",
      panel: [],
      mode: "",
      comments: "",
      screeningCap: "30",
      panelAvailability: [],
      addCandidate: false,
      candidates: [],
      addFeedback: false,
      feedbackCategory: "",
      feedbackCriteria: [],
      skipScreening: false,
    },
  });

  const { setValue } = form;
  const addCandidate = form.watch("addCandidate");
  const addFeedback = form.watch("addFeedback");
  const roundName = form.watch("roundName");
  const roundNumber = form.watch("round");

  const { data: interviewMode = [], isLoading: getLoading } = useQuery({
    queryKey: ["interviewMode", roundName],
    queryFn: () =>
      dropdownApi.fetchInterviewMode(MasterTypes.INTERVIEW_MODE, roundName),
    enabled: !!roundName,
  });

  const [editingRoundId, setEditingRoundId] = useState<number | null>(null);

  const queryClient = useQueryClient();

  const { mutate: addInterviewRounds, isPending } = useMutation({
    mutationKey: ["addInterviewRounds"],
    mutationFn: hiringApi.createInterviewRounds,
    onSuccess: (data) => {
      form.reset();
      setShowForm(false);
      toast.success(data?.message || "Interview rounds added successfully");
      queryClient.invalidateQueries({ queryKey: ["getInterviewRounds"] });
    },
    onError: (error) => {
      toast.error(error?.message || "Failed to create partner");
      console.error("Error creating partner:", error);
    },
  });

  const [editMode, setEditmode] = useState(false);
  const { data: getInterviewRounds } = useQuery({
    queryKey: ["getInterviewRounds", hiring],
    queryFn: () => hiringApi.getInterviewRounds(Number(hiring)),
    enabled: !!hiring,
  });

  const { mutate: updateInterviewRound, isPending: UpdateLoading } =
    useMutation({
      mutationFn: (values: InterviewRoundPayload) =>
        hiringApi.updateInterviews(Number(editingRoundId), values),
      onSuccess: (data) => {
        form.reset({
          round: "",
          roundName: "",
          panel: [],
          mode: "",
          comments: "",
          addCandidate: false,
          candidates: [],
          addFeedback: false,
          feedbackCategory: "",
          feedbackCriteria: [],
        });
        toast.success(data?.message || "");
        setShowForm(false);
        setEditmode(false);
        queryClient.invalidateQueries({
          queryKey: ["getInterviewRounds", hiring],
        } as InterviewRoundQueryKey);
      },
      onError: (error) => {
        toast.error("Failed to update hiring");
        console.log("Error updating hiring:", error);
      },
    });

  const onSubmit = (values: RoundValues) => {
    const transformedPayload = {
      id: editMode ? editingRoundId : 0,
      hiringRequestId: Number(hiring),
      roundNumber: Number(values.round),
      roundNameId: Number(values.roundName),
      panel: values.panel.map((p: any) => p.id),
      modeOfInterview: Number(values.mode),
      comments: values.comments || "",
      isAddSpecificCandidates: values.addCandidate || false,
      candidates: values?.candidates?.map((skill: { id: number }) => skill.id),
      addFeedbackCritria: values.addFeedback || false,
      categoryId: Number(values.feedbackCategory),
      feedbackCritriaOptions: values.addFeedback
        ? values.feedbackCriteria?.map((c: any) => ({
            criteriaOptionId: c.id,
            name: c.name,
            interviewRoundId: editMode ? editingRoundId : 0,

          }))
        : [],
      screeningCap: Number(values.screeningCap),
      availableDays: values.panelAvailability,
      skipScreening: values.skipScreening || false,
    };
    if (editMode) {
      updateInterviewRound(transformedPayload);
    } else {
      addInterviewRounds(transformedPayload);
    }
  };

  const { data: ACTIVE_PANEL = [] } = useQuery({
    queryKey: ["ACTIVE_PANEL"],
    queryFn: () => dropdownApi.fetchDropdown(MasterTypes.ACTIVE_PANEL),
    enabled: true,
  });
  const { data: feedBackCategory = [] } = useQuery({
    queryKey: ["feedBackCategory"],
    queryFn: () => dropdownApi.fetchDropdown(MasterTypes.FEEDBACK_CATEGORY),
  });
  const selectedFeedbackCategory = form.watch("feedbackCategory");

  useEffect(() => {
    if (selectedFeedbackCategory) {
      form.setValue("feedbackCriteria", []);
    }
  }, [selectedFeedbackCategory]);

  const {
    data: feedbackCriteria = [],
    refetch: refetchCriteria,
    isLoading,
  } = useQuery({
    queryKey: ["feedbackCriteria", selectedFeedbackCategory],
    queryFn: () => dropdownApi.fetchDropdown(Number(selectedFeedbackCategory)),
    enabled: !!selectedFeedbackCategory,
  });

  const { data: getCandidates, isLoading: candidateloading } = useQuery({
    queryKey: ["getCandidates", hiring],
    queryFn: () => hiringApi.getCandidates(String(hiring)),
    enabled: !!hiring,
    select: (raw: Array<any>): Option[] =>
      raw.map((c) => ({
        id: c.id,
        name: c.candidateCode,
        isActive: true,
      })) || [],
  });
  const router = useRouter();

  const onEdit = (round: InterviewRoundPayload) => {
    setShowForm(true);
    setEditmode(true);

    setEditingRoundId(round?.id);
    const data =
      Array.isArray(getCandidates) && Array.isArray(round?.candidates)
        ? getCandidates.filter(
            (item) =>
              Array.isArray(round.candidates) &&
              round.candidates.includes(item.id)
          )
        : [];

    
    const panelOptions = Array.isArray(round.panel)
      ? ACTIVE_PANEL.filter(
          (item: { name: string; id: number; isActive: boolean }) =>
            Array.isArray(round.panel) && round.panel.includes(item.id)
        )
      : [];

    const idSet = new Set(
      round?.feedbackCritriaOptions?.map((x) => x.criteriaOptionId)
    );
    refetchCriteria().then((res) => {
      const Criteria = Array.isArray(res.data) ? res.data : [];
      const selectedOpts = Criteria.filter((opt) => idSet.has(opt.id));
      form.setValue("feedbackCriteria", selectedOpts);
    });

    form.reset({
      round: String(round.roundNumber),
      roundName: String(round.roundNameId),
      panel: panelOptions,
      mode: String(round.modeOfInterview),
      comments: round.comments || "",
      addCandidate: round.isAddSpecificCandidates,
      candidates: data,
      addFeedback: round.addFeedbackCritria,
      feedbackCategory: String(round.categoryId || ""),
      // feedbackCriteria: round?.Criteria,
      skipScreening: round?.skipScreening || false,
      panelAvailability: round.availableDays || [],
      screeningCap: String(round.screeningCap),
    });
  };

  const handleAddNew = () => {
    form.setValue("roundName","")
    setShowForm(true);
    setValue("round", getInterviewRounds.length + 1);
  };

  const skipScreening = form.watch("skipScreening");

  function filterStages() {
    if (roundNumber == "1") {
      return interviewRoundName.filter((item) =>
        skipScreening ? item.sectionId === 2 : item.sectionId === 1
      );
    } else {
      return interviewRoundName.filter((item) => item.sectionId === 3);
    }
  }

  useEffect(() => {
    if (roundNumber === "1" && skipScreening === false) {
      const stages = filterStages();
      if (stages.length > 0) {
        const roundId = stages[0].id;
        form.setValue("roundName", roundId?.toString());
      }
    }
    
  }, [roundNumber, skipScreening, interviewRoundName]);

  return (
    <>
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="space-y-6 relative"
        >
          {(isPending || UpdateLoading) && <SubmitFormLoader />}
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-semibold">Interview Round</h2>
            {!showForm && (
              <Button
                type="button"
                variant="hpButton"
                size="sm"
                onClick={handleAddNew}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add
              </Button>
            )}
          </div>

          {/* Form fields */}
          {showForm && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 border rounded-lg">
              {roundNumber == "1" && (
                <div className="w-full md:col-span-2 border-b pb-4 mb-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      checked={form.watch("skipScreening")}
                      onCheckedChange={(val: boolean) =>
                        form.setValue("skipScreening", val)
                      }
                      id="skip-screening"
                      className="data-[state=checked]:bg-[#01a982] data-[state=checked]:border-[#01a982]"
                    />
                    <Label
                      htmlFor="skip-screening"
                      className="text-sm text-gray-600 font-medium dark:text-gray-300"
                    >
                      Do you want to Skip screening round?
                    </Label>
                  </div>
                </div>
              )}

              <InputField
                control={form.control}
                name="round"
                label="Round Number"
                placeholder="enter"
                required
                disabled
              />

              <SelectField
                control={form.control}
                name="roundName"
                label="Round Name"
                placeholder="Name of the round"
                options={filterStages()}
                required
              />

              <MultiSelectField
                control={form.control}
                placeholder="enter panel members"
                required
                name="panel"
                label="Panel Name"
                options={ACTIVE_PANEL}
              />

              <SelectField
                control={form.control}
                name="mode"
                label="Mode of Interview"
                placeholder="Select mode"
                disabled={!roundName}
                options={interviewMode}
                required
              />
              {!skipScreening && roundNumber == "1" && (
                <InputField
                  control={form.control}
                  name="screeningCap"
                  label="Screening Cap"
                  placeholder="enter screening cap"
                  type="number"
                />
              )}

              <DaySelector
                control={form.control}
                name="panelAvailability"
                label="Panel Availability"
                required
              />

              <textarea
                {...form.register("comments")}
                className="col-span-1 md:col-span-2 mt-4 w-full rounded-md border p-2"
                placeholder="Comments"
              />

              <div className="w-full md:col-span-2 max-w-2xl px-4">
                <div className="flex flex-col md:flex-row md:items-center md:space-x-2 py-4">
                  <Checkbox
                    disabled={editMode}
                    checked={form.watch("addCandidate")}
                    onCheckedChange={(val: boolean) =>
                      form.setValue("addCandidate", val)
                    }
                    id="partner-recommendations"
                    className="data-[state=checked]:bg-green-600 data-[state=checked]:border-green-600"
                  />
                  <Label
                    htmlFor="partner-recommendations"
                    className="mt-2 md:mt-0"
                  >
                    Add Specific Candidates for this round ?
                  </Label>
                </div>

                {addCandidate && (
                  <MultiSelectField
                    disabled={editMode}
                    control={form.control}
                    name="candidates"
                    label="Candidate Info"
                    placeholder="Select candidate codes"
                    options={getCandidates || []} // Add fallback empty array
                  />
                )}

                <div className="flex flex-col md:flex-row md:items-center md:space-x-2 gap-2 py-4">
                  <Checkbox
                    checked={form.watch("addFeedback")}
                    onCheckedChange={(val: boolean) =>
                      form.setValue("addFeedback", val)
                    }
                    id="partner-feedback"
                    className="data-[state=checked]:bg-green-600 data-[state=checked]:border-green-600"
                  />
                  <Label htmlFor="partner-feedback" className="mt-2 md:mt-0">
                    Do you want to add feedback criteria?
                  </Label>
                </div>

                {addFeedback && (
                  <div className="flex flex-col gap-4">
                    <SelectField
                      control={form.control}
                      name="feedbackCategory"
                      label="Category"
                      placeholder="Select feedback category"
                      options={feedBackCategory}
                    />
                    {
                      // feedbackCriteria
                      !!selectedFeedbackCategory && (
                        <>
                          {isLoading ? (
                            <div>Loading...</div>
                          ) : (
                            <MultiSelectField
                              control={form.control}
                              placeholder="Select feedback criteria"
                              required
                              name="feedbackCriteria"
                              label="Feedback Criteria"
                              options={feedbackCriteria}
                            />
                          )}
                        </>
                      )
                    }
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex justify-between pt-6">
            <Button
              variant="secondary"
              type="button"
              onClick={onPrevious}
              className="px-8"
            >
              Previous
            </Button>
            <div className="flex gap-4">
              {showForm && (
                <>
                  <LoadingButton
                    loading={isPending || UpdateLoading}
                    text={editMode ? "Update" : "Save"}
                    loadingText={editMode ? "Updating..." : "Saving..."}
                  />

                  <Button
                    variant="outline"
                    onClick={() => {
                      form.reset({
                        round: "1",
                        roundName: "",
                        panel: [],
                        mode: "",
                        comments: "",
                        screeningCap: "30",
                        panelAvailability: [],
                        addCandidate: false,
                        candidates: [],
                        addFeedback: false,
                        feedbackCategory: "",
                        feedbackCriteria: [],
                        skipScreening: false,
                      });
                      setEditmode(false);
                      setShowForm(false);
                    }}
                    className="px-8 hover:cursor-pointer"
                  >
                    Cancel
                  </Button>
                </>
              )}
            </div>
          </div>
        </form>
      </Form>

      <div className="overflow-x-auto mt-10">
        <table className="w-full table-auto border-collapse">
          <thead>
            <tr className="bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200">
              <th className="px-4 py-2 text-left">Round</th>
              <th className="px-4 py-2 text-left">Panel</th>
              <th className="px-4 py-2 text-left">Mode of Interview</th>
              <th className="px-4 py-2 text-left">Comments</th>
              <th className="px-4 py-2 text-left">Round Name</th>
              <th className="px-4 py-2 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {getInterviewRounds &&
              getInterviewRounds.map(
                (
                  round: {
                    modeOfInterviewName: string;
                    roundNameName: string;
                    id: number;
                    roundNumber: number;
                    panel: string[];
                    modeOfInterview: number;
                    comments?: string;
                    roundNameId: number;
                    panelNames: string;
                  },
                  index: number
                ) => (
                  <tr
                    key={round.id}
                    className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    <td className="px-4 py-2">{round.roundNumber}</td>
                    <td className="px-4 py-2">{round.panelNames}</td>
                    <td className="px-4 py-2">{round.modeOfInterviewName}</td>
                    <td className="px-4 py-2">{round.comments || "-"}</td>
                    <td className="px-4 py-2">
                      {
                        interviewRoundName.find(
                          (item: { id: number; name: string }) =>
                            item.id == round.roundNameId
                        )?.name
                      }
                    </td>

                    <td className="px-4 py-2 space-x-2">
                      <TooltipWrapper
                      
                        content={"Edit Round"}
                      >
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onEdit(round)}
                        >
                          <PencilIcon />
                          Edit
                        </Button>
                      </TooltipWrapper>
                    </td>
                  </tr>
                )
              )}
          </tbody>
        </table>
      </div>
    </>
  );
}
