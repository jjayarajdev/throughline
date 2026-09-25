"use client";
import React, { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import { Button, Card, Descriptions, Flex, Form, Input, Rate, Result, Select, Spin, Typography } from "antd";
import * as z from "zod";
import { toast } from "@/lib/toast";
import { validateWithZod, zodRules } from "@/lib/zodRules";
import { FeedbackPayload, slotApi } from "@/services/api/slot.api";
import { dropdownApi } from "@/services/api/master";
import { MasterTypes } from "@/constants/masterTypes";
import { formatDate } from "@/helpers/helper";

const formSchema = z.object({
  candidateInterviewStatus: z.number().min(1, "Status is required"),
  feedback: z.array(
    z.object({
      criteriaOptionId: z.number(),
      rating: z.number().min(1, "Rating is required").max(5, "Max rating is 5"),
      comments: z.string().min(1, "Detailed feedback is required"),
    })
  ),
});

type FormValues = z.infer<typeof formSchema>;

type CriteriaOption = { id: number; name: string };

type InterviewGetResponse = {
  interviewSlotId: number;
  candidateId: number;
  candidateName: string;
  candidateCode: string;
  interviewRoundNumber: number;
  interviewPanelMember: string;
  interviewPanelNames?: string;
  interviewDate: string;
  interviewType: { id: number; name: string };
  interviewMode: { id: number; name: string };
  candidateInterviewStatus: { id: number; name: string };
  feedbackCategory: { id: number; name: string };
  feedbackCritriaOptions: CriteriaOption[];
};

type PanelFeedbackResponse = {
  status: boolean;
  statusCode: string;
  message: string;
  data?: InterviewGetResponse;
};

const RATING_LABELS = ["Poor", "Below Average", "Average", "Good", "Excellent"];

/** Panel member's feedback form for one interview slot (/panel-feedback/[id]). */
export default function Page() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [submitted, setSubmitted] = useState(false);
  const [form] = Form.useForm<FormValues>();

  const { data: queryData, isLoading: fetching } = useQuery<PanelFeedbackResponse>({
    queryKey: ["getPanelFeedback", params.id],
    queryFn: () => slotApi.getpanelFeedback(Number(params.id)),
    enabled: Boolean(params.id),
  });

  const interviewData = queryData?.data;

  useEffect(() => {
    if (interviewData) {
      form.setFieldsValue({
        feedback: interviewData.feedbackCritriaOptions.map((opt) => ({ criteriaOptionId: opt.id, rating: 0, comments: "" })),
      });
    }
  }, [interviewData, form]);

  const { data: interviewStatus = [] } = useQuery({
    queryKey: ["interviewStatus"],
    queryFn: () => dropdownApi.fetchDropdown(MasterTypes.INTERVIEW_STATUS),
  });

  const { mutate: panelFeedbackSubmit, isPending } = useMutation({
    mutationFn: (values: FeedbackPayload) => slotApi.submitPanelFeedback(values),
    onSuccess: (data) => {
      toast.success(data?.message || "Feedback Submitted successfully");
      setSubmitted(true);
      queryClient.invalidateQueries({ queryKey: ["feedbackPending", params.id] });
    },
    onError: (error) => {
      toast.error("Failed to update hiring");
      console.error("Error updating hiring:", error);
    },
  });

  const onFinish = (raw: FormValues) => {
    const values = validateWithZod(formSchema, form, raw);
    if (!values || !interviewData) return;
    const payload = values.feedback.map((f) => ({
      interviewSlotId: interviewData.interviewSlotId,
      candidateId: interviewData.candidateId,
      candidateInterviewStatusId: values.candidateInterviewStatus,
      criteriaOptionId: f.criteriaOptionId,
      rating: f.rating,
      comments: f.comments ?? "",
      isActive: true,
    }));
    panelFeedbackSubmit(payload as any);
  };

  if (submitted) {
    return (
      <Flex align="center" justify="center" style={{ minHeight: "100vh" }} className="p-4">
        <Result
          status="success"
          title="Thank you for your feedback!"
          extra={
            <Button type="primary" onClick={() => router.back()}>
              Close
            </Button>
          }
        />
      </Flex>
    );
  }

  if (fetching) {
    return (
      <Flex align="center" justify="center" style={{ minHeight: "100vh" }}>
        <Spin size="large" />
      </Flex>
    );
  }

  if (!queryData || queryData.status === false || !interviewData) {
    return (
      <Flex align="center" justify="center" style={{ minHeight: "100vh" }} className="p-4">
        <Result status="error" title={queryData?.message || "Failed to load feedback form."} subTitle="Please check the link or contact support if the issue persists." />
      </Flex>
    );
  }

  const statusOptions = (interviewStatus as { id: number; name: string }[])
    .filter((s) => s.name === "Selected" || s.name === "Rejected" || s.name === "Onhold")
    .map((s) => ({ value: s.id, label: s.name }));

  return (
    <Flex vertical gap={16} className="p-4" style={{ maxWidth: 960, margin: "0 auto" }}>
      <Typography.Title level={4} style={{ margin: 0 }}>
        Interview Feedback Form
      </Typography.Title>
      <Descriptions bordered size="small" column={{ xs: 1, md: 2 }}>
        <Descriptions.Item label="Candidate Name">{interviewData.candidateName}</Descriptions.Item>
        <Descriptions.Item label="Schedule">{formatDate(interviewData.interviewDate)}</Descriptions.Item>
        <Descriptions.Item label="Candidate ID">{interviewData.candidateCode}</Descriptions.Item>
        <Descriptions.Item label="Type">{interviewData.interviewType?.name}</Descriptions.Item>
        <Descriptions.Item label="Round">{interviewData.interviewRoundNumber}</Descriptions.Item>
        <Descriptions.Item label="Mode">{interviewData.interviewMode?.name}</Descriptions.Item>
        <Descriptions.Item label="Panel">{interviewData.interviewPanelNames ?? interviewData.interviewPanelMember}</Descriptions.Item>
      </Descriptions>

      <Card>
        <Spin spinning={isPending}>
          <Form
            form={form}
            layout="vertical"
            onFinish={onFinish}
            initialValues={{
              candidateInterviewStatus: interviewData.candidateInterviewStatus?.id ?? 0,
              feedback: interviewData.feedbackCritriaOptions.map((opt) => ({ criteriaOptionId: opt.id, rating: 0, comments: "" })),
            }}
          >
            <Form.Item name="candidateInterviewStatus" label="Interview Status" rules={zodRules(formSchema, "candidateInterviewStatus")}>
              <Select placeholder="Select status…" options={statusOptions} style={{ maxWidth: 320 }} />
            </Form.Item>

            <Flex vertical gap={16}>
              {interviewData.feedbackCritriaOptions.map((opt, idx) => (
                <Card key={opt.id} size="small" title={opt.name}>
                  <Form.Item name={["feedback", idx, "criteriaOptionId"]} hidden>
                    <Input />
                  </Form.Item>
                  <Form.Item
                    name={["feedback", idx, "rating"]}
                    label="Rating"
                    rules={[{ validator: async (_, v) => (v >= 1 ? undefined : Promise.reject(new Error("Rating is required"))) }]}
                  >
                    <Rate tooltips={RATING_LABELS} />
                  </Form.Item>
                  <Form.Item name={["feedback", idx, "comments"]} label="Detailed feedback" rules={[{ required: true, message: "Detailed feedback is required" }]}>
                    <Input.TextArea rows={3} placeholder="Enter your detailed feedback here..." />
                  </Form.Item>
                </Card>
              ))}
            </Flex>

            <Flex justify="flex-end" className="mt-6">
              <Button type="primary" htmlType="submit" loading={isPending}>
                Submit Feedback
              </Button>
            </Flex>
          </Form>
        </Spin>
      </Card>
    </Flex>
  );
}
