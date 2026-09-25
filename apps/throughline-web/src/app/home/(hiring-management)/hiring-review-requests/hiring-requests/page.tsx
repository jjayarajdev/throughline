"use client";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Button, Card, Descriptions, Flex, Form, Input, Modal, Result, Space, Spin, Typography } from "antd";
import { format } from "date-fns";
import * as z from "zod";
import { toast } from "@/lib/toast";
import { validateWithZod, zodRules } from "@/lib/zodRules";
import { hiringApi } from "@/services/api/hiring.api";
import { errorMessage, PathBreadcrumb } from "@/components/hiring-forms/shared";
import Loading from "./loading";

const schema = z.object({
  comments: z.string().nonempty({ message: "Comments are required" }),
});

type FormValues = z.infer<typeof schema>;
type ApprovalPayload = { id: number; approverComments: string; approvalStatusId: number; proceedToCancelChildHrqs?: boolean };

/** Approve / reject a review request (`?id=&statusId=`); rejecting a parent HRQ asks to cancel its children. */
export default function ApprovalPage() {
  const [form] = Form.useForm<FormValues>();
  const searchParams = useSearchParams();
  const router = useRouter();
  const hiring = searchParams.get("id");
  const statusid = searchParams.get("statusId");
  const [showDialog, setShowDialog] = useState(false);
  const [pendingPayload, setPendingPayload] = useState<ApprovalPayload | null>(null);

  const { data: hiringDetailsBYID, isLoading, error } = useQuery({
    queryKey: ["hiringDetailsBYID", Number(hiring)],
    queryFn: () => hiringApi.gethiringDetailByID(Number(hiring)),
  });

  const { mutate: ApproveBinToCart, isPending } = useMutation({
    mutationKey: ["ApproveBinToCart"],
    mutationFn: hiringApi.ApprovedBintoCart,
    onSuccess: (data) => {
      toast.success(data?.message || "approved successfull");
      router.back();
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || "Something went wrong, please try again later.");
    },
  });

  const onFinish = (raw: FormValues) => {
    const values = validateWithZod(schema, form, raw);
    if (!values) return;
    const payload: ApprovalPayload = {
      id: Number(hiring),
      approverComments: values?.comments,
      approvalStatusId: Number(statusid),
    };
    if (statusid == "32002" && hiringDetailsBYID?.isParentHRQ) {
      setPendingPayload(payload);
      setShowDialog(true);
    } else {
      ApproveBinToCart(payload);
    }
  };

  const handleConfirm = () => {
    if (pendingPayload) {
      ApproveBinToCart({ ...pendingPayload, proceedToCancelChildHrqs: true } as any);
      setPendingPayload(null);
    }
    setShowDialog(false);
  };

  const handleCancel = () => {
    setPendingPayload(null);
    setShowDialog(false);
    router.back();
  };

  if (isLoading) return <Loading />;
  if (error) return <Result status="error" title="Could not load hiring request" subTitle={errorMessage(error)} />;

  const d: any = hiringDetailsBYID;

  return (
    <Flex vertical gap={16} className="p-4">
      <PathBreadcrumb />
      <Typography.Title level={4} style={{ margin: 0 }}>
        Approval Page
      </Typography.Title>
      <Spin spinning={isPending}>
        <Form form={form} layout="vertical" onFinish={onFinish} initialValues={{ comments: "" }}>
          <Flex vertical gap={16}>
            <Card title="Hiring Details">
              <Descriptions
                bordered
                size="small"
                column={{ xs: 1, md: 2, xl: 4 }}
                items={[
                  { key: "jobTitle", label: "Role Hired For", children: d?.jobTitle },
                  { key: "hiringManagerName", label: "Hiring Manager", children: d?.hiringManagerName },
                  { key: "hrqId", label: "HRQ ID", children: d?.hrqId },
                  { key: "rcMsProjectId", label: "RCMS Project ID", children: d?.rcMsProjectId },
                  { key: "rcMsResourceRequestId", label: "RCMS Resource Request ID", children: d?.rcMsResourceRequestId },
                  { key: "projectName", label: "Project Name", children: d?.projectName },
                  { key: "requestStartDate", label: "Request Start Date", children: d?.requestStartDate ? format(new Date(d.requestStartDate), "yyyy/MM/dd") : "-" },
                  { key: "requestCreationDate", label: "Req Creation Date", children: d?.requestCreationDate ? format(new Date(d.requestCreationDate), "yyyy/MM/dd") : "-" },
                  { key: "businessName", label: "Business", children: d?.businessName },
                  { key: "hiringTypeName", label: "Hiring Type", children: d?.hiringTypeName },
                  { key: "projectDurationMonths", label: "Project Duration (Months)", children: `${d?.projectDurationMonths} Months` },
                  { key: "hiringStatusName", label: "Status", children: d?.hiringStatusName },
                ]}
              />
            </Card>

            <Form.Item name="comments" label="Comments" rules={zodRules(schema, "comments")}>
              <Input.TextArea rows={4} placeholder="Enter comments" />
            </Form.Item>

            <Flex justify="flex-end">
              <Button type="primary" htmlType="submit" loading={isPending} danger={statusid == "32002"}>
                {isPending ? "Processing..." : statusid == "32002" ? "Reject" : "Approve"}
              </Button>
            </Flex>
          </Flex>
        </Form>
      </Spin>

      <Modal
        open={showDialog}
        title="Confirmation"
        onCancel={handleCancel}
        footer={
          <Space>
            <Button onClick={handleCancel}>No</Button>
            <Button type="primary" onClick={handleConfirm}>
              Yes
            </Button>
          </Space>
        }
      >
        Please confirm if you would like to reject this HRQID and its associated child records
      </Modal>
    </Flex>
  );
}
