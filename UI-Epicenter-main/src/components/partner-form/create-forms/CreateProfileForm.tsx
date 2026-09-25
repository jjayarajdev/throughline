"use client";

import React, { useEffect, useState } from "react";
import * as z from "zod";
import dayjs from "dayjs";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Alert,
  Button,
  Col,
  DatePicker,
  Flex,
  Form,
  Input,
  List,
  Modal,
  Row,
  Select,
  Space,
  Spin,
  Table,
  Tooltip,
  Typography,
  Upload,
} from "antd";
import { DeleteOutlined, DownloadOutlined, EyeOutlined, FileTextOutlined, UploadOutlined } from "@ant-design/icons";
import axios from "axios";
import api from "@/lib/axiosInstance";
import { toast } from "@/lib/toast";
import { validateWithZod, zodRules } from "@/lib/zodRules";
import { useDebounce } from "@/lib/useDebounce";
import { dropdownApi } from "@/services/api/master";
import { MasterTypes } from "@/constants/masterTypes";
import { partnerApi, PartnerPayload } from "@/services/api/partner.profile.api";
import { addSkillPayload, hiringApi } from "@/services/api/hiring.api";
import { usePartnerStore } from "@/store/userPartnerStore";

// Updated schema to handle array of documents
export const candidateProfileSchema = z.object({
  partnerId: z.string().optional(),
  partnerName: z.string().min(1, "Partner name is required"),
  nickname: z.string().optional(),
  startDate: z.string().min(1, "Start date is required"),
  country: z.string().min(1, "Country is required"),
  state: z.string().min(1, "State is required"),
  city: z.string().min(1, "City is required"),
  address: z.string().min(1, "Address is required"),
  domain: z
    .array(
      z.object({
        id: z.number(),
        name: z.string(),
      })
    )
    .min(1, "At least one domain is required"),
  subDomain: z
    .array(
      z.object({
        id: z.number(),
        name: z.string(),
      })
    )
    .min(1, "At least one Sub-domain is required"),
  skills: z
    .array(
      z.object({
        id: z.number(),
        name: z.string(),
      })
    )
    .min(1, "At least one skill is required"),
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
  pincode: z.string().regex(/^\d{6}$/, {
    message: "Pincode must be exactly 6 digits and numeric only",
  }),
  partnerCategoryId: z.string().min(1, "Partner Category is required"),
  servicingCountryId: z.string().min(1, "Servicing Country is required"),
});

type FormValues = z.infer<typeof candidateProfileSchema>;
type IdName = { id: number; name: string };
type Document = { id?: number; attachmentName: string; attachmentURL: string; name?: string; partnerId?: number };

interface CandidateProfileFormProps {
  onNext?: () => void;
  onPrevious?: () => void;
}

/** Ant Select (multiple) bound to a `{ id, name }[]` form value. */
const idNameSelectProps = {
  getValueProps: (v: IdName[] | undefined) => ({ value: (v ?? []).map((o) => ({ value: o.id, label: o.name })) }),
  getValueFromEvent: (opts: { value: number; label: string }[]) => opts.map((o) => ({ id: Number(o.value), name: String(o.label) })),
};

const toOptions = (rows: IdName[] | undefined) => (rows ?? []).map((r) => ({ value: String(r.id), label: r.name }));

export default function CandidateProfileForm({ onNext, onPrevious }: CandidateProfileFormProps) {
  const { partnerCode, setPartnerCode, setPartnerId, partnerId } = usePartnerStore();
  const [form] = Form.useForm<FormValues>();
  const [loader, setLoader] = useState(false);
  const [isAddSkillOpen, setIsAddSkillOpen] = useState(false);
  const [partnerStatusNameFromAPI, setPartnerStatusNameFromAPI] = useState("");

  // Determine if we're creating a new candidate or updating existing one
  const isCreating = partnerCode === "PID***" || !partnerId;

  const selectedCountry = Form.useWatch("country", form);
  const selectedState = Form.useWatch("state", form);
  const selectedDomains = Form.useWatch("domain", form);

  useQuery({
    queryKey: ["partnerStatus"],
    queryFn: () => dropdownApi.fetchDropdown(MasterTypes.PARTNER_STATUS),
  });

  const {
    data: partner,
    isLoading: isLoadingPartner,
    refetch: refetchPartner,
  } = useQuery({
    queryKey: ["partner", partnerId],
    queryFn: () => partnerApi.getPartnerProfileForm(Number(partnerId)),
    enabled: !!partnerId,
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

  const { data: domain = [], isLoading: isDomainLoading } = useQuery({
    queryKey: ["domain"],
    queryFn: () => dropdownApi.fetchDropdown(MasterTypes.DOMAIN),
  });

  const domainIds = (selectedDomains as IdName[] | undefined)?.map((d) => Number(d.id)) || [];
  const domainKey = domainIds.join(",");

  const { data: subDomain = [], isFetched } = useQuery({
    queryKey: ["subDomain", [domainIds]],
    queryFn: () => dropdownApi.fetchSubDropDowns(domainIds),
    enabled: !!selectedDomains,
  });

  const { data: skills = [], isLoading: isSkillsLoading } = useQuery({
    queryKey: ["skills"],
    queryFn: () => dropdownApi.fetchDropdown(MasterTypes.SKILL),
  });

  const { data: PARTNER_CATEGORY = [] } = useQuery({
    queryKey: ["PARTNER_CATEGORY"],
    queryFn: () => dropdownApi.fetchDropdown(MasterTypes.PARTNER_CATEGORY),
  });

  function formatFormData(values: FormValues): PartnerPayload {
    // Format capability deck documents based on create/update mode
    const formattedCapabilityDeck = values.capabilitiesDeckDocuments.map((doc) => ({
      id: doc.id || 0,
      attachmentName: doc.attachmentName,
      attachmentURL: doc.attachmentURL,
      partnerId: isCreating ? 0 : Number(partnerId), // 0 for creating, actual partnerId for updating
    }));

    return {
      id: 0,
      isActive: true,
      partnerCode: values.partnerId || null,
      partnerName: values.partnerName,
      nickname: values.nickname || "",
      startDate: values.startDate,
      countryId: parseInt(values.country),
      stateId: parseInt(values.state),
      cityId: parseInt(values.city),
      address: values.address,
      domainIds: values.domain.map((d) => Number(d.id)),
      subDomainIds: values.subDomain.map((d) => Number(d.id)),
      skillIds: values.skills.map((s) => s.id),
      capabilitiesDeckDocuments: formattedCapabilityDeck,
      pincode: values.pincode,
      partnerCategoryId: parseInt(values.partnerCategoryId),
      servicingCountryId: values.servicingCountryId,
    } as unknown as PartnerPayload;
  }

  // Pre-select the partner's existing sub-domains once the sub-domain list for the chosen domains arrives
  useEffect(() => {
    const existingSubDomainIds: number[] = partner?.data?.subDomainIds ?? [];
    if (isFetched && subDomain.length > 0 && domainIds.length > 0) {
      const matched = (subDomain as IdName[]).filter((s) => existingSubDomainIds.includes(s.id));
      if (matched.length > 0) {
        form.setFieldValue(
          "subDomain",
          matched.map((m) => ({ id: m.id, name: m.name }))
        );
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isFetched, subDomain, domainKey, partner?.data?.subDomainIds]);

  useEffect(() => {
    if (!partner?.data) return;
    // Check if all required master data is loaded
    setLoader(true);
    if (isDomainLoading || isCountryLoading || isSkillsLoading) {
      return;
    }
    const p = partner.data;

    // Format existing capability deck documents with proper partnerId
    const existingCapabilityDeck: Document[] =
      p.capabilitiesDeckDocuments?.map((doc: any) => ({
        id: doc.id || 0,
        attachmentName: doc.attachmentName,
        attachmentURL: doc.attachmentURL,
        partnerId: Number(partnerId), // Use actual partnerId for existing documents
      })) || [];

    setPartnerStatusNameFromAPI(p.partnerStatusName || "Unknown Status");
    form.setFieldsValue({
      partnerId: p.partnerCode?.toString(),
      partnerName: p.partnerName,
      nickname: p.nickname,
      startDate: new Date(p.startDate).toISOString().split("T")[0],
      address: p.address,
      pincode: p.pincode,
      capabilitiesDeckDocuments: existingCapabilityDeck,
      partnerCategoryId: p.partnerCategoryId?.toString() || "",
      servicingCountryId: p.servicingCountryId?.toString() || "",
    });
    setPartnerCode(p.partnerCode);

    const sequence = async () => {
      // Set country first; states load from the country, cities from the state
      form.setFieldValue("country", p.countryId?.toString() || "");
      await new Promise((resolve) => setTimeout(resolve, 500));
      form.setFieldValue("state", p.stateId?.toString() || "");
      await new Promise((resolve) => setTimeout(resolve, 500));
      form.setFieldValue("city", p.cityId?.toString() || "");
      form.setFieldValue(
        "domain",
        (domain as IdName[])?.filter((s) => p.domainIds.includes(s.id)).map((s) => ({ id: s.id, name: s.name })) || []
      );
      form.setFieldValue(
        "skills",
        (skills as IdName[])?.filter((s) => p.skillIds.includes(s.id)).map((s) => ({ id: s.id, name: s.name })) || []
      );
      setLoader(false);
    };

    sequence();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [partner?.data, domain, country, skills, isDomainLoading, isCountryLoading, isSkillsLoading, partnerId]);

  const updatePartnerMutation = useMutation({
    mutationFn: (values: PartnerPayload) => partnerApi.updatePartnerProfile(Number(partnerId), values),
    onSuccess: () => {
      toast.success("Partner updated successfully");
    },
    onError: (error) => {
      toast.error("Failed to update partner");
      console.error("Error updating partner:", error);
    },
  });

  const createPartnerMutation = useMutation({
    mutationFn: partnerApi.createPartner,
    onSuccess: (data) => {
      form.setFieldValue("partnerId", data.data.partnerCode);
      setPartnerCode(data.data.partnerCode);
      setPartnerId(data.data.id);
      toast.success("Partner created successfully");
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message || "";
      if (message.includes("UQ_Partners_PartnerName") || message.includes("duplicate key")) {
        toast.error("Duplicate partner name not allowed");
      } else {
        toast.error("Failed to create partner");
      }
      console.error("Error creating partner:", error);
    },
  });

  function onSubmit(values: FormValues) {
    const formattedData = formatFormData(values);

    if (partnerCode !== "PID***") {
      const payload = {
        ...formattedData,
        id: partnerId,
        approvedBy: partner.data.approvedBy,
        approverName: partner.data.approverName,
        approverEmail: partner.data.approverEmail,
        approvedStatus: true,
      };
      updatePartnerMutation.mutate(payload as PartnerPayload);
    } else {
      createPartnerMutation.mutate(formattedData);
    }
  }

  const onFinish = (values: FormValues) => {
    const data = validateWithZod(candidateProfileSchema, form, values);
    if (data) onSubmit(data);
  };

  if (loader || isLoadingPartner) {
    return (
      <Flex justify="center" align="center" className="p-8">
        <Spin size="large" />
      </Flex>
    );
  }

  return (
    <Flex vertical gap={16}>
      <Typography.Title level={4} style={{ margin: 0 }}>
        Partner Profile
      </Typography.Title>

      <Flex wrap gap={16} align="center" justify="space-between">
        <Typography.Title level={5} style={{ margin: 0 }}>
          Profile
        </Typography.Title>
        <Space size={4}>
          <Typography.Text type="secondary">Partner ID:</Typography.Text>
          <Typography.Text strong>{partnerCode}</Typography.Text>
          <Typography.Text type="secondary">({isCreating ? "Creating New" : "Updating Existing"})</Typography.Text>
        </Space>
        <Space size={4}>
          <Typography.Text type="secondary">Partner Status:</Typography.Text>
          <Typography.Text strong>{partnerStatusNameFromAPI || "*****"}</Typography.Text>
          <Typography.Text type="secondary">({isCreating ? "Creating New" : "Updating Existing"})</Typography.Text>
        </Space>
      </Flex>

      <Form
        form={form}
        layout="vertical"
        onFinish={onFinish}
        initialValues={{
          partnerId: "",
          partnerName: "",
          nickname: "",
          startDate: new Date().toISOString().split("T")[0],
          country: "",
          state: "",
          city: "",
          address: "",
          domain: [],
          subDomain: [],
          skills: [],
          capabilitiesDeckDocuments: [],
          pincode: "",
          partnerCategoryId: "",
          servicingCountryId: "",
        }}
      >
        <Form.Item name="partnerId" hidden>
          <Input />
        </Form.Item>
        <Row gutter={[16, 8]}>
          <Col xs={24} md={12}>
            <Form.Item name="partnerName" label="Partner Name" rules={zodRules(candidateProfileSchema, "partnerName")}>
              <Input placeholder="Please enter the company full name" />
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Form.Item name="nickname" label="Alias" rules={zodRules(candidateProfileSchema, "nickname")}>
              <Input placeholder="Partner NickName" />
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Form.Item
              name="startDate"
              label="Start Date"
              rules={zodRules(candidateProfileSchema, "startDate")}
              getValueProps={(v: string) => ({ value: v ? dayjs(v) : undefined })}
              normalize={(d: dayjs.Dayjs | null) => (d ? d.format("YYYY-MM-DD") : "")}
            >
              <DatePicker className="w-full" disabledDate={(d) => d.isBefore(dayjs().startOf("day"))} />
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Form.Item name="country" label="Origin Country" rules={zodRules(candidateProfileSchema, "country")}>
              <Select
                showSearch
                optionFilterProp="label"
                placeholder="select origin country"
                options={toOptions(country)}
                onChange={() => form.setFieldsValue({ state: "", city: "" })}
              />
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Form.Item name="state" label="Origin State" rules={zodRules(candidateProfileSchema, "state")}>
              <Select showSearch optionFilterProp="label" placeholder="select origin state" options={toOptions(states)} onChange={() => form.setFieldValue("city", "")} />
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Form.Item name="city" label="Origin City" rules={zodRules(candidateProfileSchema, "city")}>
              <Select showSearch optionFilterProp="label" placeholder="select origin city" options={toOptions(cities)} />
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Form.Item name="servicingCountryId" label="Servicing Country" rules={zodRules(candidateProfileSchema, "servicingCountryId")}>
              <Select showSearch optionFilterProp="label" placeholder="select servicing country" options={toOptions(country)} />
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Form.Item name="partnerCategoryId" label="Partner Category" rules={zodRules(candidateProfileSchema, "partnerCategoryId")}>
              <Select showSearch optionFilterProp="label" placeholder="Select Partner Category" options={toOptions(PARTNER_CATEGORY)} />
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Form.Item name="address" label="Registered Address" rules={zodRules(candidateProfileSchema, "address")}>
              <Input placeholder="Registered Address" />
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Form.Item name="pincode" label="Pincode" rules={zodRules(candidateProfileSchema, "pincode")}>
              <Input placeholder="Enter Pincode" maxLength={6} />
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Form.Item name="domain" label="Domain" rules={zodRules(candidateProfileSchema, "domain")} {...idNameSelectProps}>
              <Select
                mode="multiple"
                labelInValue
                showSearch
                optionFilterProp="label"
                placeholder="Select domains"
                options={(domain as IdName[]).map((d) => ({ value: d.id, label: d.name }))}
                onChange={() => form.setFieldValue("subDomain", [])}
              />
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Form.Item name="subDomain" label="Sub-Domain" rules={zodRules(candidateProfileSchema, "subDomain")} {...idNameSelectProps}>
              <Select
                mode="multiple"
                labelInValue
                showSearch
                optionFilterProp="label"
                placeholder="Select sub-domain"
                options={(subDomain as IdName[]).map((d) => ({ value: d.id, label: d.name }))}
              />
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Flex gap={16} align="flex-end">
              <Form.Item name="skills" label="Skills" rules={zodRules(candidateProfileSchema, "skills")} {...idNameSelectProps} className="flex-1">
                <Select
                  mode="multiple"
                  labelInValue
                  showSearch
                  optionFilterProp="label"
                  placeholder="Select skills"
                  options={(skills as IdName[]).map((d) => ({ value: d.id, label: d.name }))}
                />
              </Form.Item>
              <Form.Item>
                <Button onClick={() => setIsAddSkillOpen(true)}>Add Skill</Button>
              </Form.Item>
            </Flex>
          </Col>
        </Row>

        {/* Multi-Document Capability Deck Section */}
        <Form.Item name="capabilitiesDeckDocuments" label="Company Profile" rules={zodRules(candidateProfileSchema, "capabilitiesDeckDocuments")}>
          <CapabilityDeckDocuments accept=".ppt,.pptx,.pdf,.doc,.docx" maxFiles={10} partnerId={partnerId} isCreating={isCreating} refetchPartner={refetchPartner} />
        </Form.Item>

        <Flex justify="flex-end">
          <Button type="primary" htmlType="submit" loading={updatePartnerMutation.isPending || createPartnerMutation.isPending} disabled={loader}>
            {partnerId ? "Update" : "Save"}
          </Button>
        </Flex>
      </Form>

      <Flex justify="space-between">
        <Button onClick={onPrevious}>Previous</Button>
        <Button type="primary" onClick={onNext} disabled={isCreating}>
          Next
        </Button>
      </Flex>

      <AddSkillModal isOpen={isAddSkillOpen} onClose={() => setIsAddSkillOpen(false)} isPrimary masterType={MasterTypes.SKILL} />
    </Flex>
  );
}

/* ------------------------------------------------------------------ */
/* Add-skill modal (was @/components/dialog/AddSkillDialog)            */
/* ------------------------------------------------------------------ */

const skillSchema = z.object({
  skillName: z.string().min(1, "Skill name is required"),
});
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
        if (error.response?.status === 400) {
          toast.error(error.response.data?.message || "Bad Request");
        } else {
          toast.error("baD request");
        }
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
            Add Skill
          </Button>
        </Space>
      }
    >
      <Typography.Paragraph type="secondary">Please add only new skills that aren’t already listed.</Typography.Paragraph>
      <Form
        form={form}
        layout="vertical"
        initialValues={{ skillName: "" }}
        onFinish={(values) => {
          const data = validateWithZod(skillSchema, form, values);
          if (data) addSkills.mutate({ isActive: true, name: data.skillName, isPrimary });
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
/* Capability deck uploader (replaces the legacy multi-document field)   */
/* ------------------------------------------------------------------ */

interface CapabilityDeckDocumentsProps {
  value?: Document[];
  onChange?: (docs: Document[]) => void;
  accept?: string;
  maxFiles?: number;
  partnerId?: number | string;
  isCreating?: boolean;
  refetchPartner?: () => Promise<unknown>;
}

function CapabilityDeckDocuments({ value, onChange, accept, maxFiles = 10, partnerId, isCreating = false, refetchPartner }: CapabilityDeckDocumentsProps) {
  const docs = value ?? [];
  const [uploading, setUploading] = useState(false);
  const [previousOpen, setPreviousOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [searchText] = useState("");
  const debouncedSearch = useDebounce(searchText, 300);

  const url = `/Partner/paged/capability-deck-documants?partnerId=${partnerId}`;
  const { data: capabilityDeckDocuments, refetch: reFetchData, isPending } = useQuery({
    queryKey: ["capabilityDeckDocuments", partnerId, currentPage, debouncedSearch, pageSize],
    queryFn: () => partnerApi.getcapabilityDeckDocuments(url, { pageNumber: currentPage, pageSize, searchText: debouncedSearch || undefined }),
    enabled: !!partnerId,
    refetchOnWindowFocus: true,
  });

  const handleFileUpload = async (file: File) => {
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await api.post("/FileServer/upload", formData, { headers: { "Content-Type": "multipart/form-data" } });
      const fileName = res.data.fileName || res.data;
      const newDocument: Document = {
        id: 0,
        attachmentURL: fileName,
        attachmentName: fileName,
        name: fileName,
        partnerId: isCreating ? 0 : partnerId ? Number(partnerId) : 0,
      };
      if (docs.length >= maxFiles) {
        toast.error(`Maximum ${maxFiles} files allowed`);
        return;
      }
      onChange?.([...docs, newDocument]);
      toast.success("Document uploaded successfully");
    } catch (error) {
      console.error("Upload failed", error);
      toast.error("Failed to upload document");
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteDocument = async (document: Document) => {
    try {
      if (document?.attachmentURL) {
        await api.delete(`/FileServer/${document?.attachmentName}`);
      }
      onChange?.(docs.filter((d) => d?.attachmentURL !== document?.attachmentURL));
      if (typeof refetchPartner === "function") await refetchPartner();
      await reFetchData();
      toast.success("Document deleted successfully");
    } catch (error: any) {
      console.error("Delete failed", error);
      toast.error(error?.response?.data?.message || error?.message || "Failed to delete document");
    }
  };

  const getPreviewUrl = (document: Document) => {
    if (!document?.attachmentURL) return "";
    if (document.attachmentURL.startsWith("http")) return document.attachmentURL;
    return `${process.env.NEXT_PUBLIC_API_BASE_URL}/FileServer/${document.attachmentURL}`;
  };

  // Once the partner exists only the latest document is shown inline; older ones live in "Previous Documents"
  const isLatestOnly = !!partnerId;
  const renderDocs = isLatestOnly ? docs.slice(-1) : docs;
  const previousItems: any[] = capabilityDeckDocuments?.items || [];

  return (
    <Flex vertical gap={12}>
      <Upload
        accept={accept}
        showUploadList={false}
        disabled={uploading || docs.length >= maxFiles}
        beforeUpload={(file) => {
          handleFileUpload(file as File);
          return false;
        }}
      >
        <Button icon={<UploadOutlined />} loading={uploading} disabled={docs.length >= maxFiles}>
          Upload document
        </Button>
      </Upload>
      {docs.length >= maxFiles && <Alert type="warning" showIcon message={`Maximum ${maxFiles} files allowed. Delete a file to upload a new one.`} />}

      {renderDocs.length > 0 && (
        <List
          size="small"
          bordered
          dataSource={renderDocs}
          renderItem={(doc, i) => {
            const isLatest = isLatestOnly || i === docs.length - 1;
            return (
              <List.Item
                actions={[
                  <DocumentPreview key="view" url={getPreviewUrl(doc)} fileName={doc?.attachmentName} />,
                  <Tooltip key="delete" title="Delete document">
                    <Button type="text" danger size="small" icon={<DeleteOutlined />} onClick={() => handleDeleteDocument(doc)} />
                  </Tooltip>,
                ]}
              >
                <List.Item.Meta avatar={<FileTextOutlined />} title={doc?.attachmentName} description={isLatest ? "Latest Document" : `Document ${i + 1}`} />
              </List.Item>
            );
          }}
        />
      )}

      <Button
        disabled={!partnerId}
        onClick={async () => {
          await reFetchData();
          setPreviousOpen(true);
        }}
        style={{ alignSelf: "flex-start" }}
      >
        Previous Documents
      </Button>

      <Modal open={previousOpen} title="Previous Documents" onCancel={() => setPreviousOpen(false)} footer={null} width={960} destroyOnHidden>
        <Table
          size="small"
          rowKey="id"
          loading={!!partnerId && isPending}
          dataSource={previousItems}
          scroll={{ x: "max-content" }}
          pagination={{
            current: currentPage,
            pageSize,
            total: capabilityDeckDocuments?.totalCount ?? 0,
            showSizeChanger: true,
            onChange: (page, size) => {
              setCurrentPage(page);
              setPageSize(size);
            },
          }}
          columns={[
            { key: "sno", title: "S.No", render: (_: unknown, __: unknown, index: number) => index + 1 },
            { key: "attachmentName", title: "File Name", dataIndex: "attachmentName" },
            { key: "createdDate", title: "Date", dataIndex: "createdDate" },
            { key: "createdTime", title: "Time", dataIndex: "createdTime" },
            { key: "view", title: "View", render: (_: unknown, doc: any) => <DocumentPreview url={doc?.attachmentURL} fileName={doc?.attachmentName} /> },
            {
              key: "delete",
              title: "Delete",
              render: (_: unknown, doc: any) => (
                <Tooltip title="Delete document">
                  <Button type="text" danger size="small" icon={<DeleteOutlined />} onClick={() => handleDeleteDocument(doc)} />
                </Tooltip>
              ),
            },
          ]}
        />
      </Modal>
    </Flex>
  );
}

function DocumentPreview({ url, fileName }: { url: string; fileName?: string }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  return (
    <>
      <Tooltip title="View">
        <Button type="text" size="small" icon={<EyeOutlined />} onClick={() => setOpen(true)} />
      </Tooltip>
      <Modal
        open={open}
        onCancel={() => setOpen(false)}
        title={fileName || "Document"}
        width="94vw"
        style={{ top: 16 }}
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
