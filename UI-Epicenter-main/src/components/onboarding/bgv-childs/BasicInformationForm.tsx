"use client";

import { useEffect, useMemo, useState } from "react";
import * as z from "zod";
import dayjs, { type Dayjs } from "dayjs";
import { useQuery } from "@tanstack/react-query";
import { Button, Card, Checkbox, Col, DatePicker, Divider, Flex, Form, Input, Modal, Radio, Row, Select, Space, Spin, Typography } from "antd";
import { DownloadOutlined, EyeOutlined } from "@ant-design/icons";
import { dropdownApi } from "@/services/api/master";
import { MasterTypes } from "@/constants/masterTypes";
import { isPartner } from "@/store/userStore";
import { validateWithZod, zodRules } from "@/lib/zodRules";
import { TatIndicator } from "../ITPCSetup";
import { AttachmentUpload, MultiDocumentUpload } from "../upload-fields";

const bgvBaseSchema = z.object({
  startDate: z.string().min(1, "Start Date is required"),
  vendor: z.string().min(1, "Vendor is required"),
  pguId: z.string().min(1, "PGU is required"),
  ndaAvailability: z.boolean(),
  cdaAvailability: z.boolean(),
  ndaAvailabilityDoc: z.object({
    attachmentName: z.string().optional(),
    attachmentURL: z.string().optional(),
  }),
  cdaAvailabilityDoc: z.object({
    attachmentName: z.string().optional(),
    attachmentURL: z.string().optional(),
  }),
  additionalDocs: z.array(
    z.object({
      id: z.number().optional(),
      attachmentName: z.string().optional(),
      attachmentURL: z.string().optional(),
      additionalDocId: z.number().optional(),
    })
  ),
  uploadBGVDocs: z.array(
    z.object({
      id: z.number().optional(),
      attachmentName: z.string().optional(),
      attachmentURL: z.string().optional(),
      uploadBGVDocId: z.number().optional(),
    })
  ),
  isBGVAvailableWithPartner: z.boolean(),
  bgvStatusId: z.string(),
  bgvCompletionDate: z.string(),
  bgvCategoryId: z.string().optional(),
});

const formSchema = bgvBaseSchema.superRefine((data, ctx) => {
  if (data.isBGVAvailableWithPartner && !data.bgvStatusId) {
    ctx.addIssue({ path: ["bgvStatusId"], code: z.ZodIssueCode.custom, message: "BGV Status is required when BGV is available with partner" });
  }
  if (data.bgvStatusId === "77001") {
    if (!data.bgvCompletionDate) {
      ctx.addIssue({ path: ["bgvCompletionDate"], code: z.ZodIssueCode.custom, message: "BGV Completion Date is required when status is Completed" });
    }
    if (!data.bgvCategoryId) {
      ctx.addIssue({ path: ["bgvCategoryId"], code: z.ZodIssueCode.custom, message: "BGV Category is required when status is Completed" });
    }
  }
  if (data.ndaAvailability || data.cdaAvailability) {
    const isNdaMissing = !data.ndaAvailabilityDoc?.attachmentName || !data.ndaAvailabilityDoc?.attachmentURL;
    const isCdaMissing = !data.cdaAvailabilityDoc?.attachmentName || !data.cdaAvailabilityDoc?.attachmentURL;
    if (isNdaMissing && isCdaMissing) {
      ctx.addIssue({ path: ["ndaAvailabilityDoc"], code: z.ZodIssueCode.custom, message: "Both NDA and CDA documents are required" });
      ctx.addIssue({ path: ["cdaAvailabilityDoc"], code: z.ZodIssueCode.custom, message: "Both NDA and CDA documents are required" });
    } else {
      if (isNdaMissing) ctx.addIssue({ path: ["ndaAvailabilityDoc"], code: z.ZodIssueCode.custom, message: "Please upload NDA document" });
      if (isCdaMissing) ctx.addIssue({ path: ["cdaAvailabilityDoc"], code: z.ZodIssueCode.custom, message: "Please upload CDA document" });
    }
  }
});

type FormValues = z.infer<typeof formSchema>;

type Option = { id: number | string; name: string };
const toOptions = (list: Option[] = []) => list.map((o) => ({ value: String(o.id), label: o.name }));
const YES_NO = [
  { label: "Yes", value: true },
  { label: "No", value: false },
];
const ACCEPT = ".ppt,.pptx,.pdf,.doc,.docx";

const dateItem = {
  getValueProps: (v?: string) => ({ value: v && dayjs(v).isValid() ? dayjs(v) : null }),
  normalize: (d: Dayjs | null) => (d ? d.format("YYYY-MM-DD") : ""),
};
const noPast = (d: Dayjs) => d.isBefore(dayjs(), "day");

/** Background-verification form: NDA / CDA availability, supporting documents and the BGV status. */
export default function CombinedInformationForm({ onboardingTimeline, personalDetails, onSave }: any) {
  const [form] = Form.useForm<FormValues>();
  const [modalData, setModalData] = useState<{ title: string; fileUrl: string } | null>(null);
  const [loader, setLoader] = useState(false);
  const bgvId: number = typeof onboardingTimeline?.id === "number" ? onboardingTimeline.id : 0;

  const initial = useMemo<FormValues>(
    () => ({
      startDate: personalDetails?.dateOfJoining || "",
      vendor: personalDetails?.sourceName || "",
      pguId: personalDetails?.pguName || "",
      ndaAvailability: onboardingTimeline?.ndaAvailability || false,
      cdaAvailability: onboardingTimeline?.cdaAvailability || false,
      ndaAvailabilityDoc: onboardingTimeline?.ndaAvailabilityDoc || {},
      cdaAvailabilityDoc: onboardingTimeline?.cdaAvailabilityDoc || {},
      additionalDocs: onboardingTimeline?.additionalDocs || [],
      uploadBGVDocs: onboardingTimeline?.uploadBGVDocs || [],
      isBGVAvailableWithPartner: onboardingTimeline?.isBGVAvailableWithPartner || false,
      bgvStatusId: onboardingTimeline?.bgvStatusId ? onboardingTimeline?.bgvStatusId?.toString() : "77003",
      bgvCategoryId: onboardingTimeline?.bgvCategoryId?.toString() || "",
      bgvCompletionDate: onboardingTimeline?.bgvCompletionDate || "",
    }),
    [onboardingTimeline, personalDetails]
  );

  useEffect(() => {
    if (onboardingTimeline || personalDetails) form.setFieldsValue(initial);
  }, [onboardingTimeline, personalDetails, initial, form]);

  const { data: bgvCategory = [] } = useQuery({
    queryKey: ["bgvCategory"],
    queryFn: () => dropdownApi.fetchDropdown(MasterTypes.BGV_CATEGORY),
  });
  const { data: bgvStatusTypes = [] } = useQuery({
    queryKey: ["bgvStatus"],
    queryFn: () => dropdownApi.fetchDropdown(MasterTypes.BGV_STATUS_TYPES),
  });

  const ndaAvailability = Form.useWatch("ndaAvailability", form);
  const cdaAvailability = Form.useWatch("cdaAvailability", form);
  const isBGVAvailable = Form.useWatch("isBGVAvailableWithPartner", form);
  const IsbgvStatusTypes = Form.useWatch("bgvStatusId", form);

  const onFinish = async (v: FormValues) => {
    const data = validateWithZod(formSchema, form, { ...form.getFieldsValue(true), ...v });
    if (!data) return;
    setLoader(true);
    const additionalDoc = data.additionalDocs.map((doc) => ({
      id: doc.id || 0,
      attachmentName: doc.attachmentName,
      attachmentURL: doc.attachmentURL,
      docType: 1,
      additionalDocId: bgvId,
    }));
    const uploadBGVDoc = data.uploadBGVDocs.map((doc) => ({
      id: doc.id || 0,
      attachmentName: doc.attachmentName,
      attachmentURL: doc.attachmentURL,
      docType: 1,
      uploadBGVDocId: bgvId,
    }));
    const payload = {
      id: typeof onboardingTimeline?.id === "number" ? onboardingTimeline.id : undefined,
      vendorId: personalDetails?.sourceId ? Number(personalDetails.sourceId) : null,
      ...(data?.ndaAvailabilityDoc && data?.ndaAvailabilityDoc?.attachmentName && data?.ndaAvailabilityDoc?.attachmentURL && { ndaAvailabilityDoc: data.ndaAvailabilityDoc }),
      ...(data?.cdaAvailabilityDoc && data?.cdaAvailabilityDoc?.attachmentName && data?.cdaAvailabilityDoc?.attachmentURL && { cdaAvailabilityDoc: data.cdaAvailabilityDoc }),
      additionalDocs: additionalDoc ?? null,
      startDate: personalDetails?.dateOfJoining ? personalDetails?.dateOfJoining : null,
      vendor: personalDetails?.sourceName ? personalDetails?.sourceName : null,
      pguId: personalDetails?.pguId ? personalDetails?.pguId : onboardingTimeline?.pguId,
      ndaAvailability: data?.ndaAvailability ? data.ndaAvailability : null,
      cdaAvailability: data?.cdaAvailability ? data.cdaAvailability : null,
      isBGVAvailableWithPartner: data?.isBGVAvailableWithPartner ? data.isBGVAvailableWithPartner : null,
      bgvStatusId: data?.bgvStatusId ? data?.bgvStatusId : null,
      bgvCategoryId: data?.bgvCategoryId ? data?.bgvCategoryId : null,
      bgvCompletionDate: data?.bgvCompletionDate ? data?.bgvCompletionDate : null,
      uploadBGVDocs: uploadBGVDoc ?? null,
    };
    await onSave(payload);
    setTimeout(() => setLoader(false), 200);
  };

  const agreementSection = (kind: "NDA" | "CDA", availabilityName: "ndaAvailability" | "cdaAvailability", docName: "ndaAvailabilityDoc" | "cdaAvailabilityDoc", available: boolean | undefined) => (
    <Card title={`${kind} Section`} size="small">
      <Form.Item name={availabilityName} label={`${kind} Availability`}>
        <Radio.Group options={YES_NO} />
      </Form.Item>
      <Space wrap className="mb-4">
        <Button size="small" icon={<EyeOutlined />} onClick={() => setModalData({ title: kind, fileUrl: `/docs/Sample${kind}.pdf` })}>
          Sample {kind} template
        </Button>
        <Button size="small" icon={<DownloadOutlined />} href={`/docs/${kind}fill.pdf`} download>
          Download {kind} template
        </Button>
      </Space>
      <Form.Item name={docName} label={`Upload ${kind} Doc`} required>
        <AttachmentUpload accept={ACCEPT} disabled={onboardingTimeline?.candidateBGVCompleted ? !!available : !available} />
      </Form.Item>
    </Card>
  );

  return (
    <Spin spinning={loader}>
      <Flex justify="space-between" align="center" wrap gap={8} className="mb-4">
        <Typography.Title level={5} style={{ margin: 0 }}>
          Background Verification
        </Typography.Title>
        {!isPartner && <TatIndicator startDate={personalDetails?.dateOfJoining} endDate={onboardingTimeline?.bgvCompletionDate} />}
      </Flex>
      <Form form={form} layout="vertical" initialValues={initial} onFinish={onFinish}>
        <Row gutter={[16, 8]}>
          <Col xs={24} md={12}>
            <Form.Item name="pguId" label="PGU" rules={zodRules(bgvBaseSchema, "pguId")}>
              <Input placeholder="Select PGU" disabled />
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Form.Item name="startDate" label="Start Date" rules={zodRules(bgvBaseSchema, "startDate")} {...dateItem}>
              <DatePicker className="w-full" format="YYYY-MM-DD" disabled />
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Form.Item name="vendor" label="Vendor" rules={zodRules(bgvBaseSchema, "vendor")}>
              <Input disabled />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={[16, 16]}>
          <Col xs={24} md={12}>
            {agreementSection("NDA", "ndaAvailability", "ndaAvailabilityDoc", ndaAvailability)}
          </Col>
          <Col xs={24} md={12}>
            {agreementSection("CDA", "cdaAvailability", "cdaAvailabilityDoc", cdaAvailability)}
          </Col>
        </Row>

        {!isPartner && (
          <Form.Item name="additionalDocs" label="Upload Additional Document" className="mt-4">
            <MultiDocumentUpload
              accept={ACCEPT}
              maxFiles={10}
              candiadateBGVId={bgvId}
              isCreating={onboardingTimeline?.id ? false : true}
              isToggle={typeof onboardingTimeline?.id === "number" ? false : true}
              docType={2}
              additionalDocId={Array.isArray(onboardingTimeline?.additionalDocs) && onboardingTimeline?.additionalDocs.length > 0 ? onboardingTimeline?.additionalDocs[0]?.additionalDocId : undefined}
            />
          </Form.Item>
        )}

        <Divider titlePlacement="left">BGV Status</Divider>
        <Form.Item name="isBGVAvailableWithPartner" valuePropName="checked">
          <Checkbox disabled={!onboardingTimeline?.candidateBGVCompleted}>Is BGV Available with Partner</Checkbox>
        </Form.Item>
        <Row gutter={[16, 8]}>
          <Col xs={24} md={12}>
            <Form.Item name="bgvStatusId" label="BGV Status" required>
              <Select placeholder="Select Status" options={toOptions(bgvStatusTypes)} showSearch optionFilterProp="label" disabled={!isBGVAvailable} />
            </Form.Item>
          </Col>
          {IsbgvStatusTypes === "77001" && (
            <>
              <Col xs={24} md={12}>
                <Form.Item name="bgvCategoryId" label="BGV Category" required>
                  <Select placeholder="Select Category" options={toOptions(bgvCategory)} showSearch optionFilterProp="label" disabled={!isBGVAvailable} allowClear />
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item name="bgvCompletionDate" label="BGV Completion Date" required {...dateItem}>
                  <DatePicker className="w-full" format="YYYY-MM-DD" disabled={!isBGVAvailable} disabledDate={noPast} />
                </Form.Item>
              </Col>
              {!isPartner && (
                <Col xs={24}>
                  <Form.Item name="uploadBGVDocs" label="Upload Bgv Document">
                    <MultiDocumentUpload
                      accept={ACCEPT}
                      maxFiles={10}
                      candiadateBGVId={bgvId}
                      isCreating={onboardingTimeline?.id ? false : true}
                      isToggle={typeof onboardingTimeline?.id === "number" ? false : true}
                      docType={1}
                      uploadBGVDocId={Array.isArray(onboardingTimeline?.uploadBGVDocs) && onboardingTimeline?.uploadBGVDocs.length > 0 ? onboardingTimeline?.uploadBGVDocs[0]?.uploadBGVDocId : undefined}
                    />
                  </Form.Item>
                </Col>
              )}
            </>
          )}
        </Row>

        <Flex justify="flex-end" className="pt-2">
          <Button type="primary" htmlType="submit">
            {onboardingTimeline?.id ? "Update" : "Submit"}
          </Button>
        </Flex>
      </Form>

      <Modal
        open={!!modalData}
        onCancel={() => setModalData(null)}
        title={modalData?.title}
        width={960}
        style={{ top: 24 }}
        destroyOnHidden
        footer={
          <Button icon={<DownloadOutlined />} href={modalData?.fileUrl} download>
            Download PDF
          </Button>
        }
      >
        {modalData && <iframe src={modalData.fileUrl} title={modalData.title} style={{ width: "100%", height: "75vh", border: 0 }} />}
      </Modal>
    </Spin>
  );
}
