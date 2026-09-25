"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button, Card, Checkbox, Col, Divider, Flex, Form, Input, Row, Select, Space, Spin, Table, Tooltip, Typography } from "antd";
import type { ColumnsType } from "antd/es/table";
import { EditOutlined, PlusOutlined } from "@ant-design/icons";
import * as z from "zod";
import { toast } from "@/lib/toast";
import { validateWithZod, zodRules } from "@/lib/zodRules";
import { MasterTypes } from "@/constants/masterTypes";
import { dropdownApi } from "@/services/api/master";
import { hiringApi, InterviewRoundPayload } from "@/services/api/hiring.api";
import { HiringSummaryProps } from "./types";
import { idNameMulti, toIdOptions, toOptions } from "./shared";

const idName = z.object({ id: z.number(), name: z.string() });

const roundSchema = z.object({
  round: z.coerce.string().min(1, "At least one round required").max(10, "Maximum 10 rounds allowed"),
  roundName: z.string().min(1, "Round Name is required"),
  panel: z.array(idName).min(1, "At least one panel member required"),
  mode: z.string().min(1, "mode is required"),
  comments: z.string().optional(),
  screeningCap: z.string().optional(),
  panelAvailability: z.array(z.string()).min(1, "Please select at least one day"),
  addCandidate: z.boolean(),
  candidates: z.array(idName).optional(),
  addFeedback: z.boolean(),
  feedbackCategory: z.string().optional(),
  feedbackCriteria: z.array(idName).optional(),
  skipScreening: z.boolean().optional(),
});

type RoundValues = z.infer<typeof roundSchema>;

const defaultValues: RoundValues = {
  round: "1",
  roundName: "",
  panel: [],
  mode: "",
  comments: "",
  screeningCap: "30",
  panelAvailability: [],
  addCandidate: false,
  candidates: [],
  addFeedback: false,
  feedbackCategory: "",
  feedbackCriteria: [],
  skipScreening: false,
};

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

/** Toggle-button day picker (Form.Item-controlled: value / onChange). */
function DaySelector({ value = [], onChange }: { value?: string[]; onChange?: (v: string[]) => void }) {
  return (
    <Space wrap>
      {DAYS.map((day) => {
        const selected = value.includes(day);
        return (
          <Button key={day} type={selected ? "primary" : "default"} onClick={() => onChange?.(selected ? value.filter((d) => d !== day) : [...value, day])}>
            {day}
          </Button>
        );
      })}
    </Space>
  );
}

interface InterviewRoundFormProps {
  onNext?: () => void;
  onPrevious?: () => void;
  hiringData: HiringSummaryProps;
}

interface Option {
  id: number;
  name: string;
  isActive?: boolean;
}

interface RoundRow {
  modeOfInterviewName: string;
  roundNameName: string;
  id: number;
  roundNumber: number;
  panel: number[];
  modeOfInterview: number;
  comments?: string;
  roundNameId: number;
  panelNames: string;
}

/** Step 4 of the hiring request: the interview rounds, their panels and feedback criteria. */
export default function InterviewRoundForm({ onPrevious }: InterviewRoundFormProps) {
  const { hiring } = useParams();
  const queryClient = useQueryClient();
  const [form] = Form.useForm<RoundValues>();
  const [showForm, setShowForm] = useState(false);
  const [editMode, setEditmode] = useState(false);
  const [editingRoundId, setEditingRoundId] = useState<number | null>(null);

  const addCandidate = Form.useWatch("addCandidate", form);
  const addFeedback = Form.useWatch("addFeedback", form);
  const roundName = Form.useWatch("roundName", form);
  const roundNumber = Form.useWatch("round", form);
  const skipScreening = Form.useWatch("skipScreening", form);
  const selectedFeedbackCategory = Form.useWatch("feedbackCategory", form);

  const { data: interviewRoundName = [] } = useQuery({ queryKey: ["interviewRound"], queryFn: () => dropdownApi.fetchDropdown(MasterTypes.INTERVIEW_ROUND) });
  const { data: interviewMode = [] } = useQuery({
    queryKey: ["interviewMode", roundName],
    queryFn: () => dropdownApi.fetchInterviewMode(MasterTypes.INTERVIEW_MODE, roundName),
    enabled: !!roundName,
  });
  const { data: ACTIVE_PANEL = [] } = useQuery({ queryKey: ["ACTIVE_PANEL"], queryFn: () => dropdownApi.fetchDropdown(MasterTypes.ACTIVE_PANEL), enabled: true });
  const { data: feedBackCategory = [] } = useQuery({ queryKey: ["feedBackCategory"], queryFn: () => dropdownApi.fetchDropdown(MasterTypes.FEEDBACK_CATEGORY) });
  const {
    data: feedbackCriteria = [],
    refetch: refetchCriteria,
    isLoading,
  } = useQuery({
    queryKey: ["feedbackCriteria", selectedFeedbackCategory],
    queryFn: () => dropdownApi.fetchDropdown(Number(selectedFeedbackCategory)),
    enabled: !!selectedFeedbackCategory,
  });
  const { data: getCandidates } = useQuery({
    queryKey: ["getCandidates", hiring],
    queryFn: () => hiringApi.getCandidates(String(hiring)),
    enabled: !!hiring,
    select: (raw: Array<any>): Option[] => raw.map((c) => ({ id: c.id, name: c.candidateCode, isActive: true })) || [],
  });
  const { data: getInterviewRounds } = useQuery({
    queryKey: ["getInterviewRounds", hiring],
    queryFn: () => hiringApi.getInterviewRounds(Number(hiring)),
    enabled: !!hiring,
  });

  const { mutate: addInterviewRounds, isPending } = useMutation({
    mutationKey: ["addInterviewRounds"],
    mutationFn: hiringApi.createInterviewRounds,
    onSuccess: (data) => {
      form.resetFields();
      setShowForm(false);
      toast.success(data?.message || "Interview rounds added successfully");
      queryClient.invalidateQueries({ queryKey: ["getInterviewRounds"] });
    },
    onError: (error) => {
      toast.error(error?.message || "Failed to create partner");
      console.error("Error creating partner:", error);
    },
  });

  const { mutate: updateInterviewRound, isPending: UpdateLoading } = useMutation({
    mutationFn: (values: InterviewRoundPayload) => hiringApi.updateInterviews(Number(editingRoundId), values),
    onSuccess: (data) => {
      form.resetFields();
      toast.success(data?.message || "");
      setShowForm(false);
      setEditmode(false);
      queryClient.invalidateQueries({ queryKey: ["getInterviewRounds", hiring] });
    },
    onError: (error) => {
      toast.error("Failed to update hiring");
      console.log("Error updating hiring:", error);
    },
  });

  const onSubmit = (raw: RoundValues) => {
    const values = validateWithZod(roundSchema, form, raw);
    if (!values) return;
    const transformedPayload = {
      id: editMode ? editingRoundId : 0,
      hiringRequestId: Number(hiring),
      roundNumber: Number(values.round),
      roundNameId: Number(values.roundName),
      panel: values.panel.map((p: any) => p.id),
      modeOfInterview: Number(values.mode),
      comments: values.comments || "",
      isAddSpecificCandidates: values.addCandidate || false,
      candidates: values?.candidates?.map((skill: { id: number }) => skill.id),
      addFeedbackCritria: values.addFeedback || false,
      categoryId: Number(values.feedbackCategory),
      feedbackCritriaOptions: values.addFeedback
        ? values.feedbackCriteria?.map((c: any) => ({
            criteriaOptionId: c.id,
            name: c.name,
            interviewRoundId: editMode ? editingRoundId : 0,
          }))
        : [],
      screeningCap: Number(values.screeningCap),
      availableDays: values.panelAvailability,
      skipScreening: values.skipScreening || false,
    } as unknown as InterviewRoundPayload;
    if (editMode) {
      updateInterviewRound(transformedPayload);
    } else {
      addInterviewRounds(transformedPayload);
    }
  };

  useEffect(() => {
    if (selectedFeedbackCategory) form.setFieldValue("feedbackCriteria", []);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedFeedbackCategory]);

  const onEdit = (round: any) => {
    setShowForm(true);
    setEditmode(true);
    setEditingRoundId(round?.id);

    const data = Array.isArray(getCandidates) && Array.isArray(round?.candidates) ? getCandidates.filter((item) => round.candidates.includes(item.id)) : [];
    const panelOptions = Array.isArray(round.panel) ? (ACTIVE_PANEL as Option[]).filter((item) => round.panel.includes(item.id)) : [];

    const idSet = new Set((round?.feedbackCritriaOptions ?? []).map((x: any) => x.criteriaOptionId));
    refetchCriteria().then((res) => {
      const Criteria = Array.isArray(res.data) ? res.data : [];
      const selectedOpts = Criteria.filter((opt: any) => idSet.has(opt.id));
      form.setFieldValue("feedbackCriteria", selectedOpts);
    });

    form.resetFields();
    form.setFieldsValue({
      round: String(round.roundNumber),
      roundName: String(round.roundNameId),
      panel: panelOptions,
      mode: String(round.modeOfInterview),
      comments: round.comments || "",
      addCandidate: round.isAddSpecificCandidates,
      candidates: data,
      addFeedback: round.addFeedbackCritria,
      feedbackCategory: String(round.categoryId || ""),
      skipScreening: round?.skipScreening || false,
      panelAvailability: round.availableDays || [],
      screeningCap: String(round.screeningCap),
    });
  };

  const handleAddNew = () => {
    form.setFieldValue("roundName", "");
    setShowForm(true);
    form.setFieldValue("round", String((getInterviewRounds?.length ?? 0) + 1));
  };

  function filterStages(): { id: number; name: string; sectionId: number }[] {
    const rounds = interviewRoundName as { id: number; name: string; sectionId: number }[];
    if (roundNumber == "1") return rounds.filter((item) => (skipScreening ? item.sectionId === 2 : item.sectionId === 1));
    return rounds.filter((item) => item.sectionId === 3);
  }

  useEffect(() => {
    if (roundNumber === "1" && skipScreening === false) {
      const stages = filterStages();
      if (stages.length > 0) form.setFieldValue("roundName", stages[0].id?.toString());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roundNumber, skipScreening, interviewRoundName]);

  const handleCancel = () => {
    form.resetFields();
    setEditmode(false);
    setShowForm(false);
  };

  const columns: ColumnsType<RoundRow> = [
    { key: "roundNumber", title: "Round", dataIndex: "roundNumber", width: 90 },
    { key: "panelNames", title: "Panel", dataIndex: "panelNames" },
    { key: "modeOfInterviewName", title: "Mode of Interview", dataIndex: "modeOfInterviewName" },
    { key: "comments", title: "Comments", dataIndex: "comments", render: (v: string) => v || "-" },
    { key: "roundName", title: "Round Name", render: (_: unknown, r) => (interviewRoundName as { id: number; name: string }[]).find((item) => item.id == r.roundNameId)?.name },
    {
      key: "actions",
      title: "Actions",
      width: 110,
      render: (_: unknown, r) => (
        <Tooltip title="Edit Round">
          <Button size="small" icon={<EditOutlined />} onClick={() => onEdit(r)}>
            Edit
          </Button>
        </Tooltip>
      ),
    },
  ];

  return (
    <Flex vertical gap={16}>
      <Form form={form} layout="vertical" onFinish={onSubmit} initialValues={defaultValues}>
        <Spin spinning={isPending || UpdateLoading}>
          <Flex vertical gap={16}>
            <Flex justify="space-between" align="center">
              <Typography.Title level={5} style={{ margin: 0 }}>
                Interview Round
              </Typography.Title>
              {!showForm && (
                <Button type="primary" size="small" icon={<PlusOutlined />} onClick={handleAddNew}>
                  Add
                </Button>
              )}
            </Flex>

            {showForm && (
              <Card size="small">
                <Row gutter={[16, 8]}>
                  {roundNumber == "1" && (
                    <Col span={24}>
                      <Form.Item name="skipScreening" valuePropName="checked" style={{ marginBottom: 0 }}>
                        <Checkbox>Do you want to Skip screening round?</Checkbox>
                      </Form.Item>
                      <Divider style={{ marginBlock: 12 }} />
                    </Col>
                  )}
                  <Col xs={24} md={12}>
                    <Form.Item name="round" label="Round Number" rules={zodRules(roundSchema, "round")}>
                      <Input placeholder="enter" disabled />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={12}>
                    <Form.Item name="roundName" label="Round Name" rules={zodRules(roundSchema, "roundName")}>
                      <Select showSearch optionFilterProp="label" placeholder="Name of the round" options={toOptions(filterStages())} />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={12}>
                    <Form.Item name="panel" label="Panel Name" rules={zodRules(roundSchema, "panel")} {...idNameMulti}>
                      <Select mode="multiple" labelInValue showSearch optionFilterProp="label" maxTagCount="responsive" placeholder="enter panel members" options={toIdOptions(ACTIVE_PANEL)} />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={12}>
                    <Form.Item name="mode" label="Mode of Interview" rules={zodRules(roundSchema, "mode")}>
                      <Select showSearch optionFilterProp="label" placeholder="Select mode" disabled={!roundName} options={toOptions(interviewMode)} />
                    </Form.Item>
                  </Col>
                  {!skipScreening && roundNumber == "1" && (
                    <Col xs={24} md={12}>
                      <Form.Item name="screeningCap" label="Screening Cap" rules={zodRules(roundSchema, "screeningCap")}>
                        <Input type="number" placeholder="enter screening cap" />
                      </Form.Item>
                    </Col>
                  )}
                  <Col span={24}>
                    <Form.Item name="panelAvailability" label="Panel Availability" rules={zodRules(roundSchema, "panelAvailability")}>
                      <DaySelector />
                    </Form.Item>
                  </Col>
                  <Col span={24}>
                    <Form.Item name="comments" rules={zodRules(roundSchema, "comments")}>
                      <Input.TextArea rows={3} placeholder="Comments" />
                    </Form.Item>
                  </Col>
                  <Col span={24}>
                    <Form.Item name="addCandidate" valuePropName="checked">
                      <Checkbox disabled={editMode}>Add Specific Candidates for this round ?</Checkbox>
                    </Form.Item>
                    {addCandidate && (
                      <Form.Item name="candidates" label="Candidate Info" rules={zodRules(roundSchema, "candidates")} {...idNameMulti}>
                        <Select mode="multiple" labelInValue showSearch optionFilterProp="label" maxTagCount="responsive" placeholder="Select candidate codes" disabled={editMode} options={toIdOptions(getCandidates || [])} />
                      </Form.Item>
                    )}
                    <Form.Item name="addFeedback" valuePropName="checked">
                      <Checkbox>Do you want to add feedback criteria?</Checkbox>
                    </Form.Item>
                    {addFeedback && (
                      <>
                        <Form.Item name="feedbackCategory" label="Category" rules={zodRules(roundSchema, "feedbackCategory")}>
                          <Select showSearch optionFilterProp="label" placeholder="Select feedback category" options={toOptions(feedBackCategory)} />
                        </Form.Item>
                        {!!selectedFeedbackCategory &&
                          (isLoading ? (
                            <Spin size="small" />
                          ) : (
                            <Form.Item name="feedbackCriteria" label="Feedback Criteria" required rules={zodRules(roundSchema, "feedbackCriteria")} {...idNameMulti}>
                              <Select mode="multiple" labelInValue showSearch optionFilterProp="label" maxTagCount="responsive" placeholder="Select feedback criteria" options={toIdOptions(feedbackCriteria)} />
                            </Form.Item>
                          ))}
                      </>
                    )}
                  </Col>
                </Row>
              </Card>
            )}

            <Flex justify="space-between" wrap gap={8}>
              <Button onClick={onPrevious}>Previous</Button>
              {showForm && (
                <Space>
                  <Button type="primary" htmlType="submit" loading={isPending || UpdateLoading}>
                    {isPending || UpdateLoading ? (editMode ? "Updating..." : "Saving...") : editMode ? "Update" : "Save"}
                  </Button>
                  <Button onClick={handleCancel}>Cancel</Button>
                </Space>
              )}
            </Flex>
          </Flex>
        </Spin>
      </Form>

      <Table<RoundRow> size="middle" rowKey="id" columns={columns} dataSource={(getInterviewRounds as RoundRow[]) ?? []} pagination={false} scroll={{ x: "max-content" }} />
    </Flex>
  );
}
