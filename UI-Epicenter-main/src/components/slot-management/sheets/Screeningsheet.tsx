import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { TextareaField } from "@/components/form-fields/TextAreaField";
import { Loader2 } from "lucide-react";
import { SheetFooter } from "@/components/ui/sheet";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import * as z from "zod";
import { CandidateDetailsSheet } from "@/components/shared/CandidateDetailsSheet";
import { toast } from "@/lib/toast";
import { useState, useEffect } from "react";
import { slotApi } from "@/services/api/slot.api";
import { CandidateDetailsTypes } from "../types";

interface ScreeningSheetProps {
  isOpen: boolean;
  onClose: () => void;
  selectedCandidate: CandidateDetailsTypes | null;
}

const formSchema = z.object({
  comment: z.string().min(1, "Comment is required"),
  status: z.boolean().optional(),

});

type FormValues = z.infer<typeof formSchema>;

export function ScreeningSheet({
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
      comment: "",
      status: undefined,
  
    },
  });

  const { mutate: handleScreening, isPending } = useMutation({
    mutationKey: ["createSlot"],
    mutationFn: slotApi.screeningAccept,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["screeningData"] });
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

  const handleAction = (status: boolean) => {
    setActionType(status ? "accept" : "reject");
    form.handleSubmit((data) => {
      if (!selectedCandidate?.candidateId) {
        toast.error("No candidate selected");
        return;
      }
      const payloadAssign = {
        candidateId: selectedCandidate.candidateId,
        currentRoundId: selectedCandidate.currentRoundId ?? 0,
        screeningStatus: status,
        comments: data.comment,
      };
      handleScreening(payloadAssign);
    })();
  };

  return (
    <CandidateDetailsSheet
      isOpen={isOpen}
      onClose={handleClose}
      candidate={selectedCandidate}
      title="Screening Details"
    >
      {selectedCandidate ? (
        <Form {...form}>
          <form className="mt-6 space-y-6" onSubmit={(e) => e.preventDefault()}>
            <div className="pt-4">
         
              <TextareaField
                control={form.control}
                name="comment"
                label="Screening Comments"
                placeholder="Enter your screening feedback here..."
                required
              />
            </div>

            <SheetFooter className="flex gap-4 pt-6 border-t">
              <div className="flex w-full gap-4">
                <Button
                  type="button"
                  variant="hpButton"
                  disabled={isPending}
                  onClick={() => handleAction(true)}
                  className="flex-1 h-11"
                >
                  {isPending && actionType === "accept" ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      <span>Accepting...</span>
                    </>
                  ) : (
                    <span className="font-medium">Accept</span>
                  )}
                </Button>
                <Button
                  type="button"
                  variant="hpReject"
                  disabled={isPending}
                  onClick={() => handleAction(false)}
                  className="flex-1 h-11"
                >
                  {isPending && actionType === "reject" ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      <span>Rejecting...</span>
                    </>
                  ) : (
                    <span className="font-medium">Reject</span>
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
