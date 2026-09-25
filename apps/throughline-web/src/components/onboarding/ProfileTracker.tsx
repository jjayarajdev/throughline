"use client";

import React, { useEffect, useMemo, useState } from "react";
import * as z from "zod";
import dayjs, { type Dayjs } from "dayjs";
import { Button, Checkbox, Col, DatePicker, Flex, Form, Input, Row, Space } from "antd";
import { toast } from "@/lib/toast";
import { validateWithZod, zodRules } from "@/lib/zodRules";
import api from "@/lib/axiosInstance";

const employmentBaseSchema = z.object({
  profileCreatedOn: z.string().min(1, { message: "Profile Created On is required" }),
  smartProfileId: z.string().min(1, "Smart Profile ID must be required"),
  profileApprovalDate: z.string().min(1, { message: "Profile Approval Date is required" }),
  lhccCode: z.string().min(1, { message: "LHCC is required" }),
  costCenterName: z.string().min(1, { message: "Cost Center is required" }),

  employeeNameAsPerId: z.string(),
  employeeId: z.string(),

  hpeEmailId: z.string(),
  isEmployeeIdGenerated: z.boolean(),
});

export const employmentFormSchema = employmentBaseSchema.superRefine((data, ctx) => {
  if (data.isEmployeeIdGenerated) {
    if (!data.employeeNameAsPerId || data.employeeNameAsPerId.trim() === "") {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Employee Name is required", path: ["employeeNameAsPerId"] });
    }
    if (!data.employeeId || !/^\d{8}$/.test(data.employeeId)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Employee ID must be exactly 8 digits", path: ["employeeId"] });
    }
    if (!data.hpeEmailId || !/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(data.hpeEmailId)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Enter a valid company email address", path: ["hpeEmailId"] });
    }
  }
});

type EmploymentFormValues = z.infer<typeof employmentFormSchema>;
type ITPCSetupFormValuesWithId = EmploymentFormValues & { id?: string };

interface IProps {
  onSave: (data: ITPCSetupFormValuesWithId) => void;
  onboardingTimeline: Partial<ITPCSetupFormValuesWithId>;
}

/** Form value is a `YYYY-MM-DD` string; the picker works with dayjs. */
const dateItem = {
  getValueProps: (v?: string) => ({ value: v && dayjs(v).isValid() ? dayjs(v) : null }),
  normalize: (d: Dayjs | null) => (d ? d.format("YYYY-MM-DD") : ""),
};
const noPast = (d: Dayjs) => d.isBefore(dayjs(), "day");

function ProfileTracker({ onSave, onboardingTimeline }: IProps) {
  const [form] = Form.useForm<EmploymentFormValues>();
  const [loadingEmpValidation, setLoadingEmpValidation] = useState(false);

  const initial = useMemo<EmploymentFormValues>(
    () => ({
      profileCreatedOn: onboardingTimeline?.profileCreatedOn || "",
      smartProfileId: onboardingTimeline?.smartProfileId || "",
      profileApprovalDate: onboardingTimeline?.profileApprovalDate || "",
      lhccCode: onboardingTimeline?.lhccCode || "",
      costCenterName: onboardingTimeline?.costCenterName || "",
      employeeNameAsPerId: onboardingTimeline?.employeeNameAsPerId || "",
      employeeId: onboardingTimeline?.employeeId?.toString() || "",
      hpeEmailId: onboardingTimeline?.hpeEmailId || "",
      isEmployeeIdGenerated: onboardingTimeline?.isEmployeeIdGenerated || false,
    }),
    [onboardingTimeline]
  );

  useEffect(() => {
    if (onboardingTimeline) form.setFieldsValue(initial);
  }, [onboardingTimeline, initial, form]);

  const watchIsGenerated = Form.useWatch("isEmployeeIdGenerated", form);

  const onFinish = (values: EmploymentFormValues) => {
    const data = validateWithZod(employmentFormSchema, form, values);
    if (!data) return;
    onSave({
      id: onboardingTimeline?.id,
      profileCreatedOn: data.profileCreatedOn ? data.profileCreatedOn : null,
      smartProfileId: data.smartProfileId ? data.smartProfileId : null,
      profileApprovalDate: data.profileApprovalDate ? data.profileApprovalDate : null,
      lhccCode: data.lhccCode ? data.lhccCode : null,
      costCenterName: data.costCenterName ? data.costCenterName : null,
      employeeNameAsPerId: data.employeeNameAsPerId ? data.employeeNameAsPerId : null,
      employeeId: data.employeeId?.toString().trim() ? Number(data.employeeId) : null,
      hpeEmailId: data.hpeEmailId ? data.hpeEmailId : null,
      isEmployeeIdGenerated: data.isEmployeeIdGenerated ? data.isEmployeeIdGenerated : null,
    } as unknown as ITPCSetupFormValuesWithId);
  };

  const getEmployeeDetailsById = async (employeeId: string) => {
    const response = await api.get(`/User/emp-details-by-emp-code?empCode=${employeeId}`);
    return response.data;
  };

  const validateEmployeeId = async () => {
    const empId = (form.getFieldValue("employeeId") as string | undefined)?.trim() ?? "";
    if (!/^\d{8}$/.test(empId)) {
      toast.error("Employee ID must be exactly 8 digits");
      return;
    }
    try {
      setLoadingEmpValidation(true);
      const data = await getEmployeeDetailsById(empId);
      if (!data?.status) {
        toast.error(data?.message || "No employee details found. You can enter them manually.");
        form.setFieldsValue({ employeeNameAsPerId: "", hpeEmailId: "" });
        return;
      }
      form.setFieldsValue({ employeeNameAsPerId: data.employeeNameAsPerId || "", hpeEmailId: data.hpeEmailId || "" });
      toast.success("Employee details fetched successfully");
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to validate Employee ID");
    } finally {
      setLoadingEmpValidation(false);
    }
  };

  return (
    <Form form={form} layout="vertical" initialValues={initial} onFinish={onFinish} className="mt-4">
      <Row gutter={[16, 8]}>
        <Col xs={24} md={12}>
          <Form.Item name="profileCreatedOn" label="Profile Created On" rules={zodRules(employmentBaseSchema, "profileCreatedOn")} {...dateItem}>
            <DatePicker className="w-full" format="YYYY-MM-DD" disabledDate={noPast} />
          </Form.Item>
        </Col>
        <Col xs={24} md={12}>
          <Form.Item name="smartProfileId" label="Smart Profile ID" rules={zodRules(employmentBaseSchema, "smartProfileId")}>
            <Input placeholder="Enter Smart Profile ID" maxLength={8} />
          </Form.Item>
        </Col>
        <Col xs={24} md={12}>
          <Form.Item name="lhccCode" label="LHCC (IN97/IN99)" rules={zodRules(employmentBaseSchema, "lhccCode")}>
            <Input placeholder="Enter LHCC code" />
          </Form.Item>
        </Col>
        <Col xs={24} md={12}>
          <Form.Item name="costCenterName" label="Cost Center" rules={zodRules(employmentBaseSchema, "costCenterName")}>
            <Input placeholder="Enter cost center" />
          </Form.Item>
        </Col>
        <Col xs={24} md={12}>
          <Form.Item name="profileApprovalDate" label="Profile Approval Date" rules={zodRules(employmentBaseSchema, "profileApprovalDate")} {...dateItem}>
            <DatePicker className="w-full" format="YYYY-MM-DD" disabledDate={noPast} />
          </Form.Item>
        </Col>
        <Col xs={24} md={12}>
          <Form.Item name="isEmployeeIdGenerated" valuePropName="checked" className="mt-4">
            <Checkbox>Is Employee ID Generated?</Checkbox>
          </Form.Item>
        </Col>
        <Col xs={24} md={12}>
          <Form.Item label="EMP ID" required={!!watchIsGenerated}>
            <Space.Compact className="w-full">
              <Form.Item name="employeeId" noStyle>
                <Input placeholder="Enter Employee ID" maxLength={8} disabled={!watchIsGenerated} />
              </Form.Item>
              <Button type="primary" onClick={validateEmployeeId} disabled={!watchIsGenerated} loading={loadingEmpValidation}>
                Validate
              </Button>
            </Space.Compact>
          </Form.Item>
        </Col>
        <Col xs={24} md={12}>
          <Form.Item name="employeeNameAsPerId" label="Employee Name As per Directory" required={!!watchIsGenerated}>
            <Input placeholder="Enter name" disabled={!watchIsGenerated} />
          </Form.Item>
        </Col>
        <Col xs={24} md={12}>
          <Form.Item name="hpeEmailId" label="Company Email ID" required={!!watchIsGenerated}>
            <Input placeholder="Enter company email address" disabled={!watchIsGenerated} />
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

export default ProfileTracker;
