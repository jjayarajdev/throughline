"use client";
import { useState } from "react";
import { Button, Form, Input, Space } from "antd";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import * as z from "zod";
import { toast } from "@/lib/toast";
import { validateWithZod, zodRules } from "@/lib/zodRules";
import { slotApi } from "@/services/api/slot.api";
import { CandidateDetailsTypes } from "../types";
import { CandidateDrawer } from "./CandidateDrawer";

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

/** Accept / reject a candidate's screening or assessment round with a comment. */
export function ScreeningSheet({ isOpen, onClose, selectedCandidate }: ScreeningSheetProps) {
  const [actionType, setActionType] = useState<"accept" | "reject" | null>(null);
  const queryClient = useQueryClient();
  const [form] = Form.useForm<FormValues>();

  const handleClose = () => {
    form.resetFields();
    setActionType(null);
    onClose();
  };

  const { mutate: handleScreening, isPending } = useMutation({
    mutationKey: ["createSlot"],
    mutationFn: slotApi.screeningAccept,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["screeningData"] });
      toast.success(data?.message || "Screening status updated successfully");
      handleClose();
    },
    onError: (error: any) => {
      toast.error(error?.message || "Failed to process screening");
      console.error("Error in screening:", error);
      setActionType(null);
    },
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
    handleScreening({
      candidateId: selectedCandidate.candidateId,
      currentRoundId: selectedCandidate.currentRoundId ?? 0,
      screeningStatus: status,
      comments: data.comment,
    });
  };

  return (
    <CandidateDrawer
      isOpen={isOpen}
      onClose={handleClose}
      candidate={selectedCandidate}
      title="Screening Details"
      footer={
        selectedCandidate ? (
          <Space style={{ display: "flex", justifyContent: "flex-end" }}>
            <Button type="primary" disabled={isPending} loading={isPending && actionType === "accept"} onClick={() => handleAction(true)}>
              Accept
            </Button>
            <Button danger disabled={isPending} loading={isPending && actionType === "reject"} onClick={() => handleAction(false)}>
              Reject
            </Button>
          </Space>
        ) : null
      }
    >
      <Form form={form} layout="vertical" className="mt-6" initialValues={{ comment: "" }}>
        <Form.Item name="comment" label="Screening Comments" rules={zodRules(formSchema, "comment")}>
          <Input.TextArea rows={4} placeholder="Enter your screening feedback here..." />
        </Form.Item>
      </Form>
    </CandidateDrawer>
  );
}
