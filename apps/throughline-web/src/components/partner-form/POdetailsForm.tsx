"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Button, Card, Col, Dropdown, Flex, Form, Input, Radio, Row, Select, Space, Table, Typography, Upload, DatePicker } from "antd";
import type { ColumnsType } from "antd/es/table";
import { MoreOutlined, PlusOutlined, UploadOutlined } from "@ant-design/icons";
import dayjs, { type Dayjs } from "dayjs";
import * as z from "zod";
import { MasterTypes } from "@/constants/masterTypes";
import { dropdownApi } from "@/services/api/master";
import { partnerApi, PoDetailsPayload, poDetailSchema } from "@/services/api/partner.profile.api";
import { toast } from "@/lib/toast";
import { validateWithZod, zodRules } from "@/lib/zodRules";
import { usePartnerStore } from "@/store/userPartnerStore";
import api from "@/lib/axiosInstance";

type PoDetailFormValues = z.infer<typeof poDetailSchema>;

/** Form state: dates are Dayjs while editing; converted to yyyy-MM-dd on submit. */
type FormState = Omit<PoDetailFormValues, "sowStartDate" | "sowEndDate" | "extensionDate"> & {
  sowStartDate?: Dayjs | null;
  sowEndDate?: Dayjs | null;
  extensionDate?: Dayjs | null;
};

interface PODetailsFormProps {
  onNext?: () => void;
  onPrevious?: () => void;
}

const DATE_FMT = "YYYY-MM-DD";
const toStr = (d?: Dayjs | null) => (d ? d.format(DATE_FMT) : "");
const toDay = (s?: string) => (s ? dayjs(s) : null);
const disablePast = (d: Dayjs) => d.isBefore(dayjs(), "day");

const initialValues: FormState = {
  poNumber: "",
  sowNumber: "",
  sowStartDate: null,
  sowEndDate: null,
  poValue: "",
  poTypeId: "",
  poStatusId: "20001",
  thresholdPercentage: "",
  extensionDate: null,
  extendedBy: "",
  crId: "",
};

/** Single document upload to /FileServer/upload; the form value stays `{ attachmentURL, attachmentName }`. */
function PoDocumentUpload({ value, onChange, disabled }: { value?: any; onChange?: (v: any) => void; disabled?: boolean }) {
  const [uploading, setUploading] = useState(false);
  return (
    <Upload
      accept=".pdf,.doc,.docx"
      maxCount={1}
      showUploadList={false}
      disabled={disabled || uploading}
      beforeUpload={async (file) => {
        setUploading(true);
        try {
          const formData = new FormData();
          formData.append("file", file);
          const res = await api.post("/FileServer/upload", formData, { headers: { "Content-Type": "multipart/form-data" } });
          const fileName = res.data.fileName || res.data;
          onChange?.({ attachmentURL: fileName, attachmentName: fileName });
        } catch (error) {
          console.error("Upload failed", error);
        } finally {
          setUploading(false);
        }
        return false;
      }}
    >
      <Space>
        <Button icon={<UploadOutlined />} loading={uploading}>
          Upload
        </Button>
        {value?.attachmentURL && <Typography.Text type="secondary">({value.attachmentName})</Typography.Text>}
      </Space>
    </Upload>
  );
}

export default function PODetailsForm({ onNext, onPrevious }: PODetailsFormProps) {
  const [mounted, setMounted] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [poTypeForm, setPoTypeFrom] = useState<"NEW" | "CR">("NEW");
  const [selectedPo, setSelectedPo] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [showExtensionFields, setShowExtensionFields] = useState(false);
  const router = useRouter();
  const { partnerCode } = usePartnerStore();
  const searchParams = useSearchParams();
  const partnerId = searchParams.get("id") || "";
  const [form] = Form.useForm<FormState>();

  useEffect(() => {
    setMounted(true);
  }, []);

  const { data: poDetails = [], refetch: refetchPoDetails } = useQuery({
    queryKey: ["poDetails"],
    queryFn: () => partnerApi.getPoDetails(String(partnerId)),
    enabled: !!partnerId && mounted,
  });

  const { data: poTypes = [] } = useQuery({
    queryKey: ["poTypes"],
    queryFn: () => dropdownApi.fetchDropdown(MasterTypes.PO_TYPE),
    enabled: mounted,
  });

  const { data: poStatuses = [] } = useQuery({
    queryKey: ["poStatuses"],
    queryFn: () => dropdownApi.fetchDropdown(MasterTypes.PO_STATUS),
    enabled: mounted,
  });

  function formatFormData(values: PoDetailFormValues): PoDetailsPayload {
    return {
      id: selectedPo?.id || 0,
      isActive: true,
      poNumber: values.poNumber,
      sowNumber: values.sowNumber,
      sowStartDate: values.sowStartDate,
      sowEndDate: values.sowEndDate,
      poValue: values.poValue,
      poTypeId: values.poTypeId,
      poStatusId: values.poStatusId,
      thresholdPercentage: Number(values.thresholdPercentage),
      poDocuments: values.poDocuments,
      partnerId: partnerId,
      amendmentValue: values.amendmentValue || 0,
      extensionDate: values.extensionDate || undefined,
      extendedBy: values.extendedBy || undefined,
      crId: values.crId || undefined,
    };
  }

  const resetForm = () => form.resetFields();

  const createPoMutation = useMutation({
    mutationFn: partnerApi.createPoDetails,
    onSuccess: () => {
      toast.success("PO details created successfully");
      setShowForm(false);
      setShowExtensionFields(false);
      resetForm();
      refetchPoDetails();
    },
    onError: (error) => {
      toast.error("Failed to create PO details");
      console.error("Error creating PO details:", error);
    },
  });

  const updatePoMutation = useMutation({
    mutationFn: (data: PoDetailsPayload) => partnerApi.updatePoDetails(selectedPo.id, data),
    onSuccess: () => {
      toast.success("PO details updated successfully");
      setShowForm(false);
      setSelectedPo(null);
      setShowExtensionFields(false);
      resetForm();
      refetchPoDetails();
    },
    onError: (error) => {
      toast.error("Failed to update PO details");
      console.error("Error updating PO details:", error);
    },
  });

  function onFinish(raw: FormState) {
    const candidate = {
      ...raw,
      sowStartDate: toStr(raw.sowStartDate),
      sowEndDate: toStr(raw.sowEndDate),
      extensionDate: toStr(raw.extensionDate),
    };
    const values = validateWithZod(poDetailSchema, form, candidate);
    if (!values) return;
    const formattedData = formatFormData(values);
    if (selectedPo) updatePoMutation.mutate(formattedData);
    else createPoMutation.mutate(formattedData);
  }

  const handlePoTypeChange = (type: "NEW" | "CR") => {
    setPoTypeFrom(type);
    form.setFieldValue("poTypeId", type);
    if (type === "NEW") form.setFieldValue("amendmentValue", undefined);
  };

  const handleEdit = (poDetail: any) => {
    setSelectedPo(poDetail);
    setIsEditing(true);
    setShowExtensionFields(false);
    setPoTypeFrom(poDetail.poTypeId === "9002" ? "CR" : "NEW");
    form.setFieldsValue({
      poNumber: poDetail.poNumber,
      sowNumber: poDetail.sowNumber,
      sowStartDate: toDay(new Date(poDetail.sowStartDate).toISOString().split("T")[0]),
      sowEndDate: toDay(new Date(poDetail.sowEndDate).toISOString().split("T")[0]),
      poValue: poDetail.poValue.toString(),
      poTypeId: poDetail.poTypeId.toString(),
      poStatusId: poDetail.poStatusId.toString(),
      thresholdPercentage: poDetail.thresholdPercentage.toString(),
      amendmentValue: poDetail.amendmentValue?.toString(),
      extensionDate: poDetail.extensionDate ? toDay(new Date(poDetail.extensionDate).toISOString().split("T")[0]) : null,
      extendedBy: poDetail.extendedBy || "",
      crId: poDetail.crId || "",
    });
    setShowForm(true);
  };

  const handleExtension = (poDetail: any) => {
    handleEdit(poDetail);
    setShowExtensionFields(true);
  };

  const handleCancel = () => {
    setShowForm(false);
    setSelectedPo(null);
    setShowExtensionFields(false);
    resetForm();
  };

  if (!mounted) return null;

  const columns: ColumnsType<any> = [
    { key: "poNumber", title: "Po Number", dataIndex: "poNumber" },
    { key: "sowNumber", title: "Number", dataIndex: "sowNumber" },
    { key: "sowStartDate", title: "Start Date", dataIndex: "sowStartDate", render: (v: string) => v?.split("T")[0] },
    { key: "sowEndDate", title: "End Date", dataIndex: "sowEndDate", render: (v: string) => v?.split("T")[0] },
    { key: "poValue", title: "Po Value", dataIndex: "poValue" },
    { key: "poTypeName", title: "Po Type", dataIndex: "poTypeName" },
    { key: "thresholdPercentage", title: "Threshold", dataIndex: "thresholdPercentage" },
    { key: "poStatusName", title: "Status", dataIndex: "poStatusName" },
    { key: "extensionDate", title: "Extension Date", dataIndex: "extensionDate", render: (v?: string) => v?.split("T")[0] },
    {
      key: "actions",
      title: "Actions",
      render: (_: unknown, poDetail: any) => (
        <Dropdown
          trigger={["click"]}
          menu={{
            items: [
              { key: "edit", label: "Edit", onClick: () => handleEdit(poDetail) },
              { key: "extension", label: "Extension", onClick: () => handleExtension(poDetail) },
            ],
          }}
        >
          <Button type="text" size="small" icon={<MoreOutlined />} />
        </Dropdown>
      ),
    },
  ];

  const poTypeOptions = poTypes.map((o: any) => ({ value: String(o.id), label: o.name }));
  const poStatusOptions = poStatuses.map((o: any) => ({ value: String(o.id), label: o.name }));

  return (
    <Form form={form} layout="vertical" onFinish={onFinish} initialValues={initialValues}>
      <Flex vertical gap={16}>
        <Flex justify="space-between" align="center" wrap gap={8}>
          <Typography.Title level={4} style={{ margin: 0 }}>
            PO Initiation
          </Typography.Title>
          <Space>
            <Typography.Text type="secondary">Partner ID:</Typography.Text>
            <Typography.Text strong>{partnerCode}</Typography.Text>
          </Space>
        </Flex>

        {!showForm && (
          <Flex justify="flex-end">
            <Button
              type="primary"
              size="small"
              icon={<PlusOutlined />}
              onClick={() => {
                setShowForm(true);
                setIsEditing(false);
                setSelectedPo(null);
                setShowExtensionFields(false);
                resetForm();
              }}
            >
              Add
            </Button>
          </Flex>
        )}

        {showForm && (
          <Flex vertical gap={16}>
            <Radio.Group
              optionType="button"
              buttonStyle="solid"
              value={poTypeForm}
              disabled={isEditing}
              onChange={(e) => handlePoTypeChange(e.target.value)}
              options={[
                { value: "NEW", label: "New" },
                { value: "CR", label: "CR" },
              ]}
            />

            <Card>
              <Row gutter={[16, 8]}>
                <Col xs={24} md={12}>
                  <Form.Item name="poNumber" label="PO Number" rules={zodRules(poDetailSchema, "poNumber")}>
                    <Input placeholder="Enter PO number" />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item name="sowNumber" label={poTypeForm === "NEW" ? "SOW Number" : "CR Number"} rules={[{ required: true, message: "SOW number is required" }]}>
                    <Input placeholder="Enter SOW number" />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item name="sowStartDate" label={poTypeForm === "NEW" ? "SOW Start date" : "CR Start date"} rules={[{ required: true, message: "SOW start date is required" }]}>
                    <DatePicker className="w-full" format={DATE_FMT} disabledDate={disablePast} />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item name="sowEndDate" label={poTypeForm === "NEW" ? "SOW End date" : "CR End date"} rules={[{ required: true, message: "SOW end date is required" }]}>
                    <DatePicker className="w-full" format={DATE_FMT} disabledDate={disablePast} />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item name="poValue" label="PO Value ⟨₹⟩" rules={zodRules(poDetailSchema, "poValue")}>
                    <Input type="number" placeholder="Enter PO value" />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item name="poTypeId" label="PO Type" rules={zodRules(poDetailSchema, "poTypeId")}>
                    <Select placeholder="Select Type" options={poTypeOptions} disabled={isEditing} showSearch optionFilterProp="label" />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item name="poStatusId" label="PO Status" rules={[{ required: true, message: "PO status is required" }]}>
                    <Select placeholder="Select Status" options={poStatusOptions} showSearch optionFilterProp="label" />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item name="poDocuments" label="PO Documents" rules={[{ required: true, message: "PO documents are required" }]}>
                    <PoDocumentUpload />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item name="thresholdPercentage" label="Threshold (%)" rules={[{ required: true, message: "Threshold is required" }]}>
                    <Input type="number" placeholder="Enter threshold" />
                  </Form.Item>
                </Col>
                {poTypeForm === "CR" && (
                  <Col xs={24} md={12}>
                    <Form.Item name="amendmentValue" label="Amendment value as per CR" rules={[{ required: true, message: "Amendment value is required" }]}>
                      <Input type="number" placeholder="Enter amendment value" />
                    </Form.Item>
                  </Col>
                )}
                {showExtensionFields && (
                  <>
                    <Col xs={24} md={12}>
                      <Form.Item name="extensionDate" label="Extension Date" rules={[{ required: true, message: "Extension date is required" }]}>
                        <DatePicker className="w-full" format={DATE_FMT} disabledDate={disablePast} />
                      </Form.Item>
                    </Col>
                    <Col xs={24} md={12}>
                      <Form.Item name="extendedBy" label="Extended By" rules={[{ required: true, message: "Extended by is required" }]}>
                        <Input placeholder="Enter name" />
                      </Form.Item>
                    </Col>
                    <Col xs={24} md={12}>
                      <Form.Item name="crId" label="CR ID (Mention CRID if exists)" rules={[{ required: true, message: "CR ID is required" }]}>
                        <Input placeholder="Enter CR ID" />
                      </Form.Item>
                    </Col>
                  </>
                )}
              </Row>
            </Card>

            <Flex justify="flex-end" gap={8}>
              <Button onClick={handleCancel}>Cancel</Button>
              <Button type="primary" htmlType="submit" loading={createPoMutation.isPending || updatePoMutation.isPending}>
                {selectedPo ? "Update" : "Save"}
              </Button>
            </Flex>
          </Flex>
        )}

        {poDetails?.data?.length > 0 && <Table rowKey="id" size="middle" columns={columns} dataSource={poDetails.data} pagination={false} scroll={{ x: "max-content", y: 320 }} />}

        <Flex justify="space-between">
          <Button onClick={onPrevious}>Previous</Button>
          <Button type="primary" htmlType="submit" onClick={() => router.replace("/home/partner-onboarding")}>
            Submit
          </Button>
        </Flex>
      </Flex>
    </Form>
  );
}
