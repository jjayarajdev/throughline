"use client";

import { useEffect, useMemo } from "react";
import * as z from "zod";
import dayjs, { type Dayjs } from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";
import { useQuery } from "@tanstack/react-query";
import { Button, Col, DatePicker, Flex, Form, Input, Row, Select, Typography } from "antd";
import { onboarding } from "@/services/api/onboarding.api";
import { MasterTypes } from "@/constants/masterTypes";
import { dropdownApi } from "@/services/api/master";
import { useUserStore } from "@/store/userStore";
import { validateWithZod, zodRules } from "@/lib/zodRules";

dayjs.extend(customParseFormat);

const personalDetailsSchema = z.object({
  candidateCode: z.string().optional(),

  hrqId: z.string(),
  hiringManagerName: z.string(),
  hiringManagerId: z.string().optional(),
  sourceId: z.string().optional(),
  sourceName: z.string().optional(),
  roleHiredFor: z.string(),

  dateOfJoining: z.string().optional(),
  finalOnboaridngDate: z.string().min(1, "Date of Onboarding is required"),
  dob: z.string().min(1, "DOB is required"),

  countryId: z.string(),
  stateId: z.string(),
  cityId: z.string(),
  categoryId: z.string().optional(),

  currentAddress: z.string().min(1, "Current Address is required"),
  personalMailId: z.string(),

  onboardingManagerId: z.string(),

  jobLocation: z.string().min(1, "Job Location is required"),
  phone: z.string(),

  aadharLast4Digits: z
    .string()
    .min(4, "Aadhar must be exactly 4 digits")
    .max(4, "Aadhar must be exactly 4 digits")
    .refine((val) => /^\d{4}$/.test(val), { message: "Only numeric digits are allowed. No letters or special characters." }),

  genderId: z.string().min(1, "Gender is required"),
  transportRequirementId: z.string().min(1, "Transport Requirement is required"),

  domainId: z.string(),
  subDomainId: z.string(),
  candidateName: z.string(),
  nameAsPerAadhar: z.string().min(1, "Name as per Aadhar is required"),
  pincode: z.string().regex(/^\d{6}$/, { message: "Pincode must be exactly 6 digits and numeric only" }),
});

type PersonalDetailsFormValues = z.infer<typeof personalDetailsSchema>;
type ITPCSetupFormValuesWithId = PersonalDetailsFormValues & { id?: string; candidateId: number; hiringRequestId: number; [key: string]: any };
interface IProps {
  onSave: (data: ITPCSetupFormValuesWithId) => void;
  onboardingTimeline: ITPCSetupFormValuesWithId;
}

type Option = { id: number | string; name: string };
const toOptions = (list: Option[] = []) => list.map((o) => ({ value: String(o.id), label: o.name }));

const dateItem = {
  getValueProps: (v?: string) => ({ value: v && dayjs(v).isValid() ? dayjs(v) : null }),
  normalize: (d: Dayjs | null) => (d ? d.format("YYYY-MM-DD") : ""),
};
/** DOB is stored as "DD/MM"; the API may also return an ISO date-time. */
const dayMonthItem = {
  getValueProps: (v?: string) => {
    if (!v) return { value: null };
    const d = v.includes("/") ? dayjs(v, "DD/MM", true) : dayjs(v);
    return { value: d.isValid() ? d : null };
  },
  normalize: (d: Dayjs | null, prev: string) => (d ? d.format("DD/MM") : prev),
};
const noPast = (d: Dayjs) => d.isBefore(dayjs(), "day");

function PersonalDetails({ onSave, onboardingTimeline }: IProps) {
  const { userId, userName } = useUserStore();
  const [form] = Form.useForm<PersonalDetailsFormValues>();
  const locked = !!onboardingTimeline?.id;

  const initial = useMemo<Partial<PersonalDetailsFormValues>>(
    () => ({
      candidateCode: onboardingTimeline?.candidateCode || "",
      hrqId: onboardingTimeline?.hrqId || "",
      hiringManagerName: onboardingTimeline?.hiringManagerName || "",
      categoryId: onboardingTimeline?.resourceTypeName || "",
      sourceName: onboardingTimeline?.sourceName || "",
      roleHiredFor: onboardingTimeline?.roleHiredFor || "",
      dateOfJoining: onboardingTimeline?.dateOfJoining || "",
      countryId: onboardingTimeline?.countryId?.toString() || "",
      stateId: onboardingTimeline?.stateId?.toString() || "",
      cityId: onboardingTimeline?.cityId?.toString() || "",
      personalMailId: onboardingTimeline?.personalMailId || "",
      currentAddress: onboardingTimeline?.currentAddress || "",
      pincode: onboardingTimeline?.pincode || "",
      finalOnboaridngDate: onboardingTimeline?.finalOnboaridngDate || "",
      onboardingManagerId: onboardingTimeline?.onboardingManagerName ? onboardingTimeline?.onboardingManagerName : userName,
      genderId: onboardingTimeline?.genderId?.toString() || "",
      transportRequirementId: onboardingTimeline?.transportRequirementId?.toString() || "",
      jobLocation: onboardingTimeline?.jobLocation || "",
      dob: onboardingTimeline?.dob || "",
      phone: onboardingTimeline?.phone || "",
      aadharLast4Digits: onboardingTimeline?.aadharLast4Digits || "",
      domainId: onboardingTimeline?.domainId?.toString() || "",
      subDomainId: onboardingTimeline?.subDomainId?.toString() || "",
      candidateName: onboardingTimeline?.candidateName,
      nameAsPerAadhar: onboardingTimeline?.nameAsPerAadhar,
    }),
    [onboardingTimeline, userName]
  );

  useEffect(() => {
    if (onboardingTimeline) form.setFieldsValue(initial);
  }, [onboardingTimeline, initial, form]);

  const { data: country = [] } = useQuery({
    queryKey: ["getEmployeeCategoryData", MasterTypes.COUNTRY],
    queryFn: async () => (await onboarding.getEmployeeCategory(MasterTypes.COUNTRY)).data,
    retry: 1,
  });

  const selectedCountry = Form.useWatch("countryId", form);
  const { data: states = [] } = useQuery({
    queryKey: ["getStates", selectedCountry],
    queryFn: async () => (await onboarding.getEmployeeCategory(MasterTypes.STATE, { countryId: parseInt(selectedCountry) })).data,
    enabled: !!selectedCountry,
    retry: 1,
  });

  const selectedState = Form.useWatch("stateId", form);
  const { data: cities = [] } = useQuery({
    queryKey: ["getCities", selectedState],
    queryFn: async () => (await onboarding.getEmployeeCategory(MasterTypes.CITY, { stateId: parseInt(selectedState) })).data,
    enabled: !!selectedState,
    retry: 1,
  });

  const { data: categoryyesornodata = [] } = useQuery({
    queryKey: ["getEmployeeCategoryData", MasterTypes.YES_OR_NO],
    queryFn: async () => (await onboarding.getEmployeeCategory(MasterTypes.YES_OR_NO)).data,
    retry: 1,
  });

  const { data: gender = [] } = useQuery({
    queryKey: ["getEmployeeCategoryData", MasterTypes.GENDER],
    queryFn: async () => (await onboarding.getEmployeeCategory(MasterTypes.GENDER)).data,
    retry: 1,
  });

  const { data: domain = [] } = useQuery({
    queryKey: ["getonboardingKit", MasterTypes.DOMAIN],
    queryFn: async () => (await onboarding.getEmployeeCategory(MasterTypes.DOMAIN)).data,
    retry: 1,
  });

  const selectedDomainId = Form.useWatch("domainId", form);
  const { data: subdomain = [] } = useQuery({
    queryKey: ["subDomain", selectedDomainId],
    queryFn: () => dropdownApi.fetchSubDropDown(MasterTypes.SUBDOMAIN, selectedDomainId),
    enabled: !!selectedDomainId,
  });

  const onFinish = (v: PersonalDetailsFormValues) => {
    const data = validateWithZod(personalDetailsSchema, form, { ...form.getFieldsValue(true), ...v });
    if (!data) return;
    onSave({
      id: onboardingTimeline?.id,
      candidateId: onboardingTimeline?.candidateId,
      hiringRequestId: onboardingTimeline?.hiringRequestId,
      sourceId: onboardingTimeline?.sourceId,
      roleHiredFor: data.roleHiredFor,
      categoryId: onboardingTimeline?.resourceTypeId,
      dateOfJoining: data.dateOfJoining,
      onboardingManagerId: onboardingTimeline?.onboardingManagerId ? onboardingTimeline?.onboardingManagerId : userId,
      personalMailId: data.personalMailId,
      currentAddress: data.currentAddress,
      finalOnboaridngDate: data.finalOnboaridngDate,
      aadharLast4Digits: data.aadharLast4Digits,
      jobLocation: data.jobLocation,
      dob: data.dob,
      genderId: data.genderId,
      transportRequirementId: data.transportRequirementId,
      candidateCode: data.candidateCode,
      hrqId: data.hrqId,
      hiringManagerName: data.hiringManagerName,
      countryId: data.countryId ? data.countryId : null,
      phone: data.phone,
      domainId: data.domainId ? data.domainId : null,
      subDomainId: data.subDomainId ? data.subDomainId : null,
      stateId: data.stateId ? data.stateId : null,
      cityId: data.cityId ? data.cityId : null,
      candidateName: data.candidateName,
      nameAsPerAadhar: data.nameAsPerAadhar,
      pincode: data?.pincode ? data?.pincode : null,
    } as unknown as ITPCSetupFormValuesWithId);
  };

  return (
    <Form form={form} layout="vertical" initialValues={initial} onFinish={onFinish} className="mt-4">
      <Typography.Title level={5}>Personal Details</Typography.Title>
      <Row gutter={[16, 8]}>
        <Col xs={24} md={12}>
          <Form.Item name="candidateCode" label="Candidate Code">
            <Input placeholder="Enter Candidate ID" disabled />
          </Form.Item>
        </Col>
        <Col xs={24} md={12}>
          <Form.Item name="hrqId" label="HRQID">
            <Input placeholder="e.g., HRQ1101" disabled />
          </Form.Item>
        </Col>
        <Col xs={24} md={12}>
          <Form.Item name="hiringManagerName" label="Hiring Manager">
            <Input placeholder="Hiring Manager Name" disabled />
          </Form.Item>
        </Col>
        <Col xs={24} md={12}>
          <Form.Item name="sourceName" label="Source Name">
            <Input placeholder="Source Name" disabled />
          </Form.Item>
        </Col>
        <Col xs={24} md={12}>
          <Form.Item name="candidateName" label="Candidate Name">
            <Input placeholder="Candidate Name" disabled />
          </Form.Item>
        </Col>
        <Col xs={24} md={12}>
          <Form.Item name="roleHiredFor" label="Role Hired For">
            <Input placeholder="Enter designation" disabled />
          </Form.Item>
        </Col>
        <Col xs={24} md={12}>
          <Form.Item name="countryId" label="Country">
            <Select placeholder="Select Country" options={toOptions(country)} disabled />
          </Form.Item>
        </Col>
        <Col xs={24} md={12}>
          <Form.Item name="stateId" label="State">
            <Select placeholder="Select State" options={toOptions(states)} disabled />
          </Form.Item>
        </Col>
        <Col xs={24} md={12}>
          <Form.Item name="cityId" label="City">
            <Select placeholder="Select City" options={toOptions(cities)} disabled />
          </Form.Item>
        </Col>
        <Col xs={24} md={12}>
          <Form.Item name="domainId" label="Domain">
            <Select placeholder="Select domain" options={toOptions(domain)} disabled />
          </Form.Item>
        </Col>
        <Col xs={24} md={12}>
          <Form.Item name="subDomainId" label="Sub Domain">
            <Select placeholder="Select sub domain" options={toOptions(subdomain)} disabled />
          </Form.Item>
        </Col>
        <Col xs={24} md={12}>
          <Form.Item name="phone" label="Contact Number">
            <Input placeholder="Enter Phone No" disabled />
          </Form.Item>
        </Col>
        <Col xs={24} md={12}>
          <Form.Item name="personalMailId" label="Personal Mail ID">
            <Input placeholder="Enter Personal Mail ID" disabled />
          </Form.Item>
        </Col>
        <Col xs={24} md={12}>
          <Form.Item name="dateOfJoining" label="Date of Joining (initial onboarding date)" {...dateItem}>
            <DatePicker className="w-full" format="YYYY-MM-DD" disabled />
          </Form.Item>
        </Col>
        <Col xs={24} md={12}>
          <Form.Item name="onboardingManagerId" label="Onboarding Manager">
            <Input placeholder="Enter manager name" disabled />
          </Form.Item>
        </Col>
        <Col xs={24} md={12}>
          <Form.Item name="categoryId" label="Resource Category">
            <Input placeholder="Select Resource Category" disabled />
          </Form.Item>
        </Col>
        <Col xs={24} md={12}>
          <Form.Item name="jobLocation" label="Job Location" rules={zodRules(personalDetailsSchema, "jobLocation")}>
            <Input placeholder="Enter Job Location" disabled={locked} />
          </Form.Item>
        </Col>
        <Col xs={24} md={12}>
          <Form.Item name="currentAddress" label="Current Local Address" rules={zodRules(personalDetailsSchema, "currentAddress")}>
            <Input placeholder="Enter Current Local Address" disabled={locked} />
          </Form.Item>
        </Col>
        <Col xs={24} md={12}>
          <Form.Item name="finalOnboaridngDate" label="Final Onboarding Date" rules={zodRules(personalDetailsSchema, "finalOnboaridngDate")} {...dateItem}>
            <DatePicker className="w-full" format="YYYY-MM-DD" disabledDate={noPast} />
          </Form.Item>
        </Col>
        <Col xs={24} md={12}>
          <Form.Item name="aadharLast4Digits" label="Aadhar number (Only last 4 digits)" rules={zodRules(personalDetailsSchema, "aadharLast4Digits")}>
            <Input placeholder="Enter Aadhar number" maxLength={4} disabled={locked} />
          </Form.Item>
        </Col>
        <Col xs={24} md={12}>
          <Form.Item name="nameAsPerAadhar" label="Name As Per Aadhar" rules={zodRules(personalDetailsSchema, "nameAsPerAadhar")}>
            <Input placeholder="Name As Per Aadhar" disabled={locked} />
          </Form.Item>
        </Col>
        <Col xs={24} md={12}>
          <Form.Item name="pincode" label="Pincode" rules={zodRules(personalDetailsSchema, "pincode")}>
            <Input placeholder="Enter Pincode" maxLength={6} disabled={locked} />
          </Form.Item>
        </Col>
        <Col xs={24} md={12}>
          <Form.Item name="dob" label="Date of Birth (Date/Month)" rules={zodRules(personalDetailsSchema, "dob")} {...dayMonthItem}>
            <DatePicker className="w-full" format="DD/MM" placeholder="DD/MM" disabled={locked} />
          </Form.Item>
        </Col>
        <Col xs={24} md={12}>
          <Form.Item name="genderId" label="Gender" rules={zodRules(personalDetailsSchema, "genderId")}>
            <Select placeholder="Select gender" options={toOptions(gender)} showSearch optionFilterProp="label" disabled={locked} />
          </Form.Item>
        </Col>
        <Col xs={24} md={12}>
          <Form.Item name="transportRequirementId" label="Transport Requirement" rules={zodRules(personalDetailsSchema, "transportRequirementId")}>
            <Select placeholder="Select Transport Requirement" options={toOptions(categoryyesornodata)} showSearch optionFilterProp="label" disabled={locked} />
          </Form.Item>
        </Col>
      </Row>
      <Flex justify="flex-end">
        <Button type="primary" htmlType="submit">
          {onboardingTimeline?.id ? "Update" : "Submit"}
        </Button>
      </Flex>
    </Form>
  );
}

export default PersonalDetails;
