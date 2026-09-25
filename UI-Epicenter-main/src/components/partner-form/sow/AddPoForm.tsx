"use client";
import * as z from "zod";
import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button, Card, Col, DatePicker, Form, Input, InputNumber, Result, Row, Select, Space, Typography } from "antd";
import { ArrowLeftOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import { toast } from "@/lib/toast";
import { validateWithZod, zodRules } from "@/lib/zodRules";
import { partnerApi } from "@/services/api/partner.profile.api";
import { onboarding } from "@/services/api/onboarding.api";
import CrHistoryDetails, { SowCR } from "./CRHistoryDetails";

interface PODetails {
  poNumber: string;
  startDate: string;
  value: number;
  status: boolean;
  id: number;
  endDate: string;
  poValue: number;
  sowId: number;
  extendedDate: string;
  comments: string;
  crNumber?: string;
  crRequestDate?: string;
}

export interface PoPayload {
  id: number;
  poNumber: string;
  startDate: string;
  endDate: string;
  poValue: number;
  status: boolean;
  sowId: number;
  extendedDate?: string;
  comments?: string;
  crTypeId: number;
  crNumber: number;
  crRequestDate: string;
}

interface SOWDetails {
  sowNumber: string;
  startDate: string;
  endDate: string;
  tcValue: number;
  status: boolean;
  poDetails: PODetails[];
  partnerId: number;
  id: number;
  isActive: boolean;
}

let crFlagsGlobalForPO: {
  isRateChange?: boolean;
  isValidityExtension?: boolean;
  isValueChange?: boolean;
  isOthers?: boolean;
} = {};

const poBaseSchema = z.object({
  poNumber: z.string().min(1, "PO number is required"),
  startDate: z.string().min(1, "Start Date is required"),
  endDate: z.string().min(1, "End Date is required"),
  poValue: z
    .string()
    .min(1, "PO value is required")
    .refine((val) => parseFloat(val) > 0, { message: "PO value must be greater than 0" }),
  status: z.enum(["Active", "Inactive"], { required_error: "Status is required" }),
  extendedDate: z.string().optional(),
  crComments: z.string().optional(),
  crNumber: z.string().optional(),
  crRequestDate: z.string().optional(),
  crValue: z.string().optional(),
});

export const poFormSchema = poBaseSchema
  .refine(
    (data) => {
      const start = new Date(data.startDate);
      const end = new Date(data.endDate);
      return !isNaN(start.getTime()) && !isNaN(end.getTime()) && end > start;
    },
    { message: "End date must be after start date", path: ["endDate"] }
  )
  .superRefine((data, ctx) => {
    const flags = crFlagsGlobalForPO;
    if (flags.isValidityExtension && !data.extendedDate) {
      ctx.addIssue({ path: ["extendedDate"], message: "Extended End Date is required", code: z.ZodIssueCode.custom });
    }
    if (flags.isValueChange && !data.crValue) {
      ctx.addIssue({ path: ["crValue"], message: "CR Value is required", code: z.ZodIssueCode.custom });
    }
    if (flags.isOthers && !data.crComments?.trim()) {
      ctx.addIssue({ path: ["crComments"], message: "Comments are required", code: z.ZodIssueCode.custom });
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

type FormValues = z.infer<typeof poFormSchema>;

interface AddPoFormProps {
  onCancel: () => void;
  sowData: SOWDetails;
  initialData?: PODetails;
  isEditing?: boolean;
  crType?: "validity-extension" | "value-change" | "others" | string;
  addPo: boolean;
  selectedCrType: number;
  sowNumber: number;
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

/** Create / edit a PO under a SOW, or raise a change request (CR) against it. */
export function AddPoForm({ onCancel, sowData, initialData, isEditing, crType, addPo, selectedCrType, sowNumber }: AddPoFormProps) {
  const queryClient = useQueryClient();
  const [form] = Form.useForm<FormValues>();
  const [showDetails, setShowDetails] = useState(false);
  const [selectedCrData, setSelectedCrData] = useState<SowCR | null>(null);

  const selectedCategory = crType === "validity-extension" ? "Validity Extension" : crType === "value-change" ? "Value Change" : crType === "others" ? "Others" : "";

  const { data: getCRdata, refetch: reFetchData } = useQuery({
    queryKey: ["getCRdata", initialData?.id],
    queryFn: () => onboarding.getPo(initialData?.id as number),
    enabled: !!initialData?.id,
  });

  useEffect(() => {
    if (getCRdata?.poValue) form.setFieldsValue({ poValue: getCRdata.poValue.toString() } as any);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [getCRdata?.poValue]);

  const createpo = useMutation({
    mutationFn: partnerApi.createPo,
    onSuccess: (newPo) => {
      reFetchData();
      toast.success(newPo?.message || "PO created successfully");
      queryClient.invalidateQueries({ queryKey: ["getsowData"] });
      form.resetFields();
      onCancel();
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || error?.message || "Failed to create PO");
      console.error("Error creating PO:", error);
    },
  });

  const computedFlags = selectedCrData
    ? {
        isValidityExtension: !!selectedCrData.extendedDate,
        isOthers: !!selectedCrData.comments,
        isValueChange: !selectedCrData.extendedDate && !selectedCrData.comments,
      }
    : {
        isValidityExtension: crType === "validity-extension",
        isOthers: crType === "others",
        isValueChange: crType === "value-change",
      };

  const clearCrFields = () =>
    form.setFieldsValue({ extendedDate: "", crComments: "", crNumber: "", crRequestDate: "", crValue: "" } as any);

  const {
    mutate: updatePo,
    isPending: updateLoading,
    isError,
    error,
  } = useMutation({
    mutationFn: (values: PoPayload) => partnerApi.updatePo(Number(initialData?.id), values),
    onSuccess: (data) => {
      reFetchData();
      queryClient.invalidateQueries({ queryKey: ["getsowData"] });
      if (selectedCrData) {
        toast.success("CR updated successfully");
        clearCrFields();
      } else if (computedFlags?.isValueChange || computedFlags?.isValidityExtension || computedFlags?.isOthers) {
        toast.success("CR created successfully");
        clearCrFields();
      } else {
        toast.success(data?.message || "PO created successfully");
        clearCrFields();
        onCancel();
      }
    },
    onError: () => toast.error("Failed to update PO"),
  });

  const handleEditCR = (cr: SowCR) => {
    const actualCategory = cr?.comments ? "Others" : cr?.extendedDate ? "Validity Extension" : cr?.isRateChanged ? "Rate Change" : "Value Change";
    if (selectedCategory !== actualCategory) {
      toast.warning(`This CR belongs to "${actualCategory}". You can only edit "${selectedCategory}" CRs.`);
      return;
    }
    setSelectedCrData(cr);
    const patch: Partial<FormValues> = { crNumber: cr.crNumber || "", crRequestDate: cr.crRequestDate || "" };
    if (cr.extendedDate) patch.extendedDate = cr.extendedDate;
    if (cr.comments) patch.crComments = cr.comments;
    if (cr.crValue) patch.crValue = cr.crValue?.toString();
    form.setFieldsValue(patch as any);
  };

  const handleSubmit = (data: FormValues) => {
    let finalTcValue = Number(data.poValue || 0);
    if (selectedCrData && data.crValue) {
      finalTcValue += Number(data.crValue || 0) - Number(selectedCrData.crValue || 0);
    } else if (!selectedCrData && data.crValue) {
      finalTcValue += Number(data.crValue);
    }
    const isCR = crType === "validity-extension" || crType === "value-change" || crType === "others" || crType === "rate-change";
    const poCRPayload = isCR
      ? [
          {
            ...(selectedCrData?.id ? { id: selectedCrData.id } : {}),
            crTypeId: selectedCrType,
            crNumber: data.crNumber,
            crRequestDate: data.crRequestDate,
            ...(crType === "validity-extension" && data.extendedDate ? { extendedDate: data.extendedDate } : {}),
            ...(crType === "others" && data.crComments ? { comments: data.crComments } : {}),
            ...(crType === "value-change" && data.crValue ? { crValue: Number(data.crValue) } : {}),
            poId: initialData?.id ?? 0,
          },
        ]
      : [];
    const commonPayload = {
      poNumber: data.poNumber,
      startDate: data.startDate,
      endDate: data.endDate,
      poValue: finalTcValue,
      status: data.status === "Active",
      sowId: initialData?.sowId ? initialData?.sowId : sowData?.id,
      id: initialData?.id ?? 0,
      pO_CRs: poCRPayload,
    } as unknown as PoPayload;

    if (isEditing || poCRPayload.length) updatePo(commonPayload);
    else createpo.mutate(commonPayload);
  };

  const onFinish = (values: FormValues) => {
    crFlagsGlobalForPO = computedFlags;
    const data = validateWithZod(poFormSchema, form, values);
    if (data) handleSubmit(data);
  };

  crFlagsGlobalForPO = computedFlags;

  const isFieldDisabled = (): boolean => {
    const isCR = crType === "validity-extension" || crType === "value-change" || crType === "others";
    if (isEditing) return isCR;
    if (addPo) return false;
    if (isCR) return true;
    return true;
  };
  const disabled = isFieldDisabled();

  const submitLabel = selectedCrData ? `Update ${selectedCategory || "CR"}` : selectedCategory ? `Create ${selectedCategory || "CR"}` : isEditing ? "Update PO" : "Create PO";
  const busy = createpo.isPending || updateLoading;
  const title =
    crType === "validity-extension" ? "Validity Extension" : crType === "value-change" ? "Value Change" : crType === "others" ? "Others" : isEditing ? "Edit PO" : !initialData?.id ? "Add New PO" : "PO Details";

  return (
    <Card
      title={
        <Space direction="vertical" size={0}>
          <Space>
            <Button type="text" icon={<ArrowLeftOutlined />} onClick={onCancel} />
            <Typography.Title level={5} style={{ margin: 0 }}>
              {title}
            </Typography.Title>
          </Space>
          <Typography.Text type="secondary">SOW Number: {sowNumber}</Typography.Text>
        </Space>
      }
    >
      {isError && <Result status="error" title="Failed to update PO" subTitle={(error as any)?.response?.data?.message || (error as Error)?.message} />}
      <Form<FormValues>
        form={form}
        layout="vertical"
        onFinish={onFinish}
        initialValues={{
          poNumber: initialData?.poNumber || "",
          startDate: initialData?.startDate,
          endDate: initialData?.endDate,
          poValue: initialData?.poValue?.toString() || "",
          status: initialData?.status !== undefined ? (initialData.status ? "Active" : "Inactive") : "Active",
          crNumber: initialData?.crNumber,
          crRequestDate: initialData?.crRequestDate,
          extendedDate: initialData?.extendedDate,
        }}
      >
        <Row gutter={[16, 8]}>
          <Col xs={24} md={12}>
            <Form.Item name="poNumber" label="PO Number" rules={zodRules(poBaseSchema, "poNumber")}>
              <Input placeholder="Enter PO number" disabled={disabled} />
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Form.Item name="startDate" label="Start Date" rules={zodRules(poBaseSchema, "startDate")} {...dateValueProps}>
              <DatePicker className="w-full" format="YYYY-MM-DD" disabled={disabled} />
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Form.Item name="endDate" label="End Date" rules={zodRules(poBaseSchema, "endDate")} {...dateValueProps}>
              <DatePicker className="w-full" format="YYYY-MM-DD" disabled={disabled} />
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Form.Item name="poValue" label="PO Value" rules={zodRules(poBaseSchema, "poValue")} normalize={(v) => v ?? ""}>
              <InputNumber stringMode className="w-full" placeholder="Enter PO value" disabled={disabled} />
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Form.Item name="status" label="Status" rules={zodRules(poBaseSchema, "status")}>
              <Select options={STATUS_OPTIONS} disabled={disabled} />
            </Form.Item>
          </Col>
          {computedFlags.isValidityExtension && (
            <Col xs={24} md={12}>
              <Form.Item name="extendedDate" label="Extended Validity Date" required {...dateValueProps}>
                <DatePicker className="w-full" format="YYYY-MM-DD" />
              </Form.Item>
            </Col>
          )}
          {computedFlags.isOthers && (
            <Col xs={24} md={12}>
              <Form.Item name="crComments" label="Change Request Comments" required>
                <Input placeholder="Enter reason for CR" />
              </Form.Item>
            </Col>
          )}
          {computedFlags.isValueChange && (
            <Col xs={24} md={12}>
              <Form.Item name="crValue" label="PO CR Value" required normalize={(v) => v ?? ""}>
                <InputNumber stringMode className="w-full" placeholder="PO CR value" />
              </Form.Item>
            </Col>
          )}
          {crType && (
            <Col xs={24} md={12}>
              <Form.Item name="crNumber" label="CR Number" required>
                <Input placeholder="Enter CR Number" />
              </Form.Item>
            </Col>
          )}
          {crType && (
            <Col xs={24} md={12}>
              <Form.Item name="crRequestDate" label="CR RequestDate" required {...dateValueProps}>
                <DatePicker className="w-full" format="YYYY-MM-DD" />
              </Form.Item>
            </Col>
          )}
        </Row>
        <Space className="w-full justify-end pt-4" style={{ display: "flex", justifyContent: "flex-end" }}>
          {crType && (
            <Button onClick={() => setShowDetails((s) => !s)} disabled={createpo.isPending}>
              View CR
            </Button>
          )}
          <Button onClick={onCancel} disabled={createpo.isPending}>
            Cancel
          </Button>
          <Button type="primary" htmlType="submit" loading={busy}>
            {busy ? submitLabel.replace(/^(Create|Update)/, (m) => (m === "Create" ? "Creating" : "Updating")) + "..." : submitLabel}
          </Button>
        </Space>
      </Form>
      {showDetails && (
        <div className="mt-6">
          <CrHistoryDetails crData={getCRdata?.pO_CRs} onEditCR={handleEditCR} isToggle={false} />
        </div>
      )}
    </Card>
  );
}
