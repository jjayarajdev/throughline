"use client";

import React, { useEffect, useMemo, useState } from "react";
import * as z from "zod";
import dayjs, { type Dayjs } from "dayjs";
import { useQuery } from "@tanstack/react-query";
import { Button, Checkbox, Col, DatePicker, Divider, Flex, Form, Input, Row, Select, Space, Typography } from "antd";
import { ExclamationCircleOutlined } from "@ant-design/icons";
import { differenceInCalendarDays, isValid } from "date-fns";
import { MasterTypes } from "@/constants/masterTypes";
import { onboarding } from "@/services/api/onboarding.api";
import { validateWithZod, zodRules } from "@/lib/zodRules";

const itpcBaseSchema = z.object({
  pcRequestCreatedDate: z.string().min(1, "PC Request created date is required"),
  pcRequestRefNo: z.string().min(1, "PC Request Ref No. is required"),
  pcSerialNo: z.string(),
  pcAllocationDate: z.string(),
  modeOfPcShipmentId: z.string(),
  pcReceivedOn: z.string(),
  pcConfigurationDate: z.string(),
  itAssetStatusID: z.string(),
  complianceFollowedId: z.string(),
  delayCategoryId: z.string().optional(),
  comments: z.string(),

  isPCAllocated: z.boolean(),
  isJoinConfirmed: z.boolean().optional(),
});

const itpcSetupSchema = itpcBaseSchema.superRefine((data, ctx) => {
  if (data.isPCAllocated) {
    if (!data.pcAllocationDate.trim()) {
      ctx.addIssue({ path: ["pcAllocationDate"], code: z.ZodIssueCode.custom, message: "Pc Allocation Date is required" });
    }
    if (!data.pcSerialNo.trim()) {
      ctx.addIssue({ path: ["pcSerialNo"], code: z.ZodIssueCode.custom, message: "Pc Serial No Date is required" });
    }
  }
  if (data.isJoinConfirmed) {
    if (!data.modeOfPcShipmentId.trim()) {
      ctx.addIssue({ path: ["modeOfPcShipmentId"], code: z.ZodIssueCode.custom, message: "Mode of PC shipment is required" });
    }
    if (!data.pcReceivedOn.trim()) {
      ctx.addIssue({ path: ["pcReceivedOn"], code: z.ZodIssueCode.custom, message: "PC received on is required" });
    }
    if (!data.itAssetStatusID.trim()) {
      ctx.addIssue({ path: ["itAssetStatusID"], code: z.ZodIssueCode.custom, message: "IT Asset Status is required" });
    }
    if (!data.complianceFollowedId.trim()) {
      ctx.addIssue({ path: ["complianceFollowedId"], code: z.ZodIssueCode.custom, message: "Compliance Followed is required" });
    }
  }
});

type ITPCSetupFormValues = z.infer<typeof itpcSetupSchema>;
type ITPCSetupFormValuesWithId = ITPCSetupFormValues & { id?: string };

interface IProps {
  onSave: (data: ITPCSetupFormValuesWithId) => void;
  onboardingTimeline: Partial<ITPCSetupFormValuesWithId>;
  personalDetails: any;
}

type Option = { id: number | string; name: string };
const toOptions = (list: Option[] = []) => list.map((o) => ({ value: String(o.id), label: o.name }));

const dateItem = {
  getValueProps: (v?: string) => ({ value: v && dayjs(v).isValid() ? dayjs(v) : null }),
  normalize: (d: Dayjs | null) => (d ? d.format("YYYY-MM-DD") : ""),
};
const noPast = (d: Dayjs) => d.isBefore(dayjs(), "day");

const COMPLETED_ID = 64001;
const UNDER_PROGRESS_ID = 64002;

function ITPCSetup({ onSave, onboardingTimeline, personalDetails }: IProps) {
  const [form] = Form.useForm<ITPCSetupFormValues>();

  const initial = useMemo<ITPCSetupFormValues>(
    () => ({
      pcRequestCreatedDate: onboardingTimeline?.pcRequestCreatedDate || "",
      pcRequestRefNo: onboardingTimeline?.pcRequestRefNo || "",
      pcSerialNo: onboardingTimeline?.pcSerialNo || "",
      pcAllocationDate: onboardingTimeline?.pcAllocationDate || "",
      modeOfPcShipmentId: onboardingTimeline?.modeOfPcShipmentId?.toString() || "",
      pcReceivedOn: onboardingTimeline?.pcReceivedOn || "",
      pcConfigurationDate: onboardingTimeline?.pcConfigurationDate || "",
      itAssetStatusID: onboardingTimeline?.isPCAllocated ? onboardingTimeline.itAssetStatusID?.toString() || UNDER_PROGRESS_ID.toString() : "",
      complianceFollowedId: onboardingTimeline?.complianceFollowedId ? onboardingTimeline.complianceFollowedId.toString() : "79003",
      delayCategoryId: onboardingTimeline?.delayCategoryId?.toString() || "",
      comments: onboardingTimeline?.comments || "",
      isJoinConfirmed: onboardingTimeline?.isJoinConfirmed,
      isPCAllocated: onboardingTimeline?.isPCAllocated as boolean,
    }),
    [onboardingTimeline]
  );

  useEffect(() => {
    if (onboardingTimeline) form.setFieldsValue(initial);
  }, [onboardingTimeline, initial, form]);

  const { data: pcshipement = [] } = useQuery({
    queryKey: ["getEmployeeCategoryData", MasterTypes.PC_SHIPMENT_MODE],
    queryFn: async () => (await onboarding.getEmployeeCategory(MasterTypes.PC_SHIPMENT_MODE)).data,
    retry: 1,
  });
  const { data: itAssetStatus = [] } = useQuery({
    queryKey: ["getEmployeeItAssetStatus", MasterTypes.IT_ASSET_STATUS],
    queryFn: async () => (await onboarding.getEmployeeCategory(MasterTypes.IT_ASSET_STATUS)).data,
    retry: 1,
  });
  const { data: DELAY_CATEGORY = [] } = useQuery({
    queryKey: ["getDELAY_CATEGORY", MasterTypes.DELAY_CATEGORY],
    queryFn: async () => (await onboarding.getEmployeeCategory(MasterTypes.DELAY_CATEGORY)).data,
    retry: 1,
  });
  const { data: COMPLAINCE_FOLLOWED = [] } = useQuery({
    queryKey: ["getComplianceFollowedData", MasterTypes.COMPLAINCE_FOLLOWED],
    queryFn: () => onboarding.getEmployeeCategory(MasterTypes.COMPLAINCE_FOLLOWED).then((res) => res.data),
    retry: 1,
  });

  const joiningConformedId = Form.useWatch("isJoinConfirmed", form);
  const IsPCAllocatedId = Form.useWatch("isPCAllocated", form);
  const complianceFollowedId = Form.useWatch("complianceFollowedId", form);
  const pcReceivedOn = Form.useWatch("pcReceivedOn", form);
  const pcConfigurationDate = Form.useWatch("pcConfigurationDate", form);

  // compliance is derived from the received / configured dates (<= 3 days = On-Time)
  useEffect(() => {
    if (pcReceivedOn && pcConfigurationDate) {
      const receivedDate = new Date(pcReceivedOn);
      const configuredDate = new Date(pcConfigurationDate);
      if (isValid(receivedDate) && isValid(configuredDate)) {
        const days = differenceInCalendarDays(configuredDate, receivedDate);
        form.setFieldValue("complianceFollowedId", days <= 3 ? "79001" : "79002");
      }
    } else {
      form.setFieldValue("complianceFollowedId", "79003"); // Yet to Join
    }
  }, [pcReceivedOn, pcConfigurationDate, form]);

  useEffect(() => {
    const currentDelay = form.getFieldValue("delayCategoryId");
    if (complianceFollowedId === "79001" && currentDelay !== "69001") {
      form.setFieldValue("delayCategoryId", "69001");
    } else if (complianceFollowedId === "79004" && currentDelay !== "69008") {
      form.setFieldValue("delayCategoryId", "69008");
    }
  }, [complianceFollowedId, form]);

  const onFinish = (values: ITPCSetupFormValues) => {
    const data = validateWithZod(itpcSetupSchema, form, values);
    if (!data) return;
    onSave({
      delayCategoryId: data.delayCategoryId ? data.delayCategoryId : null,
      pcAllocationDate: data.pcAllocationDate ? data.pcAllocationDate : null,
      modeOfPcShipmentId: data.modeOfPcShipmentId ? data.modeOfPcShipmentId : null,
      pcReceivedOn: data.pcReceivedOn ? data.pcReceivedOn : null,
      pcConfigurationDate: data.pcConfigurationDate ? data.pcConfigurationDate : null,
      itAssetStatusID: data.isPCAllocated ? (data.itAssetStatusID ? data.itAssetStatusID : null) : null,
      complianceFollowedId: data.complianceFollowedId ? data.complianceFollowedId : null,
      pcSerialNo: data.pcSerialNo ? data.pcSerialNo : null,
      id: onboardingTimeline?.id,
      ...(data.isPCAllocated && { isPCAllocated: data.isPCAllocated }),
      ...(data.isJoinConfirmed && { isJoinConfirmed: data.isJoinConfirmed }),
      pcRequestCreatedDate: data.pcRequestCreatedDate ? data.pcRequestCreatedDate : null,
      pcRequestRefNo: data.pcRequestRefNo ? data.pcRequestRefNo : null,
      comments: data.comments ? data.comments : null,
    } as unknown as ITPCSetupFormValuesWithId);
  };

  return (
    <Form
      form={form}
      layout="vertical"
      initialValues={initial}
      onFinish={onFinish}
      onValuesChange={(changed) => {
        if ("pcConfigurationDate" in changed) {
          form.setFieldValue("itAssetStatusID", String(changed.pcConfigurationDate ? COMPLETED_ID : UNDER_PROGRESS_ID));
        }
      }}
    >
      <Divider titlePlacement="left">PC Request</Divider>
      <Row gutter={[16, 8]}>
        <Col xs={24} md={12}>
          <Form.Item name="pcRequestCreatedDate" label="PC Request Created Date" rules={zodRules(itpcBaseSchema, "pcRequestCreatedDate")} {...dateItem}>
            <DatePicker className="w-full" format="YYYY-MM-DD" disabledDate={noPast} />
          </Form.Item>
        </Col>
        <Col xs={24} md={12}>
          <Form.Item name="pcRequestRefNo" label="PC Request Ref No." rules={zodRules(itpcBaseSchema, "pcRequestRefNo")}>
            <Input placeholder="Enter reference number" />
          </Form.Item>
        </Col>
      </Row>

      <Divider titlePlacement="left">PC Allocation</Divider>
      <Flex justify="space-between" align="center" wrap gap={8} className="mb-2">
        <Form.Item name="isPCAllocated" valuePropName="checked" noStyle>
          <Checkbox>Is PC Allocated?</Checkbox>
        </Form.Item>
        <TatIndicator startDate={personalDetails?.dateOfJoining} endDate={onboardingTimeline?.pcAllocationDate} />
      </Flex>
      <Row gutter={[16, 8]}>
        <Col xs={24} md={12}>
          <Form.Item name="pcAllocationDate" label="PC Allocation Date" required={!!IsPCAllocatedId} {...dateItem}>
            <DatePicker className="w-full" format="YYYY-MM-DD" disabled={!IsPCAllocatedId} />
          </Form.Item>
        </Col>
        <Col xs={24} md={12}>
          <Form.Item name="pcSerialNo" label="PC Serial No." required={!!IsPCAllocatedId}>
            <Input placeholder="Enter PC serial number" disabled={!IsPCAllocatedId} />
          </Form.Item>
        </Col>
      </Row>

      <Divider titlePlacement="left">Confirm Joining prior allocating PC</Divider>
      <Flex justify="flex-end" className="mb-2">
        <TatIndicator startDate={personalDetails?.dateOfJoining} endDate={onboardingTimeline?.pcConfigurationDate} />
      </Flex>
      <Row gutter={[16, 8]}>
        <Col xs={24} md={12}>
          <Form.Item name="isJoinConfirmed" valuePropName="checked" label=" ">
            <Checkbox disabled>Joining Confirmed</Checkbox>
          </Form.Item>
        </Col>
        <Col xs={24} md={12}>
          <Form.Item name="modeOfPcShipmentId" label="Mode of PC Shipment" required={!!joiningConformedId}>
            <Select placeholder="Select Mode of PC Shipment" options={toOptions(pcshipement)} showSearch optionFilterProp="label" disabled={!joiningConformedId} allowClear />
          </Form.Item>
        </Col>
        <Col xs={24} md={12}>
          <Form.Item name="pcReceivedOn" label="PC Received On" required={!!joiningConformedId} {...dateItem}>
            <DatePicker className="w-full" format="YYYY-MM-DD" disabled={!joiningConformedId} disabledDate={noPast} />
          </Form.Item>
        </Col>
        <Col xs={24} md={12}>
          <Form.Item name="pcConfigurationDate" label="PC Configuration Date" {...dateItem}>
            <DatePicker className="w-full" format="YYYY-MM-DD" disabled={!joiningConformedId} disabledDate={noPast} />
          </Form.Item>
        </Col>
        <Col xs={24} md={12}>
          <Form.Item name="itAssetStatusID" label="IT Asset Status" required={!!joiningConformedId}>
            <Select placeholder="Select IT Asset Status" options={toOptions(itAssetStatus)} disabled />
          </Form.Item>
        </Col>
        <Col xs={24} md={12}>
          <PcTatSection pcReceivedOn={pcReceivedOn} pcConfigurationDate={pcConfigurationDate} />
        </Col>
      </Row>

      <Divider titlePlacement="left">Compliance</Divider>
      <Row gutter={[16, 8]}>
        <Col xs={24} md={12}>
          <Form.Item name="complianceFollowedId" label="Compliance Followed" required={!!joiningConformedId}>
            <Select placeholder="Select Followed" options={toOptions(COMPLAINCE_FOLLOWED)} showSearch optionFilterProp="label" disabled={!joiningConformedId} />
          </Form.Item>
        </Col>
        <Col xs={24} md={12}>
          <Form.Item name="delayCategoryId" label="Delay Category">
            <Select placeholder="Select Delay Category" options={toOptions(DELAY_CATEGORY)} showSearch optionFilterProp="label" disabled={!joiningConformedId} allowClear />
          </Form.Item>
        </Col>
        <Col xs={24}>
          <Form.Item name="comments" label="Comments">
            <Input.TextArea rows={4} placeholder="Enter any remarks or comments" disabled={!joiningConformedId} />
          </Form.Item>
        </Col>
      </Row>

      <Flex justify="flex-end">
        <Button type="primary" htmlType="submit">
          {onboardingTimeline?.id ? "Update" : "Submit"}
        </Button>
      </Flex>
    </Form>
  );
}

export default ITPCSetup;

/** TAT between the PC received and configured dates (today when not configured yet). */
export function PcTatSection({ pcReceivedOn, pcConfigurationDate }: { pcReceivedOn?: string; pcConfigurationDate?: string }) {
  const [tatDays, setTatDays] = useState<number | null>(null);
  const [showRedAlert, setShowRedAlert] = useState(false);

  useEffect(() => {
    if (pcReceivedOn) {
      const received = new Date(pcReceivedOn);
      const configured = pcConfigurationDate ? new Date(pcConfigurationDate) : new Date();
      if (isValid(received) && isValid(configured)) {
        const days = differenceInCalendarDays(configured, received);
        setTatDays(days);
        setShowRedAlert(days > 3);
        return;
      }
    }
    setTatDays(null);
    setShowRedAlert(false);
  }, [pcReceivedOn, pcConfigurationDate]);

  if (tatDays === null) return null;
  return (
    <Space className="mt-8">
      {showRedAlert && <ExclamationCircleOutlined />}
      <Typography.Text strong type={showRedAlert ? "danger" : "success"}>
        TAT: {tatDays} day{tatDays !== 1 ? "s" : ""}
        {showRedAlert && " (Exceeded 3 days!)"}
      </Typography.Text>
    </Space>
  );
}

/** "TAT: n days" between two dates, red when over `limitDays`. */
export function TatIndicator({
  startDate,
  endDate,
  limitDays = 3,
}: {
  startDate?: Date | string | null;
  endDate?: Date | string | null;
  limitDays?: number;
}) {
  const [tatDays, setTatDays] = useState<number | null>(null);
  const [showRedAlert, setShowRedAlert] = useState(false);

  useEffect(() => {
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      if (isValid(start) && isValid(end)) {
        const days = differenceInCalendarDays(end, start);
        setTatDays(days);
        setShowRedAlert(days > limitDays);
        return;
      }
    }
    setTatDays(null);
    setShowRedAlert(false);
  }, [startDate, endDate, limitDays]);

  return (
    <Typography.Text strong type={showRedAlert ? "danger" : "success"}>
      TAT
      {tatDays !== null && (
        <>
          : {tatDays} day{tatDays !== 1 ? "s" : ""}
          {showRedAlert && ` (Exceeded ${limitDays} days!)`}
        </>
      )}
    </Typography.Text>
  );
}
