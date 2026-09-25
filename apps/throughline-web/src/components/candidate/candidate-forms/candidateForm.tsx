"use client";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useMutation, useQuery } from "@tanstack/react-query";
import * as z from "zod";
import { Button, Checkbox, Col, DatePicker, Divider, Flex, Form, Input, Radio, Row, Select, Space, Spin, Typography } from "antd";
import { PlusOutlined } from "@ant-design/icons";

import { toast } from "@/lib/toast";
import { validateWithZod, zodRules } from "@/lib/zodRules";
import api from "@/lib/axiosInstance";
import { candidateApi } from "@/services/api/candidate.api";
import { dropdownApi } from "@/services/api/master";
import { MasterTypes } from "@/constants/masterTypes";
import { isPartner, useUserStore } from "@/store/userStore";
import { AddSkillDialog } from "@/components/dialog/AddSkillDialog";
import { TermsConditionsModal } from "@/components/dialog/TermsConditionsModal";
import { CandidateBreadcrumb } from "../CandidateBreadcrumb";
import UploadMultipleCandidate from "./uploadMultipleCandidate";
import { ResumeUploadField } from "./ResumeUploadField";
import { dateStringProps, idNameSelectProps, REFERRED_OPTIONS, toStringOptions, YES_NO_OPTIONS, type IdName } from "./formFieldProps";

const idName = z.object({ id: z.number(), name: z.string() });

const candidateFormSchema = z.object({
  fullName: z.string().min(1, "Full Name is required"),
  phoneNumber: z
    .string()
    .min(10, "Contact number must be 10 digits")
    .max(10, "Contact number must be 10 digits")
    .refine((value) => /^\d+$/.test(value), { message: "Only numbers are allowed" }),
  email: z.string().email("Invalid email address").min(1, "Email is required"),
  PreferredWorkLocationId: z.array(idName).optional(),
  primarySkills: z.array(idName).optional(),
  secondarySkills: z.array(idName).optional(),
  countryId: z.string().min(1, "Country is required"),
  stateId: z.string().min(1, "State is required"),
  cityId: z.string().min(1, "City is required"),
  diversity: z.string().optional(),
  noticePeriod: z.string().min(1, "NoticePeriod is required"),
  relevantExperience: z.string().min(1, "Relevant Experience is required"),
  currentlyWorking: z.string().min(1, "Currently Working is required"),
  currentOrganisation: z.string().min(1, "Current/Last Organisation is required"),
  lastWorkingDay: z.string().optional().nullable(),
  resume: z.object({
    attachmentName: z.string().min(1, "Resume is required"),
    attachmentURL: z.string().min(1, "Resume is required"),
  }),
  isReferred: z.string().optional(),
  referredBy: z.string().optional(),
  hrqId: z.string().min(1, "HRQ ID is required"),
  partner: z.string().min(1, "Partner is required"),
  jobTitle: z.string().min(1, "Role Hired For is required"),
  hrqStatusName: z.string().min(1, "HRQ Status is required"),
  resourceTypeName: z.string().optional(),
  isAgreedForTermsConditions: z.boolean().refine((val) => val === true, { message: "You must accept the terms and conditions" }),
  hiringRequestId: z.number().optional(),
});

type FormValues = z.infer<typeof candidateFormSchema>;

/** Candidate registration: single (this form) or multiple (Excel upload). */
const CandidateForm = () => {
  const [registrationType, setRegistrationType] = useState<"single" | "multiple">("single");
  const searchParams = useSearchParams();
  const hrqid = searchParams.get("hrqid");
  const router = useRouter();
  const { partnerId, partnerName, userId } = useUserStore();
  const [form] = Form.useForm<FormValues>();

  const [showTermsDialog, setShowTermsDialog] = useState(false);
  const [selectedHrqID, setSelectedHrqID] = useState<string | null>(null);
  const [jobLocations, setJobLocations] = useState<IdName[]>([]);
  const [loader, setLoader] = useState(false);
  const [isPrimary, setisPrimary] = useState(true);
  const [isAddSkillOpen, setIsAddSkillOpen] = useState(false);

  const selectedCountry = Form.useWatch("countryId", form);
  const selectedState = Form.useWatch("stateId", form);

  const { data: hrqids = [] } = useQuery({
    queryKey: ["hrqids"],
    queryFn: () => candidateApi.getHrqid(partnerId ? Number(partnerId) : null),
  });
  const { data: country = [] } = useQuery({ queryKey: ["country"], queryFn: () => dropdownApi.fetchDropdown(MasterTypes.COUNTRY) });
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
  const { data: PRIMARY_SKILLS = [] } = useQuery({ queryKey: ["PRIMARY_SKILLS"], queryFn: () => dropdownApi.fetchDropdown(MasterTypes.PRIMARY_SKILLS) });
  const { data: SECONDARY_SKILLS = [] } = useQuery({
    queryKey: ["SECONDARY_SKILLS"],
    queryFn: () => dropdownApi.fetchDropdown(MasterTypes.SECONDARY_SKILLS),
  });
  const { data: hrqPartnersList = [] } = useQuery({
    queryKey: ["hrqPartnersList", selectedHrqID],
    queryFn: () => dropdownApi.fetchSpecificpartner(MasterTypes.HRQ_SPECIFIC_PARTNERS, selectedHrqID),
    enabled: !!selectedHrqID,
  });

  useEffect(() => {
    if (hrqPartnersList && hrqPartnersList.length > 0 && partnerId) {
      form.setFieldValue("partner", partnerId?.toString() || "");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hrqPartnersList]);

  const createCandidateMutation = useMutation({
    mutationFn: async (values: any) => {
      try {
        await candidateApi.createCandidateUserIdBased(values, userId);
      } catch (error: any) {
        if (
          error.response?.data?.message ===
          "The candidate you are trying to upload is a duplicate. Are you sure you want to send this candidate for approval?"
        ) {
          return await candidateApi.createCandidateUserIdBased({ ...values, isRequestException: true }, userId);
        }
        throw error;
      }
    },
    onSuccess: () => {
      toast.success("Candidate details created successfully");
      form.resetFields();
      router.push("/home/candidate-management");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to create candidate details");
      console.error("Error creating candidate details:", error);
    },
  });

  const onFinish = (raw: FormValues) => {
    const values = validateWithZod(candidateFormSchema, form, raw);
    if (!values) return;
    const primarySkillIds = (values.primarySkills ?? []).map((skill) => skill.id);
    const secondarySkillIds = values.secondarySkills?.map((skill) => skill.id) || [];
    const { PreferredWorkLocationId, ...rest } = values;
    const payload = {
      ...rest,
      PrimarySkillIds: primarySkillIds,
      SecondarySkillIds: secondarySkillIds,
      preferredWorkLocationIds: PreferredWorkLocationId ? PreferredWorkLocationId.map((item) => item.id) : [],
      noticePeriod: Number(values.noticePeriod),
      isReferred: values.isReferred,
      isBin: true,
      partnerId: values.partner,
      isActive: true,
    };
    createCandidateMutation.mutate(payload);
  };

  const fillRandomData = async () => {
    const hrqId = form.getFieldValue("hrqId");
    if (!hrqId) {
      toast.error("Please enter HRQ ID");
      return;
    }
    try {
      setLoader(true);
      const response = await api.get(`/HiringRequest/hiring/validate/${hrqId}`);
      const data = response.data.data;
      form.setFieldsValue({
        hiringRequestId: data.hiringRequestId,
        jobTitle: data.jobTitle,
        hrqStatusName: data.hiringStatusName,
        resourceTypeName: String(data.resourceTypeName),
      });
      setJobLocations(Array.isArray(data.jobLocations) ? data.jobLocations.map((loc: any) => ({ id: loc.id, name: loc.name })) : []);
      toast.success("HRQ details loaded successfully");
      setSelectedHrqID(data.hiringRequestId);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to fetch HRQ details");
    } finally {
      setLoader(false);
    }
  };

  useEffect(() => {
    if (hrqid) {
      form.setFieldValue("hrqId", hrqid);
      fillRandomData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hrqid]);

  const handleTermsAccept = () => {
    form.setFieldValue("isAgreedForTermsConditions", true);
    form.validateFields(["isAgreedForTermsConditions"]);
    setShowTermsDialog(false);
  };

  return (
    <Flex vertical gap={16}>
      <CandidateBreadcrumb />
      <Flex justify="space-between" align="center" wrap gap={8}>
        <Typography.Title level={4} style={{ margin: 0 }}>
          Candidate Registration
        </Typography.Title>
        <Space>
          <Typography.Text>Registration Type</Typography.Text>
          <Radio.Group
            optionType="button"
            value={registrationType}
            onChange={(e) => setRegistrationType(e.target.value)}
            options={[
              { value: "single", label: "Single" },
              { value: "multiple", label: "Multiple" },
            ]}
          />
        </Space>
      </Flex>

      {registrationType === "single" ? (
        <Spin spinning={loader} description="Validating HRQ...">
          <Form
            form={form}
            layout="vertical"
            onFinish={onFinish}
            initialValues={{
              fullName: "",
              phoneNumber: "",
              email: "",
              countryId: "",
              stateId: "",
              cityId: "",
              diversity: "",
              noticePeriod: "",
              relevantExperience: "",
              currentlyWorking: "",
              currentOrganisation: "",
              lastWorkingDay: null,
              isReferred: "",
              referredBy: "",
              resume: { attachmentName: "", attachmentURL: "" },
              hrqId: "",
              partner: partnerName,
              jobTitle: "",
              hrqStatusName: "",
              resourceTypeName: "",
              isAgreedForTermsConditions: false,
              PreferredWorkLocationId: [],
              primarySkills: [],
              secondarySkills: [],
            }}
          >
            <Row gutter={[16, 8]}>
              <Col xs={24} md={12}>
                {!hrqid ? (
                  <Form.Item label="HRQ ID" required>
                    <Space.Compact className="w-full">
                      <Form.Item name="hrqId" noStyle rules={zodRules(candidateFormSchema, "hrqId")}>
                        <Select
                          showSearch
                          optionFilterProp="label"
                          placeholder="Select or search HRQ ID"
                          options={(hrqids as any[])?.map((option) => ({ value: option.hrqId, label: option.hrqId }))}
                          className="w-full"
                        />
                      </Form.Item>
                      <Button type="primary" loading={loader} onClick={fillRandomData}>
                        {loader ? "Validating..." : "Validate"}
                      </Button>
                    </Space.Compact>
                  </Form.Item>
                ) : (
                  <Form.Item name="hrqId" label="HRQ ID">
                    <Input readOnly variant="filled" />
                  </Form.Item>
                )}
              </Col>
            </Row>

            <Row gutter={[16, 8]}>
              <Col xs={24} md={12}>
                <Form.Item name="partner" label="Partner" rules={zodRules(candidateFormSchema, "partner")}>
                  <Select showSearch optionFilterProp="label" placeholder="Select Partner" options={toStringOptions(hrqPartnersList)} disabled={!!partnerId} />
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item name="jobTitle" label="Role Hired For" rules={zodRules(candidateFormSchema, "jobTitle")}>
                  <Input readOnly variant="filled" placeholder="Validate an HRQ ID" />
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item name="hrqStatusName" label="HRQ Status" rules={zodRules(candidateFormSchema, "hrqStatusName")}>
                  <Input readOnly variant="filled" placeholder="Validate an HRQ ID" />
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item label="Intake Status">
                  <Input readOnly variant="filled" value="New" />
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item name="resourceTypeName" label="Resource Type">
                  <Input readOnly variant="filled" placeholder="Validate an HRQ ID" />
                </Form.Item>
                <Form.Item name="hiringRequestId" hidden>
                  <Input />
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item name="PreferredWorkLocationId" label="Preferred Work Location" {...idNameSelectProps(jobLocations)}>
                  <Select
                    mode="multiple"
                    showSearch
                    optionFilterProp="label"
                    allowClear
                    maxTagCount="responsive"
                    placeholder="Select preferred work locations"
                    options={jobLocations.map((o) => ({ value: o.id, label: o.name }))}
                    disabled={jobLocations.length === 0}
                  />
                </Form.Item>
              </Col>
            </Row>

            <Divider />

            <Row gutter={[16, 8]}>
              <Col xs={24} md={12}>
                <Form.Item name="fullName" label="Full Name" rules={zodRules(candidateFormSchema, "fullName")}>
                  <Input placeholder="Full Name" />
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item name="phoneNumber" label="Phone Number" rules={zodRules(candidateFormSchema, "phoneNumber")}>
                  <Input placeholder="Enter 10 digit contact number" type="tel" maxLength={10} />
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item name="email" label="Email" rules={zodRules(candidateFormSchema, "email")}>
                  <Input placeholder="Email" />
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Flex gap={8} align="flex-end">
                  <Form.Item name="primarySkills" label="Primary Skills" className="flex-1" {...idNameSelectProps(PRIMARY_SKILLS)}>
                    <Select
                      mode="multiple"
                      showSearch
                      optionFilterProp="label"
                      allowClear
                      maxTagCount="responsive"
                      placeholder="Select primary skills"
                      options={(PRIMARY_SKILLS as IdName[]).map((o) => ({ value: o.id, label: o.name }))}
                    />
                  </Form.Item>
                  {!isPartner && (
                    <Form.Item label=" ">
                      <Button
                        icon={<PlusOutlined />}
                        onClick={() => {
                          setisPrimary(true);
                          setIsAddSkillOpen(true);
                        }}
                      >
                        Add Skill
                      </Button>
                    </Form.Item>
                  )}
                </Flex>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item name="secondarySkills" label="Secondary Skills" {...idNameSelectProps(SECONDARY_SKILLS)}>
                  <Select
                    mode="multiple"
                    showSearch
                    optionFilterProp="label"
                    allowClear
                    maxTagCount="responsive"
                    placeholder="Select secondary skills"
                    options={(SECONDARY_SKILLS as IdName[]).map((o) => ({ value: o.id, label: o.name }))}
                  />
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item name="countryId" label="Country" rules={zodRules(candidateFormSchema, "countryId")}>
                  <Select
                    showSearch
                    optionFilterProp="label"
                    placeholder="Select country"
                    options={toStringOptions(country)}
                    onChange={() => form.setFieldsValue({ stateId: "", cityId: "" })}
                  />
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item name="stateId" label="State" rules={zodRules(candidateFormSchema, "stateId")}>
                  <Select showSearch optionFilterProp="label" placeholder="Select state" options={toStringOptions(states)} onChange={() => form.setFieldValue("cityId", "")} />
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item name="cityId" label="City" rules={zodRules(candidateFormSchema, "cityId")}>
                  <Select showSearch optionFilterProp="label" placeholder="Select city" options={toStringOptions(cities)} />
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item name="diversity" label="Diversity">
                  <Select placeholder="Diversity" options={YES_NO_OPTIONS} allowClear />
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item name="noticePeriod" label="Notice Period(Days)" rules={zodRules(candidateFormSchema, "noticePeriod")}>
                  <Input type="number" placeholder="Notice Period" />
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item name="relevantExperience" label="Relevant Experience(In Years)" rules={zodRules(candidateFormSchema, "relevantExperience")}>
                  <Input placeholder="Relevant Experience" />
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item name="currentlyWorking" label="Currently Working" rules={zodRules(candidateFormSchema, "currentlyWorking")}>
                  <Select placeholder="Currently Working" options={YES_NO_OPTIONS} />
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item name="currentOrganisation" label="Current/Last Organisation" rules={zodRules(candidateFormSchema, "currentOrganisation")}>
                  <Input placeholder="Current/Last Organisation" />
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item name="lastWorkingDay" label="Last Working Date" {...dateStringProps(null)}>
                  <DatePicker className="w-full" format="YYYY-MM-DD" placeholder="YYYY-MM-DD" />
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item
                  name="resume"
                  label="Resume"
                  required
                  rules={[{ validator: async (_, v) => (v?.attachmentURL ? undefined : Promise.reject(new Error("Resume is required"))) }]}
                >
                  <ResumeUploadField accept=".ppt,.pptx,.pdf,.doc,.docx" />
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item name="isReferred" label="Is Referred">
                  <Select placeholder="Select..." options={REFERRED_OPTIONS} allowClear />
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item name="referredBy" label="Referred By(Email)">
                  <Input placeholder="Enter email" />
                </Form.Item>
              </Col>
            </Row>

            <Form.Item name="isAgreedForTermsConditions" valuePropName="checked" rules={zodRules(candidateFormSchema, "isAgreedForTermsConditions")}>
              <Checkbox disabled>
                I read and agree to <Typography.Link onClick={() => setShowTermsDialog(true)}>terms and conditions</Typography.Link>
              </Checkbox>
            </Form.Item>

            <Button type="primary" htmlType="submit" loading={createCandidateMutation.isPending}>
              {createCandidateMutation.isPending ? "Submitting..." : "Submit"}
            </Button>
          </Form>
        </Spin>
      ) : (
        <UploadMultipleCandidate />
      )}

      <TermsConditionsModal open={showTermsDialog} onCancel={() => setShowTermsDialog(false)} onAccept={handleTermsAccept} />
      <AddSkillDialog isOpen={isAddSkillOpen} onClose={() => setIsAddSkillOpen(false)} isPrimary={isPrimary} masterType={MasterTypes.SKILL} />
    </Flex>
  );
};

export default CandidateForm;
