"use client";
import { Button, Form, Input, Select } from "antd";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as z from "zod";
import { CandidateDetailsSheet } from "@/components/shared/CandidateDetailsSheet";
import { toast } from "@/lib/toast";
import { validateWithZod, zodRules } from "@/lib/zodRules";
import { slotApi } from "@/services/api/slot.api";
import { dropdownApi } from "@/services/api/master";
import { useUserStore } from "@/store/userStore";
import type { CandidateDetailsTypes } from "../../../slot-management/types";

interface TransferCandidateSheetProps {
  isOpen: boolean;
  onClose: () => void;
  selectedCandidate: CandidateDetailsTypes | null;
}

const formSchema = z.object({
  candidateHRQTransferComments: z.string().min(1, "feedback is required"),
  hiringRequestId: z.string().min(1, "status required"),
});

type FormValues = z.infer<typeof formSchema>;

/** Move an identified candidate to another vacant HRQ. */
export default function TransferCandidateSheet({ isOpen, onClose, selectedCandidate }: TransferCandidateSheetProps) {
  const queryClient = useQueryClient();
  const { userId } = useUserStore();
  const [form] = Form.useForm<FormValues>();

  const hiringRequestId = Number(selectedCandidate?.hiringRequestId) || 0;
  const { data: getVacantHrqid = [] } = useQuery({
    queryKey: ["getVacantHrqid", hiringRequestId],
    queryFn: () => dropdownApi.getVacantHrqid(hiringRequestId),
    enabled: !!hiringRequestId,
  });

  const handleClose = () => {
    form.resetFields();
    onClose();
  };

  const { mutate: transferCandidates, isPending } = useMutation({
    mutationKey: ["transferCandidates"],
    mutationFn: slotApi.transferCandidate,
    onSuccess: (data) => {
      toast.success(data?.message || "Screening status updated successfully");
      queryClient.invalidateQueries({ queryKey: ["hiringProfile"] });
      handleClose();
    },
    onError: (error: any) => {
      toast.error(error?.message || "Failed to process screening");
      console.error("Error in screening:", error);
    },
  });

  const onFinish = (values: FormValues) => {
    const data = validateWithZod(formSchema, form, values);
    if (!data || !selectedCandidate) return;
    transferCandidates({
      hiringRequestId: Number(data.hiringRequestId),
      candidateHRQTransferComments: data.candidateHRQTransferComments,
      candidateId: (selectedCandidate as any).id,
      transferredBy: userId,
    } as any);
  };

  return (
    <CandidateDetailsSheet
      isOpen={isOpen}
      onClose={handleClose}
      candidate={selectedCandidate}
      title="Transfer Candidate"
      footer={
        selectedCandidate ? (
          <Button type="primary" block loading={isPending} onClick={() => form.submit()}>
            {isPending ? "Submitting..." : "Submit"}
          </Button>
        ) : null
      }
    >
      {selectedCandidate && (
        <Form form={form} layout="vertical" onFinish={onFinish} className="mt-6" initialValues={{ candidateHRQTransferComments: "", hiringRequestId: "" }}>
          <Form.Item name="hiringRequestId" label="Select HrqId" rules={zodRules(formSchema, "hiringRequestId")}>
            <Select
              showSearch
              optionFilterProp="label"
              placeholder="Select interview status"
              options={(getVacantHrqid as any[]).map((hrq) => ({ value: String(hrq?.id), label: hrq?.hrqId }))}
            />
          </Form.Item>
          <Form.Item name="candidateHRQTransferComments" label="Comments" rules={zodRules(formSchema, "candidateHRQTransferComments")}>
            <Input.TextArea rows={4} placeholder="Enter your comments here..." />
          </Form.Item>
        </Form>
      )}
    </CandidateDetailsSheet>
  );
}
