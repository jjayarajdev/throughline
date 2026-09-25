"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button, Card, Col, DatePicker, Flex, Form, Input, Row, Space, Spin, Table, Typography, Upload } from "antd";
import type { ColumnsType } from "antd/es/table";
import { EditOutlined, PlusOutlined, UploadOutlined } from "@ant-design/icons";
import * as z from "zod";
import api from "@/lib/axiosInstance";
import { toast } from "@/lib/toast";
import { validateWithZod, zodRules } from "@/lib/zodRules";
import { useHiringStore } from "@/store/useHiringStore";
import { createCalibrationPayload, hiringApi } from "@/services/api/hiring.api";
import { HiringSummaryProps } from "./types";
import { dateItem, DocumentPreview } from "./shared";

const calibrationSchema = z.object({
  hrqId: z.string().min(1, "HRQ ID is required"),
  jobTitle: z.string().optional(),
  attendees: z.string().min(1, "attendees is required"),
  calibrationDate: z.string().min(1, "Date is required"),
  primaryChanges: z.string().min(1, "primary skills is Required"),
  secondaryChanges: z.string().min(1, "secondary skills is Required"),
  certifications: z.string().min(1, "certifications is Required"),
  comments: z.string().optional(),
  documents: z
    .object({
      attachmentName: z.string().optional(),
      attachmentURL: z.string().optional(),
    })
    .optional()
    .nullable(),
});

const schema = z.object({ calibrations: calibrationSchema });

type FormValues = z.infer<typeof schema>;
type Attachment = { attachmentName?: string; attachmentURL?: string } | null;

/** File picker that uploads to the file server immediately and stores `{ attachmentURL, attachmentName }`. */
function UploadedFileField({ value, onChange, accept }: { value?: Attachment; onChange?: (v: Attachment) => void; accept?: string }) {
  const [uploading, setUploading] = useState(false);
  return (
    <Space wrap>
      <Upload
        accept={accept}
        showUploadList={false}
        disabled={uploading}
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
        <Button icon={<UploadOutlined />} loading={uploading}>
          Upload
        </Button>
      </Upload>
      {value?.attachmentURL && <Typography.Text type="secondary">({value.attachmentName})</Typography.Text>}
    </Space>
  );
}

interface SkillsCalibrationFormProps {
  onPrevious?: () => void;
  onNext?: () => void;
  hiringData: HiringSummaryProps;
}

type CalibrationKey = keyof z.infer<typeof calibrationSchema>;
const field = <K extends CalibrationKey>(name: K): ["calibrations", K] => ["calibrations", name];

/** Step 5 of the hiring request: skills calibration sessions. */
export default function SkillsCalibrationForm({ onPrevious, hiringData }: SkillsCalibrationFormProps) {
  const { hiring } = useParams();
  const queryClient = useQueryClient();
  const { hrqid, jobtitle } = useHiringStore();
  const [form] = Form.useForm<FormValues>();
  const [showForm, setShowForm] = useState(false);
  const [editMode, setEditmode] = useState(false);
  const [editCalibrationId, setCalibrationId] = useState<number | null>(null);

  const initialValues: FormValues = {
    calibrations: {
      hrqId: hiringData?.hrqid || "",
      jobTitle: hiringData?.jobDetail || "",
      attendees: "",
      calibrationDate: "",
      primaryChanges: "",
      secondaryChanges: "",
      certifications: "",
      comments: "",
      documents: undefined,
    },
  };

  const { data: getCalibrations } = useQuery({
    queryKey: ["getCalibrations", hiring],
    queryFn: () => hiringApi.getCalibrations(Number(hiring)),
    enabled: !!hiring,
  });

  const { mutate: createCalibration, isPending } = useMutation({
    mutationKey: ["createCalibration"],
    mutationFn: hiringApi.createCalibration,
    onSuccess: (data) => {
      toast.success(data?.message || "calibration created");
      queryClient.invalidateQueries({ queryKey: ["getCalibrations"] });
      form.resetFields();
      setShowForm(false);
    },
    onError: (error) => {
      toast.error("Failed to create partner");
      console.error("Error creating partner:", error);
    },
  });

  const { mutate: updateCalibration, isPending: UpdateLoading } = useMutation({
    mutationFn: (values: createCalibrationPayload) => hiringApi.updateCalibration(Number(editCalibrationId), values),
    onSuccess: (data) => {
      form.resetFields();
      toast.success(data?.message || "Calibration updated successfully");
      setShowForm(false);
      setEditmode(false);
      queryClient.invalidateQueries({ queryKey: ["getCalibrations"] });
    },
    onError: (error) => {
      toast.error("Failed to update hiring");
      console.log("Error updating hiring:", error);
    },
  });

  const handleFormSubmit = (raw: FormValues) => {
    const data = validateWithZod(schema, form, raw);
    if (!data) return;
    const values = data.calibrations;
    const transformedPayload = {
      id: editMode ? editCalibrationId : 0,
      hrqId: values.hrqId,
      jobTitle: values.jobTitle,
      attendees: values.attendees,
      calibrationDate: new Date(values.calibrationDate).toISOString(),
      primarySkills: values.primaryChanges,
      secondarySkills: values.secondaryChanges,
      certifications: values.certifications,
      comments: values.comments,
      hiringRequestId: Number(hiring),
      documents: values.documents || { attachmentName: "", attachmentURL: "" },
    } as unknown as createCalibrationPayload;

    if (editMode) {
      updateCalibration(transformedPayload);
    } else {
      createCalibration(transformedPayload);
    }
  };

  useEffect(() => {
    form.setFieldValue(field("hrqId"), hrqid);
    form.setFieldValue(field("jobTitle"), jobtitle);
  }, [hrqid, jobtitle, form]);

  const onEdit = (value: any) => {
    setCalibrationId(value.id);
    setShowForm(true);
    setEditmode(true);
    form.resetFields();
    form.setFieldsValue({
      calibrations: {
        hrqId: value?.hrqId || "",
        jobTitle: value?.jobTitle || "",
        attendees: value.attendees,
        calibrationDate: new Date(value?.calibrationDate).toISOString().split("T")[0],
        primaryChanges: value.primarySkills,
        secondaryChanges: value.secondarySkills,
        certifications: value.certifications,
        comments: value.comments,
        documents: value?.documents || { attachmentName: "", attachmentURL: "" },
      },
    });
  };

  const columns: ColumnsType<any> = [
    { key: "hrqId", title: "HRQ ID", dataIndex: "hrqId" },
    { key: "jobTitle", title: "Role Hired For", dataIndex: "jobTitle" },
    { key: "attendees", title: "Attendees", dataIndex: "attendees" },
    { key: "calibrationDate", title: "Calibration Date", dataIndex: "calibrationDate", render: (v: string) => new Date(v).toLocaleDateString() },
    { key: "certifications", title: "Certifications", dataIndex: "certifications" },
    { key: "comments", title: "Comments", dataIndex: "comments" },
    {
      key: "documents",
      title: "Document",
      render: (_: unknown, c: any) => (c.documents?.attachmentURL ? <DocumentPreview url={c.documents.attachmentURL} fileName={c.documents.attachmentName} /> : null),
    },
    {
      key: "actions",
      title: "Actions",
      width: 110,
      render: (_: unknown, c: any) => (
        <Button size="small" icon={<EditOutlined />} onClick={() => onEdit(c)}>
          Edit
        </Button>
      ),
    },
  ];

  return (
    <Flex vertical gap={16}>
      <Form form={form} layout="vertical" onFinish={handleFormSubmit} initialValues={initialValues}>
        <Spin spinning={isPending || UpdateLoading}>
          <Flex vertical gap={16}>
            <Flex justify="space-between" align="center">
              <Typography.Title level={5} style={{ margin: 0 }}>
                Skills Calibration
              </Typography.Title>
              {!showForm && (
                <Button type="primary" size="small" icon={<PlusOutlined />} onClick={() => setShowForm(true)}>
                  Add
                </Button>
              )}
            </Flex>

            {showForm && (
              <>
                <Card size="small">
                  <Row gutter={[16, 8]}>
                    <Col xs={24} md={12}>
                      <Form.Item name={field("hrqId")} label="HRQID" rules={zodRules(calibrationSchema, "hrqId")}>
                        <Input disabled />
                      </Form.Item>
                    </Col>
                    <Col xs={24} md={12}>
                      <Form.Item name={field("jobTitle")} label="Role Hired For" rules={zodRules(calibrationSchema, "jobTitle")}>
                        <Input disabled />
                      </Form.Item>
                    </Col>
                    <Col xs={24} md={12}>
                      <Form.Item name={field("attendees")} label="Attendees" rules={zodRules(calibrationSchema, "attendees")}>
                        <Input placeholder="Enter attendees" />
                      </Form.Item>
                    </Col>
                    <Col xs={24} md={12}>
                      <Form.Item name={field("calibrationDate")} label="Calibration Date" rules={zodRules(calibrationSchema, "calibrationDate")} {...dateItem}>
                        <DatePicker className="w-full" format="YYYY-MM-DD" />
                      </Form.Item>
                    </Col>
                    <Col xs={24} md={12}>
                      <Form.Item name={field("primaryChanges")} label="Primary skills" rules={zodRules(calibrationSchema, "primaryChanges")}>
                        <Input placeholder="Enter primary skill" />
                      </Form.Item>
                    </Col>
                    <Col xs={24} md={12}>
                      <Form.Item name={field("secondaryChanges")} label="Secondary skills" rules={zodRules(calibrationSchema, "secondaryChanges")}>
                        <Input placeholder="Enter secondary skill" />
                      </Form.Item>
                    </Col>
                    <Col xs={24} md={12}>
                      <Form.Item name={field("certifications")} label="Certifications" rules={zodRules(calibrationSchema, "certifications")}>
                        <Input placeholder="Enter certifications" />
                      </Form.Item>
                    </Col>
                    <Col xs={24} md={12}>
                      <Form.Item name={field("documents")} label="documents">
                        <UploadedFileField accept=".ppt,.pptx,.pdf,.doc,.docx" />
                      </Form.Item>
                    </Col>
                    <Col span={24}>
                      <Form.Item name={field("comments")} label="Comments" rules={zodRules(calibrationSchema, "comments")}>
                        <Input.TextArea rows={4} />
                      </Form.Item>
                    </Col>
                  </Row>
                </Card>

                <Flex justify="space-between" wrap gap={8}>
                  <Button onClick={onPrevious}>Previous</Button>
                  <Space>
                    <Button type="primary" htmlType="submit" loading={isPending || UpdateLoading}>
                      {isPending || UpdateLoading ? (editMode ? "Updating..." : "Saving...") : editMode ? "Update" : "Save"}
                    </Button>
                    <Button onClick={() => setShowForm(false)}>Cancel</Button>
                  </Space>
                </Flex>
              </>
            )}
          </Flex>
        </Spin>
      </Form>

      <Table size="middle" rowKey="id" columns={columns} dataSource={(getCalibrations as any[]) ?? []} pagination={false} scroll={{ x: "max-content" }} />
    </Flex>
  );
}
