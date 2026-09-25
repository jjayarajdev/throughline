import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { TextareaField } from "@/components/form-fields/TextAreaField";
import { Loader2 } from "lucide-react";
import { SheetFooter } from "@/components/ui/sheet";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as z from "zod";
import { CandidateDetailsSheet } from "@/components/shared/CandidateDetailsSheet";
import { toast } from "sonner";
import { useState, useEffect } from "react";
import { slotApi } from "@/services/api/slot.api";
import { DatePickerField } from "@/components/form-fields/DatePickerField";
import { InputField } from "@/components/form-fields/InputField";
import { SelectField } from "@/components/form-fields/SelectField";
import { dropdownApi } from "@/services/api/master";
import { MasterTypes } from "@/constants/masterTypes";
import { MultiSelectField } from "@/components/form-fields/MultiSelectField";
import { CandidateDetailsTypes } from "../types";

interface ScreeningSheetProps {
  isOpen: boolean;
  onClose: () => void;
  isEdit: boolean;
  selectedCandidate: CandidateDetailsTypes | null;
}
const hoursOptions = [
  { id: "2", name: "2 hrs" },
  { id: "4", name: "4 hrs" },
  { id: "8", name: "8 hrs" },
  { id: "12", name: "12 hrs" },
  { id: "18", name: "18 hrs" },
  { id: "24", name: "24 hrs" },
  { id: "48", name: "48 hrs" },
  { id: "72", name: "72 hrs" },
];
const durationOptions = [
  { name: "30 minutes", id: "30" },
  { name: "45 minutes", id: "45" },
  { name: "1 hour", id: "60" },
  { name: "1.5 hours", id: "90" },
];

const formSchema = z.object({
  date: z.string().min(1, "Date is required"),
  timeSlot: z.string().min(1, "Time is required"),
  panelMember: z.string().optional(),
  requestCreationDate: z.string().optional(),
  validityHours: z.string().min(1, "Time is required"),
  duration: z.string().min(1, "Duration is required"),
  panelName: z.array(z.object({ id: z.number(), name: z.string() })).optional(),
  comments: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

export function InterviewSheet({
  isOpen,
  onClose,
  isEdit,
  selectedCandidate,
}: ScreeningSheetProps) {
  const [actionType, setActionType] = useState<"accept" | "reject" | null>(
    null
  );
  const queryClient = useQueryClient();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      date: selectedCandidate?.date || "",
      timeSlot: selectedCandidate?.time?.slice(0, 5) || "",
      panelMember: "",
      requestCreationDate: "",
      validityHours: String(selectedCandidate?.validityHours) || "2",
      duration: selectedCandidate?.duration
        ? String(selectedCandidate.duration)
        : "30",
      panelName: [],
      comments: "",
    },
  });

  const { mutate: createSlot, isPending } = useMutation({
    mutationKey: ["createSlot"],
    mutationFn: slotApi.assigSlot,
    onSuccess: (data) => {
      form.reset();
      queryClient.invalidateQueries({ queryKey: ["interviewListData"] });
      queryClient.invalidateQueries({ queryKey: ["screeningData"] });
      toast.success(data?.message || "slot assigned");
      handleClose();
    },
    onError: (error) => {
      toast.error("Failed to create Assign Slot");
      console.error("Error creating partner:", error);
    },
  });
  const { mutate: updateSlot, isPending: pendingLoading } = useMutation({
    mutationKey: ["updateSlot"],
    mutationFn: slotApi.updateassigSlot,
    onSuccess: (data) => {
      form.reset();
      queryClient.invalidateQueries({ queryKey: ["interviewListData"] });
      toast.success(data?.message || "slot assigned");
      handleClose();
    },
    onError: (error) => {
      console.error("Error creating partner:", error);
    },
  });

  const handleClose = () => {
    form.reset();
    setActionType(null);
    onClose();
  };

  useEffect(() => {
    if (!isOpen) {
      handleClose();
    }
  }, [isOpen]);

  const handleAction = () => {
    form.handleSubmit((data) => {
      if (!selectedCandidate?.candidateId) {
        toast.error("No candidate selected");
        return;
      }
      const payloadAssign = {
        hiringRequestId: selectedCandidate?.hiringRequestId,
        candidateId: selectedCandidate?.candidateId,
        date: data.date,
        time: data.timeSlot+":00",
        partnerId: selectedCandidate.partnerId,
        currentRoundId: selectedCandidate?.currentRoundId,
        isRescheduled:
          selectedCandidate.candidateInterviewStatusName === "Rescheduled",
        interviewStatusId: selectedCandidate.interviewStatusId ?? 0,
        panel: data?.panelName?.map((p: any) => p.id) || [],
        duration: data.duration,
        validityHours: data.validityHours,
        hmAdditionalComments: data.comments || "",
      };
      if (isEdit) {
        const editPayload = {
          ...payloadAssign,
          interviewSlotId: selectedCandidate.interviewSlotId,
          candidateInterviewStatusId:
            selectedCandidate.candidateInterviewStatusId,
        };
        updateSlot(editPayload);
      } else {
        createSlot(payloadAssign);
      }
    })();
  };
  const { data: ACTIVE_PANEL = [] } = useQuery({
    queryKey: ["ACTIVE_PANEL"],
    queryFn: () => dropdownApi.fetchDropdown(MasterTypes.ACTIVE_PANEL),
    enabled: true,
  });

  useEffect(() => {
    if (!isEdit || !selectedCandidate || ACTIVE_PANEL.length === 0) return;
    if (isEdit && selectedCandidate && ACTIVE_PANEL.length > 0) {
      const filteredData = ACTIVE_PANEL.filter((person: any) =>
        selectedCandidate?.additionalPanel?.includes(person.id)
      );
      form.setValue("panelName", filteredData);
    }
    return () => {
      form.resetField("panelName");
    };
  }, [selectedCandidate, ACTIVE_PANEL]);

  return (
    <CandidateDetailsSheet
      isOpen={isOpen}
      onClose={handleClose}
      candidate={selectedCandidate}
      title="Interview Details"
    >
      {selectedCandidate ? (
        <Form {...form}>
          <form className="mt-6 space-y-6" onSubmit={(e) => e.preventDefault()}>
            <div className="grid grid-cols-2 gap-4">
              <DatePickerField
                control={form.control}
                name="date"
                label="Interview date"
                required
              />

              <InputField
                control={form.control}
                name="timeSlot"
                label="Interview Time"
                placeholder="Select time slot"
                type="time"
                required
              />
              <SelectField
                control={form.control}
                name="validityHours"
                label="Validity hours"
                placeholder="Select time slot"
                options={hoursOptions}
                required
              />
              <SelectField
                control={form.control}
                name="duration"
                label="Interview duration"
                placeholder="Select duration"
                options={durationOptions}
                required
              />
              <div className="col-span-2">
                <MultiSelectField
                  control={form.control}
                  placeholder="Additional panel"
                  name="panelName"
                  label="Additional Panel Name"
                  options={ACTIVE_PANEL}
                />
              </div>
              <div className="col-span-2">
                <TextareaField
                  control={form.control}
                  name="comments"
                  label="Comments"
                  placeholder="Enter your comments here..."
                />
              </div>
            </div>

            <SheetFooter className="flex gap-4 pt-6 border-t">
              <div className="flex w-full gap-4">
                <Button
                  type="submit"
                  variant="hpButton"
                  disabled={isPending || pendingLoading}
                  onClick={() => handleAction()}
                  className="w-full h-11"
                >
                  {isPending || pendingLoading ? (
                    <div className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Submitting...</span>
                    </div>
                  ) : (
                    <span>Submit</span>
                  )}
                </Button>
              </div>
            </SheetFooter>
          </form>
        </Form>
      ) : (
        <div className="mt-6 text-center text-gray-500">
          No candidate selected
        </div>
      )}
    </CandidateDetailsSheet>
  );
}
