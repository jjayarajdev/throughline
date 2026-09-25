"use client";
import { useState } from "react";
import { Alert, Button, Form, Input, Space, Typography } from "antd";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import * as z from "zod";
import { toast } from "@/lib/toast";
import { validateWithZod, zodRules } from "@/lib/zodRules";
import { slotApi } from "@/services/api/slot.api";
import { CandidateDetailsTypes } from "../types";
import { CandidateDrawer } from "./CandidateDrawer";
import { apiErrorMessage } from "../cells";

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

/** Partner accepts or rejects an interview slot proposed for their candidate. */
export function ParnterSlotsheet({ isOpen, onClose, selectedCandidate }: ScreeningSheetProps) {
  const [actionType, setActionType] = useState<"accept" | "reject" | null>(null);
  const queryClient = useQueryClient();
  const [form] = Form.useForm<FormValues>();

  const handleClose = () => {
    form.resetFields();
    setActionType(null);
    onClose();
  };

  const { mutate: acceptSlot, isPending, error } = useMutation({
    mutationKey: ["acceptSlot"],
    mutationFn: slotApi.acceptSlot,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["partnerSlot"] });
      toast.success(data?.message || "Screening status updated successfully");
      handleClose();
    },
    onError: () => setActionType(null),
  });

  const handleAction = async (status: boolean) => {
    setActionType(status ? "accept" : "reject");
    let values: FormValues;
    try {
      values = await form.validateFields();
    } catch {
      setActionType(null);
      return;
    }
    const data = validateWithZod(formSchema, form, values);
    if (!data) {
      setActionType(null);
      return;
    }
    if (!selectedCandidate?.candidateId) {
      toast.error("No candidate selected");
      return;
    }
    acceptSlot({
      interviewSlotId: selectedCandidate.interviewSlotId as any,
      isAccepted: status,
      comments: data.comment,
    });
  };

  return (
    <CandidateDrawer
      isOpen={isOpen}
      onClose={handleClose}
      candidate={selectedCandidate}
      title="Accept/Reject Slot"
      footer={
        selectedCandidate ? (
          <Space style={{ display: "flex", justifyContent: "flex-end" }}>
            <Button type="primary" disabled={isPending} loading={isPending && actionType === "accept"} onClick={() => handleAction(true)}>
              Accept Slot
            </Button>
            <Button danger disabled={isPending} loading={isPending && actionType === "reject"} onClick={() => handleAction(false)}>
              Reject Slot
            </Button>
          </Space>
        ) : null
      }
    >
      {error && <Alert type="error" showIcon className="mt-4" message={apiErrorMessage(error)} />}
      <Form form={form} layout="vertical" className="mt-6" initialValues={{ comment: "" }}>
        <Form.Item name="comment" label="Comments" rules={zodRules(formSchema, "comment")}>
          <Input.TextArea rows={4} placeholder="Enter your comment here..." />
        </Form.Item>
        <Typography.Text type="secondary" italic>
          Note: Please confirm after scheduling
        </Typography.Text>
      </Form>
    </CandidateDrawer>
  );
}
