"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button, Card, Col, DatePicker, Flex, Form, Input, Modal, Row, Select, Space, Spin, Table, Typography, Upload } from "antd";
import type { ColumnsType } from "antd/es/table";
import { DeleteOutlined, DownloadOutlined, EyeOutlined, FileTextOutlined, PlusOutlined, ReloadOutlined } from "@ant-design/icons";
import dayjs, { type Dayjs } from "dayjs";
import axios from "axios";
import * as z from "zod";
import { dropdownApi } from "@/services/api/master";
import { MasterTypes } from "@/constants/masterTypes";
import { partnerApi, PartnerPayload } from "@/services/api/partner.profile.api";
import { addSkillPayload, hiringApi } from "@/services/api/hiring.api";
import { toast } from "@/lib/toast";
import { validateWithZod, zodRules } from "@/lib/zodRules";
import { usePartnerStore } from "@/store/userPartnerStore";
import api from "@/lib/axiosInstance";
import { useDebounce } from "@/lib/useDebounce";
import { useUserStore } from "@/store/userStore";

interface CapabilityDoc {
  id?: number;
  attachmentName: string;
  attachmentURL: string;
  name?: string;
  partnerId?: number;
  partnerEmpanelId?: number;
  candiadateBGVId?: number;
}

const idName = z.object({ id: z.number(), name: z.string() });

const profileFormSchema = z.object({
  partnerId: z.string().optional(),
  partnerName: z.string().min(1, "Partner name is required"),
  nickname: z.string().optional(),
  startDate: z.string().min(1, "Start date is required"),
  country: z.string().min(1, "Country is required"),
  state: z.string().min(1, "State is required"),
  city: z.string().min(1, "City is required"),
  address: z.string().min(1, "Address is required"),
  domain: z.array(idName).min(1, "At least one domain is required"),
  subDomain: z.array(idName).min(1, "At least one Sub-domain is required"),
  skills: z.array(idName).min(1, "At least one skill is required"),
  capabilitiesDeckDocuments: z
    .array(
      z.object({
        id: z.number().optional(),
        attachmentName: z.string(),
        attachmentURL: z.string(),
        partnerId: z.number().optional(),
      })
    )
    .min(1, "At least one capability deck document is required"),
  pincode: z.string().regex(/^\d{6}$/, { message: "Pincode must be exactly 6 digits and numeric only" }),
  partnerCategoryId: z.string().min(1, "Partner Category is required"),
  servicingCountryId: z.string().min(1, "Servicing Country is required"),
});

type FormValues = z.infer<typeof profileFormSchema>;

/** Form state: multi-selects hold ids and the date holds a Dayjs; mapped back to the schema shape on submit. */
type FormState = Omit<FormValues, "domain" | "subDomain" | "skills" | "startDate"> & {
  domain: number[];
  subDomain: number[];
  skills: number[];
  startDate?: Dayjs | null;
};

interface ProfileFormProps {
  onNext?: () => void;
  onPrevious?: () => void;
}

type Option = { id: number; name: string };
const toOptions = (rows: Option[]) => rows.map((o) => ({ value: String(o.id), label: o.name }));
const toNumOptions = (rows: Option[]) => rows.map((o) => ({ value: o.id, label: o.name }));
const pick = (rows: Option[], ids?: number[]) => rows.filter((s) => ids?.includes(s.id)).map((s) => ({ id: s.id, name: s.name }));

const DATE_FMT = "YYYY-MM-DD";

/* ------------------------------------------------------------------ */
/* Document preview (iframe in a modal)                                */
/* ------------------------------------------------------------------ */
function DocPreview({ url, fileName }: { url: string; fileName?: string }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  return (
    <>
      <Button type="text" size="small" icon={<EyeOutlined />} onClick={() => setOpen(true)} />
      <Modal
        open={open}
        onCancel={() => setOpen(false)}
        title={fileName || "Document"}
        width="94vw"
        destroyOnHidden
        footer={
          <Button icon={<DownloadOutlined />} onClick={() => window.open(url, "_blank")}>
            Download
          </Button>
        }
      >
        <Spin spinning={loading} description="Loading document...">
          <iframe src={url} title="Document Preview" style={{ width: "100%", height: "75vh", border: 0 }} onLoad={() => setLoading(false)} />
        </Spin>
      </Modal>
    </>
  );
}

/* ------------------------------------------------------------------ */
/* Capability deck documents (Form.Item child: value / onChange)       */
/* ------------------------------------------------------------------ */
interface CapabilityDeckProps {
  value?: CapabilityDoc[];
  onChange?: (docs: CapabilityDoc[]) => void;
  partnerId: string;
  disabled?: boolean;
  maxFiles?: number;
  refetchPartner?: () => Promise<unknown>;
}

function CapabilityDeckDocuments({ value = [], onChange, partnerId, disabled, maxFiles = 10, refetchPartner }: CapabilityDeckProps) {
  const [uploading, setUploading] = useState(false);
  const [prevOpen, setPrevOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [searchText] = useState("");
  const debouncedSearch = useDebounce(searchText, 300);

  const url = `/Partner/paged/capability-deck-documants?partnerId=${partnerId}`;
  const { data: paged, refetch: reFetchData, isPending } = useQuery({
    queryKey: ["capabilityDeckDocuments", partnerId, currentPage, debouncedSearch, pageSize],
    queryFn: () => partnerApi.getcapabilityDeckDocuments(url, { pageNumber: currentPage, pageSize, searchText: debouncedSearch || undefined }),
    enabled: !!partnerId,
    refetchOnWindowFocus: true,
  });

  const getPreviewUrl = (doc: CapabilityDoc) => {
    if (!doc?.attachmentURL) return "";
    if (doc.attachmentURL.startsWith("http")) return doc.attachmentURL;
    return `${process.env.NEXT_PUBLIC_API_BASE_URL}/FileServer/${doc.attachmentURL}`;
  };

  const handleFileUpload = async (file: File) => {
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await api.post("/FileServer/upload", formData, { headers: { "Content-Type": "multipart/form-data" } });
      const fileName = res.data.fileName || res.data;
      const newDocument: CapabilityDoc = {
        id: 0,
        attachmentURL: fileName,
        attachmentName: fileName,
        name: fileName,
        partnerId: partnerId ? Number(partnerId) : 0,
        partnerEmpanelId: partnerId ? Number(partnerId) : 0,
        candiadateBGVId: 0,
      };
      if (value.length >= maxFiles) {
        toast.error(`Maximum ${maxFiles} files allowed`);
        return;
      }
      onChange?.([...value, newDocument]);
      toast.success("Document uploaded successfully");
    } catch (error) {
      console.error("Upload failed", error);
      toast.error("Failed to upload document");
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteDocument = async (document: CapabilityDoc) => {
    try {
      if (document?.attachmentURL) await api.delete(`/FileServer/${document?.attachmentName}`);
      onChange?.(value.filter((doc) => doc?.attachmentURL !== document?.attachmentURL));
      if (typeof refetchPartner === "function") await refetchPartner();
      await reFetchData();
      toast.success("Document deleted successfully");
    } catch (error: any) {
      console.error("Delete failed", error);
      toast.error(error?.message || "Failed to delete document");
    }
  };

  const latest = value.length ? value[value.length - 1] : null;

  const prevColumns: ColumnsType<any> = [
    { key: "sno", title: "S.No", render: (_: unknown, __: unknown, i: number) => i + 1 },
    { key: "name", title: "File Name", dataIndex: "attachmentName" },
    { key: "date", title: "Date", dataIndex: "createdDate" },
    { key: "time", title: "Time", dataIndex: "createdTime" },
    { key: "view", title: "View", render: (_: unknown, doc: any) => <DocPreview url={doc?.attachmentURL} fileName={doc?.attachmentName} /> },
    {
      key: "delete",
      title: "Delete",
      render: (_: unknown, doc: any) => <Button type="text" size="small" danger icon={<DeleteOutlined />} onClick={() => handleDeleteDocument(doc)} />,
    },
  ];

  return (
    <Flex vertical gap={12}>
      <Upload
        accept=".ppt,.pptx,.pdf,.doc,.docx"
        showUploadList={false}
        disabled={disabled || uploading || value.length >= maxFiles}
        beforeUpload={(file) => {
          handleFileUpload(file);
          return false;
        }}
      >
        <Button icon={<PlusOutlined />} loading={uploading} disabled={disabled || value.length >= maxFiles}>
          Upload document
        </Button>
      </Upload>
      {value.length >= maxFiles && <Typography.Text type="warning">Maximum {maxFiles} files allowed. Delete a file to upload a new one.</Typography.Text>}

      {latest && (
        <Card size="small">
          <Flex align="center" justify="space-between" gap={12}>
            <Space>
              <FileTextOutlined />
              <Flex vertical>
                <Typography.Text strong ellipsis title={latest.attachmentName}>
                  {latest.attachmentName}
                </Typography.Text>
                <Typography.Text type="secondary">Latest Document</Typography.Text>
              </Flex>
            </Space>
            <Space size={4}>
              <DocPreview url={getPreviewUrl(latest)} fileName={latest.attachmentName} />
              <Button type="text" size="small" danger icon={<DeleteOutlined />} disabled={disabled} title="Delete document" onClick={() => handleDeleteDocument(latest)} />
            </Space>
          </Flex>
        </Card>
      )}

      <Button
        disabled={!partnerId}
        style={{ alignSelf: "flex-start" }}
        onClick={async () => {
          await reFetchData();
          setPrevOpen(true);
        }}
      >
        Previous Documents
      </Button>

      <Modal open={prevOpen} onCancel={() => setPrevOpen(false)} title="Previous Documents" width={960} footer={null} destroyOnHidden>
        <Table
          rowKey="id"
          size="small"
          loading={isPending}
          columns={prevColumns}
          dataSource={paged?.items || []}
          scroll={{ x: "max-content" }}
          pagination={{
            current: currentPage,
            pageSize,
            total: paged?.totalCount ?? 0,
            showSizeChanger: true,
            onChange: (p, s) => {
              setCurrentPage(p);
              setPageSize(s);
            },
          }}
        />
      </Modal>
    </Flex>
  );
}

/* ------------------------------------------------------------------ */
/* Add skill modal                                                     */
/* ------------------------------------------------------------------ */
const skillSchema = z.object({ skillName: z.string().min(1, "Skill name is required") });
type SkillFormValues = z.infer<typeof skillSchema>;

function AddSkillModal({ isOpen, onClose, isPrimary, masterType }: { isOpen: boolean; onClose: () => void; isPrimary: boolean; masterType?: number }) {
  const queryClient = useQueryClient();
  const [form] = Form.useForm<SkillFormValues>();

  const addSkills = useMutation({
    mutationKey: ["addSkills"],
    mutationFn: (data: addSkillPayload) => hiringApi.addSkills(masterType || 0, data),
    onSuccess: (data) => {
      toast.success(data?.message || "Skill added successfully");
      queryClient.invalidateQueries({ queryKey: [isPrimary ? "PrimarySkills" : "SecondarySkills"] });
      queryClient.invalidateQueries({ queryKey: ["skills"] });
      form.resetFields();
      onClose();
    },
    onError: (error) => {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 400) toast.error(error.response.data?.message || "Bad Request");
        else toast.error("baD request");
      }
    },
  });

  const close = () => {
    form.resetFields();
    onClose();
  };

  return (
    <Modal
      open={isOpen}
      title="Add New Skill"
      onCancel={close}
      destroyOnHidden
      footer={
        <Space>
          <Button onClick={onClose} disabled={addSkills.isPending}>
            Cancel
          </Button>
          <Button type="primary" loading={addSkills.isPending} onClick={() => form.submit()}>
            {addSkills.isPending ? "Adding..." : "Add Skill"}
          </Button>
        </Space>
      }
    >
      <Typography.Paragraph type="secondary">Please add only new skills that aren’t already listed.</Typography.Paragraph>
      <Form
        form={form}
        layout="vertical"
        initialValues={{ skillName: "" }}
        onFinish={(v) => {
          const values = validateWithZod(skillSchema, form, v);
          if (!values) return;
          addSkills.mutate({ isActive: true, name: values.skillName, isPrimary });
        }}
      >
        <Form.Item name="skillName" label="Skill Name" rules={zodRules(skillSchema, "skillName")}>
          <Input placeholder="Enter skill name (e.g., React, Java, Project Management)" />
        </Form.Item>
      </Form>
    </Modal>
  );
}

/* ------------------------------------------------------------------ */
/* Profile form                                                        */
/* ------------------------------------------------------------------ */
export default function ProfileForm({ onNext, onPrevious }: ProfileFormProps) {
  const { partnerCode, setPartnerCode, setPartnerId, setPartnerStatus } = usePartnerStore();
  const [loader, setLoader] = useState(false);
  const [partnerStatusNameFromAPI, setPartnerStatusNameFromAPI] = useState("");
  const searchParams = useSearchParams();
  const partnerId = searchParams.get("id") || "";
  const roles = useUserStore((state) => state.roles);
  const isPartner = roles.some((role) => role.name === "PARTNER");
  const [form] = Form.useForm<FormState>();
  const [isPrimary, setIsPrimary] = useState(true);
  const [isAddSkillOpen, setIsAddSkillOpen] = useState(false);

  const selectedCountry = Form.useWatch("country", form);
  const selectedState = Form.useWatch("state", form);
  const selectedDomains = Form.useWatch("domain", form);

  const {
    data: partner,
    refetch: refetchPartner,
  } = useQuery({
    queryKey: ["partner", partnerId],
    queryFn: () => partnerApi.getPartnerProfileForm(Number(partnerId)),
    enabled: !!partnerId,
  });

  const { data: domain = [], isLoading: isDomainLoading } = useQuery({
    queryKey: ["domain"],
    queryFn: () => dropdownApi.fetchDropdown(MasterTypes.DOMAIN),
  });
  const { data: skills = [], isLoading: isSkillsLoading } = useQuery({
    queryKey: ["skills"],
    queryFn: () => dropdownApi.fetchDropdown(MasterTypes.SKILL),
  });
  const { data: country = [], isLoading: isCountryLoading } = useQuery({
    queryKey: ["country"],
    queryFn: () => dropdownApi.fetchDropdown(MasterTypes.COUNTRY),
  });
  const { data: states = [] } = useQuery({
    queryKey: ["states", selectedCountry],
    queryFn: () => dropdownApi.fetchDropdown(MasterTypes.STATE, { countryId: parseInt(selectedCountry) }),
    enabled: !!selectedCountry,
  });
  const { data: cities = [] } = useQuery({
    queryKey: ["cities", selectedState],
    queryFn: () => dropdownApi.fetchDropdown(MasterTypes.CITY, { stateId: parseInt(selectedState) }),
    enabled: !!selectedState,
  });
  const { data: PARTNER_CATEGORY = [], isLoading: isPARTNER_CATEGORY } = useQuery({
    queryKey: ["PARTNER_CATEGORY"],
    queryFn: () => dropdownApi.fetchDropdown(MasterTypes.PARTNER_CATEGORY),
  });
  const domainIds = selectedDomains?.map((id) => Number(id)) || [];
  const { data: subDomain = [] } = useQuery({
    queryKey: ["subDomain", [domainIds]],
    queryFn: () => dropdownApi.fetchSubDropDowns(domainIds),
    enabled: domainIds.length > 0,
  });

  // Populate the form once the partner and the master lists are available.
  useEffect(() => {
    if (!partner?.data) return;
    if (isDomainLoading || isCountryLoading || isSkillsLoading || isPARTNER_CATEGORY) return;

    const p = partner.data;
    const existingCapabilityDeck: CapabilityDoc[] =
      p.capabilitiesDeckDocuments?.map((doc: any) => ({
        id: doc.id || 0,
        attachmentName: doc.attachmentName,
        attachmentURL: doc.attachmentURL,
        partnerId: doc.partnerId || Number(partnerId),
      })) || [];

    setLoader(true);
    form.setFieldsValue({
      partnerId: p.partnerCode?.toString() || "",
      partnerName: p.partnerName || "",
      nickname: p.nickname || "",
      startDate: p.startDate ? dayjs(p.startDate) : null,
      country: p.countryId ? String(p.countryId) : "",
      state: "",
      city: "",
      servicingCountryId: p.servicingCountryId ? String(p.servicingCountryId) : "",
      partnerCategoryId: p.partnerCategoryId ? String(p.partnerCategoryId) : "",
      address: p.address || "",
      pincode: p.pincode || "",
      domain: pick(domain, p.domainIds).map((d) => d.id),
      skills: pick(skills, p.skillIds).map((s) => s.id),
      subDomain: [],
      capabilitiesDeckDocuments: existingCapabilityDeck,
    });

    setPartnerCode(p.partnerCode);
    setPartnerId(p.id);
    setPartnerStatusNameFromAPI(p.partnerStatusName || "");

    const STATE_DELAY_MS = 300;
    const CITY_DELAY_MS = 1200;
    const stateTimer = window.setTimeout(() => form.setFieldValue("state", p.stateId ? String(p.stateId) : ""), STATE_DELAY_MS);
    const cityTimer = window.setTimeout(() => {
      form.setFieldValue("city", p.cityId ? String(p.cityId) : "");
      setLoader(false);
    }, CITY_DELAY_MS);
    return () => {
      clearTimeout(stateTimer);
      clearTimeout(cityTimer);
    };
  }, [partner?.data, partnerId, domain, skills, isDomainLoading, isCountryLoading, isSkillsLoading, isPARTNER_CATEGORY, form, setPartnerCode, setPartnerId]);

  // Re-select the partner's existing sub-domains once the list for the chosen domains arrives.
  useEffect(() => {
    const existingSubDomainIds: number[] | undefined = partner?.data?.subDomainIds;
    if (subDomain.length > 0 && domainIds?.length > 0) {
      const matched = subDomain.filter((s: any) => existingSubDomainIds?.includes(s.id));
      if (matched.length > 0) form.setFieldValue("subDomain", matched.map((m: any) => m.id));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subDomain, partner?.data?.subDomainIds]);

  function formatFormData(values: FormValues): PartnerPayload {
    const formattedCapabilityDeck = values.capabilitiesDeckDocuments.map((doc) => ({
      id: doc.id || 0,
      attachmentName: doc.attachmentName,
      attachmentURL: doc.attachmentURL,
      partnerId: Number(partnerId),
    }));
    return {
      id: partner.data.id,
      isActive: true,
      partnerCode: partnerCode || null,
      partnerName: values.partnerName,
      nickname: values.nickname || "",
      startDate: values.startDate,
      countryId: parseInt(values.country),
      stateId: parseInt(values.state),
      cityId: parseInt(values.city),
      address: values.address,
      domainIds: values.domain.map((item) => item.id),
      subDomainIds: values.subDomain.map((item) => item.id),
      skillIds: values.skills.map((s) => s.id),
      capabilitiesDeckDocuments: formattedCapabilityDeck,
      partnerCategoryId: values.partnerCategoryId,
      servicingCountryId: values.servicingCountryId,
      pincode: values.pincode,
    } as any;
  }

  const updatePartnerMutation = useMutation({
    mutationFn: (values: PartnerPayload) => partnerApi.updatePartnerProfile(Number(partnerId), values),
    onSuccess: async (data) => {
      form.setFieldValue("partnerId", data.data.partnerCode);
      setPartnerCode(data.data.partnerCode);
      setPartnerId(data.data.id);
      await refetchPartner();
      toast.success("Partner updated successfully");
    },
    onError: (error) => {
      toast.error("Failed to update partner");
      console.error("Error updating partner:", error);
    },
  });

  const reinitiateMutation = useMutation({
    mutationFn: async () => api.patch(`Partner/toggle?partnerId=${partnerId}&partnerStatusId=19001`),
    onSuccess: () => {
      toast.success("Partner reinitiated successfully");
      setPartnerStatus(false);
      refetchPartner();
    },
    onError: (error) => {
      toast.error("Failed to reinitiate partner");
      console.error("Error reinitiating partner:", error);
    },
  });

  function onFinish(raw: FormState) {
    const candidate = {
      ...raw,
      startDate: raw.startDate ? raw.startDate.format(DATE_FMT) : "",
      domain: pick(domain, raw.domain),
      subDomain: pick(subDomain, raw.subDomain),
      skills: pick(skills, raw.skills),
    };
    const values = validateWithZod(profileFormSchema, form, candidate);
    if (!values) return;
    const payload = {
      ...formatFormData(values),
      id: partnerId,
      approvedBy: partner.data.approvedBy,
      approverName: partner.data.approverName,
      approverEmail: partner.data.approverEmail,
      approvedStatus: true,
    };
    updatePartnerMutation.mutate(payload as any);
  }

  const inactive = partnerStatusNameFromAPI === "Inactive";
  const lockedForPartner = inactive || isPartner;

  if (loader) return <Spin fullscreen />;

  return (
    <Flex vertical gap={16}>
      {inactive && (
        <Flex>
          <Button type="primary" size="small" icon={<ReloadOutlined />} loading={reinitiateMutation.isPending} onClick={() => reinitiateMutation.mutate()}>
            Reinitiate
          </Button>
        </Flex>
      )}

      <Flex justify="space-between" align="center" wrap gap={8}>
        <Typography.Title level={4} style={{ margin: 0 }}>
          Profile
        </Typography.Title>
        <Space>
          <Typography.Text type="secondary">Partner ID:</Typography.Text>
          <Typography.Text strong>{partnerCode}</Typography.Text>
        </Space>
        <Space>
          <Typography.Text type="secondary">Partner Status:</Typography.Text>
          <Typography.Text strong>{partnerStatusNameFromAPI}</Typography.Text>
        </Space>
      </Flex>

      <Form
        form={form}
        layout="vertical"
        onFinish={onFinish}
        initialValues={{ partnerId: "", partnerName: "", nickname: "", startDate: null, country: "", state: "", city: "", address: "", pincode: "", partnerCategoryId: "", servicingCountryId: "", domain: [], subDomain: [], skills: [], capabilitiesDeckDocuments: [] }}
      >
        <Row gutter={[16, 8]}>
          <Col xs={24} md={12}>
            <Form.Item name="partnerName" label="Partner Name" rules={zodRules(profileFormSchema, "partnerName")}>
              <Input placeholder="Please enter the company full name" disabled={lockedForPartner} />
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Form.Item name="nickname" label="Alias" rules={zodRules(profileFormSchema, "nickname")}>
              <Input placeholder="Partner NickName" disabled={lockedForPartner} />
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Form.Item name="startDate" label="Start Date" rules={[{ required: true, message: "Start date is required" }]}>
              <DatePicker className="w-full" format={DATE_FMT} disabled={lockedForPartner} disabledDate={(d) => d.isBefore(dayjs(), "day")} />
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Form.Item name="country" label="Origin Country" rules={zodRules(profileFormSchema, "country")}>
              <Select
                placeholder="select origin country"
                showSearch
                optionFilterProp="label"
                options={toOptions(country)}
                disabled={lockedForPartner}
                onChange={() => form.setFieldsValue({ state: "", city: "" })}
              />
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Form.Item name="state" label="Origin State" rules={zodRules(profileFormSchema, "state")}>
              <Select placeholder="select origin state" showSearch optionFilterProp="label" options={toOptions(states)} disabled={lockedForPartner} onChange={() => form.setFieldValue("city", "")} />
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Form.Item name="city" label="Origin City" rules={zodRules(profileFormSchema, "city")}>
              <Select placeholder="select origin city" showSearch optionFilterProp="label" options={toOptions(cities)} disabled={lockedForPartner} />
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Form.Item name="servicingCountryId" label="Servicing Country" rules={zodRules(profileFormSchema, "servicingCountryId")}>
              <Select placeholder="select servicing country" showSearch optionFilterProp="label" options={toOptions(country)} />
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Form.Item name="partnerCategoryId" label="Partner Category" rules={zodRules(profileFormSchema, "partnerCategoryId")}>
              <Select placeholder="Select Partner Category" showSearch optionFilterProp="label" options={toOptions(PARTNER_CATEGORY)} />
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Form.Item name="address" label="Registered Address" rules={zodRules(profileFormSchema, "address")}>
              <Input placeholder="Registered Address" disabled={lockedForPartner} />
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Form.Item name="pincode" label="Pincode" rules={zodRules(profileFormSchema, "pincode")}>
              <Input placeholder="Enter Pincode" maxLength={6} />
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Form.Item name="domain" label="Domain" rules={[{ required: true, message: "At least one domain is required" }]}>
              <Select
                mode="multiple"
                placeholder="Select domains"
                showSearch
                optionFilterProp="label"
                maxTagCount="responsive"
                options={toNumOptions(domain)}
                disabled={inactive}
                onChange={() => form.setFieldValue("subDomain", [])}
              />
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Form.Item name="subDomain" label="Sub-Domain" rules={[{ required: true, message: "At least one Sub-domain is required" }]}>
              <Select mode="multiple" placeholder="Select sub-domain" showSearch optionFilterProp="label" maxTagCount="responsive" options={toNumOptions(subDomain)} disabled={inactive} />
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Flex gap={8} align="flex-end">
              <Form.Item name="skills" label="Skills" rules={[{ required: true, message: "At least one skill is required" }]} className="w-full" style={{ flex: 1 }}>
                <Select mode="multiple" placeholder="Select skills" showSearch optionFilterProp="label" maxTagCount="responsive" options={toNumOptions(skills)} disabled={inactive} />
              </Form.Item>
              <Form.Item label=" ">
                <Button
                  disabled={inactive}
                  onClick={() => {
                    setIsPrimary(true);
                    setIsAddSkillOpen(true);
                  }}
                >
                  Add Skill
                </Button>
              </Form.Item>
            </Flex>
          </Col>
          <Col xs={24}>
            <Form.Item name="capabilitiesDeckDocuments" label="Company Profile" rules={[{ required: true, message: "At least one capability deck document is required" }]}>
              <CapabilityDeckDocuments partnerId={partnerId} disabled={lockedForPartner} maxFiles={10} refetchPartner={refetchPartner} />
            </Form.Item>
          </Col>
        </Row>

        <Flex justify="flex-end">
          <Button type="primary" htmlType="submit" loading={updatePartnerMutation.isPending} disabled={inactive}>
            {updatePartnerMutation.isPending ? "Updating.." : "Update"}
          </Button>
        </Flex>
      </Form>

      <Flex justify="space-between">
        <Button onClick={onPrevious}>Previous</Button>
        <Button type="primary" onClick={onNext}>
          Next
        </Button>
      </Flex>

      <AddSkillModal isOpen={isAddSkillOpen} onClose={() => setIsAddSkillOpen(false)} isPrimary={isPrimary} masterType={MasterTypes.SKILL} />
    </Flex>
  );
}
