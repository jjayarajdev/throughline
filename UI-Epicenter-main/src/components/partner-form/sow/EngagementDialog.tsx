"use client";
import { useEffect, useState } from "react";
import { Button, DatePicker, Divider, Drawer, Form, Input, List, Select, Space, Typography } from "antd";
import type { FormInstance } from "antd";
import { useQuery } from "@tanstack/react-query";
import dayjs from "dayjs";
import { dropdownApi } from "@/services/api/master";
import { MasterTypes } from "@/constants/masterTypes";
import { engagementFormSchema, partnerApi } from "@/services/api/partner.profile.api";
import { validateWithZod, zodRules } from "@/lib/zodRules";
import { useDebounce } from "@/lib/useDebounce";
import { formatDate } from "@/helpers/helper";

type EvalSidebarProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** the parent's evaluation form; its stored values are merged with this drawer's fields on submit */
  evaluationForm: FormInstance<any>;
  onSubmit: (data: any) => void;
  actionType: "extended" | "completed" | null;
  completedOptions: { id: number; name: string }[];
  selectedEngagement: any;
};

/** Form values keep dates as `YYYY-MM-DD` strings (the shape the zod schema and API expect). */
const dateItemProps = {
  getValueProps: (v: string | undefined) => ({ value: v ? dayjs(v) : null }),
  normalize: (d: dayjs.Dayjs | null) => (d ? d.format("YYYY-MM-DD") : ""),
};

/** Side drawer to extend or complete/reject an evaluation, with the extension history. */
export const EvaluationSidebarOnly = ({ open, onOpenChange, evaluationForm, onSubmit, actionType, completedOptions, selectedEngagement }: EvalSidebarProps) => {
  const [form] = Form.useForm();
  const evalStatus = Form.useWatch("evaluationStatusId", form);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchText] = useState("");
  const debouncedSearch = useDebounce(searchText, 300);
  const [pageSize, setPageSize] = useState(50);

  // seed the drawer's fields from the parent's evaluation form each time it opens
  useEffect(() => {
    if (!open) return;
    const base = evaluationForm.getFieldsValue(true) as Record<string, any>;
    form.setFieldsValue({
      evaluationStatusId: base.evaluationStatusId,
      evaluationExtendedDate: base.evaluationExtendedDate || "",
      extendedComments: base.extendedComments || "",
      rejectionReasonId: base.rejectionReasonId || "",
      rejectionReason: base.rejectionReason || "",
    });
  }, [open, evaluationForm, form]);

  const { data: rejectionReasons = [] } = useQuery({
    queryKey: ["rejectionReason"],
    queryFn: () => dropdownApi.fetchDropdown(MasterTypes.REJECTION_REASON),
  });

  const { data: getEngagementDetails, isPending } = useQuery({
    queryKey: ["getEngagement", selectedEngagement?.id, currentPage, debouncedSearch, pageSize],
    queryFn: () =>
      partnerApi.getEvaluationExtended(selectedEngagement?.id, {
        pageNumber: currentPage,
        pageSize,
        searchText: debouncedSearch || undefined,
      }),
    enabled: !!selectedEngagement?.id,
    refetchOnWindowFocus: true,
  });

  const getEngagementData: any[] = getEngagementDetails?.items || [];

  const handleCancel = () => {
    evaluationForm.setFieldsValue({ evaluationExtendedDate: "", extendedComments: "" });
    onOpenChange(false);
  };

  const onFinish = (values: any) => {
    const merged = { ...(evaluationForm.getFieldsValue(true) as Record<string, any>), ...values };
    const data = validateWithZod(engagementFormSchema, form, merged);
    if (!data) return;
    onSubmit(data);
  };

  return (
    <Drawer
      open={open}
      onClose={handleCancel} size="large"
      destroyOnHidden
      title={actionType === "extended" ? "Extend evaluation" : "Complete evaluation"}
      footer={
        <Space style={{ display: "flex", justifyContent: "flex-end" }}>
          <Button onClick={handleCancel}>Cancel</Button>
          <Button type="primary" onClick={() => form.submit()}>
            Submit
          </Button>
        </Space>
      }
    >
      <Form form={form} layout="vertical" onFinish={onFinish}>
        {actionType === "extended" && (
          <>
            <Form.Item
              name="evaluationExtendedDate"
              label="Evaluation Extended Date"
              rules={[{ required: true, message: "Extended date is required" }]}
              {...dateItemProps}
            >
              <DatePicker className="w-full" format="YYYY-MM-DD" disabledDate={(d) => d.isBefore(dayjs().startOf("day"))} />
            </Form.Item>
            <Form.Item name="extendedComments" label="Evaluation Extended Comments" rules={[{ required: true, message: "Comments are required" }]}>
              <Input placeholder="Enter extended comments" maxLength={150} />
            </Form.Item>
          </>
        )}

        {actionType === "completed" && (
          <>
            <Form.Item name="evaluationStatusId" label="Evaluation Status" rules={zodRules(engagementFormSchema.innerType(), "evaluationStatusId")}>
              <Select placeholder="Select Status" options={completedOptions.map((o) => ({ value: String(o.id), label: o.name }))} />
            </Form.Item>
            {evalStatus === "11004" && (
              <>
                <Form.Item name="rejectionReasonId" label="Reasons of rejection" rules={[{ required: true, message: "Rejection reason is required" }]}>
                  <Select
                    placeholder="Enter reason of rejection"
                    showSearch
                    optionFilterProp="label"
                    options={(rejectionReasons as { id: number; name: string }[]).map((o) => ({ value: String(o.id), label: o.name }))}
                  />
                </Form.Item>
                <Form.Item name="rejectionReason" label="Rejection Comments" rules={[{ required: true, message: "Rejection note is required" }]}>
                  <Input placeholder="Enter rejection comments" />
                </Form.Item>
              </>
            )}
          </>
        )}
      </Form>

      {actionType === "extended" && (
        <>
          <Divider titlePlacement="left">Evaluation Extension History</Divider>
          <List
            loading={isPending && !!selectedEngagement?.id}
            dataSource={getEngagementData}
            locale={{ emptyText: "No records found" }}
            pagination={{
              current: currentPage,
              pageSize,
              total: getEngagementDetails?.totalCount ?? 0,
              showSizeChanger: true,
              onChange: (page, size) => {
                setCurrentPage(page);
                if (size !== pageSize) setPageSize(size);
              },
            }}
            renderItem={(candidate: any) => (
              <List.Item key={candidate.id}>
                <Space direction="vertical" size={2}>
                  <Typography.Text>
                    <Typography.Text strong>Extended By:</Typography.Text> {candidate?.createdUserName || "-"}
                  </Typography.Text>
                  <Typography.Text>
                    <Typography.Text strong>Extended Date:</Typography.Text> {formatDate(candidate?.evaluationExtendedDate)}
                  </Typography.Text>
                  <Typography.Text>
                    <Typography.Text strong>Comments:</Typography.Text>{" "}
                    {candidate?.extendedComments
                      ? candidate.extendedComments.length > 250
                        ? `${candidate.extendedComments.slice(0, 250)}...`
                        : candidate.extendedComments
                      : "-"}
                  </Typography.Text>
                </Space>
              </List.Item>
            )}
          />
        </>
      )}
    </Drawer>
  );
};
