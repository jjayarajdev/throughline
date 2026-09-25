"use client";
import * as z from "zod";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button, Card, Checkbox, Col, DatePicker, Form, Input, InputNumber, Modal, Row, Select, Space, Typography } from "antd";
import { ArrowLeftOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import { toast } from "@/lib/toast";
import { validateWithZod, zodRules } from "@/lib/zodRules";
import { partnerApi, SowPayload } from "@/services/api/partner.profile.api";
import { onboarding } from "@/services/api/onboarding.api";
import { isAdmin, isPartner, isVendorManager } from "@/store/userStore";
import CrHistoryDetails, { SowCR } from "./CRHistoryDetails";

let crFlagsGlobal: {
  isRateChange?: boolean;
  isValidityExtension?: boolean;
  isValueChange?: boolean;
  isOthers?: boolean;
} = {};

const sowBaseSchema = z.object({
  sowNumber: z.string().min(1, "SOW number is required"),
  startDate: z.string().min(1, "Start Date is required"),
  endDate: z.string().min(1, "End Date is required"),
  tcValue: z
    .string()
    .min(1, "TCV value is required")
    .refine((val) => parseFloat(val) > 0, { message: "TC value must be greater than 0" }),
  status: z.enum(["Active", "Inactive"], { required_error: "Status is required" }),
  extendedDate: z.string().optional(),
  crComments: z.string().optional(),
  isRateChanged: z.boolean().optional(),
  crNumber: z.string().optional(),
  crRequestDate: z.string().optional(),
  crValue: z.string().optional(),
});

export const formSchema = sowBaseSchema
  .refine(
    (data) => {
      const start = new Date(data.startDate);
      const end = new Date(data.endDate);
      return !isNaN(start.getTime()) && !isNaN(end.getTime()) && end > start;
    },
    { message: "End date must be after start date", path: ["endDate"] }
  )
  .superRefine((data, ctx) => {
    const flags = crFlagsGlobal;
    if (flags.isRateChange && data.isRateChanged !== true) {
      ctx.addIssue({ path: ["isRateChanged"], message: "Rate Changed must be checked", code: z.ZodIssueCode.custom });
    }
    if (flags.isValidityExtension && !data.extendedDate) {
      ctx.addIssue({ path: ["extendedDate"], message: "Extended End Date is required", code: z.ZodIssueCode.custom });
    }
    if (flags.isOthers && !data.crComments?.trim()) {
      ctx.addIssue({ path: ["crComments"], message: "Comments are required", code: z.ZodIssueCode.custom });
    }
    if (flags.isValueChange && !data.crValue?.trim()) {
      ctx.addIssue({ path: ["crValue"], message: "CR Value are required", code: z.ZodIssueCode.custom });
    }
    if (flags.isRateChange || flags.isValueChange || flags.isValidityExtension || flags.isOthers) {
      if (!data.crNumber?.trim()) {
        ctx.addIssue({ path: ["crNumber"], message: "CR Number is required", code: z.ZodIssueCode.custom });
      }
      if (!data.crRequestDate) {
        ctx.addIssue({ path: ["crRequestDate"], message: "CR Request Date is required", code: z.ZodIssueCode.custom });
      }
    }
  });

type FormValues = z.infer<typeof formSchema>;

interface AddSowFormProps {
  onCancel: () => void;
  initialData?: any;
  isEditing?: boolean;
  crTypes: any;
  crFlags: {
    isRateChange: boolean;
    isValidityExtension: boolean;
    isValueChange: boolean;
    isOthers: boolean;
  };
  selectedCRType: number | null;
}

/** Form values keep the API's "YYYY-MM-DD" string while the picker shows a dayjs. */
const dateValueProps = {
  getValueProps: (v: string) => ({ value: v ? dayjs(v) : null }),
  normalize: (d: dayjs.Dayjs | null) => (d ? d.format("YYYY-MM-DD") : ""),
};

const STATUS_OPTIONS = [
  { value: "Active", label: "Active" },
  { value: "Inactive", label: "Inactive" },
];

/** Create / edit a SOW for the partner in `?id=`, or raise a change request (CR) against it. */
export function AddSowForm({ onCancel, initialData, isEditing, crFlags, selectedCRType }: AddSowFormProps) {
  const queryClient = useQueryClient();
  const [form] = Form.useForm<FormValues>();
  crFlagsGlobal = crFlags;

  const [showDetails, setShowDetails] = useState(false);
  const [selectedCrData, setSelectedCrData] = useState<SowCR | null>(null);

  const anyCr = crFlags?.isRateChange || crFlags?.isValueChange || crFlags?.isValidityExtension || crFlags?.isOthers;
  const selectedCategory = crFlags?.isRateChange ? "Rate Change" : crFlags?.isValidityExtension ? "Validity Extension" : crFlags?.isValueChange ? "Value Change" : crFlags?.isOthers ? "Others" : "";

  const searchParams = useSearchParams();
  const parnterId = searchParams.get("id") || "";

  const { data: getCRdata, refetch: reFetchData } = useQuery({
    queryKey: ["getCRdata", initialData?.id],
    queryFn: () => onboarding.getSow(initialData?.id),
    enabled: !!initialData?.id,
  });

  useEffect(() => {
    if (getCRdata?.tcValue) form.setFieldsValue({ tcValue: getCRdata.tcValue.toString() } as any);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [getCRdata?.tcValue]);

  const clearCrFields = () =>
    form.setFieldsValue({ extendedDate: "", crComments: "", isRateChanged: false, crNumber: "", crRequestDate: "", crValue: "" } as any);

  const createSow = useMutation({
    mutationFn: partnerApi.createSow,
    onSuccess: (newSow) => {
      queryClient.invalidateQueries({ queryKey: ["getsowData", parnterId] });
      reFetchData();
      toast.success(newSow?.message || "SOW created successfully");
      form.resetFields();
      onCancel();
    },
    onError: (error: any) => toast.error(error?.response?.data?.message || error?.message || "Failed to create sow"),
  });

  const { mutate: upDateSow, isPending: updateLoading } = useMutation({
    mutationFn: (values: SowPayload) => partnerApi.updateSow(Number(initialData?.id), values),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["getsowData", parnterId] });
      reFetchData();
      if (selectedCrData) {
        toast.success("CR updated successfully");
        clearCrFields();
      } else if (anyCr) {
        toast.success("CR created successfully");
        clearCrFields();
      } else {
        toast.success(data?.message || "SOW created successfully");
        form.resetFields();
        onCancel();
      }
    },
    onError: () => toast.error("Failed to update SOW"),
  });

  const handleEditCR = (cr: SowCR) => {
    const actualCategory = cr?.comments ? "Others" : cr?.extendedDate ? "Validity Extension" : cr?.isRateChanged ? "Rate Change" : "Value Change";
    if (selectedCategory !== actualCategory) {
      toast.warning(`This CR belongs to "${actualCategory}". You can only edit "${selectedCategory}" CRs.`);
      return;
    }
    setSelectedCrData(cr);
    const patch: Partial<FormValues> = { crNumber: cr.crNumber || "", crRequestDate: cr.crRequestDate || "" };
    if (cr.isRateChanged !== undefined) patch.isRateChanged = cr.isRateChanged;
    if (cr.extendedDate) patch.extendedDate = cr.extendedDate;
    if (cr.comments) patch.crComments = cr.comments;
    if (cr.crValue) patch.crValue = cr.crValue?.toString();
    form.setFieldsValue(patch as any);
  };

  const hasChanges = (oldData: any, newData: any) => JSON.stringify(oldData) !== JSON.stringify(newData);

  const confirm = (message: string, onOk: () => void) =>
    Modal.confirm({ title: "Confirmation", content: message, okText: "Continue", cancelText: "Cancel", onOk });

  const handleSubmit = (data: FormValues) => {
    let finalTcValue = Number(data.tcValue || 0);
    if (selectedCrData && data.crValue) {
      finalTcValue += Number(data.crValue || 0) - Number(selectedCrData.crValue || 0);
    } else if (!selectedCrData && data.crValue) {
      finalTcValue += Number(data.crValue);
    }

    const sowCRPayload = anyCr
      ? [
          {
            ...(selectedCrData?.id ? { id: selectedCrData.id } : {}),
            crTypeId: selectedCRType,
            crNumber: data.crNumber,
            crRequestDate: data.crRequestDate,
            ...(crFlags?.isRateChange ? { isRateChanged: data.isRateChanged } : {}),
            ...(crFlags?.isValidityExtension ? { extendedDate: data.extendedDate } : {}),
            ...(crFlags?.isOthers ? { comments: data.crComments } : {}),
            ...(crFlags?.isValueChange ? { crValue: Number(data.crValue) } : {}),
            sowId: initialData?.id,
          },
        ]
      : [];

    const commonPayload = {
      sowNumber: data.sowNumber,
      startDate: data.startDate,
      endDate: data.endDate,
      tcValue: finalTcValue,
      status: data.status === "Active",
      partnerId: Number(parnterId),
      id: initialData?.id,
      crTypeId: selectedCRType,
      crNumber: data.crNumber,
      crRequestDate: data.crRequestDate,
      soW_CRs: sowCRPayload,
    } as unknown as SowPayload;

    const isPrivilegedUser = isAdmin || isVendorManager;
    if (isPrivilegedUser) {
      if (isEditing || sowCRPayload.length) upDateSow(commonPayload);
      else createSow.mutate(commonPayload);
      return;
    }

    if (isEditing || sowCRPayload.length) {
      if (hasChanges(initialData, commonPayload)) {
        confirm("You are updating a SOW. Please check carefully. This update will go for approval. Do you want to continue?", () => upDateSow(commonPayload));
      } else {
        upDateSow(commonPayload);
      }
    } else {
      confirm("You are creating a new SOW. This will go for approval. Do you want to continue?", () => createSow.mutate(commonPayload));
    }
  };

  const onFinish = (values: FormValues) => {
    crFlagsGlobal = crFlags;
    const data = validateWithZod(formSchema, form, values);
    if (data) handleSubmit(data);
  };

  const computedFlags = selectedCrData
    ? {
        isRateChange: !!selectedCrData.isRateChanged,
        isValidityExtension: !!selectedCrData.extendedDate,
        isOthers: !!selectedCrData.comments,
        isValueChange: !selectedCrData.isRateChanged && !selectedCrData.extendedDate && !selectedCrData.comments,
      }
    : crFlags;

  const isFieldDisabled = (field: string) => {
    if (isEditing) {
      if (crFlags?.isRateChange || crFlags.isValidityExtension || crFlags.isValueChange || crFlags.isOthers) return true;
      if (crFlags?.isValueChange) return field !== "tcValue";
      return false;
    }
    if (crFlags?.isRateChange) return true;
    if (crFlags?.isValueChange) return field !== "tcValue";
    return false;
  };

  const submitLabel = selectedCrData ? `Update ${selectedCategory || "CR"}` : selectedCategory ? `Create ${selectedCategory || "CR"}` : isEditing ? "Update SOW" : "Create SOW";
  const busy = createSow.isPending || updateLoading;
  const title = crFlags?.isRateChange
    ? "Rate Change"
    : crFlags?.isValidityExtension
    ? "Validity Extension"
    : crFlags?.isValueChange
    ? "Value Change"
    : crFlags?.isOthers
    ? "Others"
    : isEditing
    ? "Edit SOW"
    : !initialData?.id
    ? "Add New SOW"
    : "SOW Details";

  return (
    <Card
      title={
        <Space>
          <Button type="text" icon={<ArrowLeftOutlined />} onClick={onCancel} />
          <Typography.Title level={5} style={{ margin: 0 }}>
            {title}
          </Typography.Title>
        </Space>
      }
    >
      <Form<FormValues>
        form={form}
        layout="vertical"
        onFinish={onFinish}
        initialValues={{
          sowNumber: initialData?.sowNumber || "",
          startDate: initialData?.startDate,
          endDate: initialData?.endDate || "",
          tcValue: initialData?.tcValue?.toString() || "",
          status: isPartner ? "Inactive" : typeof initialData?.status === "boolean" ? (initialData.status ? "Active" : "Inactive") : "Active",
          isRateChanged: crFlags?.isRateChange ? true : initialData?.isRateChanged ?? false,
          crNumber: initialData?.crNumber,
          crRequestDate: initialData?.crRequestDate,
          extendedDate: initialData?.extendedDate,
        }}
      >
        <Row gutter={[16, 8]}>
          <Col xs={24} md={12}>
            <Form.Item name="sowNumber" label="SOW Number" rules={zodRules(sowBaseSchema, "sowNumber")}>
              <Input placeholder="Enter SOW number" disabled={isFieldDisabled("sowNumber")} />
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Form.Item name="startDate" label="Start Date" rules={zodRules(sowBaseSchema, "startDate")} {...dateValueProps}>
              <DatePicker className="w-full" format="YYYY-MM-DD" disabled={isFieldDisabled("startDate")} />
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Form.Item name="endDate" label="End Date" rules={zodRules(sowBaseSchema, "endDate")} {...dateValueProps}>
              <DatePicker className="w-full" format="YYYY-MM-DD" disabled={isFieldDisabled("endDate")} />
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Form.Item name="tcValue" label="TC Value" rules={zodRules(sowBaseSchema, "tcValue")} normalize={(v) => v ?? ""}>
              <InputNumber stringMode className="w-full" placeholder="Enter TC value" disabled={isFieldDisabled("tcValue")} />
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Form.Item name="status" label="Status" rules={zodRules(sowBaseSchema, "status")}>
              <Select placeholder="Select status" options={STATUS_OPTIONS} disabled={isFieldDisabled("status")} />
            </Form.Item>
          </Col>
          {computedFlags?.isRateChange && (
            <Col xs={24} md={12}>
              <Form.Item name="isRateChanged" valuePropName="checked" label=" ">
                <Checkbox>Rate Changed</Checkbox>
              </Form.Item>
            </Col>
          )}
          {computedFlags?.isValidityExtension && (
            <Col xs={24} md={12}>
              <Form.Item name="extendedDate" label="Extended End Date" required {...dateValueProps}>
                <DatePicker className="w-full" format="YYYY-MM-DD" />
              </Form.Item>
            </Col>
          )}
          {computedFlags?.isOthers && (
            <Col xs={24} md={12}>
              <Form.Item name="crComments" label="Comments" required>
                <Input.TextArea rows={3} placeholder="Describe what has changed" />
              </Form.Item>
            </Col>
          )}
          {computedFlags?.isValueChange && (
            <Col xs={24} md={12}>
              <Form.Item name="crValue" label="CR Value" required normalize={(v) => v ?? ""}>
                <InputNumber stringMode className="w-full" placeholder="Enter CR value" />
              </Form.Item>
            </Col>
          )}
          {anyCr && (
            <Col xs={24} md={12}>
              <Form.Item name="crNumber" label="CR Number" required>
                <Input placeholder="Enter CR Number" />
              </Form.Item>
            </Col>
          )}
          {anyCr && (
            <Col xs={24} md={12}>
              <Form.Item name="crRequestDate" label="CR Request Date" required {...dateValueProps}>
                <DatePicker className="w-full" format="YYYY-MM-DD" />
              </Form.Item>
            </Col>
          )}
        </Row>
        <Space className="pt-4" style={{ display: "flex", justifyContent: "flex-end" }}>
          {anyCr && (
            <Button onClick={() => setShowDetails((s) => !s)} disabled={createSow.isPending}>
              View CR
            </Button>
          )}
          <Button onClick={onCancel} disabled={busy}>
            Cancel
          </Button>
          <Button type="primary" htmlType="submit" loading={busy}>
            {busy ? submitLabel.replace(/^(Create|Update)/, (m) => (m === "Create" ? "Creating" : "Updating")) + "..." : submitLabel}
          </Button>
        </Space>
      </Form>
      {showDetails && (
        <div className="mt-6">
          <CrHistoryDetails crData={getCRdata?.soW_CRs} onEditCR={handleEditCR} isToggle={true} />
        </div>
      )}
    </Card>
  );
}
