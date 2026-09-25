"use client";
import { Button, Form, Input, Select, Space } from "antd";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as z from "zod";
import { toast } from "@/lib/toast";
import { validateWithZod, zodRules } from "@/lib/zodRules";
import { slotApi } from "@/services/api/slot.api";
import { dropdownApi } from "@/services/api/master";
import { MasterTypes } from "@/constants/masterTypes";
import { CandidateDetailsTypes } from "../types";
import { CandidateDrawer } from "./CandidateDrawer";

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

/** Record the interview outcome (Selected / Rejected / Onhold) and feedback for a slot. */
export function FeedbackPendingSheet({ isOpen, onClose, selectedCandidate }: ScreeningSheetProps) {
  const queryClient = useQueryClient();
  const [form] = Form.useForm<FormValues>();

  const { data: Interviewstatus = [] } = useQuery({
    queryKey: ["Interviewstatus"],
    queryFn: () => dropdownApi.fetchDropdown(MasterTypes.INTERVIEW_STATUS),
    enabled: !!selectedCandidate,
  });

  const handleClose = () => {
    form.resetFields();
    onClose();
  };

  const { mutate: addFeedback, isPending } = useMutation({
    mutationKey: ["addFeedback"],
    mutationFn: slotApi.addFeedbackInterviewList,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["feedbackPending"] });
      toast.success(data?.message || "Screening status updated successfully");
      handleClose();
    },
    onError: (error: any) => {
      toast.error(error?.message || "Failed to process screening");
      console.error("Error in screening:", error);
    },
  });

  const onFinish = (values: FormValues) => {
    const data = validateWithZod(formSchema, form, values);
    if (!data) return;
    if (!selectedCandidate?.candidateId) {
      toast.error("No candidate selected");
      return;
    }
    addFeedback({ ...data, interviewSlotId: selectedCandidate.interviewSlotId } as any);
  };

  const statusOptions = (Interviewstatus as { id: number; name: string }[])
    .filter((s) => s.name === "Selected" || s.name === "Rejected" || s.name === "Onhold")
    .map((s) => ({ value: String(s.id), label: s.name }));

  return (
    <CandidateDrawer
      isOpen={isOpen}
      onClose={handleClose}
      candidate={selectedCandidate}
      title="Feedback Pending"
      footer={
        selectedCandidate ? (
          <Space style={{ display: "flex", justifyContent: "flex-end" }}>
            <Button type="primary" loading={isPending} onClick={() => form.submit()}>
              Submit Feedback
            </Button>
          </Space>
        ) : null
      }
    >
      <Form form={form} layout="vertical" className="mt-6" onFinish={onFinish} initialValues={{ feedback: "", interviewStatusId: undefined }}>
        <Form.Item name="interviewStatusId" label="Interview Status" rules={zodRules(formSchema, "interviewStatusId")}>
          <Select placeholder="Select interview status" options={statusOptions} showSearch optionFilterProp="label" />
        </Form.Item>
        <Form.Item name="feedback" label="Feedback" rules={zodRules(formSchema, "feedback")}>
          <Input.TextArea rows={4} placeholder="Enter your feedback here..." />
        </Form.Item>
      </Form>
    </CandidateDrawer>
  );
}
