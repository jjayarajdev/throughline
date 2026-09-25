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
import { toast } from "@/lib/toast";
import { useState, useEffect } from "react";
import { slotApi } from "@/services/api/slot.api";
import { dropdownApi } from "@/services/api/master";
import { MasterTypes } from "@/constants/masterTypes";
import { SelectField } from "@/components/form-fields/SelectField";
import { CandidateDetailsTypes } from "../types";

interface ScreeningSheetProps {
  isOpen: boolean;
  onClose: () => void;
  selectedCandidate: CandidateDetailsTypes | null;
}

const formSchema = z.object({
  feedback: z.string().min(1, "feedback is required"),
  interviewStatusId: z.string().min(1, "status required"),
});

type FormValues = z.infer<typeof formSchema>;

export function FeedbackPendingSheet({
  isOpen,
  onClose,
  selectedCandidate,
}: ScreeningSheetProps) {
  const [actionType, setActionType] = useState<"accept" | "reject" | null>(
    null
  );
  const queryClient = useQueryClient();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      feedback: "",
      interviewStatusId: "",
    },
  });

  const { data: Interviewstatus = [] } = useQuery({
    queryKey: ["Interviewstatus"],
    queryFn: () => dropdownApi.fetchDropdown(MasterTypes.INTERVIEW_STATUS),
    enabled: !!selectedCandidate,
  });

  const { mutate: addFeedback, isPending } = useMutation({
    mutationKey: ["addFeedback"],
    mutationFn: slotApi.addFeedbackInterviewList,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["feedbackPending"]});
      toast.success(data?.message || "Screening status updated successfully");
      handleClose();
    },
    onError: (error) => {
      toast.error(error?.message || "Failed to process screening");
      console.error("Error in screening:", error);
      setActionType(null);
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
         ...data,
      interviewSlotId: selectedCandidate.interviewSlotId,
      };
      addFeedback(payloadAssign);
    })();
  };
  const filteredStatuses = Interviewstatus.filter(
    (status: { name: string }) =>
      status.name === "Selected" || status.name === "Rejected" || status.name ==="Onhold"
  );
  return (
    <CandidateDetailsSheet
      isOpen={isOpen}
      onClose={handleClose}
      candidate={selectedCandidate}
      title="Feedback Pending"
    >
      {selectedCandidate ? (
        <Form {...form}>
          <form className="mt-6 space-y-6" onSubmit={(e) => e.preventDefault()}>
            <div className="pt-4 space-y-4">
              <SelectField
                control={form.control}
                name="interviewStatusId"
                label="Interview Status"
                placeholder="Select interview status"
                options={filteredStatuses}
                required
              />
              <TextareaField
                control={form.control}
                name="feedback"
                label="Feedback"
                placeholder="Enter your feedback here..."
                required
              />
            </div>

            <SheetFooter className="flex pt-6 border-t">
              <Button
                type="submit"
                variant="hpButton"
                disabled={isPending}
                onClick={() => handleAction()}
                className="w-full h-11"
              >
                {isPending ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Submitting Feedback...</span>
                  </div>
                ) : (
                  <span>Submit Feedback</span>
                )}
              </Button>
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
