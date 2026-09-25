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
import { CandidateDetailsTypes } from "../../../slot-management/types";
import { useUserStore } from "@/store/userStore";

interface ScreeningSheetProps {
  isOpen: boolean;
  onClose: () => void;
  selectedCandidate: CandidateDetailsTypes | null;
}

const formSchema = z.object({
  candidateHRQTransferComments: z.string().min(1, "feedback is required"),
  hiringRequestId: z.string().min(1, "status required"),
});

type FormValues = z.infer<typeof formSchema>;

export default function TransferCandidateSheet({
  isOpen,
  onClose,
  selectedCandidate,
}: ScreeningSheetProps) {
  const [actionType, setActionType] = useState<"accept" | "reject" | null>(
    null
  );

  const queryClient = useQueryClient();
const {userId} = useUserStore();
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      candidateHRQTransferComments: "",
      hiringRequestId: "",
    },
  });
  const hiringRequestId = Number(selectedCandidate?.hiringRequestId) || 0;
  const { data: getVacantHrqid = [] } = useQuery({
    queryKey: ["getVacantHrqid", hiringRequestId],
    queryFn: () => dropdownApi.getVacantHrqid(hiringRequestId),
    enabled: !!hiringRequestId,
  });
 


  const { mutate: transferCandidates, isPending } = useMutation({
    mutationKey: ["transferCandidates"],
    mutationFn: slotApi.transferCandidate,
    onSuccess: (data) => {
      toast.success(data?.message || "Screening status updated successfully");
        queryClient.invalidateQueries({ queryKey: ["hiringProfile"] });
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
 

      const payloadAssign = {
        hiringRequestId: Number(data.hiringRequestId),
        candidateHRQTransferComments: data.candidateHRQTransferComments,
        candidateId: selectedCandidate.id,
        transferredBy: userId,
      };
      transferCandidates(payloadAssign);
    })();
  };

  return (
    <CandidateDetailsSheet
      isOpen={isOpen}
      onClose={handleClose}
      candidate={selectedCandidate}
      title="Transfer Candidate"
    >
      {selectedCandidate ? (
        <Form {...form}>
          <form className="mt-6 space-y-6" onSubmit={(e) => e.preventDefault()}>
            <div className="pt-4 space-y-4">
              <SelectField
                control={form.control}
                name="hiringRequestId"
                label="Select HrqId"
                placeholder="Select interview status"
                options={getVacantHrqid.map((hrq) => ({
                  id: hrq?.id,
                  name: hrq?.hrqId,
                }))}
                required
              />
              <TextareaField
                control={form.control}
                name="candidateHRQTransferComments"
                label="Comments"
                placeholder="Enter your comments here..."
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
                    <span>Submitting...</span>
                  </div>
                ) : (
                  <span>Submit</span>
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
