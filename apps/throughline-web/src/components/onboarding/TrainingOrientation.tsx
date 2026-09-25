"use client";

import { useEffect, useMemo } from "react";
import * as z from "zod";
import dayjs, { type Dayjs } from "dayjs";
import { useQuery } from "@tanstack/react-query";
import { Button, Checkbox, Col, DatePicker, Divider, Flex, Form, Input, Radio, Row, Select } from "antd";
import { MasterTypes } from "@/constants/masterTypes";
import { onboarding } from "@/services/api/onboarding.api";
import { validateWithZod, zodRules } from "@/lib/zodRules";
import { TatIndicator } from "./ITPCSetup";
import { AttachmentUpload } from "./upload-fields";

const trainingBaseSchema = z.object({
  trainingSharedOn: z.string().min(1, "Training Shared On is required"),
  trainingCompleted: z.string().optional(),
  orientationDate: z.string().optional(),
  orientationCompletionDate: z.string().optional(),
  orientationStatusId: z.string().optional(),
  resumeUploaded: z
    .object({
      attachmentName: z.string().optional(),
      attachmentURL: z.string().optional(),
    })
    .optional(),
  reasonForReschedule: z.string().optional(),
  rescheduleOrientationDate: z.string().optional(),
  rcmsUploadStatusId: z.string().optional(),
  isTrainingCompleted: z.boolean().optional(),
  isOrientationCompleted: z.boolean().optional(),
  orientationSharedOn: z.string().optional(),
  releaseToOperationsDate: z.string().optional(),

  trainingModuleId: z.array(z.object({ id: z.number(), name: z.string() })).optional(),

  sessionTakenByManagerId: z.string().optional(),
  isMovedToManager: z.boolean().optional(),
});

const trainingOrientationSchema = trainingBaseSchema.superRefine((data, ctx) => {
  if (data.isTrainingCompleted) {
    if (!data.resumeUploaded?.attachmentURL) {
      ctx.addIssue({ path: ["resumeUploaded", "attachmentURL"], code: z.ZodIssueCode.custom, message: "Resume upload is required" });
    }
    if (!data.trainingModuleId || data.trainingModuleId.length === 0) {
      ctx.addIssue({ path: ["trainingModuleId"], code: z.ZodIssueCode.custom, message: "At least one training module must be selected" });
    }
  }
  if (data.isOrientationCompleted === true && data.orientationStatusId !== "65002") {
    if (!data.sessionTakenByManagerId?.trim()) {
      ctx.addIssue({ path: ["sessionTakenByManagerId"], code: z.ZodIssueCode.custom, message: "Session Taken by Managers is required" });
    }
  }
  if (data.isOrientationCompleted === false && data.orientationStatusId === "65002") {
    if (!data.reasonForReschedule?.trim()) {
      ctx.addIssue({ path: ["reasonForReschedule"], code: z.ZodIssueCode.custom, message: "Reason for Reschedule is required" });
    }
    if (!data.rescheduleOrientationDate) {
      ctx.addIssue({ path: ["rescheduleOrientationDate"], code: z.ZodIssueCode.custom, message: "Reschedule Orientation Date is required" });
    }
  }
});

type TrainingOrientationFormValues = z.infer<typeof trainingOrientationSchema>;
type ITPCSetupFormValuesWithId = TrainingOrientationFormValues & { id?: string; [key: string]: any };

interface IProps {
  onSave: (data: ITPCSetupFormValuesWithId) => void;
  onboardingTimeline: Partial<ITPCSetupFormValuesWithId>;
  assetDetails: any;
}

type Option = { id: number; name: string };
const toOptions = (list: Option[] = []) => list.map((o) => ({ value: String(o.id), label: o.name }));
const YES_NO = [
  { label: "Yes", value: true },
  { label: "No", value: false },
];

const dateItem = {
  getValueProps: (v?: string) => ({ value: v && dayjs(v).isValid() ? dayjs(v) : null }),
  normalize: (d: Dayjs | null) => (d ? d.format("YYYY-MM-DD") : ""),
};
const noPast = (d: Dayjs) => d.isBefore(dayjs(), "day");

/** Multi-select whose form value stays `[{ id, name }]` (the schema's shape). */
function ModuleSelect({ value, onChange, options, placeholder }: { value?: Option[]; onChange?: (v: Option[]) => void; options: Option[]; placeholder?: string }) {
  return (
    <Select
      mode="multiple"
      allowClear
      showSearch
      optionFilterProp="label"
      maxTagCount="responsive"
      placeholder={placeholder}
      value={value?.map((v) => v.id) ?? []}
      onChange={(ids: number[]) => onChange?.(ids.map((id) => ({ id, name: options.find((o) => o.id === id)?.name ?? "" })))}
      options={options.map((o) => ({ value: o.id, label: o.name }))}
    />
  );
}

function TrainingOrientation({ onSave, onboardingTimeline, assetDetails }: IProps) {
  const [form] = Form.useForm<TrainingOrientationFormValues>();

  const { data: TRAINING_MODULE = [] } = useQuery({
    queryKey: ["getOrientationStatus", MasterTypes.TRAINING_MODULE],
    queryFn: () => onboarding.getEmployeeCategory(MasterTypes.TRAINING_MODULE).then((res) => res.data),
    retry: 1,
  });

  const initial = useMemo<TrainingOrientationFormValues>(
    () => ({
      trainingSharedOn: onboardingTimeline?.trainingSharedOn ? onboardingTimeline?.trainingSharedOn : assetDetails?.pcConfigurationDate || "",
      trainingCompleted: onboardingTimeline?.trainingCompleted || "",
      orientationDate: onboardingTimeline?.orientationDate || "",
      orientationStatusId: onboardingTimeline?.orientationStatusId?.toString() || "",
      reasonForReschedule: onboardingTimeline?.reasonForReschedule || "",
      resumeUploaded: onboardingTimeline?.resumeUploaded || undefined,
      rcmsUploadStatusId: onboardingTimeline?.rcmsUploadStatusId?.toString() || "",
      isTrainingCompleted: !!onboardingTimeline?.trainingCompleted,
      isOrientationCompleted: onboardingTimeline?.isOrientationCompleted,
      orientationCompletionDate: onboardingTimeline?.orientationCompletionDate ? onboardingTimeline?.orientationCompletionDate : onboardingTimeline?.orientationSharedOn,
      rescheduleOrientationDate: onboardingTimeline?.rescheduleOrientationDate || "",
      orientationSharedOn: onboardingTimeline?.orientationSharedOn || "",
      releaseToOperationsDate: onboardingTimeline?.releaseToOperationsDate ? onboardingTimeline?.releaseToOperationsDate : assetDetails?.pcConfigurationDate || "",
      trainingModuleId: Array.isArray(onboardingTimeline?.trainingModuleIds)
        ? (TRAINING_MODULE as Option[]).filter((s) => onboardingTimeline?.trainingModuleIds.includes(s.id)).map((s) => ({ id: s.id, name: s.name }))
        : [],
      isMovedToManager: onboardingTimeline?.isMovedToManager,
      sessionTakenByManagerId: onboardingTimeline?.sessionTakenByManagerId?.toString() || "",
    }),
    [onboardingTimeline, assetDetails, TRAINING_MODULE]
  );

  useEffect(() => {
    if (onboardingTimeline?.id) form.setFieldsValue(initial);
  }, [onboardingTimeline, initial, form]);

  const { data: orientationStatus = [] } = useQuery({
    queryKey: ["getOrientationStatus", MasterTypes.ORIENTATION_STATUS],
    queryFn: () => onboarding.getEmployeeCategory(MasterTypes.ORIENTATION_STATUS).then((res) => res.data),
    retry: 1,
  });

  const { data: HIRING_DOMAIN_MANAGERS = [] } = useQuery({
    queryKey: ["getOrientationStatus", MasterTypes.HIRING_DOMAIN_MANAGERS],
    queryFn: () => onboarding.getEmployeeCategory(MasterTypes.HIRING_DOMAIN_MANAGERS, { roleIds: "2,9", isActive: true }).then((res) => res.data),
    retry: 1,
  });

  const { data: onboardingKit = [] } = useQuery({
    queryKey: ["getonboardingKit", MasterTypes.YES_OR_NO],
    queryFn: () => onboarding.getEmployeeCategory(MasterTypes.YES_OR_NO).then((res) => res.data),
    retry: 1,
  });

  const orientationStatusId = Form.useWatch("orientationStatusId", form);
  const selectedStatus = (orientationStatus as Option[]).find((item) => item.id === Number(orientationStatusId));
  const isRescheduled = selectedStatus?.name === "Rescheduled";
  const isTrainingCompleted = Form.useWatch("isTrainingCompleted", form);
  const isOrientationCompleted = Form.useWatch("isOrientationCompleted", form);
  const orientationSharedOn = Form.useWatch("orientationSharedOn", form);
  const rescheduleOrientationDate = Form.useWatch("rescheduleOrientationDate", form);

  useEffect(() => {
    if (isOrientationCompleted === true && !onboardingTimeline?.orientationCompletionDate) {
      form.setFieldValue("orientationCompletionDate", orientationSharedOn);
    }
  }, [isOrientationCompleted, orientationSharedOn, form, onboardingTimeline?.orientationCompletionDate]);

  useEffect(() => {
    if (isRescheduled && rescheduleOrientationDate && !isOrientationCompleted) {
      form.setFieldValue("orientationSharedOn", rescheduleOrientationDate);
    }
  }, [isRescheduled, rescheduleOrientationDate, isOrientationCompleted, form]);

  useEffect(() => {
    if (!orientationStatus?.length) return;
    const completed = (orientationStatus as Option[]).find((option) => option.name === "Completed");
    const rescheduled = (orientationStatus as Option[]).find((option) => option.name === "Rescheduled");
    if (isOrientationCompleted && completed?.id) {
      form.setFieldValue("orientationStatusId", String(completed.id));
    } else if (!isOrientationCompleted && rescheduled?.id) {
      form.setFieldValue("orientationStatusId", String(rescheduled.id));
    } else {
      form.setFieldValue("orientationStatusId", undefined);
    }
  }, [isOrientationCompleted, orientationStatus, form]);

  useEffect(() => {
    if (typeof isOrientationCompleted !== "boolean") form.setFieldValue("orientationStatusId", undefined);
  }, [isOrientationCompleted, form]);

  const onFinish = (values: TrainingOrientationFormValues) => {
    const data = validateWithZod(trainingOrientationSchema, form, values);
    if (!data) {
      // the resume issue is reported on a nested path; surface it on the upload field itself
      const parsed = trainingOrientationSchema.safeParse(values);
      if (!parsed.success) {
        const resume = parsed.error.issues.find((i) => i.path[0] === "resumeUploaded");
        if (resume) form.setFields([{ name: "resumeUploaded", errors: [resume.message] }]);
      }
      return;
    }
    onSave({
      id: onboardingTimeline?.id,
      trainingSharedOn: data.trainingSharedOn ? data.trainingSharedOn : null,
      trainingCompleted: data.trainingCompleted ? data.trainingCompleted : null,
      orientationDate: data.orientationDate ? data.orientationDate : null,
      orientationStatusId: data.orientationStatusId ? data.orientationStatusId : null,
      reasonForReschedule: data.reasonForReschedule ? data.reasonForReschedule : null,
      rcmsUploadStatusId: data.rcmsUploadStatusId ? data.rcmsUploadStatusId : null,
      isTrainingCompleted: data.isTrainingCompleted ? data.isTrainingCompleted : null,
      ...(typeof data.isOrientationCompleted === "boolean" && { isOrientationCompleted: data.isOrientationCompleted }),
      ...(typeof data.isMovedToManager === "boolean" && { isMovedToManager: data.isMovedToManager }),
      resumeUploaded: data.resumeUploaded ? data.resumeUploaded : { attachmentName: "", attachmentURL: "" },
      orientationCompletionDate: data.isOrientationCompleted ? data.orientationCompletionDate ?? null : null,
      rescheduleOrientationDate: data?.rescheduleOrientationDate ? data?.rescheduleOrientationDate : null,
      orientationSharedOn: data?.orientationSharedOn ? data?.orientationSharedOn : null,
      releaseToOperationsDate: data.releaseToOperationsDate ? data.releaseToOperationsDate : null,
      trainingModuleIds: data.trainingModuleId ? data.trainingModuleId.map((s) => s.id) : null,
      sessionTakenByManagerId: Number(data?.sessionTakenByManagerId) || null,
    } as unknown as ITPCSetupFormValuesWithId);
  };

  return (
    // preserve={false}: hidden sections drop their values on submit, as the legacy form did (shouldUnregister)
    <Form form={form} layout="vertical" initialValues={initial} onFinish={onFinish} preserve={false}>
      <Divider titlePlacement="left">Training</Divider>
      <Flex justify="flex-end" className="mb-2">
        <TatIndicator startDate={onboardingTimeline?.doj} endDate={onboardingTimeline?.trainingCompleted} />
      </Flex>
      <Row gutter={[16, 8]}>
        <Col xs={24} md={12}>
          <Form.Item name="trainingSharedOn" label="Training Shared On Date" rules={zodRules(trainingBaseSchema, "trainingSharedOn")} {...dateItem}>
            <DatePicker className="w-full" format="YYYY-MM-DD" placeholder="Training Shared On Date" disabledDate={noPast} />
          </Form.Item>
        </Col>
        <Col xs={24} md={12}>
          <Form.Item name="isTrainingCompleted" valuePropName="checked" label=" ">
            <Checkbox>Is Training Completed</Checkbox>
          </Form.Item>
        </Col>
        {isTrainingCompleted && (
          <>
            <Col xs={24} md={12}>
              <Form.Item name="trainingCompleted" label="Training Completed Date" required {...dateItem}>
                <DatePicker className="w-full" format="YYYY-MM-DD" placeholder="Training Completed Date" disabledDate={noPast} />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item name="trainingModuleId" label="Training Modules">
                <ModuleSelect options={TRAINING_MODULE} placeholder="Select Training Modules" />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item name="resumeUploaded" label="Upload Resume in Company Format">
                <AttachmentUpload preview previewName="Resume in Company Format" />
              </Form.Item>
            </Col>
          </>
        )}
      </Row>

      <Divider titlePlacement="left">Release to Operations</Divider>
      <Flex justify="flex-end" className="mb-2">
        <TatIndicator startDate={onboardingTimeline?.doj} endDate={onboardingTimeline?.releaseToOperationsDate} />
      </Flex>
      <Row gutter={[16, 8]}>
        <Col xs={24} md={12}>
          <Form.Item name="releaseToOperationsDate" label="Release To Operations Date" {...dateItem}>
            <DatePicker className="w-full" format="YYYY-MM-DD" placeholder="Release To Operations Date" disabledDate={noPast} />
          </Form.Item>
        </Col>
        <Col xs={24} md={12}>
          <Form.Item name="isMovedToManager" label="Is Resource moved to managers?">
            <Radio.Group options={YES_NO} />
          </Form.Item>
        </Col>
      </Row>

      <Divider titlePlacement="left">Orientation</Divider>
      <Flex justify="flex-end" className="mb-2">
        <TatIndicator startDate={onboardingTimeline?.doj} endDate={onboardingTimeline?.orientationCompletionDate} />
      </Flex>
      <Row gutter={[16, 8]}>
        <Col xs={24} md={12}>
          <Form.Item name="orientationSharedOn" label="Orientation Scheduled On Date" {...dateItem}>
            <DatePicker className="w-full" format="YYYY-MM-DD" placeholder="Orientation Scheduled On Date" disabledDate={noPast} />
          </Form.Item>
        </Col>
        <Col xs={24} md={12}>
          <Form.Item name="isOrientationCompleted" label="Is Orientation Completed?">
            <Radio.Group options={YES_NO} />
          </Form.Item>
        </Col>
        <Col xs={24} md={12}>
          <Form.Item name="orientationStatusId" label="Orientation Status">
            <Select placeholder="Select Orientation Status" options={toOptions(orientationStatus)} disabled />
          </Form.Item>
        </Col>
        {typeof isOrientationCompleted === "boolean" &&
          (isRescheduled ? (
            <>
              <Col xs={24} md={12}>
                <Form.Item name="reasonForReschedule" label="Reasons for Reschedule">
                  <Input placeholder="Enter reason" />
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item name="rescheduleOrientationDate" label="Reschedule Orientation Date" {...dateItem}>
                  <DatePicker className="w-full" format="YYYY-MM-DD" placeholder="Reschedule Orientation Date" disabledDate={noPast} />
                </Form.Item>
              </Col>
            </>
          ) : (
            <>
              <Col xs={24} md={12}>
                <Form.Item name="sessionTakenByManagerId" label="Session Taken by Manager">
                  <Select placeholder="Enter Manager Name" options={toOptions(HIRING_DOMAIN_MANAGERS)} showSearch optionFilterProp="label" allowClear />
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item name="orientationCompletionDate" label="Orientation Completion Date" {...dateItem}>
                  <DatePicker className="w-full" format="YYYY-MM-DD" placeholder="Orientation Completion Date" disabledDate={noPast} />
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item name="rcmsUploadStatusId" label="RCMS Upload Status">
                  <Select placeholder="RCMS Upload Status" options={toOptions(onboardingKit)} allowClear />
                </Form.Item>
              </Col>
            </>
          ))}
      </Row>

      <Flex justify="flex-end">
        <Button type="primary" htmlType="submit">
          {onboardingTimeline?.id ? "Update" : "Submit"}
        </Button>
      </Flex>
    </Form>
  );
}

export default TrainingOrientation;
