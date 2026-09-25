"use client";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useMutation, useQuery } from "@tanstack/react-query";
import * as z from "zod";
import { Button, Checkbox, Col, DatePicker, Divider, Flex, Form, Input, Row, Select, Spin, Typography } from "antd";

import { toast } from "@/lib/toast";
import { validateWithZod, zodRules } from "@/lib/zodRules";
import { candidateApi } from "@/services/api/candidate.api";
import { dropdownApi } from "@/services/api/master";
import { MasterTypes } from "@/constants/masterTypes";
import { useUserStore } from "@/store/userStore";
import { TermsConditionsModal } from "@/components/dialog/TermsConditionsModal";
import { CandidateBreadcrumb } from "@/components/candidate/CandidateBreadcrumb";
import { ResumeUploadField } from "@/components/candidate/candidate-forms/ResumeUploadField";
import {
  dateStringProps,
  idNameSelectProps,
  REFERRED_OPTIONS,
  toStringOptions,
  YES_NO_OPTIONS,
  type IdName,
} from "@/components/candidate/candidate-forms/formFieldProps";

const idName = z.object({ id: z.number(), name: z.string() });

const candidateFormSchema = z.object({
  fullName: z.string().min(1, "Full Name is required"),
  phoneNumber: z.string().min(1, "Phone Number is required"),
  email: z.string().email("Invalid email address").min(1, "Email is required"),
  primarySkills: z.array(idName).optional(),
  secondarySkills: z.array(idName).optional(),
  PreferredWorkLocationId: z.array(idName).optional(),
  countryId: z.string().min(1, "Country is required"),
  stateId: z.string().min(1, "State is required"),
  cityId: z.string().min(1, "City is required"),
  diversity: z.string().optional(),
  noticePeriod: z.string().optional(),
  relevantExperience: z.string().optional(),
  currentlyWorking: z.string().optional(),
  currentOrganisation: z.string().optional(),
  lastWorkingDay: z.string().optional(),
  resume: z.object({
    attachmentName: z.string().min(1, "Resume is required"),
    attachmentURL: z.string().min(1, "Resume is required"),
  }),
  isReferred: z.string().optional(),
  referredBy: z.string().optional(),
  hrqId: z.string().min(1, "HRQ ID is required"),
  partnerId: z.string().min(1, "Partner is required"),
  jobTitle: z.string().min(1, "Role Hired For is required"),
  hrqStatusName: z.string().min(1, "HRQ Status is required"),
  intakeStatusId: z.string().min(1, "Intake Status is required"),
  resourceTypeId: z.string().min(1, "Resource Type is required"),
  isAgreedForTermsConditions: z.boolean().refine((val) => val === true, { message: "You must accept the terms and conditions" }),
  hiringRequestId: z.string(),
});

type FormValues = z.infer<typeof candidateFormSchema>;

/** Edit a candidate that is still under review (CandidateBin). */
const EditReviewCandidate = () => {
  const [showTermsDialog, setShowTermsDialog] = useState(false);
  const [selectedHrqID, setSelectedHrqID] = useState<string | null>(null);
  const [jobLocations, setJobLocations] = useState<IdName[]>([]);
  const { partnerId } = useUserStore();
  const searchParams = useSearchParams();
  const candidateId = searchParams.get("id");
  const router = useRouter();
  const [form] = Form.useForm<FormValues>();

  const selectedCountry = Form.useWatch("countryId", form);
  const selectedState = Form.useWatch("stateId", form);

  const { data: hrqids = [] } = useQuery({
    queryKey: ["hrqids"],
    queryFn: () => candidateApi.getHrqid(partnerId ? Number(partnerId) : null),
  });

  const UpdateCandidateMutation = useMutation({
    mutationFn: (data: any) => candidateApi.updateReviewCandidate(Number(candidateId), data),
    onSuccess: (data) => {
      toast.success(data.message);
      router.back();
    },
    onError: (error) => {
      toast.error((error as any)?.response?.data?.message || "An error occurred");
    },
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
  const { data: PRIMARY_SKILLS = [], isFetched: primaryFetched } = useQuery({
    queryKey: ["PRIMARY_SKILLS"],
    queryFn: () => dropdownApi.fetchDropdown(MasterTypes.PRIMARY_SKILLS),
  });
  const { data: SECONDARY_SKILLS = [], isFetched: secondaryFetched } = useQuery({
    queryKey: ["SECONDARY_SKILLS"],
    queryFn: () => dropdownApi.fetchDropdown(MasterTypes.SECONDARY_SKILLS),
  });
  const { data: IntakeStatus = [] } = useQuery({
    queryKey: ["instakeStatus"],
    queryFn: () => dropdownApi.fetchDropdown(MasterTypes.CANDIDATE_INTAKE_STATUS),
  });
  const { data: ResourceType = [] } = useQuery({ queryKey: ["resourceType"], queryFn: () => dropdownApi.fetchDropdown(MasterTypes.RESOURCE_TYPE) });
  const { data: hrqPartnersList = [] } = useQuery({
    queryKey: ["hrqPartnersList", selectedHrqID],
    queryFn: () => dropdownApi.fetchSpecificpartner(MasterTypes.HRQ_SPECIFIC_PARTNERS, selectedHrqID),
    enabled: !!selectedHrqID,
  });

  const { data: candidateData, isFetched } = useQuery({
    queryKey: ["candidate", candidateId],
    queryFn: () => candidateApi.fetchCandidateReviewDetails(Number(candidateId)),
    enabled: !!candidateId,
  });

  const [populated, setPopulated] = useState(false);
  useEffect(() => {
    if (!candidateData || !primaryFetched || !secondaryFetched || populated) return;
    const candidate = candidateData;
    const pick = (ids: unknown, rows: IdName[]) =>
      Array.isArray(ids) ? rows.filter((s) => ids.includes(s.id)).map((s) => ({ id: s.id, name: s.name })) : [];
    form.setFieldsValue({
      fullName: candidate?.fullName || "",
      phoneNumber: candidate?.phoneNumber || "",
      email: candidate?.email || "",
      primarySkills: pick(candidate.primarySkillIds, PRIMARY_SKILLS),
      secondarySkills: pick(candidate.secondarySkillIds, SECONDARY_SKILLS),
      PreferredWorkLocationId: pick(candidate.preferredWorkLocationIds, candidate?.preferredWorkLocations ?? []),
      countryId: candidate?.countryId?.toString() || "",
      stateId: candidate.stateId?.toString() || "",
      cityId: candidate.cityId?.toString() || "",
      intakeStatusId: String(candidateData?.intakeStatusId),
      diversity: candidate?.diversity?.toLowerCase() === "yes" ? "yes" : "no",
      noticePeriod: candidate?.noticePeriod?.toString() || "",
      relevantExperience: candidate?.relevantExperience?.toString() || "",
      currentlyWorking: candidate?.currentlyWorking?.toLowerCase() === "yes" ? "yes" : "no",
      currentOrganisation: candidate?.currentOrganisation || "",
      lastWorkingDay: candidate?.lastWorkingDay || "",
      resume: candidate?.resume || { attachmentName: "", attachmentURL: "" },
      isReferred: candidate?.isReferred,
      referredBy: candidate?.referredBy || "",
      hrqId: candidate?.hrqId || "",
      partnerId: candidate?.partnerId?.toString() || "",
      jobTitle: candidate?.jobTitle || "",
      hrqStatusName: candidate?.hiringStatusName || "WIP",
      resourceTypeId: candidate?.resourceTypeId?.toString() || "",
      hiringRequestId: candidate?.hiringRequestId?.toString() || "",
      isAgreedForTermsConditions: true,
    });
    if (Array.isArray(candidate.jobLocations)) {
      setJobLocations(candidate.jobLocations.map((loc: any) => ({ id: loc.id, name: loc.value })));
    }
    setSelectedHrqID(candidate?.hiringRequestId || null);
    setPopulated(true);
  }, [candidateData, primaryFetched, secondaryFetched, PRIMARY_SKILLS, SECONDARY_SKILLS, form, populated]);

  const handleTermsAccept = () => {
    form.setFieldValue("isAgreedForTermsConditions", true);
    form.validateFields(["isAgreedForTermsConditions"]);
    setShowTermsDialog(false);
  };

  const onFinish = (raw: FormValues) => {
    const values = validateWithZod(candidateFormSchema, form, raw);
    if (!values) return;
    const primarySkillIds = (values.primarySkills ?? []).map((skill) => skill.id);
    const secondarySkillIds = values.secondarySkills?.map((skill) => skill.id) || [];
    const { PreferredWorkLocationId, lastWorkingDay, ...rest } = values;
    const payload = {
      ...rest,
      primarySkillIds,
      secondarySkillIds,
      preferredWorkLocationIds: PreferredWorkLocationId ? PreferredWorkLocationId.map((item) => item.id) : [],
      CandidateBinId: candidateData?.candidateBinId,
      noticePeriod: values.noticePeriod,
      isBin: candidateData.isBin,
      partnerId: values.partnerId,
      lastWorkingDay: lastWorkingDay ? lastWorkingDay : null,
    };
    UpdateCandidateMutation.mutate(payload);
  };

  if (!isFetched || (candidateData && !populated)) return <Spin fullscreen />;

  return (
    <Flex vertical gap={16} className="p-4">
      <CandidateBreadcrumb />
      <Typography.Title level={4} style={{ margin: 0 }}>
        Edit Review Candidate
      </Typography.Title>

      <Form
        form={form}
        layout="vertical"
        onFinish={onFinish}
        initialValues={{
          fullName: "",
          phoneNumber: "",
          email: "",
          hiringRequestId: "",
          countryId: "",
          stateId: "",
          cityId: "",
          diversity: "",
          noticePeriod: "",
          relevantExperience: "",
          currentlyWorking: "",
          currentOrganisation: "",
          lastWorkingDay: "",
          isReferred: "",
          referredBy: "",
          resume: { attachmentName: "", attachmentURL: "" },
          hrqId: "",
          partnerId: "",
          jobTitle: "",
          hrqStatusName: "",
          intakeStatusId: "",
          resourceTypeId: "",
          isAgreedForTermsConditions: false,
          PreferredWorkLocationId: [],
          primarySkills: [],
          secondarySkills: [],
        }}
      >
        <Row gutter={[16, 8]}>
          <Col xs={24} md={12}>
            <Form.Item name="hrqId" label="HRQ ID" rules={zodRules(candidateFormSchema, "hrqId")}>
              <Select
                showSearch
                optionFilterProp="label"
                placeholder="Select or search HRQ ID"
                options={(hrqids as any[])?.map((option) => ({ value: option.hrqId, label: option.hrqId }))}
                disabled
              />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={[16, 8]}>
          <Col xs={24} md={12}>
            <Form.Item name="partnerId" label="Partner" rules={zodRules(candidateFormSchema, "partnerId")}>
              <Select showSearch optionFilterProp="label" placeholder="Select intake status" options={toStringOptions(hrqPartnersList)} />
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Form.Item name="jobTitle" label="Role Hired For" rules={zodRules(candidateFormSchema, "jobTitle")}>
              <Input readOnly variant="filled" />
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Form.Item name="hrqStatusName" label="HRQ Status" rules={zodRules(candidateFormSchema, "hrqStatusName")}>
              <Input readOnly variant="filled" />
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Form.Item name="intakeStatusId" label="Intake Status" rules={zodRules(candidateFormSchema, "intakeStatusId")}>
              <Select placeholder="Select intake status" options={toStringOptions(IntakeStatus)} disabled />
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Form.Item name="resourceTypeId" label="Resource type" rules={zodRules(candidateFormSchema, "resourceTypeId")}>
              <Select placeholder="Select resource type" options={toStringOptions(ResourceType)} />
            </Form.Item>
          </Col>
          <Form.Item name="hiringRequestId" hidden>
            <Input />
          </Form.Item>
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
              <Input placeholder="Phone Number" />
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Form.Item name="email" label="Email" rules={zodRules(candidateFormSchema, "email")}>
              <Input placeholder="Email" />
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Form.Item name="primarySkills" label="Primary Skills" required {...idNameSelectProps(PRIMARY_SKILLS)}>
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
            <Form.Item name="noticePeriod" label="Notice Period" required>
              <Input type="number" placeholder="Notice Period" />
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Form.Item name="relevantExperience" label="Relevant Experience" required>
              <Input placeholder="Relevant Experience" />
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Form.Item name="currentlyWorking" label="Currently Working" required>
              <Select placeholder="Currently Working" options={YES_NO_OPTIONS} />
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Form.Item name="currentOrganisation" label="Current Organisation">
              <Input placeholder="Current Organisation" />
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Form.Item name="lastWorkingDay" label="Last Working Date" {...dateStringProps("")}>
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
            <Form.Item name="referredBy" label="Referred By">
              <Input placeholder="Referred By" />
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

        <Form.Item name="isAgreedForTermsConditions" valuePropName="checked" rules={zodRules(candidateFormSchema, "isAgreedForTermsConditions")}>
          <Checkbox>
            I read and agree to <Typography.Link onClick={() => setShowTermsDialog(true)}>terms and conditions</Typography.Link>
          </Checkbox>
        </Form.Item>

        <Button type="primary" htmlType="submit" loading={UpdateCandidateMutation.isPending}>
          Submit
        </Button>
      </Form>

      <TermsConditionsModal open={showTermsDialog} onCancel={() => setShowTermsDialog(false)} onAccept={handleTermsAccept} />
    </Flex>
  );
};

export default EditReviewCandidate;
