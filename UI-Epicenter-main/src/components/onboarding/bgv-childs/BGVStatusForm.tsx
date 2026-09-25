"use client";

import React, { useEffect, useMemo } from "react";
import * as z from "zod";
import dayjs, { type Dayjs } from "dayjs";
import { useQuery } from "@tanstack/react-query";
import { Button, Card, Checkbox, Col, DatePicker, Flex, Form, Row, Select } from "antd";
import { FileDoneOutlined } from "@ant-design/icons";
import { MasterTypes } from "@/constants/masterTypes";
import { dropdownApi } from "@/services/api/master";
import { validateWithZod, zodRules } from "@/lib/zodRules";
import { AttachmentUpload } from "../upload-fields";

export const bgvStatusSchema = z.object({
  bgvStatusId: z.string().min(1, "BGV Status is required"),
  bgvCompletionDate: z.string().min(1, "Completion Date is required"),
  isBGVAvailableWithPartner: z.boolean({ required_error: "This field is required" }),
  bgvCategoryId: z.string({ required_error: "BGV Category selection is required" }),
  bgvAcknowledged: z.boolean().optional(),
  uploadBGVDoc: z.object({
    attachmentName: z.string({ required_error: "Attachment name is required" }).min(1, "Attachment name is required"),
    attachmentURL: z.string({ required_error: "Attachment URL is required" }).min(1, "Attachment URL is required"),
  }),
});

export type BGVStatusFormValues = z.infer<typeof bgvStatusSchema>;
interface Iprops {
  onSave: (data: any) => void;
  onboardingTimeline: any;
}

type Option = { id: number | string; name: string };
const toOptions = (list: Option[] = []) => list.map((o) => ({ value: String(o.id), label: o.name }));
const dateItem = {
  getValueProps: (v?: string) => ({ value: v && dayjs(v).isValid() ? dayjs(v) : null }),
  normalize: (d: Dayjs | null) => (d ? d.format("YYYY-MM-DD") : ""),
};
const noPast = (d: Dayjs) => d.isBefore(dayjs(), "day");

const BGVStatusForm = ({ onSave, onboardingTimeline }: Iprops) => {
  const [form] = Form.useForm<BGVStatusFormValues>();

  const initial = useMemo<BGVStatusFormValues>(
    () => ({
      isBGVAvailableWithPartner: onboardingTimeline?.isBGVAvailableWithPartner,
      bgvCompletionDate: onboardingTimeline?.bgvCompletionDate,
      bgvCategoryId: onboardingTimeline?.bgvCategoryId?.toString() || "",
      bgvStatusId: onboardingTimeline?.bgvStatusId?.toString() || "",
      uploadBGVDoc: {
        attachmentName: onboardingTimeline?.uploadBGVDoc?.attachmentName || "",
        attachmentURL: onboardingTimeline?.uploadBGVDoc?.attachmentURL || "",
      },
    }),
    [onboardingTimeline]
  );

  useEffect(() => {
    if (onboardingTimeline) form.setFieldsValue(initial);
  }, [onboardingTimeline, initial, form]);

  const isAcknowledged = Form.useWatch("isBGVAvailableWithPartner", form);

  const onFinish = (values: BGVStatusFormValues) => {
    const data = validateWithZod(bgvStatusSchema, form, values);
    if (!data) return;
    onSave({
      ...data,
      startDate: onboardingTimeline?.startDate,
      vendor: onboardingTimeline?.vendor,
      pguId: onboardingTimeline?.pguId?.toString() || null,
      ndaAvailability: onboardingTimeline?.ndaAvailability,
      cdaAvailability: onboardingTimeline?.cdaAvailability,
      ndaAvailabilityDoc: {
        attachmentName: onboardingTimeline?.ndaAvailabilityDoc?.attachmentName || null,
        attachmentURL: onboardingTimeline?.ndaAvailabilityDoc?.attachmentURL || null,
      },
      cdaAvailabilityDoc: {
        attachmentName: onboardingTimeline?.cdaAvailabilityDoc?.attachmentName || null,
        attachmentURL: onboardingTimeline?.cdaAvailabilityDoc?.attachmentURL || null,
      },
      id: onboardingTimeline?.id,
    });
  };

  const { data: bgvCategory = [] } = useQuery({
    queryKey: ["categoryPguData", MasterTypes.BGV_CATEGORY],
    queryFn: () => dropdownApi.fetchDropdown(MasterTypes.BGV_CATEGORY),
    retry: 1,
  });
  const { data: bgvStatusTypes = [] } = useQuery({
    queryKey: ["categoryPguData", MasterTypes.BGV_STATUS_TYPES],
    queryFn: () => dropdownApi.fetchDropdown(MasterTypes.BGV_STATUS_TYPES),
    retry: 1,
  });

  return (
    <Form form={form} layout="vertical" initialValues={initial} onFinish={onFinish} className="mt-6">
      <Card
        title={
          <span className="inline-flex items-center gap-2">
            <FileDoneOutlined /> BGV Status
          </span>
        }
      >
        <Form.Item name="isBGVAvailableWithPartner" valuePropName="checked">
          <Checkbox>Is BGV Available with Partner</Checkbox>
        </Form.Item>
        <Row gutter={[16, 8]}>
          <Col xs={24} md={12}>
            <Form.Item name="bgvStatusId" label="BGV Status" rules={zodRules(bgvStatusSchema, "bgvStatusId")}>
              <Select placeholder="Select Status" options={toOptions(bgvStatusTypes)} showSearch optionFilterProp="label" disabled={!isAcknowledged} />
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Form.Item name="bgvCategoryId" label="BGV Category" rules={zodRules(bgvStatusSchema, "bgvCategoryId")}>
              <Select placeholder="Select BGV Category" options={toOptions(bgvCategory)} showSearch optionFilterProp="label" disabled={!isAcknowledged} />
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Form.Item name="bgvCompletionDate" label="BGV Completion Date" rules={zodRules(bgvStatusSchema, "bgvCompletionDate")} {...dateItem}>
              <DatePicker className="w-full" format="YYYY-MM-DD" disabled={!isAcknowledged} disabledDate={noPast} />
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Form.Item name="uploadBGVDoc" label="Upload BGV" required>
              <AttachmentUpload disabled={!isAcknowledged} preview previewName="NDA File" />
            </Form.Item>
          </Col>
        </Row>
        <Flex justify="flex-end" className="pt-2">
          <Button type="primary" htmlType="submit" disabled={!isAcknowledged}>
            {onboardingTimeline?.isBGVAvailableWithPartner ? "Update" : "Submit"}
          </Button>
        </Flex>
      </Card>
    </Form>
  );
};

export default BGVStatusForm;
