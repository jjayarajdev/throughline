"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Button, Col, DatePicker, Flex, Form, Input, Row, Select, Space, Spin, Tooltip, Typography, Upload } from "antd";
import { PaperClipOutlined } from "@ant-design/icons";
import pdfToText from "react-pdftotext";
import mammoth from "mammoth";
import * as XLSX from "xlsx";
import * as z from "zod";
import { toast } from "@/lib/toast";
import { validateWithZod, zodRules } from "@/lib/zodRules";
import { dropdownApi } from "../../services/api/master";
import { MasterTypes } from "@/constants/masterTypes";
import { hiringApi, HiringReqPayload } from "@/services/api/hiring.api";
import { AddSkillDialog } from "../dialog/AddSkillDialog";
import { useJobDetailsDropdown } from "./hooks/useJobDetailsDropdown";
import { dateItem, idNameMulti, toIdOptions, toOptions } from "./shared";

const idName = z.object({ id: z.number(), name: z.string() });

const step3Fields = z.object({
  jobDescription: z.string().min(1, "Job description is required"),
  hiringActivity: z.string().min(1, "Hiring Activity is required"),
  jobPriority: z.string().min(1, "Job Priority is required"),
  hiringDate: z.string().min(1, "Hiring Date is required"),
  resourceType: z.string().min(1, "Resource Type is required"),
  subDomain: z.string().min(1, "Sub-Domain is required"),
  domainManager: z.string().optional(),
  subDomainManager: z.string().optional(),
  primarySkills: z.array(idName).min(1, "At least one Primary skill is required"),
  secondarySkills: z.array(idName).min(1, "At least one Secondary skill is required"),
  mandatoryCertification: z.string().optional(),
  jobLevels: z.string().min(1, "Job Levels is required"),
  relevantExperience: z.string().min(1, "Relevant Experience is required"),
  totalExperience: z.string().min(1, "Total Experience is required"),
  country: z.string().min(1, "Country is required"),
  state: z.array(idName).min(1, "At least one State is required"),
  city: z.array(idName).min(1, "At least one primary city is required"),
  secondaryCity: z.array(idName).optional(),
  badgeRecId: z.string().optional(),
});

const step3Schema = (jobLevels: any[]) =>
  step3Fields.superRefine((data, ctx) => {
    const selected = jobLevels.find((j) => j.id.toString() === data.jobLevels);
    const value = Number(data.relevantExperience);

    if (selected && !isNaN(value)) {
      const min = selected.defaultExperience - selected.experienceRange;
      const max = selected.defaultExperience;

      if (value < min || value > max) {
        ctx.addIssue({
          path: ["relevantExperience"],
          code: z.ZodIssueCode.custom,
          message: `Relevant experience must be between ${min} and ${max} years for the selected job level.`,
        });
      }
    }

    if (["40001", "40014"].includes(data.resourceType) && !data.badgeRecId) {
      ctx.addIssue({
        path: ["badgeRecId"],
        code: z.ZodIssueCode.custom,
        message: "Badge Rec Id is required for this resource type.",
      });
    }
  });

type Step3Values = z.infer<typeof step3Fields>;

const defaultValues: Step3Values = {
  jobDescription: "",
  hiringActivity: "",
  jobPriority: "",
  hiringDate: "",
  resourceType: "",
  subDomain: "",
  domainManager: "",
  subDomainManager: "",
  primarySkills: [],
  secondarySkills: [],
  mandatoryCertification: "",
  jobLevels: "",
  relevantExperience: "",
  totalExperience: "",
  country: "",
  state: [],
  city: [],
  secondaryCity: [],
  badgeRecId: "",
};

interface RCMSStep3FormProps {
  onPrevious?: () => void;
  onNext?: () => void;
  domainId?: number;
}

/** Step 2 of the hiring request: job description, skills, experience and location. */
export default function JobDetailsForm({ onPrevious, onNext, domainId }: RCMSStep3FormProps) {
  const { hiring } = useParams();
  const [form] = Form.useForm<Step3Values>();
  const { hiringActivity, jobPriority } = useJobDetailsDropdown();

  const selectedCountry = Form.useWatch("country", form);
  const selectedState = Form.useWatch("state", form);
  const selectedLevel = Form.useWatch("jobLevels", form);
  const selectedSubDomain = Form.useWatch("subDomain", form);
  const resourceTypeValue = Form.useWatch("resourceType", form);
  const selectedStates = selectedState?.map((s) => Number(s.id)) || [];

  const { data: jobLevel = [] } = useQuery({ queryKey: ["jobLevel"], queryFn: () => dropdownApi.fetchDropdown(MasterTypes.JOB_LEVEL) });
  const { data: subdomain = [] } = useQuery({
    queryKey: ["subDomain", domainId],
    queryFn: () => dropdownApi.fetchSubDropDowns([Number(domainId)]),
    enabled: !!domainId,
  });
  const { data: resourceType = [] } = useQuery({ queryKey: ["resourceType"], queryFn: () => dropdownApi.fetchDropdown(MasterTypes.RESOURCE_TYPE) });
  const { data: PrimarySkills = [], isLoading: primarySkillsLoading } = useQuery({ queryKey: ["PrimarySkills"], queryFn: () => dropdownApi.fetchDropdown(MasterTypes.PRIMARY_SKILLS) });
  const { data: SecondarySkills = [], isLoading: secondarySkillsLoading } = useQuery({ queryKey: ["SecondarySkills"], queryFn: () => dropdownApi.fetchDropdown(MasterTypes.SECONDARY_SKILLS) });
  const { data: country = [] } = useQuery({ queryKey: ["country"], queryFn: () => dropdownApi.fetchDropdown(MasterTypes.COUNTRY) });
  const { data: states = [], refetch: refetchStates } = useQuery({
    queryKey: ["states", selectedCountry],
    queryFn: () => dropdownApi.fetchDropdown(MasterTypes.STATE, { countryId: parseInt(selectedCountry) }),
    enabled: !!selectedCountry,
  });
  const { data: cities = [], refetch: refetchCities } = useQuery({
    queryKey: ["cities", selectedStates],
    queryFn: () => dropdownApi.fetchSubCitys(MasterTypes.CITY, selectedStates),
    enabled: !!selectedStates,
  });

  const [maxLimit, setMaxLimit] = useState(0);
  const [loading, setLoading] = useState(false);
  const [isAddSkillOpen, setIsAddSkillOpen] = useState(false);
  const [isPrimary, setisPrimary] = useState(true);

  useEffect(() => {
    const level = (jobLevel as any[]).find((j) => j.id.toString() === selectedLevel);
    if (level) {
      setMaxLimit(level.experienceRange);
      form.setFieldValue("relevantExperience", String(level.defaultExperience));
    }
  }, [selectedLevel, form, jobLevel]);

  useEffect(() => {
    const subDomainManager = (subdomain as any[]).find((s) => s.id === Number(selectedSubDomain));
    if (subDomainManager) form.setFieldValue("subDomainManager", subDomainManager.subDomainManagerName);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedSubDomain]);

  const handleFile = async (file: File) => {
    setLoading(true);
    try {
      let text = "";
      if (file.type === "application/pdf") {
        text = await pdfToText(file);
      } else if (file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" || file.name.endsWith(".docx")) {
        const arrayBuffer = await file.arrayBuffer();
        const result = await mammoth.extractRawText({ arrayBuffer });
        text = result.value;
      } else if (file.type === "application/msword" || file.name.endsWith(".doc")) {
        toast.warning("Old .doc files have limited support. Consider using .docx for better results.");
      } else if (file.type === "text/plain" || file.name.endsWith(".txt")) {
        text = await file.text();
      } else if (file.type.includes("spreadsheetml") || file.name.endsWith(".xlsx") || file.name.endsWith(".xls")) {
        const data = await file.arrayBuffer();
        const workbook = XLSX.read(data);
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        text = XLSX.utils.sheet_to_txt(sheet);
      } else {
        toast.error("Unsupported file format. Please use PDF, Word, Excel or text files.");
        return;
      }

      form.setFieldValue("jobDescription", text);
      toast.success(`Job description extracted from ${file.name}`);
    } catch (err) {
      console.error("File parsing failed", err);
      toast.error("Failed to extract text from the file");
    } finally {
      setLoading(false);
    }
  };

  const { mutate: createJobDetails, isPending: createPending } = useMutation({
    mutationKey: ["createJobDetails"],
    mutationFn: hiringApi.createJobDetails,
    onSuccess: (data) => {
      toast.success(data?.message || "Job Details Created successfully");
      form.resetFields();
      onNext?.();
    },
    onError: (error) => {
      toast.error(error?.message || "Failed to create job details");
      console.error("Error creating partner:", error);
    },
  });

  const { data: getJobdetails } = useQuery({
    queryKey: ["getJobdetails", hiring],
    queryFn: () => hiringApi.getJobDetails(Number(hiring)),
    enabled: !!hiring,
  });

  const { mutate: updateJobdetails, isPending: UpdateLoading } = useMutation({
    mutationFn: (values: HiringReqPayload) => hiringApi.updateJobDetails(Number(getJobdetails?.id), values as any),
    onSuccess: (data) => {
      toast.success(data?.message || "Updated Successfully");
      onNext?.();
    },
    onError: (error) => {
      toast.error("Failed to update hiring");
      console.log("Error updating hiring:", error);
    },
  });

  const handleSubmit = (raw: Step3Values) => {
    const values = validateWithZod(step3Schema(jobLevel), form, raw);
    if (!values) return;
    const payload = {
      hiringRequestId: Number(hiring),
      isActive: true,
      jobDescription: values.jobDescription ?? "",
      hiringActivityId: Number(values.hiringActivity),
      jobPriorityId: Number(values.jobPriority),
      hiringDate: new Date(values.hiringDate).toISOString(),
      jobLevelId: Number(values.jobLevels),
      relevantExperience: Number(values.relevantExperience),
      totalExperience: Number(values.totalExperience),
      resourceTypeId: Number(values.resourceType),
      countryId: Number(values.country),
      stateIds: values.state.map((item) => item.id),
      primaryCityIds: values.city.map((item) => item.id),
      secondaryCityIds: values.secondaryCity ? values.secondaryCity.map((item) => item.id) : [],
      subDomainId: Number(values.subDomain),
      primarySkills: values.primarySkills.map((skill: { id: number }) => skill.id),
      secondarySkills: (values.secondarySkills || []).map((skill: { id: number }) => skill.id),
      mandatoryCertification: values.mandatoryCertification ?? "",
      id: getJobdetails?.id || 0,
      badgeRecId: values.badgeRecId ? values.badgeRecId : null,
    };
    if (getJobdetails) {
      updateJobdetails(payload as any);
    } else {
      createJobDetails(payload as any);
    }
  };

  useEffect(() => {
    if (!getJobdetails) return;
    setLoading(true);
    const setDataTimer = setTimeout(() => {
      const { countryId } = getJobdetails;
      const mapIdsToObjects = (ids: number[] = []) => (PrimarySkills as any[]).filter((skill: { id: number }) => ids.includes(skill.id));
      const mapSecondary = (ids: number[] = []) => (SecondarySkills as any[]).filter((skill: { id: number }) => ids.includes(skill.id));
      form.resetFields();
      form.setFieldsValue({
        jobDescription: getJobdetails.jobDescription || "",
        hiringActivity: String(getJobdetails.hiringActivityId),
        jobPriority: String(getJobdetails.jobPriorityId),
        hiringDate: getJobdetails.hiringDate?.split("T")[0] || "",
        resourceType: String(getJobdetails.resourceTypeId),
        domainManager: getJobdetails.domainManagerName || "",
        subDomainManager: getJobdetails.subDomainManagerName || "",
        primarySkills: mapIdsToObjects(getJobdetails.primarySkills),
        secondarySkills: mapSecondary(getJobdetails.secondarySkills),
        mandatoryCertification: getJobdetails.mandatoryCertification || "",
        jobLevels: String(getJobdetails.jobLevelId),
        relevantExperience: String(getJobdetails.relevantExperience),
        totalExperience: String(getJobdetails.totalExperience),
        country: String(countryId),
        badgeRecId: getJobdetails.badgeRecId?.toString() || "",
      });
    }, 500);
    const subDomainTimer = setTimeout(() => {
      form.setFieldValue("subDomain", String(getJobdetails?.subDomainId) || "");
      setLoading(false);
    }, 1500);

    return () => {
      clearTimeout(setDataTimer);
      clearTimeout(subDomainTimer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [getJobdetails, form, primarySkillsLoading, secondarySkillsLoading]);

  useEffect(() => {
    if (selectedCountry) {
      form.setFieldsValue({ state: [], city: [] });
      refetchStates();
    }
  }, [selectedCountry, form, refetchStates]);

  useEffect(() => {
    if (selectedState) {
      form.setFieldValue("city", []);
      refetchCities();
    }
  }, [selectedState, form, refetchCities]);

  useEffect(() => {
    const existingStateIds: number[] = getJobdetails?.stateIds || [];
    if (states.length > 0 && existingStateIds.length > 0) {
      const matchedStates = (states as any[]).filter((s) => existingStateIds.includes(s.id));
      if (matchedStates.length > 0) {
        const currentState = form.getFieldValue("state") || [];
        if (currentState.length === 0) form.setFieldValue("state", matchedStates.map((m) => ({ id: m.id, name: m.name })));
      }
    }

    const existingPrimaryCityIds: number[] = getJobdetails?.primaryCityIds || [];
    if (cities.length > 0 && existingPrimaryCityIds.length > 0) {
      const matchedCities = (cities as any[]).filter((c) => existingPrimaryCityIds.includes(c.id));
      if (matchedCities.length > 0) {
        const currentCities = form.getFieldValue("city") || [];
        if (currentCities.length === 0) form.setFieldValue("city", matchedCities.map((m) => ({ id: m.id, name: m.name })));
      }
    }

    const existingSecondaryCityIds: number[] = getJobdetails?.secondaryCityIds || [];
    if (cities.length > 0 && existingSecondaryCityIds.length > 0) {
      const matchedSecondary = (cities as any[]).filter((c) => existingSecondaryCityIds.includes(c.id));
      if (matchedSecondary.length > 0) {
        const currentSecondary = form.getFieldValue("secondaryCity") || [];
        if (currentSecondary.length === 0) form.setFieldValue("secondaryCity", matchedSecondary.map((m) => ({ id: m.id, name: m.name })));
      }
    }
  }, [states, cities, getJobdetails, form]);

  const multiSelect = (placeholder: string, options: any[], disabled?: boolean) => (
    <Select mode="multiple" labelInValue showSearch optionFilterProp="label" maxTagCount="responsive" placeholder={placeholder} options={toIdOptions(options)} disabled={disabled} />
  );

  return (
    <>
      <Form form={form} layout="vertical" onFinish={handleSubmit} initialValues={defaultValues}>
        <Spin spinning={createPending || UpdateLoading || loading} description={loading ? "Extracting…" : undefined}>
          <Flex vertical gap={16}>
            <Typography.Title level={5} style={{ margin: 0 }}>
              Job Details
            </Typography.Title>

            <Form.Item
              name="jobDescription"
              rules={zodRules(step3Fields, "jobDescription")}
              label={
                <Space>
                  Job Description (JD)
                  <Upload
                    accept=".pdf,.docx,.doc,.txt,.xlsx,.xls"
                    showUploadList={false}
                    beforeUpload={(file) => {
                      handleFile(file);
                      return false;
                    }}
                  >
                    <Tooltip title="Extract from a PDF, Word, Excel or text file">
                      <Button type="text" size="small" icon={<PaperClipOutlined />} loading={loading} />
                    </Tooltip>
                  </Upload>
                </Space>
              }
            >
              <Input.TextArea rows={5} placeholder="Enter Job Description" />
            </Form.Item>

            <Row gutter={[16, 8]}>
              <Col xs={24} md={12}>
                <Form.Item name="hiringActivity" label="Hiring Activity" rules={zodRules(step3Fields, "hiringActivity")}>
                  <Select showSearch optionFilterProp="label" placeholder="Select Hiring Activity" options={toOptions(hiringActivity)} />
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item name="jobPriority" label="Job Priority" rules={zodRules(step3Fields, "jobPriority")}>
                  <Select showSearch optionFilterProp="label" placeholder="Select Job Priority" options={toOptions(jobPriority)} />
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item name="hiringDate" label="Target Hiring Date" rules={zodRules(step3Fields, "hiringDate")} {...dateItem}>
                  <DatePicker className="w-full" format="YYYY-MM-DD" placeholder="Select Target Date" />
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item name="resourceType" label="Resource Type" rules={zodRules(step3Fields, "resourceType")}>
                  <Select showSearch optionFilterProp="label" placeholder="Select Resource Type" options={toOptions(resourceType)} />
                </Form.Item>
              </Col>
              {[40001, 40014].includes(Number(resourceTypeValue)) && (
                <Col xs={24} md={12}>
                  <Form.Item name="badgeRecId" label="Badge Rec" required rules={zodRules(step3Fields, "badgeRecId")}>
                    <Input type="number" maxLength={7} placeholder="Enter Badge Rec" />
                  </Form.Item>
                </Col>
              )}
              <Col xs={24} md={12}>
                <Form.Item name="subDomain" label="Sub-Domain" rules={zodRules(step3Fields, "subDomain")}>
                  <Select showSearch optionFilterProp="label" placeholder="Select Sub-Domain" options={toOptions(subdomain)} />
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item name="subDomainManager" label="Sub-Domain Manager" required rules={zodRules(step3Fields, "subDomainManager")}>
                  <Input placeholder="Sub-Domain Manager Name" disabled />
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Flex gap={8} align="flex-start">
                  <Form.Item name="primarySkills" label="Primary Skills" rules={zodRules(step3Fields, "primarySkills")} className="flex-1" {...idNameMulti}>
                    {multiSelect("Select Primary Skills", PrimarySkills)}
                  </Form.Item>
                  <Form.Item label=" ">
                    <Button
                      onClick={() => {
                        setisPrimary(true);
                        setIsAddSkillOpen(true);
                      }}
                    >
                      Add Skill
                    </Button>
                  </Form.Item>
                </Flex>
              </Col>
              <Col xs={24} md={12}>
                <Flex gap={8} align="flex-start">
                  <Form.Item name="secondarySkills" label="Secondary Skills" rules={zodRules(step3Fields, "secondarySkills")} className="flex-1" {...idNameMulti}>
                    {multiSelect("Select Secondary Skills", SecondarySkills)}
                  </Form.Item>
                  <Form.Item label=" ">
                    <Button
                      onClick={() => {
                        setisPrimary(false);
                        setIsAddSkillOpen(true);
                      }}
                    >
                      Add Skill
                    </Button>
                  </Form.Item>
                </Flex>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item name="mandatoryCertification" label="Mandatory Certification" required rules={zodRules(step3Fields, "mandatoryCertification")}>
                  <Input placeholder="Enter Mandatory Certification" />
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item name="jobLevels" label="Job Levels" rules={zodRules(step3Fields, "jobLevels")}>
                  <Select showSearch optionFilterProp="label" placeholder="Select Job Level" options={toOptions(jobLevel)} />
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item name="relevantExperience" label="Relevant Experience" rules={zodRules(step3Fields, "relevantExperience")}>
                  <Input placeholder="Enter Relevant Experience" max={maxLimit} />
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item name="totalExperience" label="Total Experience" rules={zodRules(step3Fields, "totalExperience")}>
                  <Input placeholder="Enter Total Experience" />
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item name="country" label="Country" rules={zodRules(step3Fields, "country")}>
                  <Select showSearch optionFilterProp="label" placeholder="Select Country" options={toOptions(country)} />
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item name="state" label="State" rules={zodRules(step3Fields, "state")} {...idNameMulti}>
                  {multiSelect("Select States", states)}
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item name="city" label="City" rules={zodRules(step3Fields, "city")} {...idNameMulti}>
                  {multiSelect("Select Primary Citys", cities)}
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item name="secondaryCity" label="Secondary City" rules={zodRules(step3Fields, "secondaryCity")} {...idNameMulti}>
                  {multiSelect("Select Secondary Citys", cities)}
                </Form.Item>
              </Col>
            </Row>

            <Flex justify="space-between" wrap gap={8}>
              <Button onClick={onPrevious}>Previous</Button>
              <Space>
                <Button type="primary" htmlType="submit" loading={UpdateLoading || createPending}>
                  {UpdateLoading || createPending ? (getJobdetails ? "Updating..." : "Saving...") : getJobdetails ? "Update" : "Save"}
                </Button>
                <Button onClick={onNext}>Next</Button>
              </Space>
            </Flex>
          </Flex>
        </Spin>
      </Form>
      <AddSkillDialog isOpen={isAddSkillOpen} onClose={() => setIsAddSkillOpen(false)} isPrimary={isPrimary} masterType={MasterTypes.SKILL} />
    </>
  );
}
