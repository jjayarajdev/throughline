"use client";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  Button,
  Card,
  Checkbox,
  Col,
  DatePicker,
  Descriptions,
  Divider,
  Dropdown,
  Flex,
  Form,
  Input,
  List,
  Modal,
  Row,
  Select,
  Space,
  Table,
  Typography,
  Upload,
} from "antd";
import type { MenuProps } from "antd";
import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  DeleteOutlined,
  DownloadOutlined,
  EditOutlined,
  EyeOutlined,
  FileTextOutlined,
  MoreOutlined,
  PlusOutlined,
  UploadOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import * as z from "zod";

import DataTable, { type DataColumn } from "@/components/data-table/DataTable";
import { useTableState } from "@/components/data-table/useTableState";
import { useSearchColumns } from "@/components/data-table/useSearchColumns";
import { toast } from "@/lib/toast";
import { validateWithZod, zodRules } from "@/lib/zodRules";
import api from "@/lib/axiosInstance";
import { useDebounce } from "@/lib/useDebounce";
import { MasterTypes } from "@/constants/masterTypes";
import { FilterTypeEnum } from "@/constants/FilterTypeEnum";
import { dropdownApi } from "@/services/api/master";
import { empanelmentFormSchema, engagementFormSchema, partnerApi } from "@/services/api/partner.profile.api";
import { usePartnerStore } from "@/store/userPartnerStore";
import { isPartner, useUserStore } from "@/store/userStore";
import { EvaluationSidebarOnly } from "./sow/EngagementDialog";

type EngagementFormValues = z.infer<typeof engagementFormSchema>;
type EmpanelmentFormValues = z.infer<typeof empanelmentFormSchema>;

// the object schemas behind the refinements, for per-field rules
const evaluationShape = engagementFormSchema.innerType();
const empanelmentShape = empanelmentFormSchema.innerType().innerType();

interface EngagementFormProps {
  onNext?: () => void;
  onPrevious?: () => void;
}

interface SowDocument {
  id?: number;
  attachmentName: string;
  attachmentURL: string;
  name?: string;
  partnerId?: number;
  partnerEmpanelId?: number;
}

/** Form values keep dates as `YYYY-MM-DD` strings (the shape the zod schemas and API expect). */
const dateItemProps = {
  getValueProps: (v: string | undefined) => ({ value: v ? dayjs(v) : null }),
  normalize: (d: dayjs.Dayjs | null) => (d ? d.format("YYYY-MM-DD") : ""),
};
const notBeforeToday = (d: dayjs.Dayjs) => d.isBefore(dayjs().startOf("day"));

const toOptions = (rows: { id: number; name: string }[] = []) => rows.map((r) => ({ value: String(r.id), label: r.name }));

// evaluation status -> engagement status
const evaluationToEngagementMap: Record<string, string> = {
  "11005": "8001", // Yet to Start
  "11001": "8003", // In Progress
  "11002": "8003", // Completed
  "11003": "8003", // Extended
  "11004": "8004", // Rejected
};

/* ------------------------------------------------------------------ */
/* SOW & Quote documents (multi-upload field used inside Form.Item)     */
/* ------------------------------------------------------------------ */

interface SowQuoteDocumentsProps {
  value?: SowDocument[];
  onChange?: (docs: SowDocument[]) => void;
  disabled?: boolean;
  maxFiles?: number;
  accept?: string;
  partnerId: string;
  isCreating: boolean;
  partnerEmpanelId?: number;
  refetchPartner?: () => unknown;
}

function SowQuoteDocuments({ value = [], onChange, disabled, maxFiles = 10, accept, partnerId, isCreating, partnerEmpanelId, refetchPartner }: SowQuoteDocumentsProps) {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<{ url: string; name: string } | null>(null);
  const [previousOpen, setPreviousOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [searchText] = useState("");
  const debouncedSearch = useDebounce(searchText, 300);

  const listId = partnerEmpanelId ? partnerEmpanelId : partnerId;
  const url = partnerEmpanelId
    ? `Empanelment/paged/sow-quote-documents?partnerempanelId=${partnerEmpanelId}`
    : `/Partner/paged/capability-deck-documants?partnerId=${partnerId}`;

  const { data: previousDocuments, refetch: refetchPrevious, isPending } = useQuery({
    queryKey: ["capabilityDeckDocuments", listId, currentPage, debouncedSearch, pageSize],
    queryFn: () => partnerApi.getcapabilityDeckDocuments(url, { pageNumber: currentPage, pageSize, searchText: debouncedSearch || undefined }),
    enabled: !!partnerId,
    refetchOnWindowFocus: true,
  });
  const previousRows: any[] = previousDocuments?.items || [];

  const handleUpload = async (file: File) => {
    if (value.length >= maxFiles) {
      toast.error(`Maximum ${maxFiles} files allowed`);
      return;
    }
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await api.post("/FileServer/upload", formData, { headers: { "Content-Type": "multipart/form-data" } });
      const fileName = res.data.fileName || res.data;
      const newDocument: SowDocument = {
        id: 0,
        attachmentURL: fileName,
        attachmentName: fileName,
        name: fileName,
        partnerId: isCreating ? 0 : partnerId ? Number(partnerId) : 0,
        partnerEmpanelId: isCreating ? 0 : partnerId ? Number(partnerId) : 0,
      };
      onChange?.([...value, newDocument]);
      toast.success("Document uploaded successfully");
    } catch (error) {
      console.error("Upload failed", error);
      toast.error("Failed to upload document");
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (document: SowDocument) => {
    try {
      if (document?.attachmentURL) await api.delete(`/FileServer/${document?.attachmentName}`);
      onChange?.(value.filter((doc) => doc?.attachmentURL !== document?.attachmentURL));
      if (typeof refetchPartner === "function") await refetchPartner();
      await refetchPrevious();
      toast.success("Document deleted successfully");
    } catch (error: any) {
      console.error("Delete failed", error);
      toast.error(error?.response?.data?.message || error?.message || "Failed to delete document");
    }
  };

  const previewUrl = (doc: SowDocument) => {
    if (!doc?.attachmentURL) return "";
    if (doc.attachmentURL.startsWith("http")) return doc.attachmentURL;
    return `${process.env.NEXT_PUBLIC_API_BASE_URL}/FileServer/${doc.attachmentURL}`;
  };

  // in edit mode (an empanelment exists) only the latest document is shown inline
  const isLatestOnly = !!partnerEmpanelId;
  const shown = isLatestOnly && value.length ? [value[value.length - 1]] : value;

  return (
    <Flex vertical gap={12}>
      <Upload
        accept={accept}
        showUploadList={false}
        disabled={disabled || uploading || value.length >= maxFiles}
        beforeUpload={(file) => {
          void handleUpload(file as File);
          return false;
        }}
      >
        <Button icon={<UploadOutlined />} loading={uploading} disabled={disabled || value.length >= maxFiles}>
          Upload document
        </Button>
      </Upload>
      {value.length >= maxFiles && (
        <Typography.Text type="warning">Maximum {maxFiles} files allowed. Delete a file to upload a new one.</Typography.Text>
      )}
      {shown.length > 0 && (
        <List
          size="small"
          bordered
          dataSource={shown}
          rowKey={(d) => d.attachmentName}
          renderItem={(doc, i) => {
            const isLatest = isLatestOnly || i === value.length - 1;
            return (
              <List.Item
                actions={[
                  <Button key="view" type="text" size="small" icon={<EyeOutlined />} onClick={() => setPreview({ url: previewUrl(doc), name: doc.attachmentName })} />,
                  <Button key="delete" type="text" size="small" danger icon={<DeleteOutlined />} disabled={disabled} onClick={() => handleDelete(doc)} />,
                ]}
              >
                <List.Item.Meta
                  avatar={<FileTextOutlined />}
                  title={<Typography.Text ellipsis={{ tooltip: doc.attachmentName }}>{doc.attachmentName}</Typography.Text>}
                  description={isLatest ? "Latest Document" : `Document ${i + 1}`}
                />
              </List.Item>
            );
          }}
        />
      )}
      <Button
        style={{ alignSelf: "flex-start" }}
        disabled={!partnerEmpanelId}
        onClick={async () => {
          await refetchPrevious();
          setPreviousOpen(true);
        }}
      >
        Previous Documents
      </Button>

      <Modal open={previousOpen} onCancel={() => setPreviousOpen(false)} footer={null} title="Previous Documents" width={960} destroyOnHidden>
        <Table
          size="small"
          rowKey="id"
          loading={isPending && !!partnerId}
          dataSource={previousRows}
          scroll={{ x: "max-content" }}
          pagination={{
            current: currentPage,
            pageSize,
            total: previousDocuments?.totalCount ?? 0,
            showSizeChanger: true,
            onChange: (page, size) => {
              setCurrentPage(page);
              if (size !== pageSize) setPageSize(size);
            },
          }}
          columns={[
            { key: "sno", title: "S.No", render: (_: unknown, __: unknown, index: number) => index + 1 },
            { key: "attachmentName", title: "File Name", dataIndex: "attachmentName" },
            { key: "createdDate", title: "Date", dataIndex: "createdDate" },
            { key: "createdTime", title: "Time", dataIndex: "createdTime" },
            {
              key: "view",
              title: "View",
              render: (_: unknown, doc: any) => <Button type="text" size="small" icon={<EyeOutlined />} onClick={() => setPreview({ url: doc?.attachmentURL, name: doc?.attachmentName })} />,
            },
            {
              key: "delete",
              title: "Delete",
              render: (_: unknown, doc: any) => <Button type="text" size="small" danger icon={<DeleteOutlined />} onClick={() => handleDelete(doc)} />,
            },
          ]}
        />
      </Modal>

      <Modal
        open={!!preview}
        onCancel={() => setPreview(null)}
        title={preview?.name || "Document"}
        width="94vw"
        style={{ top: 16 }}
        destroyOnHidden
        footer={
          <Button icon={<DownloadOutlined />} onClick={() => preview && window.open(preview.url, "_blank")}>
            Download
          </Button>
        }
      >
        {preview && <iframe src={preview.url} title="Document preview" style={{ width: "100%", height: "80vh", border: 0 }} />}
      </Modal>
    </Flex>
  );
}

/* ------------------------------------------------------------------ */
/* Empanelment fields (shared by create and edit)                       */
/* ------------------------------------------------------------------ */

function EmpanelmentFields({
  isGpApproved,
  agreementTypeId,
  agreementTypes,
  sowSigningDate,
  partnerId,
  isCreating,
  partnerEmpanelId,
  refetchPartner,
}: {
  isGpApproved: boolean;
  agreementTypeId?: string;
  agreementTypes: { id: number; name: string }[];
  sowSigningDate?: string;
  partnerId: string;
  isCreating: boolean;
  partnerEmpanelId?: number;
  refetchPartner: () => unknown;
}) {
  const disabledDate = notBeforeToday;
  return (
    <>
      <Row gutter={[16, 8]}>
        <Col xs={24} md={12}>
          <Flex gap={16} align="flex-end">
            <Form.Item name="empanelmentStartDate" label="Empanelment Start Date" rules={[{ required: true, message: "Empanelment start date is required" }]} {...dateItemProps} className="flex-1">
              <DatePicker className="w-full" format="YYYY-MM-DD" disabledDate={notBeforeToday} />
            </Form.Item>
            <Form.Item name="isThisGPApproved" valuePropName="checked">
              <Checkbox>Is this GP approved?</Checkbox>
            </Form.Item>
          </Flex>
        </Col>
        <Col xs={24} md={12}>
          <Form.Item name="gpApprovalDate" label="GP Approval Date" {...dateItemProps}>
            <DatePicker className="w-full" format="YYYY-MM-DD" disabled={!isGpApproved} disabledDate={disabledDate} />
          </Form.Item>
        </Col>
        <Col xs={24} md={12}>
          <Form.Item name="agreementTypeId" label="Agreement Type" rules={zodRules(empanelmentShape, "agreementTypeId")}>
            <Select placeholder="Select agreement type" options={toOptions(agreementTypes)} disabled={!isGpApproved} allowClear showSearch optionFilterProp="label" />
          </Form.Item>
        </Col>
        {agreementTypeId === "1001" && (
          <>
            <Col xs={24} md={12}>
              <Form.Item name="gpId" label="GP ID" rules={zodRules(empanelmentShape, "gpId")}>
                <Input placeholder="Enter GP ID" disabled={!isGpApproved} />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item name="contractId" label="Contract ID" rules={zodRules(empanelmentShape, "contractId")}>
                <Input placeholder="Enter Contract ID" disabled={!isGpApproved} />
              </Form.Item>
            </Col>
          </>
        )}
        <Col xs={24} md={12}>
          <Form.Item name="panid" label="PAN ID" rules={zodRules(empanelmentShape, "panid")}>
            <Input placeholder="Enter PAN ID" disabled={!isGpApproved} />
          </Form.Item>
        </Col>
        <Col xs={24} md={12}>
          <Form.Item name="tanid" label="TAN ID" rules={zodRules(empanelmentShape, "tanid")}>
            <Input placeholder="Enter TAN ID" disabled={!isGpApproved} />
          </Form.Item>
        </Col>
        <Col xs={24} md={12}>
          <Form.Item name="gstid" label="GST ID" rules={zodRules(empanelmentShape, "gstid")}>
            <Input placeholder="Enter GST ID" disabled={!isGpApproved} />
          </Form.Item>
        </Col>
        <Col xs={24} md={12}>
          <Form.Item name="empanelmentComments" label="Empanelment Comments" rules={zodRules(empanelmentShape, "empanelmentComments")}>
            <Input placeholder="Enter Empanelment Comments" disabled={!isGpApproved} />
          </Form.Item>
        </Col>
        <Col xs={24} md={12}>
          <Form.Item
            name="sowSigningDate"
            label="SOW Signing Date"
            rules={isGpApproved ? [{ required: true, message: "SOW Signing Date is required when GP is approved" }] : []}
            {...dateItemProps}
          >
            <DatePicker className="w-full" format="YYYY-MM-DD" disabled={!isGpApproved} disabledDate={disabledDate} />
          </Form.Item>
        </Col>
      </Row>
      {sowSigningDate && (
        <Form.Item name="sowQuoteDocuments" label="SOW & Quote Documents" required>
          <SowQuoteDocuments
            accept=".ppt,.pptx,.pdf,.doc,.docx"
            maxFiles={10}
            partnerId={partnerId}
            isCreating={isCreating}
            partnerEmpanelId={partnerEmpanelId}
            disabled={!isGpApproved}
            refetchPartner={refetchPartner}
          />
        </Form.Item>
      )}
    </>
  );
}

/* ------------------------------------------------------------------ */
/* Engagement form                                                      */
/* ------------------------------------------------------------------ */

export default function EngagementForm({ onNext, onPrevious }: EngagementFormProps) {
  const { partnerCode, isPartnerEmpanelled, setIsPartnerEmpanelled } = usePartnerStore();
  const { userName } = useUserStore();
  const searchParams = useSearchParams();
  const partnerId = searchParams.get("id") || "";

  const [showHiringDialog, setShowHiringDialog] = useState(false);
  const [selectedHrqIds, setSelectedHrqIds] = useState<string[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [selectedEngagement, setSelectedEngagement] = useState<any>(null);
  const [isEditingEmpanelment, setIsEditingEmpanelment] = useState(false);
  const [showEmpanelmentFields, setShowEmpanelmentFields] = useState(false);
  const [actionType, setActionType] = useState<"extended" | "completed" | null>(null);
  const [open, setOpen] = useState(false);

  const [evaluationForm] = Form.useForm<EngagementFormValues>();
  const [empanelmentForm] = Form.useForm<EmpanelmentFormValues>();

  const evaluationInitialValues: EngagementFormValues = useMemo(
    () => ({
      isActive: true,
      engagementStatusId: "8003",
      engagementTypeId: "",
      evaluationStartDate: new Date().toISOString().split("T")[0],
      evaluationExtendedDate: "",
      evaluationEndDate: "",
      evaluationPeriod: "",
      evaluatedBy: userName ?? "",
      businessId: "",
      businessCenter: "",
      mruCode: "",
      evaluationStatusId: "11001",
      rejectionReasonId: "",
      rejectionReason: "",
      partnerId: partnerId || "",
      comments: "",
      isEditMode: false,
    }),
    [userName, partnerId]
  );

  const empanelmentInitialValues: EmpanelmentFormValues = useMemo(
    () => ({
      isActive: true,
      partnerId: null,
      isEmpaneledPartner: false,
      empanelmentStartDate: "",
      sowSigningDate: "",
      gpApprovalDate: "",
      agreementTypeId: "",
      empanelmentComments: "",
      panid: "",
      tanid: "",
      gstid: "",
      gpId: "",
      contractId: "",
      isThisGPApproved: false,
      sowQuoteDocuments: [],
    }),
    []
  );

  // watched values (preserve: true so hidden / unmounted fields are still observed)
  const selectedEngagementType = Form.useWatch("engagementTypeId", { form: evaluationForm, preserve: true });
  const evaluationStartDate = Form.useWatch("evaluationStartDate", { form: evaluationForm, preserve: true });
  const evaluationEndDate = Form.useWatch("evaluationEndDate", { form: evaluationForm, preserve: true });
  const evalStatusId = Form.useWatch("evaluationStatusId", { form: evaluationForm, preserve: true });
  const agreementTypeId = Form.useWatch("agreementTypeId", { form: empanelmentForm, preserve: true });
  const isThisGPApproved = Form.useWatch("isThisGPApproved", { form: empanelmentForm, preserve: true });
  const sowSigningDate = Form.useWatch("sowSigningDate", { form: empanelmentForm, preserve: true });
  const isGpApproved = !!isThisGPApproved;

  useEffect(() => {
    if (evaluationStartDate && evaluationEndDate) {
      const start = new Date(evaluationStartDate);
      const end = new Date(evaluationEndDate);
      let months = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());
      if (end.getDate() < start.getDate()) months -= 1;
      evaluationForm.setFieldsValue({ evaluationPeriod: months.toString() } as any);
    }
  }, [evaluationStartDate, evaluationEndDate, evaluationForm]);

  useEffect(() => {
    const derived = evaluationToEngagementMap[evalStatusId as string];
    if (derived) evaluationForm.setFieldsValue({ engagementStatusId: derived } as any);
  }, [evalStatusId, evaluationForm]);

  /* ---------------- hiring open list (engagement type: labour) ---------------- */
  const t = useTableState({ pageSize: 50, searchColumn: "HrqId" });
  const searchColumns = useSearchColumns(FilterTypeEnum.Partner_Engagement_OpenListGrid);
  const { data: hiringRequests, isLoading } = useQuery({
    queryKey: ["hiringRequests", partnerId, t.query.pageNumber, t.query.pageSize, t.searchColumn, t.query.searchText],
    queryFn: () =>
      partnerApi.activeHiringReq(partnerId, {
        pageNumber: t.query.pageNumber,
        pageSize: t.query.pageSize,
        searchColumn: t.searchColumn,
        searchText: t.query.searchText || undefined,
      }),
    enabled: showHiringDialog,
    refetchOnWindowFocus: true,
  });
  const hrqColumns: DataColumn<any>[] = [
    { key: "hrqId", title: "HRQID", dataIndex: "hrqId" },
    { key: "jobTitle", title: "Role Hired For", dataIndex: "jobTitle" },
    { key: "experience", title: "Experience", dataIndex: "experience" },
    { key: "rmOwnerName", title: "RM Owner", dataIndex: "rmOwnerName" },
    { key: "resourceTypeName", title: "Resource Type", dataIndex: "resourceTypeName" },
    { key: "openPositions", title: "Open Positions", dataIndex: "openPositions" },
    { key: "domainName", title: "Domain Name", dataIndex: "domainName" },
  ];

  /* ---------------- lookups ---------------- */
  const { data: engagementStatuses = [] } = useQuery({ queryKey: ["engagementStatus"], queryFn: () => dropdownApi.fetchDropdown(MasterTypes.ENGAGEMENT_STATUS) });
  const { data: engagementTypes = [] } = useQuery({ queryKey: ["engagementType"], queryFn: () => dropdownApi.fetchDropdown(MasterTypes.ENGAGEMENT_TYPE) });
  const { data: businessUnits = [] } = useQuery({ queryKey: ["businessUnit"], queryFn: () => dropdownApi.fetchDropdown(MasterTypes.BUSINESS_UNIT) });
  const { data: evaluationStatuses = [] } = useQuery({ queryKey: ["evaluationStatus"], queryFn: () => dropdownApi.fetchDropdown(MasterTypes.EVALUATION_STATUS) });
  const { data: agreementTypes = [] } = useQuery({ queryKey: ["agreementType"], queryFn: () => dropdownApi.fetchDropdown(MasterTypes.AGREEMENT_TYPE) });

  const { data: engagementDetails, isError: engagementDetailsError, refetch: refetchEvalutaionDetail } = useQuery({
    queryKey: ["engagementDetails", partnerId],
    queryFn: () => partnerApi.getEngagement(partnerId),
  });

  const { data: empanelmentDetails, refetch: refetchEmapnelmentDetail } = useQuery({
    queryKey: ["empanelmentDetails", partnerId],
    queryFn: () => partnerApi.getEmpanelment(partnerId),
  });
  const empanelment = empanelmentDetails?.data;

  useEffect(() => {
    if (!empanelment) return;
    setIsPartnerEmpanelled(empanelment.isEmpaneledPartner);
    const existingSowQuoteDocuments: SowDocument[] =
      empanelment.sowQuoteDocuments?.map((doc: any) => ({
        id: doc.id || 0,
        attachmentName: doc.attachmentName,
        attachmentURL: doc.attachmentURL,
        partnerEmpanelId: doc.partnerEmpanelId || Number(partnerId),
      })) || [];
    empanelmentForm.setFieldsValue({
      empanelmentStartDate: empanelment.empanelmentStartDate,
      sowSigningDate: empanelment.sowSigningDate,
      gpApprovalDate: empanelment.gpApprovalDate,
      agreementTypeId: empanelment.agreementTypeId?.toString() || "",
      empanelmentComments: empanelment.empanelmentComments || "",
      panid: empanelment.panid || "",
      tanid: empanelment.tanid || "",
      gstid: empanelment.gstid || "",
      gpId: empanelment.gpId || "",
      contractId: empanelment.contractId || "",
      partnerId: empanelment.partnerId || null,
      isThisGPApproved: !!empanelment.isThisGPApproved,
      sowQuoteDocuments: existingSowQuoteDocuments,
    } as any);
  }, [empanelment, empanelmentForm, partnerId, setIsPartnerEmpanelled]);

  /* ---------------- evaluation mutations ---------------- */
  const createEvaluationMutation = useMutation({
    mutationFn: partnerApi.createEngagement,
    onSuccess: () => {
      toast.success("Evaluation created successfully");
      setShowForm(false);
      evaluationForm.resetFields();
      refetchEvalutaionDetail();
    },
    onError: () => toast.error("Failed to create evaluation"),
  });

  const updateEvaluationMutation = useMutation({
    mutationFn: (values: any) => partnerApi.updatePartnerEngagement(Number(selectedEngagement?.id), values),
    onSuccess: () => {
      toast.success("Evaluation updated successfully");
      setShowForm(false);
      setSelectedEngagement(null);
      setOpen(false);
      evaluationForm.setFieldsValue({ evaluationExtendedDate: "", extendedComments: "" } as any);
      refetchEvalutaionDetail();
    },
    onError: () => toast.error("Failed to update evaluation"),
  });

  /** `values` are already validated against engagementFormSchema. */
  const handleEvaluationSubmit = (values: EngagementFormValues) => {
    const formattedValues: any = {
      evaluationPeriod: Number(values.evaluationPeriod),
      engagementStatusId: Number(values.engagementStatusId),
      engagementTypeId: Number(values.engagementTypeId),
      businessId: Number(values.businessId),
      evaluationStatusId: Number(values.evaluationStatusId),
      partnerId: Number(partnerId) || Number(partnerId),
      evaluatedBy: values.evaluatedBy,
      evaluationStartDate: values.evaluationStartDate,
      evaluationEndDate: values.evaluationEndDate,
      isActive: values.isActive,
      businessCenter: values.businessCenter,
      mruCode: values.mruCode,
      comments: values.comments,
      isExtendEvaluation: values.evaluationStatusId === "11003",
      ...(values.evaluationStatusId === "11003" && values.evaluationExtendedDate?.trim() ? { evaluationExtendedDate: values.evaluationExtendedDate } : {}),
      ...(values.evaluationStatusId === "11003" && values.extendedComments?.trim() ? { extendedComments: values.extendedComments } : {}),
      ...(values.evaluationStatusId === "11004" ? { rejectionReasonId: values.rejectionReasonId || null, rejectionReason: values.rejectionReason || null } : {}),
    };
    if (selectedEngagement) updateEvaluationMutation.mutate({ ...formattedValues, id: selectedEngagement.id });
    else createEvaluationMutation.mutate(formattedValues);
  };

  const onEvaluationFinish = (values: EngagementFormValues) => {
    // merge with the stored (unmounted) fields such as isEditMode / partnerId
    const all = { ...(evaluationForm.getFieldsValue(true) as EngagementFormValues), ...values };
    const data = validateWithZod(engagementFormSchema, evaluationForm, all);
    if (data) handleEvaluationSubmit(data);
  };

  /* ---------------- empanelment mutations ---------------- */
  const submitEmpanelmentMutation = useMutation({
    mutationFn: partnerApi.submitEmpanelment,
    onSuccess: () => {
      toast.success("Empanelment created successfully");
      setIsPartnerEmpanelled(true);
      setShowEmpanelmentFields(false);
      refetchEmapnelmentDetail();
    },
    onError: () => toast.error("Failed to create empanelment"),
  });

  const updateEmpanelmentMutation = useMutation({
    mutationFn: (values: any) => partnerApi.updateEmpanelment(empanelment.id, values),
    onSuccess: () => {
      toast.success("Empanelment updated successfully");
      setIsEditingEmpanelment(false);
      refetchEmapnelmentDetail();
    },
    onError: () => toast.error("Failed to update empanelment"),
  });

  const handleEmpanelmentSubmit = (values: EmpanelmentFormValues) => {
    const formattedSowQuoteDocuments = values.sowQuoteDocuments.map((doc) => ({
      id: 0,
      attachmentName: doc.attachmentName,
      attachmentURL: doc.attachmentURL,
      partnerEmpanelId: Number(partnerId),
    }));
    submitEmpanelmentMutation.mutate({
      partnerId: Number(partnerId) || Number(partnerId),
      isEmpaneledPartner: true,
      sowSigningDate: values.sowSigningDate || null,
      gpApprovalDate: values.gpApprovalDate || null,
      agreementTypeId: Number(values.agreementTypeId) || null,
      isThisGPApproved: values.isThisGPApproved || false,
      sowQuoteDocuments: formattedSowQuoteDocuments,
      isActive: values.isActive,
      empanelmentStartDate: values.empanelmentStartDate,
      empanelmentComments: values.empanelmentComments,
      panid: values.panid,
      tanid: values.tanid,
      gstid: values.gstid,
      gpId: values.gpId,
      contractId: values.contractId,
    });
  };

  const handleEmpanelmentUpdate = (values: EmpanelmentFormValues) => {
    const formattedSowQuoteDocuments = values.sowQuoteDocuments.map((doc) => ({
      id: doc.id || 0,
      attachmentName: doc.attachmentName,
      attachmentURL: doc.attachmentURL,
      partnerEmpanelId: empanelment.id,
    }));
    updateEmpanelmentMutation.mutate({
      ...values,
      id: empanelment.id,
      partnerId: Number(partnerId),
      isEmpaneledPartner: true,
      sowQuoteDocuments: formattedSowQuoteDocuments,
      sowSigningDate: values.sowSigningDate || null,
      gpApprovalDate: values.gpApprovalDate || null,
      agreementTypeId: Number(values.agreementTypeId) || null,
      isThisGPApproved: values.isThisGPApproved || false,
      isActive: values.isActive,
      empanelmentStartDate: values.empanelmentStartDate,
      empanelmentComments: values.empanelmentComments,
      panid: values.panid,
      tanid: values.tanid,
      gstid: values.gstid,
      gpId: values.gpId,
      contractId: values.contractId,
    });
  };

  const onEmpanelmentFinish = (values: EmpanelmentFormValues) => {
    const all = { ...(empanelmentForm.getFieldsValue(true) as EmpanelmentFormValues), ...values };
    const data = validateWithZod(empanelmentFormSchema, empanelmentForm, all);
    if (!data) return;
    if (empanelment) handleEmpanelmentUpdate(data);
    else handleEmpanelmentSubmit(data);
  };

  /* ---------------- row actions ---------------- */
  const populateEvaluationFormValues = (engagement: any) => {
    const evaluationStatusId = engagement?.evaluationStatusId?.toString() || "";
    evaluationForm.setFieldsValue({
      evaluationStatusId,
      engagementStatusId: evaluationToEngagementMap[evaluationStatusId],
      engagementTypeId: engagement?.engagementTypeId?.toString() || "",
      evaluationStartDate: engagement?.evaluationStartDate,
      evaluationEndDate: engagement?.evaluationEndDate,
      evaluatedBy: engagement?.evaluatedBy?.toString() || "",
      businessId: engagement?.businessId?.toString() || "",
      businessCenter: engagement?.businessCenter?.toString() || "",
      comments: engagement?.comments?.toString() || "",
      mruCode: engagement?.mruCode || "",
      evaluationPeriod: engagement?.evaluationPeriod?.toString() || "",
      partnerId: engagement?.partnerId?.toString() || "",
    } as any);
  };

  const handleEdit = (engagement: any) => {
    evaluationForm.setFieldsValue({ isEditMode: true } as any);
    setSelectedEngagement(engagement);
    populateEvaluationFormValues(engagement);
    setShowForm(true);
  };

  const completedOptions = (evaluationStatuses as { id: number; name: string }[]).filter((item) => item.id === 11004 || item.id === 11005);
  const sidebarTriggerOptions = (evaluationStatuses as { id: number; name: string }[]).filter((item) => item.id === 11002 || item.id === 11003);

  const handleEvaluationClick = (id: number, engagement: any) => {
    setSelectedEngagement(engagement);
    populateEvaluationFormValues(engagement);
    if (id === 11002) {
      setActionType("completed");
      evaluationForm.setFieldsValue({ isEditMode: false } as any);
      setOpen(true);
    } else if (id === 11003) {
      evaluationForm.setFieldsValue({ evaluationStatusId: id.toString(), isEditMode: false } as any);
      setActionType("extended");
      setOpen(true);
    }
  };

  const rowMenu = (engagement: any): MenuProps["items"] => [
    { key: "edit", icon: <EditOutlined />, label: "Edit", onClick: () => handleEdit(engagement) },
    ...sidebarTriggerOptions.map((status) => ({
      key: String(status.id),
      icon: status.id === 11003 ? <ClockCircleOutlined /> : <CheckCircleOutlined />,
      label: status.name,
      onClick: () => handleEvaluationClick(status.id, engagement),
    })),
  ];

  const historyColumns: DataColumn<any>[] = [
    { key: "engagementStatusName", title: "Engagement Status", dataIndex: "engagementStatusName" },
    { key: "engagementTypeName", title: "Engagement Type", dataIndex: "engagementTypeName" },
    { key: "businessUnitName", title: "Business Unit", dataIndex: "businessUnitName" },
    { key: "evaluationStatusName", title: "Evaluation Status", dataIndex: "evaluationStatusName" },
    { key: "evaluatedBy", title: "Evaluated By", dataIndex: "evaluatedBy" },
    { key: "evaluationExtendedDate", title: "Extended Date", dataIndex: "evaluationExtendedDate", render: (v: string) => v?.split("T")[0] || "-" },
    {
      key: "actions",
      title: "Actions",
      locked: true,
      align: "center",
      width: 80,
      render: (_: unknown, engagement: any) => (
        <Dropdown menu={{ items: rowMenu(engagement) }} trigger={["click"]} disabled={isPartner}>
          <Button size="small" icon={<MoreOutlined />} />
        </Dropdown>
      ),
    },
  ];

  const isSavingEvaluation = createEvaluationMutation.isPending || updateEvaluationMutation.isPending;

  return (
    <Flex vertical gap={16}>
      <Flex justify="space-between" align="center" wrap gap={8}>
        <Typography.Title level={4} style={{ margin: 0 }}>
          Engagement Form
        </Typography.Title>
        <Typography.Text type="secondary">
          Partner ID: <Typography.Text strong>{partnerCode}</Typography.Text>
        </Typography.Text>
      </Flex>

      {/* ---------------- Evaluation ---------------- */}
      <Card
        title="Evaluation"
        extra={
          !showForm && !isPartner ? (
            <Button
              type="primary"
              size="small"
              icon={<PlusOutlined />}
              onClick={() => {
                setSelectedEngagement(null);
                evaluationForm.resetFields();
                evaluationForm.setFieldsValue({ isEditMode: false } as any);
                setShowForm(true);
              }}
            >
              Add
            </Button>
          ) : null
        }
      >
        <Form form={evaluationForm} layout="vertical" initialValues={evaluationInitialValues} onFinish={onEvaluationFinish}>
          {showForm && (
            <>
              <Row gutter={[16, 8]}>
                <Col xs={24} md={12}>
                  <Form.Item name="engagementStatusId" label="Engagement Status" rules={zodRules(evaluationShape, "engagementStatusId")}>
                    <Select placeholder="Select engagement status" options={toOptions(engagementStatuses)} disabled />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Flex gap={8} align="flex-end">
                    <Form.Item name="engagementTypeId" label="Engagement Type" rules={zodRules(evaluationShape, "engagementTypeId")} className="flex-1">
                      <Select placeholder="Select Engagement Type" options={toOptions(engagementTypes)} showSearch optionFilterProp="label" />
                    </Form.Item>
                    {selectedEngagementType === "9001" && (
                      <Form.Item>
                        <Button type="text" onClick={() => setShowHiringDialog((v) => !v)}>
                          Open List
                        </Button>
                      </Form.Item>
                    )}
                  </Flex>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item name="evaluationStartDate" label="Evaluation Start Date" rules={zodRules(evaluationShape, "evaluationStartDate")} {...dateItemProps}>
                    <DatePicker className="w-full" format="YYYY-MM-DD" disabledDate={notBeforeToday} />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item name="evaluationEndDate" label="Evaluation End Date" rules={zodRules(evaluationShape, "evaluationEndDate")} {...dateItemProps}>
                    <DatePicker className="w-full" format="YYYY-MM-DD" disabledDate={notBeforeToday} />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item name="evaluationPeriod" label="Evaluation Period(Months)" rules={zodRules(evaluationShape, "evaluationPeriod")}>
                    <Input type="number" placeholder="Enter Evaluation Period" disabled />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item name="evaluatedBy" label="Evaluated By" rules={zodRules(evaluationShape, "evaluatedBy")}>
                    <Input placeholder="Enter Evaluator Name" disabled />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item name="businessId" label="Business Unit" rules={zodRules(evaluationShape, "businessId")}>
                    <Select placeholder="Select Business Unit" options={toOptions(businessUnits)} showSearch optionFilterProp="label" />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item name="evaluationStatusId" label="Evaluation Status" rules={zodRules(evaluationShape, "evaluationStatusId")}>
                    <Select placeholder="Select evaluation status" options={toOptions(evaluationStatuses)} disabled />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item name="businessCenter" label="Business Center(Country)">
                    <Input placeholder="Enter Business Center" />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item name="mruCode" label="MRU Code">
                    <Input placeholder="Enter MRU Code" />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item name="comments" label="Comments">
                    <Input placeholder="Enter Comments" />
                  </Form.Item>
                </Col>
              </Row>
              <Flex justify="flex-end" gap={8}>
                <Button onClick={() => setShowForm(false)}>Cancel</Button>
                <Button type="primary" htmlType="submit" loading={isSavingEvaluation}>
                  {selectedEngagement ? "Update" : "Save"}
                </Button>
              </Flex>
            </>
          )}
        </Form>

        {engagementDetailsError && <Typography.Text type="danger">Failed to load engagement details. Please try again later.</Typography.Text>}

        {engagementDetails?.data && (
          <div className="mt-4">
            <DataTable<any> title="Engagement History" rowKey="id" columns={historyColumns} data={engagementDetails.data} pagination={false} size="small" />
          </div>
        )}
      </Card>

      <EvaluationSidebarOnly
        open={open}
        onOpenChange={setOpen}
        evaluationForm={evaluationForm}
        onSubmit={handleEvaluationSubmit}
        actionType={actionType}
        completedOptions={completedOptions}
        selectedEngagement={selectedEngagement}
      />

      {/* ---------------- Empanelment ---------------- */}
      {!empanelment && (
        <Checkbox checked={showEmpanelmentFields} onChange={(e) => setShowEmpanelmentFields(e.target.checked)}>
          Do you want to empanel this partner?
        </Checkbox>
      )}

      {(showEmpanelmentFields && !empanelment) || empanelment ? (
        <Card
          title={empanelment ? "Empanelment Details" : "Create Empanelment"}
          extra={
            empanelment ? (
              <Button type="text" size="small" icon={<EditOutlined />} disabled={isPartner} onClick={() => setIsEditingEmpanelment((v) => !v)}>
                {isEditingEmpanelment ? "Cancel Edit" : "Edit"}
              </Button>
            ) : null
          }
        >
          {empanelment && (
            <Descriptions bordered size="small" column={{ xs: 1, md: 2 }}>
              <Descriptions.Item label="Start Date">{empanelment.empanelmentStartDate?.split("T")[0] || "-"}</Descriptions.Item>
              <Descriptions.Item label="SOW Signing Date">{empanelment.sowSigningDate?.split("T")[0] || "-"}</Descriptions.Item>
              <Descriptions.Item label="GP Approval Date">{empanelment.gpApprovalDate?.split("T")[0] || "-"}</Descriptions.Item>
              <Descriptions.Item label="Agreement Type">{empanelment.agreementTypeName || "-"}</Descriptions.Item>
              <Descriptions.Item label="PAN ID">{empanelment.panid || "-"}</Descriptions.Item>
              <Descriptions.Item label="TAN ID">{empanelment.tanid || "-"}</Descriptions.Item>
              <Descriptions.Item label="GST ID">{empanelment.gstid || "-"}</Descriptions.Item>
            </Descriptions>
          )}

          <Form form={empanelmentForm} layout="vertical" initialValues={empanelmentInitialValues} onFinish={onEmpanelmentFinish}>
            {!empanelment && (
              <>
                <EmpanelmentFields
                  isGpApproved={isGpApproved}
                  agreementTypeId={agreementTypeId}
                  agreementTypes={agreementTypes}
                  sowSigningDate={sowSigningDate}
                  partnerId={partnerId}
                  isCreating
                  refetchPartner={refetchEvalutaionDetail}
                />
                <Flex justify="flex-end">
                  <Button type="primary" htmlType="submit" disabled={isPartner} loading={submitEmpanelmentMutation.isPending}>
                    Submit
                  </Button>
                </Flex>
              </>
            )}

            {empanelment && isEditingEmpanelment && (
              <>
                <Divider titlePlacement="left">Edit Empanelment</Divider>
                <EmpanelmentFields
                  isGpApproved={isGpApproved}
                  agreementTypeId={agreementTypeId}
                  agreementTypes={agreementTypes}
                  sowSigningDate={sowSigningDate}
                  partnerId={partnerId}
                  isCreating={false}
                  partnerEmpanelId={empanelment.sowQuoteDocuments?.[0]?.partnerEmpanelId}
                  refetchPartner={refetchEvalutaionDetail}
                />
                <Flex justify="flex-end" gap={8}>
                  <Button onClick={() => setIsEditingEmpanelment(false)}>Cancel</Button>
                  <Button type="primary" htmlType="submit" loading={updateEmpanelmentMutation.isPending}>
                    Update
                  </Button>
                </Flex>
              </>
            )}
          </Form>
        </Card>
      ) : null}

      {/* ---------------- Hiring open list (labour) ---------------- */}
      <Modal
        open={showHiringDialog}
        onCancel={() => setShowHiringDialog(false)}
        title="Engagement Type: Labour"
        width={1100}
        destroyOnHidden
        footer={
          <Space>
            <Button onClick={() => setShowHiringDialog(false)}>Previous</Button>
            <Button type="primary" onClick={() => setShowHiringDialog(false)}>
              Submit
            </Button>
          </Space>
        }
      >
        <DataTable<any>
          storageKey="engagement-hiring-open-list"
          rowKey="hrqId"
          columns={hrqColumns}
          data={hiringRequests?.data?.items}
          loading={isLoading}
          size="small"
          pagination={{ current: t.pageNumber, pageSize: t.pageSize, total: hiringRequests?.data?.totalCount ?? 0, pageSizeOptions: [5, 10, 50] }}
          onChange={t.onTableChange}
          search={{ columns: searchColumns, column: t.searchColumn, text: t.searchText, onChange: t.setSearch, placeholder: "Search by" }}
          rowSelection={{ selectedRowKeys: selectedHrqIds, onChange: (keys) => setSelectedHrqIds(keys as string[]) }}
          emptyText="No Data Available"
        />
      </Modal>

      <Flex justify="space-between">
        <Button onClick={onPrevious}>Previous</Button>
        <Button type="primary" onClick={onNext} disabled={!empanelment || !isPartnerEmpanelled}>
          Next
        </Button>
      </Flex>
    </Flex>
  );
}
