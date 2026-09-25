"use client";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Button, Col, DatePicker, Flex, Form, Input, InputNumber, Radio, Row, Select, Spin } from "antd";
import * as z from "zod";
import { toast } from "@/lib/toast";
import { validateWithZod, zodRules } from "@/lib/zodRules";
import { Hiring, hiringApi } from "../../services/api/hiring.api";
import { useHiringStore } from "@/store/useHiringStore";
import { useUserStore } from "@/store/userStore";
import { useHiringDropdownData } from "./hooks/useHiringFormData";
import { RCMSValidationForm } from "./RCMSValidationForm";
import { getHiringType } from "./types";
import { dateItem, toOptions } from "./shared";

const formSchema = z.object({
  jobTitle: z.string().min(1, "Role Hired For is required"),
  rmOwnerName: z.string().optional(),
  hiringManagerName: z.string().min(1, "Hiring Manager is required"),
  hrqId: z.string(),
  rcmsProjectId: z.string().min(1, "RCMS Project ID is required"),
  rcMsResourceRequestId: z.string().min(1, "RCMS Resource Request ID is required"),
  projectName: z.string().min(1, "Project Name is required"),
  businessId: z.string().min(1, "businessId is required"),
  requestStartDate: z.string().min(1, "Request Start Date is required"),
  requestCreationDate: z.string().min(1, "Req Creation Date is required"),
  hiringTypeId: z.string().min(1, "Hiring Type is required"),
  projectDurationMonths: z.string().min(1, "Hiring Type is required"),
  hiringStatusName: z.string().optional(),
  isMultiplePositions: z.boolean(),
  numberOfPositions: z.coerce.number().min(1, "At least one position required"),
  approverEmail: z.string().optional(),
  employeeId: z.string().optional(),
  referredHrqId: z.string().optional(),
  domainId: z.string().min(1, "domain  is required"),
  domainManager: z.string().optional(),
  recordTypeId: z.number().optional(),
  hiringMangerId: z.number().optional(),
});

type FormValues = z.infer<typeof formSchema>;

const defaultValues: FormValues = {
  jobTitle: "",
  rmOwnerName: "",
  hiringManagerName: "",
  hrqId: "",
  rcmsProjectId: "",
  rcMsResourceRequestId: "",
  projectName: "",
  businessId: "",
  requestStartDate: "",
  requestCreationDate: new Date().toISOString().split("T")[0],
  projectDurationMonths: "",
  hiringTypeId: "",
  hiringStatusName: "New",
  isMultiplePositions: false,
  numberOfPositions: 1,
  approverEmail: "",
  employeeId: "",
  referredHrqId: "",
  domainManager: "",
  domainId: "",
  recordTypeId: 23001,
  hiringMangerId: NaN,
};

interface RCMSFormProps {
  onNext?: () => void;
  onPrevious?: () => void;
  HiringDatabyid: getHiringType;
  isLoading: boolean;
}

/** Step 1 of the hiring request: RCMS validation (create mode) and the request header fields. */
export default function HiringForm({ HiringDatabyid, isLoading }: RCMSFormProps) {
  const { business, hiringType, domain } = useHiringDropdownData();
  const { userId } = useUserStore();
  const { setJobTitle } = useHiringStore();
  const pathname = usePathname();
  const router = useRouter();
  const isAddMode = pathname.includes("create-hiring");
  const [form] = Form.useForm<FormValues>();
  const [valdate, setValidate] = useState(false);

  const isMultiplePositions = Form.useWatch("isMultiplePositions", form);
  const isemployeeId = Form.useWatch("hiringTypeId", form);
  const domainId = Form.useWatch("domainId", form);

  const { data: BeteamApprover } = useQuery({
    queryKey: ["BeTeamApprover"],
    queryFn: () => hiringApi.getBETeamApprover(),
    enabled: isAddMode,
  });

  useEffect(() => {
    if (BeteamApprover) form.setFieldValue("approverEmail", BeteamApprover?.email);
  }, [BeteamApprover, form]);

  useEffect(() => {
    if (!isAddMode && HiringDatabyid) {
      setValidate(true);
      setJobTitle(HiringDatabyid.jobTitle);
      const data = HiringDatabyid as any;
      form.resetFields();
      form.setFieldsValue({
        jobTitle: data?.jobTitle,
        rmOwnerName: data?.rmOwnerName || "--",
        hiringManagerName: data?.hiringManagerName || "--",
        hrqId: data?.hrqId,
        rcmsProjectId: data?.rcMsProjectId,
        rcMsResourceRequestId: data?.rcMsResourceRequestId,
        projectName: data?.projectName,
        businessId: String(data?.businessId),
        requestStartDate: data?.requestStartDate,
        requestCreationDate: data?.requestCreationDate,
        hiringTypeId: String(data?.hiringTypeId) || "",
        projectDurationMonths: String(data?.projectDurationMonths) || "",
        hiringStatusName: String(data?.hiringStatusName) || "",
        isMultiplePositions: data?.isMultiplePositions || false,
        numberOfPositions: Number(data?.numberOfPositions) || 1,
        approverEmail: data?.approverEmail || "",
        employeeId: data?.employeeId || "",
        referredHrqId: data?.referredHrqId || "",
        domainId: String(data?.domainId) || "",
        domainManager: String(data?.domainManager) || "",
        hiringMangerId: data?.hiringMangerId || "",
      } as any);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form, HiringDatabyid, isAddMode]);

  const handleValidate = async (data: Hiring, mode: string) => {
    const recordTypeId = mode === "replica" ? 23002 : 23001;
    if (!data) return;
    setValidate(true);
    form.resetFields();
    form.setFieldsValue({
      jobTitle: data?.jobTitle || "NA",
      rmOwnerName: data?.rmOwnerName || "Na",
      hiringManagerName: data.hiringManagerName != undefined ? String(data.hiringManagerName) : "",
      hrqId: mode === "replica" ? "NA" : data?.hrqId || "NA",
      businessId: data.businessId != undefined ? String(data.businessId) : "",
      rcmsProjectId: data?.rcMsProjectId || "",
      rcMsResourceRequestId: data?.rcMsResourceRequestId || "NA",
      projectName: data?.projectName,
      requestStartDate: new Date().toISOString().split("T")[0],
      requestCreationDate: new Date().toISOString().split("T")[0],
      isMultiplePositions: data?.isMultiplePositions,
      numberOfPositions: Number(data?.numberOfPositions) || 1,
      approverEmail: data?.approverEmail || "",
      hiringTypeId: data.hiringTypeId != undefined ? String(data.hiringTypeId) : "",
      projectDurationMonths: data.projectDurationMonths != undefined ? String(data.projectDurationMonths) : "",
      hiringStatusName: "New",
      employeeId: data?.employeeId || "",
      referredHrqId: data?.hrqId || "",
      domainId: (data as any).domainId != undefined ? String((data as any).domainId) : "",
      recordTypeId,
      hiringMangerId: data?.hiringMangerId,
    } as any);
  };

  const { mutate: createHiringRequest, isPending } = useMutation({
    mutationKey: ["createHiringRequest"],
    mutationFn: hiringApi.createHiring,
    onSuccess: (data) => {
      setJobTitle(data.data.jobTitle);
      setValidate(false);
      form.resetFields();
      toast.success(data?.message || "REC Created successfully || moved to Hiring Bin");
      router.back();
    },
    onError: (error) => {
      toast.error("Failed to create hiring");
      console.error("Error creating hiring:", error);
    },
  });

  const handleSave = async () => {
    try {
      await form.validateFields();
    } catch {
      toast.error("Please fill all required fields correctly.");
      return;
    }
    const values = form.getFieldsValue(true) as FormValues;
    if (!validateWithZod(formSchema, form, values)) {
      toast.error("Please fill all required fields correctly.");
      return;
    }
    createHiringRequest({ ...values, requestorId: userId, betApproverId: BeteamApprover?.userId } as any);
  };

  useEffect(() => {
    const domainManager = (domain as { id: number; domainManagerName?: string }[]).find((d) => d.id === Number(domainId));
    if (domainManager) form.setFieldValue("domainManager", String(domainManager.domainManagerName));
  }, [domainId, domain, form]);

  return (
    <Flex vertical gap={16}>
      {isAddMode && <RCMSValidationForm setValidate={setValidate} onValidationSuccess={handleValidate} />}
      <Form form={form} layout="vertical" initialValues={defaultValues}>
        {valdate && (
        <Spin spinning={isPending || isLoading}>
          <Row gutter={[16, 8]}>
            <Col xs={24} md={12}>
              <Form.Item name="jobTitle" label="Role Hired For" rules={zodRules(formSchema, "jobTitle")}>
                <Input placeholder="Title Name" disabled={!isAddMode} />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item name="rmOwnerName" label="RM Owner" required rules={zodRules(formSchema, "rmOwnerName")}>
                <Input placeholder="Owner" disabled />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item name="hiringManagerName" label="Hiring Manager" rules={zodRules(formSchema, "hiringManagerName")}>
                <Input placeholder="Name" disabled />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item name="hrqId" label="HRQ ID" rules={zodRules(formSchema, "hrqId")}>
                <Input placeholder="hrqId" disabled />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item name="rcmsProjectId" label="RCMS Project ID" rules={zodRules(formSchema, "rcmsProjectId")}>
                <Input disabled />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item name="rcMsResourceRequestId" label="RCMS Resource Request ID" rules={zodRules(formSchema, "rcMsResourceRequestId")}>
                <Input disabled />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item name="projectName" label="Project Name" rules={zodRules(formSchema, "projectName")}>
                <Input disabled={!isAddMode} />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item name="businessId" label="Business Unit" rules={zodRules(formSchema, "businessId")}>
                <Select showSearch optionFilterProp="label" placeholder="Select Business" options={toOptions(business)} disabled={!isAddMode} />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item name="requestStartDate" label="Request Start Date" rules={zodRules(formSchema, "requestStartDate")} {...dateItem}>
                <DatePicker className="w-full" format="YYYY-MM-DD" disabled={!isAddMode} />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item name="requestCreationDate" label="Req Creation Date" rules={zodRules(formSchema, "requestCreationDate")} {...dateItem}>
                <DatePicker className="w-full" format="YYYY-MM-DD" disabled />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item name="hiringTypeId" label="Hiring Type" rules={zodRules(formSchema, "hiringTypeId")}>
                <Select showSearch optionFilterProp="label" placeholder="Select Hiring Type" options={toOptions(hiringType)} disabled={!isAddMode} />
              </Form.Item>
            </Col>
            {isemployeeId == "13003" && (
              <>
                <Col xs={24} md={12}>
                  <Form.Item name="employeeId" label="Employee ID" rules={zodRules(formSchema, "employeeId")}>
                    <Input placeholder="Enter employee id" disabled={!isAddMode} />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item name="referredHrqId" label="Referred HRQ id" rules={zodRules(formSchema, "referredHrqId")}>
                    <Input placeholder="Enter HRQ id" disabled={!isAddMode} />
                  </Form.Item>
                </Col>
              </>
            )}
            <Col xs={24} md={12}>
              <Form.Item name="projectDurationMonths" label="Project Duration (Months)" rules={zodRules(formSchema, "projectDurationMonths")}>
                <Input type="number" placeholder="Enter Duration" disabled={!isAddMode} />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item name="hiringStatusName" label="Status" required rules={zodRules(formSchema, "hiringStatusName")}>
                <Input placeholder="New" disabled />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item name="isMultiplePositions" label="Position Category">
                <Radio.Group
                  optionType="button"
                  buttonStyle="solid"
                  disabled={!isAddMode}
                  options={[
                    { value: false, label: "Single" },
                    { value: true, label: "Multiple" },
                  ]}
                />
              </Form.Item>
            </Col>
            {isMultiplePositions && (
              <Col xs={24} md={12}>
                <Form.Item name="numberOfPositions" label="No. of Positions" rules={zodRules(formSchema, "numberOfPositions")}>
                  <InputNumber className="w-full" min={1} precision={0} placeholder="0" disabled={!isAddMode} />
                </Form.Item>
              </Col>
            )}
            <Col xs={24} md={12}>
              <Form.Item name="domainId" label="Domain" rules={zodRules(formSchema, "domainId")}>
                <Select showSearch optionFilterProp="label" placeholder="Select Type" options={toOptions(domain)} disabled={!isAddMode} />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item name="domainManager" label="Domain Manager" required rules={zodRules(formSchema, "domainManager")}>
                <Input placeholder="*****" disabled />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item label="BE Team Approver">
                <Input disabled value={isAddMode ? `${BeteamApprover?.firstName ?? ""} ${BeteamApprover?.lastName ?? ""}` : HiringDatabyid?.betApproverName ?? ""} />
              </Form.Item>
            </Col>
          </Row>
          {isAddMode && (
            <Flex justify="flex-end" className="pt-4">
              <Button type="primary" loading={isPending} onClick={handleSave}>
                {isPending ? "submitting..." : "Submit"}
              </Button>
            </Flex>
          )}
        </Spin>
        )}
      </Form>
    </Flex>
  );
}
