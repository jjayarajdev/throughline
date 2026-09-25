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
import { toast } from "sonner";
import { useState, useEffect } from "react";
import { slotApi } from "@/services/api/slot.api";
import { CandidateDetailsTypes } from "../types";
import { ErrorHandler } from "@/components/error/ErrorHandler";

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

export function ParnterSlotsheet({
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
  
  const { mutate: acceptSlot, isPending,error } = useMutation({
    mutationKey: ["acceptSlot"],
    mutationFn: slotApi.acceptSlot,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["partnerSlot"] });
      toast.success(data?.message || "Screening status updated successfully");
      handleClose();
    },
    onError: (error) => {
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
        const payload = {
      interviewSlotId: selectedCandidate.interviewSlotId,
      isAccepted: status,
      comments: data.comment,
    };
    acceptSlot(payload);
    })();
  };

  return (
    <CandidateDetailsSheet
      isOpen={isOpen}
      onClose={handleClose}
      candidate={selectedCandidate}
      title="Accept/Reject Slot"
    >
      {selectedCandidate ? (
        <Form {...form}>
          {
            error &&(
              <ErrorHandler error={error}/>
            )
          }
          <form className="mt-6 space-y-6" onSubmit={(e) => e.preventDefault()}>
            <div className="pt-4">
         
              <TextareaField
                control={form.control}
                name="comment"
                label="Comments"
                placeholder="Enter your comment here..."
                required
              />
            </div>
            <div className="text-md text-muted-foreground italic">
             Note: Please confirm after scheduling
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
                    <span className="font-medium">Accept Slot</span>
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
                    <span className="font-medium">Reject Slot</span>
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
