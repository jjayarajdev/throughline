"use client";
import { useEffect } from "react";
import { Button, Col, DatePicker, Form, Input, Row, Select, Space, TimePicker } from "antd";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import dayjs, { type Dayjs } from "dayjs";
import * as z from "zod";
import { toast } from "@/lib/toast";
import { validateWithZod, zodRules } from "@/lib/zodRules";
import { slotApi } from "@/services/api/slot.api";
import { dropdownApi } from "@/services/api/master";
import { MasterTypes } from "@/constants/masterTypes";
import { CandidateDetailsTypes } from "../types";
import { CandidateDrawer } from "./CandidateDrawer";

interface ScreeningSheetProps {
  isOpen: boolean;
  onClose: () => void;
  isEdit: boolean;
  selectedCandidate: CandidateDetailsTypes | null;
}

const hoursOptions = [
  { value: "2", label: "2 hrs" },
  { value: "4", label: "4 hrs" },
  { value: "8", label: "8 hrs" },
  { value: "12", label: "12 hrs" },
  { value: "18", label: "18 hrs" },
  { value: "24", label: "24 hrs" },
  { value: "48", label: "48 hrs" },
  { value: "72", label: "72 hrs" },
];
const durationOptions = [
  { value: "30", label: "30 minutes" },
  { value: "45", label: "45 minutes" },
  { value: "60", label: "1 hour" },
  { value: "90", label: "1.5 hours" },
];

const formSchema = z.object({
  date: z.string().min(1, "Date is required"),
  timeSlot: z.string().min(1, "Time is required"),
  panelMember: z.string().optional(),
  requestCreationDate: z.string().optional(),
  validityHours: z.string().min(1, "Time is required"),
  duration: z.string().min(1, "Duration is required"),
  panelName: z.array(z.object({ id: z.number(), name: z.string() })).optional(),
  comments: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

/** Form values as Ant holds them: dayjs for the pickers, panel member ids for the multi-select. */
interface FieldValues {
  date?: Dayjs | null;
  timeSlot?: Dayjs | null;
  validityHours?: string;
  duration?: string;
  panelName?: number[];
  comments?: string;
}

type PanelOption = { id: number; name: string };

/** Assign (or edit) an interview slot: date, time, validity, duration, additional panel and comments. */
export function InterviewSheet({ isOpen, onClose, isEdit, selectedCandidate }: ScreeningSheetProps) {
  const queryClient = useQueryClient();
  const [form] = Form.useForm<FieldValues>();
  const candidate = selectedCandidate as (CandidateDetailsTypes & { additionalPanel?: number[] }) | null;

  const initialValues: FieldValues = {
    date: candidate?.date ? dayjs(candidate.date) : null,
    timeSlot: candidate?.time ? dayjs(candidate.time.slice(0, 5), "HH:mm") : null,
    validityHours: candidate?.validityHours ? String(candidate.validityHours) : "2",
    duration: candidate?.duration ? String(candidate.duration) : "30",
    panelName: [],
    comments: "",
  };

  const handleClose = () => {
    form.resetFields();
    onClose();
  };

  const { mutate: createSlot, isPending } = useMutation({
    mutationKey: ["createSlot"],
    mutationFn: slotApi.assigSlot,
    onSuccess: (data) => {
      form.resetFields();
      queryClient.invalidateQueries({ queryKey: ["interviewListData"] });
      queryClient.invalidateQueries({ queryKey: ["screeningData"] });
      toast.success(data?.message || "slot assigned");
      handleClose();
    },
    onError: (error) => {
      toast.error("Failed to create Assign Slot");
      console.error("Error creating partner:", error);
    },
  });

  const { mutate: updateSlot, isPending: pendingLoading } = useMutation({
    mutationKey: ["updateSlot"],
    mutationFn: slotApi.updateassigSlot,
    onSuccess: (data) => {
      form.resetFields();
      queryClient.invalidateQueries({ queryKey: ["interviewListData"] });
      toast.success(data?.message || "slot assigned");
      handleClose();
    },
    onError: (error) => {
      console.error("Error creating partner:", error);
    },
  });

  const { data: ACTIVE_PANEL = [] } = useQuery({
    queryKey: ["ACTIVE_PANEL"],
    queryFn: () => dropdownApi.fetchDropdown(MasterTypes.ACTIVE_PANEL),
    enabled: true,
  });
  const panelOptions = ACTIVE_PANEL as PanelOption[];

  useEffect(() => {
    if (!isEdit || !candidate || panelOptions.length === 0) return;
    const ids = panelOptions.filter((p) => candidate.additionalPanel?.includes(p.id)).map((p) => p.id);
    form.setFieldValue("panelName", ids);
    return () => {
      form.resetFields(["panelName"]);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCandidate, ACTIVE_PANEL]);

  const onFinish = (values: FieldValues) => {
    const candidateValues: FormValues = {
      date: values.date ? values.date.format("YYYY-MM-DD") : "",
      timeSlot: values.timeSlot ? values.timeSlot.format("HH:mm") : "",
      panelMember: "",
      requestCreationDate: "",
      validityHours: values.validityHours ?? "",
      duration: values.duration ?? "",
      panelName: (values.panelName ?? [])
        .map((id) => panelOptions.find((p) => p.id === id))
        .filter((p): p is PanelOption => !!p)
        .map((p) => ({ id: p.id, name: p.name })),
      comments: values.comments ?? "",
    };
    const data = validateWithZod(formSchema, form, candidateValues);
    if (!data) return;
    if (!selectedCandidate?.candidateId) {
      toast.error("No candidate selected");
      return;
    }
    const payloadAssign = {
      hiringRequestId: selectedCandidate.hiringRequestId,
      candidateId: selectedCandidate.candidateId,
      date: data.date,
      time: data.timeSlot + ":00",
      partnerId: selectedCandidate.partnerId,
      currentRoundId: selectedCandidate.currentRoundId,
      isRescheduled: selectedCandidate.candidateInterviewStatusName === "Rescheduled",
      interviewStatusId: selectedCandidate.interviewStatusId ?? 0,
      panel: data.panelName?.map((p) => p.id) || [],
      duration: data.duration,
      validityHours: data.validityHours,
      hmAdditionalComments: data.comments || "",
    };
    if (isEdit) {
      updateSlot({
        ...payloadAssign,
        interviewSlotId: selectedCandidate.interviewSlotId,
        candidateInterviewStatusId: selectedCandidate.candidateInterviewStatusId,
      } as any);
    } else {
      createSlot(payloadAssign as any);
    }
  };

  const submitting = isPending || pendingLoading;

  return (
    <CandidateDrawer
      isOpen={isOpen}
      onClose={handleClose}
      candidate={selectedCandidate}
      title="Interview Details"
      footer={
        selectedCandidate ? (
          <Space style={{ display: "flex", justifyContent: "flex-end" }}>
            <Button type="primary" loading={submitting} onClick={() => form.submit()}>
              Submit
            </Button>
          </Space>
        ) : null
      }
    >
      <Form form={form} layout="vertical" className="mt-6" onFinish={onFinish} initialValues={initialValues}>
        <Row gutter={[16, 8]}>
          <Col xs={24} md={12}>
            <Form.Item name="date" label="Interview date" rules={[{ required: true, message: "Date is required" }]}>
              <DatePicker className="w-full" format="YYYY-MM-DD" disabledDate={(d) => d.isBefore(dayjs().startOf("day"))} />
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Form.Item name="timeSlot" label="Interview Time" rules={[{ required: true, message: "Time is required" }]}>
              <TimePicker className="w-full" format="HH:mm" placeholder="Select time slot" needConfirm={false} />
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Form.Item name="validityHours" label="Validity hours" rules={zodRules(formSchema, "validityHours")}>
              <Select placeholder="Select time slot" options={hoursOptions} />
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Form.Item name="duration" label="Interview duration" rules={zodRules(formSchema, "duration")}>
              <Select placeholder="Select duration" options={durationOptions} />
            </Form.Item>
          </Col>
          <Col span={24}>
            <Form.Item name="panelName" label="Additional Panel Name">
              <Select
                mode="multiple"
                allowClear
                showSearch
                optionFilterProp="label"
                placeholder="Additional panel"
                options={panelOptions.map((p) => ({ value: p.id, label: p.name }))}
              />
            </Form.Item>
          </Col>
          <Col span={24}>
            <Form.Item name="comments" label="Comments">
              <Input.TextArea rows={3} placeholder="Enter your comments here..." />
            </Form.Item>
          </Col>
        </Row>
      </Form>
    </CandidateDrawer>
  );
}
