"use client";
import { Alert, Button, Form, Input, Radio, Space } from "antd";
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
        ctx.addIssue({ path: ["comment"], code: z.ZodIssueCode.custom, message: "Comment is required when interview is completed" });
      }
    } else {
      if (!data.action) {
        ctx.addIssue({ path: ["action"], code: z.ZodIssueCode.custom, message: "Action is required if candidate was not interviewed" });
      }
      if (!data.initiatedBy) {
        ctx.addIssue({ path: ["initiatedBy"], code: z.ZodIssueCode.custom, message: "Initiator is required if candidate was not interviewed" });
      }
      if (!data.comment || data.comment.trim() === "") {
        ctx.addIssue({ path: ["comment"], code: z.ZodIssueCode.custom, message: "Comment is required when candidate was not interviewed" });
      }
    }
  });
const baseSchema = formSchema._def.schema;

type FormValues = z.infer<typeof formSchema>;

/** Partner confirms whether a scheduled interview happened (or was rescheduled / dropped, and by whom). */
export function PartnerConfirmsheet({ isOpen, onClose, selectedCandidate }: ScreeningSheetProps) {
  const queryClient = useQueryClient();
  const [form] = Form.useForm<FormValues>();
  const interviewed = Form.useWatch("interviewed", form);

  const handleClose = () => {
    form.resetFields();
    onClose();
  };

  const { mutate: confirmInterview, isPending, error } = useMutation({
    mutationKey: ["confirmInterview"],
    mutationFn: slotApi.confirmInterview,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["partnerSlot"] });
      toast.success(data?.message || "Screening status updated successfully");
      handleClose();
    },
    onError: (err: any) => {
      toast.error(err?.message || "Failed to process screening");
      console.error("Error in screening:", err);
    },
  });

  const onFinish = (values: FormValues) => {
    const data = validateWithZod(formSchema, form, values);
    if (!data) return;
    if (!selectedCandidate?.interviewSlotId) {
      toast.error("No candidate selected");
      return;
    }
    confirmInterview({
      interviewSlotId: selectedCandidate.interviewSlotId,
      isInterviewCompleted: data.interviewed === "yes",
      resheduledOrDropped: data.interviewed === "no" ? (data.action === "reschedule" ? 1 : 2) : 0,
      resheduleIntiatedBy: data.interviewed === "no" ? (data.initiatedBy === "candidate" ? 1 : 2) : 0,
      partnerInterviewCompletedComments: data.comment || "",
    });
  };

  return (
    <CandidateDrawer
      isOpen={isOpen}
      onClose={handleClose}
      candidate={selectedCandidate}
      title="Scheduled Interview Confirmation"
      footer={
        selectedCandidate ? (
          <Space style={{ display: "flex", justifyContent: "flex-end" }}>
            <Button type="primary" loading={isPending} onClick={() => form.submit()}>
              Submit
            </Button>
          </Space>
        ) : null
      }
    >
      {error && <Alert type="error" showIcon className="mt-4" message={apiErrorMessage(error)} />}
      <Form
        form={form}
        layout="vertical"
        className="mt-6"
        onFinish={onFinish}
        initialValues={{ interviewed: "yes", comment: "", action: undefined, initiatedBy: undefined }}
      >
        <Form.Item name="interviewed" label="Was the candidate interviewed?" rules={zodRules(baseSchema, "interviewed")}>
          <Radio.Group
            options={[
              { value: "yes", label: "Yes" },
              { value: "no", label: "No" },
            ]}
          />
        </Form.Item>
        {interviewed === "no" && (
          <>
            <Form.Item name="action" label="Action">
              <Radio.Group
                options={[
                  { value: "reschedule", label: "Reschedule" },
                  { value: "drop", label: "Drop" },
                ]}
              />
            </Form.Item>
            <Form.Item name="initiatedBy" label="Initiated By">
              <Radio.Group
                options={[
                  { value: "candidate", label: "Candidate" },
                  { value: "panel", label: "Panel" },
                ]}
              />
            </Form.Item>
          </>
        )}
        <Form.Item name="comment" label="Comments" required>
          <Input.TextArea rows={4} placeholder="Enter your comment here..." />
        </Form.Item>
      </Form>
    </CandidateDrawer>
  );
}
