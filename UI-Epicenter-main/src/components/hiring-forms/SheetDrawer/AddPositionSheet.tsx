import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { Loader2 } from "lucide-react";
import { SheetFooter } from "@/components/ui/sheet";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import * as z from "zod";
import { toast } from "sonner";
import { useEffect } from "react";
import { InputField } from "@/components/form-fields/InputField";
import { HiringDetailSheet } from "@/components/shared/HiringDetailsSheet";
import { hiringApi, HiringPageRequest } from "@/services/api/hiring.api";

interface ScreeningSheetProps {
  isOpen: boolean;
  onClose: () => void;
  isEdit: boolean;
  selectedCandidate: HiringPageRequest | null;
}

const formSchema = z.object({
  positions: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

export function AddPositionSheet({
  isOpen,
  onClose,
  selectedCandidate,
}: ScreeningSheetProps) {

  const queryClient = useQueryClient();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      positions: "",
    },
  });

  const { mutate: addHiringPositions, isPending } = useMutation({
    mutationKey: ["addHiringPositions"],
    mutationFn: hiringApi.addHiringPositions,
    onSuccess: (data) => {
      form.reset();
      queryClient.invalidateQueries({ queryKey: ["hiringBin"] });
      toast.success(data?.message || "Positions added successfully");
      handleClose();
    },
    onError: (error) => {
      toast.error(error?.message || "something went wrong");
      console.error("Error:", error);
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

  const handleAction = () => {
    form.handleSubmit((data) => {
      const payloadAssign = {
        parentHiringRequestId: selectedCandidate.id,
        noOfPositions: data.positions ? parseInt(data.positions) : 0,
      };
      addHiringPositions(payloadAssign);
    })();
  };


  return (
    <HiringDetailSheet
      isOpen={isOpen}
      onClose={handleClose}
      candidate={selectedCandidate}
      title="Hiring Details"
    >
      {selectedCandidate ? (
        <Form {...form}>
          <form className="mt-6 space-y-6" onSubmit={(e) => e.preventDefault()}>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <InputField
                  control={form.control}
                  name="positions"
                  type="number"
                  label="Number of Positions"
                  placeholder="Enter your number of positions here..."
                />
              </div>
            </div>

            <SheetFooter className="flex gap-4 pt-6 border-t">
              <div className="flex w-full gap-4">
                <Button
                  type="submit"
                  variant="hpButton"
                  disabled={isPending }
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
              </div>
            </SheetFooter>
          </form>
        </Form>
      ) : (
        <div className="mt-6 text-center text-gray-500">
          No candidate selected
        </div>
      )}
    </HiringDetailSheet>
  );
}
