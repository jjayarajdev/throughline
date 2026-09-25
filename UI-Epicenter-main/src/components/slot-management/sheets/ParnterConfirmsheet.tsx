import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { TextareaField } from "@/components/form-fields/TextAreaField";
import { Loader2 } from "lucide-react";
import { SheetFooter } from "@/components/ui/sheet";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import * as z from "zod";
import { CandidateDetailsSheet } from "@/components/shared/CandidateDetailsSheet";
import { toast } from "@/lib/toast";
import { useEffect } from "react";
import { slotApi } from "@/services/api/slot.api";
import { CandidateDetailsTypes } from "../types";
import { ErrorHandler } from "@/components/error/ErrorHandler";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";

interface ScreeningSheetProps {
  isOpen: boolean;
  onClose: () => void;
  selectedCandidate: CandidateDetailsTypes | null;
}

const formSchema = z
  .object({
    interviewed: z.enum(["yes", "no"], {
      required_error: "Please select if the candidate was interviewed",
    }),
    comment: z.string().optional(),
    action: z.enum(["reschedule", "drop"]).optional(),
    initiatedBy: z.enum(["candidate", "panel"]).optional(),
  })
  .superRefine((data, ctx) => {
    if (data.interviewed === "yes") {
      if (!data.comment || data.comment.trim() === "") {
        ctx.addIssue({
          path: ["comment"],
          code: z.ZodIssueCode.custom,
          message: "Comment is required when interview is completed",
        });
      }
    } else {
      if (!data.action) {
        ctx.addIssue({
          path: ["action"],
          code: z.ZodIssueCode.custom,
          message: "Action is required if candidate was not interviewed",
        });
      }
      if (!data.initiatedBy) {
        ctx.addIssue({
          path: ["initiatedBy"],
          code: z.ZodIssueCode.custom,
          message: "Initiator is required if candidate was not interviewed",
        });
      }
      if (!data.comment || data.comment.trim() === "") {
        ctx.addIssue({
          path: ["comment"],
          code: z.ZodIssueCode.custom,
          message: "Comment is required when candidate was not interviewed",
        });
      }
    }
  });

type FormValues = z.infer<typeof formSchema>;

export function PartnerConfirmsheet({
  isOpen,
  onClose,
  selectedCandidate,
}: ScreeningSheetProps) {
  const queryClient = useQueryClient();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      interviewed: "yes",
      comment: "",
      action: undefined,
      initiatedBy: undefined,
    },
  });

  const {
    mutate: confirmInterview,
    isPending,
    error,
  } = useMutation({
    mutationKey: ["confirmInterview"],
    mutationFn: slotApi.confirmInterview,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["partnerSlot"] });
      toast.success(data?.message || "Screening status updated successfully");
      handleClose();
    },
    onError: (error) => {
      toast.error(error?.message || "Failed to process screening");
      console.error("Error in screening:", error);
    },
  });

  const handleClose = () => {
    form.reset();
    onClose();
  };

  useEffect(() => {
    if (!isOpen) {
      handleClose();
    }
  }, [isOpen]);

  const onSubmit = (data: FormValues) => {
    if (!selectedCandidate?.interviewSlotId) {
      toast.error("No candidate selected");

      return;
    }

    const payload = {
      interviewSlotId: selectedCandidate.interviewSlotId,
      isInterviewCompleted: data.interviewed === "yes",
      resheduledOrDropped:
        data.interviewed === "no" ? (data.action === "reschedule" ? 1 : 2) : 0,
      resheduleIntiatedBy:
        data.interviewed === "no"
          ? data.initiatedBy === "candidate"
            ? 1
            : 2
          : 0,
      partnerInterviewCompletedComments: data.comment || "",
    };
 
    confirmInterview(payload);
  };

  const watchedInterviewed = form.watch("interviewed");

  if(error)return <ErrorHandler error={error}/>
  return (
    <CandidateDetailsSheet
      isOpen={isOpen}
      onClose={handleClose}
      candidate={selectedCandidate}
      title="Scheduled Interview Confirmation"
    >
      {selectedCandidate ? (
        <Form {...form}>
          {error && <ErrorHandler error={error} />}

          <form
            className="mt-6 space-y-6"
            onSubmit={form.handleSubmit(onSubmit)}
          >
            <div>
              <Label className="block mb-2">
                Was the candidate interviewed?
              </Label>
              <Controller
                control={form.control}
                name="interviewed"
                render={({ field }) => (
                  <RadioGroup
                    className="flex gap-4"
                    value={field.value}
                    onValueChange={field.onChange}
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="yes" id="yes" />
                      <Label htmlFor="yes">Yes</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="no" id="no" />
                      <Label htmlFor="no">No</Label>
                    </div>
                  </RadioGroup>
                )}
              />
              {form.formState.errors.interviewed && (
                <p className="text-sm text-red-500">
                  {form.formState.errors.interviewed.message}
                </p>
              )}
            </div>

            {watchedInterviewed === "no" && (
              <>
                <div className="flex flex-col gap-2 pt-4">
                  <Label className="block">Action</Label>
                  <Controller
                    name="action"
                    control={form.control}
                    render={({ field }) => (
                      <RadioGroup
                        onValueChange={field.onChange}
                        value={field.value ?? ""}
                        className="flex gap-4"
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="reschedule" id="reschedule" />
                          <Label htmlFor="reschedule">Reschedule</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="drop" id="drop" />
                          <Label htmlFor="drop">Drop</Label>
                        </div>
                      </RadioGroup>
                    )}
                  />
                  {form.formState.errors.action && (
                    <p className="text-sm text-red-500">
                      {form.formState.errors.action.message}
                    </p>
                  )}
                </div>

                <div className="flex flex-col gap-2 pt-4">
                  <Label className="block">Initiated By</Label>
                  <Controller
                    name="initiatedBy"
                    control={form.control}
                    render={({ field }) => (
                      <RadioGroup
                        onValueChange={field.onChange}
                        value={field.value ?? ""}
                        className="flex gap-4"
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="candidate" id="candidate" />
                          <Label htmlFor="candidate">Candidate</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="panel" id="panel" />
                          <Label htmlFor="panel">Panel</Label>
                        </div>
                      </RadioGroup>
                    )}
                  />
                  {form.formState.errors.initiatedBy && (
                    <p className="text-sm text-red-500">
                      {form.formState.errors.initiatedBy.message}
                    </p>
                  )}
                </div>
              </>
            )}
              <div className="pt-4">
                <TextareaField
                  control={form.control}
                  name="comment"
                  label="Comments"
                  placeholder="Enter your comment here..."
                  required
                />
              </div>
     

            <SheetFooter className="flex gap-4 pt-6 border-t">
              <Button
                type="submit"
                variant="hpButton"
                disabled={isPending}
                className="flex-1 h-11"
              >
                {isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    <span>Submitting...</span>
                  </>
                ) : (
                  <span className="font-medium">Submit</span>
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
