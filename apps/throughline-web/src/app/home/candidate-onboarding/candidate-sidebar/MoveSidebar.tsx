"use client";

import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import dayjs, { type Dayjs } from "dayjs";
import { Button, Col, DatePicker, Drawer, Form, Input, Modal, Row, Select, Space, Table, Typography } from "antd";
import { onboarding } from "@/services/api/onboarding.api";
import { useUserStore } from "@/store/userStore";
import { dropdownApi } from "@/services/api/master";
import { toast } from "@/lib/toast";
import { MasterTypes } from "@/constants/masterTypes";
import { formatDate } from "@/helpers/helper";
import { CommentsDialog } from "./CommentsDialog";

interface MoveSidebarProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  candidate: any;
  partnerName?: string;
  actionType: string;
}

type MoveValues = {
  hrqid: string;
  partnerRate: string | number;
  hourlyRate: string | number;
  category: string;
  doj: string;
  offerStatus: string;
  comments: string;
  candidateId: string;
  caid: string;
  partnerName: string;
  coreEmerging: string;
  joiningStatus: string;
  finalOnboaridngDate: string;
};

const EMPTY: MoveValues = {
  hrqid: "",
  partnerRate: "",
  hourlyRate: "",
  category: "",
  doj: "",
  offerStatus: "",
  comments: "",
  candidateId: "",
  caid: "",
  partnerName: "",
  coreEmerging: "",
  joiningStatus: "",
  finalOnboaridngDate: "",
};

type Option = { id: number | string; name: string };
const toOptions = (list: Option[] = []) => list.map((o) => ({ value: String(o.id), label: o.name }));
const dateItem = {
  getValueProps: (v?: string) => ({ value: v && dayjs(v).isValid() ? dayjs(v) : null }),
  normalize: (d: Dayjs | null) => (d ? d.format("YYYY-MM-DD") : ""),
};
const noPast = (d: Dayjs) => d.isBefore(dayjs(), "day");

function getActionLabel(actionType: string): string {
  switch (actionType) {
    case "rec":
      return "Parent ID";
    case "onboarding":
      return "Add Rate Card";
    case "offer-status":
      return "Offer Status";
    case "Joined":
      return "Joining Status";
    default:
      return "";
  }
}

/** Side panel for the row actions of the onboarding grid: move to REC / onboarding, offer status, joining confirmation. */
export const MoveSidebar = ({ open, onOpenChange, candidate, actionType }: MoveSidebarProps) => {
  const [form] = Form.useForm<MoveValues>();
  const { userId } = useUserStore();
  const queryClient = useQueryClient();
  const [showCustomRateConfirm, setShowCustomRateConfirm] = useState(false);
  const [pendingPayload, setPendingPayload] = useState<any>(null);

  const { data: getVacantHrqid = [] } = useQuery({
    queryKey: ["getVacantHrqid", candidate?.hiringRequestId],
    queryFn: () => dropdownApi.getVacantHrqid(candidate?.hiringRequestId),
    enabled: !!candidate?.hiringRequestId,
  });

  useEffect(() => {
    if (actionType === "onboarding" && candidate) {
      form.setFieldsValue({ hrqid: candidate?.hrqId || "", caid: candidate?.candidateCode || "", partnerName: candidate?.partnerName || "" });
    }
  }, [actionType, candidate, form]);

  const clearOfferStatusFields = () => {
    form.setFieldsValue({ offerStatus: "", comments: "", partnerRate: "", hourlyRate: "", category: "", coreEmerging: "", finalOnboaridngDate: "" });
  };

  const offerAcceptance = useMutation({
    mutationFn: onboarding.offerAcceptance,
    onSuccess: async (res) => {
      toast.success(res?.message);
      clearOfferStatusFields();
      onOpenChange(false);
      await queryClient.invalidateQueries({ queryKey: ["getOnboardingDetails"] });
    },
    onError: (err) => {
      console.error(err);
      toast.error("Failed to transfer candidate details.");
    },
  });

  const moveToRecCandidate = useMutation({
    mutationFn: onboarding.moveToRec,
    onSuccess: async (res) => {
      toast.success(res?.message || "Created successfully.");
      onOpenChange(false);
      clearOfferStatusFields();
      await queryClient.invalidateQueries({ queryKey: ["getOnboardingDetails"] });
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || "Failed to transfer candidate details.");
    },
  });

  const moveToOnboarding = useMutation({
    mutationFn: onboarding.moveToOnboarding,
    onSuccess: async (res) => {
      toast.success(res?.message || "Candidate moved to onboarding.");
      onOpenChange(false);
      clearOfferStatusFields();
      await queryClient.invalidateQueries({ queryKey: ["getOnboardingDetails"] });
    },
    onError: (err) => {
      console.error(err);
      toast.error("Failed to move candidate to onboarding.");
    },
  });

  const joiningConfirmation = useMutation({
    mutationFn: onboarding.joiningConfirmation,
    onSuccess: async (res) => {
      toast.success(res?.message || "Candidate Joined");
      onOpenChange(false);
      clearOfferStatusFields();
      await queryClient.invalidateQueries({ queryKey: ["getOnboardingDetails"] });
      refetch();
    },
    onError: (err) => {
      console.error(err);
      toast.error("Failed to move candidate to onboarding.");
    },
  });

  const { data: JOINING_STATUS = [] } = useQuery({
    queryKey: ["getJOINING_STATUS", MasterTypes.JOINING_STATUS],
    queryFn: async () => (await onboarding.getEmployeeCategory(MasterTypes.JOINING_STATUS)).data,
    retry: 1,
  });
  const { data: hourlyRate = [] } = useQuery({
    queryKey: ["gethourlyRate", MasterTypes.HOURLY_RATE],
    queryFn: async () => (await onboarding.getEmployeeCategory(MasterTypes.HOURLY_RATE)).data,
    retry: 1,
  });
  const { data: CANDIDATE_CATEGORY = [] } = useQuery({
    queryKey: ["getCANDIDATE_CATEGORY", MasterTypes.CANDIDATE_CATEGORY],
    queryFn: async () => (await onboarding.getEmployeeCategory(MasterTypes.CANDIDATE_CATEGORY)).data,
    retry: 1,
  });

  const selectedHrqid = Form.useWatch("hrqid", form);
  const selectedCategoryId = Form.useWatch("category", form);
  const selectedCoreEmergingId = Form.useWatch("coreEmerging", form);
  const joiningStatusValue = Form.useWatch("joiningStatus", form);

  // standard / emerging-tech rates follow the category + candidate-category pick
  useEffect(() => {
    if (!selectedCategoryId || !selectedCoreEmergingId) return;
    const categoryId = Number(selectedCategoryId);
    const isCore = Number(selectedCoreEmergingId) === 78001;
    const matchedRate = (hourlyRate as any[]).find((rate) => rate.id === categoryId);
    if (matchedRate) {
      form.setFieldsValue({
        hourlyRate: isCore ? matchedRate.standardRate : matchedRate.etRate,
        partnerRate: isCore ? matchedRate.inrStandardRate : matchedRate.inretRate,
      });
    }
  }, [selectedCategoryId, selectedCoreEmergingId, hourlyRate, form]);

  useEffect(() => {
    if (joiningStatusValue === "80003") {
      form.setFieldValue("comments", "");
    } else {
      form.setFieldValue("finalOnboaridngDate", "");
    }
  }, [joiningStatusValue, form]);

  const { data: joiningRescheduleHistory = [], isLoading, refetch } = useQuery({
    queryKey: ["joiningRescheduleHistory", candidate?.candidatePersonalDetailsId],
    queryFn: async () => (await onboarding.getJoiningRescheduleHistory(candidate?.candidatePersonalDetailsId)).data,
    enabled: !!candidate?.candidatePersonalDetailsId,
    retry: 1,
  });

  const onFinish = (v: MoveValues) => {
    const values: MoveValues = { ...EMPTY, ...form.getFieldsValue(true), ...v };
    if (actionType === "offer-status") {
      offerAcceptance.mutate({ offerStatus: values.offerStatus === "true", candidateId: candidate?.id, comments: values.comments });
    } else if (actionType === "Joined") {
      joiningConfirmation.mutate({
        joiningStatusId: values.joiningStatus,
        candidateId: candidate?.id,
        comments: values.comments,
        candidatePersonalDetailsId: candidate?.candidatePersonalDetailsId,
        finalOnboaridngDate: values.finalOnboaridngDate ? values.finalOnboaridngDate : null,
      });
    } else if (actionType === "rec") {
      moveToRecCandidate.mutate({ hiringRequestId: selectedHrqid, candidateId: candidate?.id, transferredBy: userId });
    } else if (actionType === "onboarding") {
      const isCore = values.coreEmerging === "78001";
      const matchedRate = (hourlyRate as any[]).find((rate) => rate.id === Number(values.category));
      const expectedHourly = isCore ? matchedRate?.standardRate : matchedRate?.etRate;
      const expectedPartner = isCore ? matchedRate?.inrStandardRate : matchedRate?.inretRate;
      const isCustomRate = values.hourlyRate !== expectedHourly || values.partnerRate !== expectedPartner;
      const payload = {
        candidateId: candidate?.id,
        partnerRate: values.partnerRate,
        hourlyRate: values.hourlyRate,
        categoryId: Number(values.category),
        doj: values.doj,
        CandidateCategotyId: values.coreEmerging,
      };
      if (isCustomRate) {
        setPendingPayload(payload);
        setShowCustomRateConfirm(true);
      } else {
        moveToOnboarding.mutate({ ...payload, IsCustomisedRateCard: false });
      }
    }
  };

  const isPending = offerAcceptance.isPending || moveToRecCandidate.isPending || moveToOnboarding.isPending || joiningConfirmation.isPending;

  const historyColumns = [
    { key: "modifiedbyUsername", title: "Rescheduled By", dataIndex: "modifiedbyUsername" },
    { key: "modifiedOn", title: "Rescheduled On", dataIndex: "modifiedOn", render: (v: string) => formatDate(v) },
    { key: "finalOnboardingDate", title: "Rescheduled Date", dataIndex: "finalOnboardingDate", render: (v: string) => formatDate(v) },
    { key: "comments", title: "Comments", dataIndex: "comments", render: (v: string) => <CommentsDialog comments={v} /> },
  ];

  return (
    <Drawer
      open={open}
      onClose={() => onOpenChange(false)}
      size={actionType === "Joined" ? "large" : "default"}
      destroyOnHidden
      title={
        <Space>
          <span>{getActionLabel(actionType)}</span>
          {actionType === "rec" && <Typography.Text strong>{candidate?.hrqId}</Typography.Text>}
        </Space>
      }
      footer={
        <Space style={{ display: "flex", justifyContent: "space-between" }}>
          <Button
            onClick={() => {
              clearOfferStatusFields();
              onOpenChange(false);
            }}
          >
            Cancel
          </Button>
          <Button type="primary" loading={isPending} onClick={() => form.submit()}>
            Move
          </Button>
        </Space>
      }
    >
      <Form form={form} layout="vertical" initialValues={EMPTY} onFinish={onFinish}>
        {actionType === "offer-status" && (
          <>
            <Form.Item name="offerStatus" label="Candidate Offer Status" required>
              <Select
                placeholder="Select Status"
                options={[
                  { value: "true", label: "Accept" },
                  { value: "false", label: "Reject" },
                ]}
              />
            </Form.Item>
            <Form.Item name="comments" label="Comments">
              <Input placeholder="Add any comments" />
            </Form.Item>
          </>
        )}

        {actionType === "rec" && (
          <Form.Item name="hrqid" label="Move To" required>
            <Select placeholder="Select HRQID" showSearch optionFilterProp="label" options={(getVacantHrqid as { id: number; hrqId: string }[]).map((hrq) => ({ value: String(hrq?.id), label: hrq?.hrqId }))} />
          </Form.Item>
        )}

        {actionType === "onboarding" && (
          <Row gutter={[16, 8]}>
            <Col xs={24} md={12}>
              <Form.Item name="hrqid" label="HRQID">
                <Input disabled />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item name="caid" label="CAID">
                <Input disabled />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item name="partnerName" label="Partner Name">
                <Input disabled />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item name="category" label="Category" rules={[{ required: true, message: "Category is required" }]}>
                <Select placeholder="Select Category" showSearch optionFilterProp="label" options={toOptions(hourlyRate)} />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item name="coreEmerging" label="Candidate Category" rules={[{ required: true, message: "Candidate Category is required" }]}>
                <Select placeholder="Enter Candidate Category" showSearch optionFilterProp="label" options={toOptions(CANDIDATE_CATEGORY)} />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item name="hourlyRate" label="Hourly Rate ($)" required>
                <Input type="number" placeholder="Enter Hourly Rate ($)" />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item name="partnerRate" label="Partner Monthly Rate (₹)" required>
                <Input type="number" placeholder="Enter monthly rate" />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item name="doj" label="Date of Joining" rules={[{ required: true, message: "Date of Joining is required" }]} {...dateItem}>
                <DatePicker className="w-full" format="YYYY-MM-DD" disabledDate={noPast} />
              </Form.Item>
            </Col>
          </Row>
        )}

        {actionType === "Joined" && (
          <>
            <Form.Item name="joiningStatus" label="Candidate Joining Status" rules={[{ required: true, message: "joiningStatus is required" }]}>
              <Select placeholder="Select Status" showSearch optionFilterProp="label" options={toOptions(JOINING_STATUS)} />
            </Form.Item>
            {joiningStatusValue === "80003" ? (
              <>
                <Form.Item name="finalOnboaridngDate" label="Final Onboarding Date" rules={[{ required: true, message: "Final Onboaridng Date is required" }]} {...dateItem}>
                  <DatePicker className="w-full" format="YYYY-MM-DD" disabledDate={noPast} />
                </Form.Item>
                <Form.Item name="comments" label="Comments" rules={[{ required: true, message: "comments is required" }]}>
                  <Input placeholder="Add any comments" />
                </Form.Item>
              </>
            ) : (
              <Form.Item name="comments" label="Comments">
                <Input placeholder="Add any comments" />
              </Form.Item>
            )}
          </>
        )}
      </Form>

      {actionType === "Joined" && (
        <>
          <Typography.Title level={5} className="mt-6">
            Reschedule History
          </Typography.Title>
          <Table size="small" rowKey="id" loading={isLoading} dataSource={joiningRescheduleHistory} columns={historyColumns} pagination={false} scroll={{ x: "max-content" }} locale={{ emptyText: "No Data Available" }} />
        </>
      )}

      <Modal
        open={showCustomRateConfirm}
        title="Customised Rate Card"
        okText="Proceed"
        onCancel={() => {
          setShowCustomRateConfirm(false);
          setPendingPayload(null);
        }}
        onOk={() => {
          moveToOnboarding.mutate({ ...pendingPayload, IsCustomisedRateCard: true });
          setShowCustomRateConfirm(false);
          setPendingPayload(null);
          onOpenChange(false);
          clearOfferStatusFields();
        }}
      >
        <Typography.Paragraph>
          You are creating a customised rate card deviating from the current rates.
          <br />
          Please agree to continue and proceed.
        </Typography.Paragraph>
      </Modal>
    </Drawer>
  );
};
