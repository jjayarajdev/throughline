"use client";
import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button, Checkbox, Descriptions, Flex, Form, Input, Modal, Radio, Select, Space, Typography } from "antd";
import {
  CalendarOutlined,
  ClockCircleOutlined,
  FileTextOutlined,
  IdcardOutlined,
  MailOutlined,
  PauseCircleOutlined,
  ProfileOutlined,
  UserOutlined,
  UserSwitchOutlined,
} from "@ant-design/icons";
import { z } from "zod";
import { toast } from "@/lib/toast";
import { validateWithZod, zodRules } from "@/lib/zodRules";
import { MasterTypes } from "@/constants/masterTypes";
import { hiringStatusType } from "@/constants/enumTypes";
import { hiringApi } from "@/services/api/hiring.api";
import { dropdownApi } from "@/services/api/master";
import { isAdmin, isDomainManager, isHiringManager, isRmowner, isVendorManager, useUserStore } from "@/store/userStore";
import { toOptions } from "./shared";

interface HiringDetail {
  onholdRequestedByName: string;
  onholdComments: string;
  onholdDate: any;
  onholdByUserName: any;
  onholdReasonName: any;
  hiringManagerName: any;
  jobTitle: string;
  hrqId: string;
  rcMsProjectId: string;
  rcMsResourceRequestId: string;
  requestCreationDate: string;
  approverComments: string;
  hiringStatusName: string;
  approvalStatusName: string;
  approverEmail: string;
  hiringStatusId: number;
  rmOwnerId: number;
  id: number;
  hasChildRequests: boolean;
  onHoldReviewStatusId?: number | string;
}

interface Props {
  data: HiringDetail;
}

const holdFormBase = z.object({
  reason: z.string().min(1, "Please select a reason"),
  onHoldRequestedBy: z.string().min(1, "please select on hold requested by"),
  isTalentPool: z.boolean().optional(),
  isIdentifiedTalents: z.boolean().optional(),
  onholdCategoryId: z.string().optional(),
  onholdComments: z.string().optional(),
});
const holdFormSchema = (hasChildRequests: boolean) =>
  holdFormBase.refine((d) => (hasChildRequests ? !!d.onholdCategoryId : true), { path: ["onholdCategoryId"], message: "Please select On Hold Category" });
type HoldValues = z.infer<typeof holdFormBase>;

/** Hiring request summary on the profile page, with RM owner change and the on-hold / reactivate flow. */
export function HiringDetailsTable({ data }: Props) {
  const queryClient = useQueryClient();
  const { userId } = useUserStore();
  const [rmowner, setRmowner] = useState(data.rmOwnerId);
  const [isHoldDialogOpen, setIsHoldDialogOpen] = useState(false);
  const [holdForm] = Form.useForm<HoldValues>();
  const onholdCategoryId = Form.useWatch("onholdCategoryId", holdForm);

  const { data: onHoldRequestedBy } = useQuery({ queryKey: ["onHoldRequestedBy"], queryFn: () => dropdownApi.fetchDropdown(MasterTypes.CAN_ONHOLD_ROLES) });
  const { data: rmOwner } = useQuery({ queryKey: ["rmOwner"], queryFn: () => dropdownApi.fetchDropdown(MasterTypes.RM_OWNER) });
  const { data: holdReasons } = useQuery({ queryKey: ["holdReasons"], queryFn: () => dropdownApi.fetchDropdown(MasterTypes.HRQ_ONHOLD_REASONS) });

  const hiringId = data?.id;

  const { mutate: changeStatus, isPending } = useMutation({
    mutationKey: ["changeStatus"],
    mutationFn: ({ hiringRequestId, hiringStatusId }: { hiringRequestId: number; hiringStatusId: number }) => hiringApi.changeHiringStatus(hiringRequestId, hiringStatusId),
    onSuccess: (res) => {
      toast.success(res?.message || "slot assigned");
      queryClient.invalidateQueries({ queryKey: ["hiringProfile"] });
    },
  });

  const { mutate: changeRmowner, isPending: rmownerLoading } = useMutation({
    mutationKey: ["changeRmowner"],
    mutationFn: ({ hiringRequestId, rmownerId }: { hiringRequestId: number; rmownerId: number }) => hiringApi.changeRmowner(hiringRequestId, rmownerId),
    onSuccess: (res) => toast.success(res?.message || "slot assigned"),
  });

  const putOnHolds = useMutation({
    mutationKey: ["putOnHold"],
    mutationFn: (payload: any) => hiringApi.holdHiringRequest(payload),
    onSuccess: (res) => {
      toast.success(res?.message || "on hold request created");
      setIsHoldDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ["hiringProfile"] });
      holdForm.resetFields();
    },
    onError: (error: any) => {
      toast.error(error?.message || "Something went wrong, please try again later.");
      console.error("Error creating partner:", error);
    },
  });

  const onHoldSubmit = (raw: HoldValues) => {
    const values = validateWithZod(holdFormSchema(!!data?.hasChildRequests), holdForm, raw);
    if (!values) return;
    const freezeCandidateType = [values.isTalentPool ? 1 : null, values.isIdentifiedTalents ? 3 : null].filter((v): v is number => v !== null);
    putOnHolds.mutate({
      onholdRaisedByUserId: userId,
      hiringRequestId: hiringId,
      onholdReasonId: values.reason,
      onholdRequestedByRoleId: values.onHoldRequestedBy,
      onholdComments: values.onholdComments,
      onholdDate: new Date().toISOString(),
      freezeCandidateTypes: freezeCandidateType,
      onholdCategoryId: values.onholdCategoryId ? Number(values.onholdCategoryId) : 1,
    });
  };

  useEffect(() => {
    setRmowner(data.rmOwnerId);
  }, [data.rmOwnerId]);

  const label = (icon: React.ReactNode, text: string) => (
    <Space size={6}>
      {icon}
      {text}
    </Space>
  );

  const items = [
    { key: "hrq", label: label(<IdcardOutlined />, "HRQ ID"), children: data.hrqId },
    { key: "rcms", label: label(<FileTextOutlined />, "RCMS ID"), children: data.rcMsProjectId },
    { key: "rr", label: label(<IdcardOutlined />, "RR ID"), children: data.rcMsResourceRequestId },
    { key: "hiringStatusName", label: label(<IdcardOutlined />, "Req Status"), children: data.hiringStatusName },
    ...(data.onholdReasonName
      ? [
          { key: "onholdReasonName", label: label(<IdcardOutlined />, "On Hold Reason"), children: data.onholdReasonName },
          { key: "onholdByUserName", label: label(<IdcardOutlined />, "On Hold By"), children: data.onholdByUserName },
          { key: "onholdDate", label: label(<IdcardOutlined />, "Date On Hold"), children: new Date(data.onholdDate).toLocaleDateString() },
          { key: "onholdComments", label: label(<ProfileOutlined />, "On hold Comment"), children: data.onholdComments || "No comments provided" },
          { key: "onholdRequestedByName", label: label(<UserOutlined />, "On hold Requested By"), children: data.onholdRequestedByName || "" },
        ]
      : []),
    { key: "title", label: label(<UserSwitchOutlined />, "Role Hired For"), children: data.jobTitle },
    { key: "created", label: label(<CalendarOutlined />, "Req Created Date"), children: new Date(data.requestCreationDate).toLocaleDateString() },
    { key: "hiringManagerName", label: label(<UserSwitchOutlined />, "Hiring Manager"), children: data.hiringManagerName },
    {
      key: "rmOwner",
      label: label(<MailOutlined />, "RM Owner"),
      children: (
        <Select
          className="w-full"
          style={{ minWidth: 180 }}
          showSearch
          optionFilterProp="label"
          placeholder="Select Status"
          value={rmowner}
          options={((rmOwner ?? []) as { id: number; name: string }[]).map((o) => ({ value: o.id, label: o.name }))}
          disabled={rmownerLoading || !(isAdmin || isRmowner || isVendorManager)}
          onChange={(v) => {
            setRmowner(Number(v));
            changeRmowner({ hiringRequestId: hiringId, rmownerId: Number(v) });
          }}
        />
      ),
    },
  ];

  const reviewId = Number(data.onHoldReviewStatusId);
  let action: React.ReactNode = null;
  if (isAdmin || isRmowner || isDomainManager || isHiringManager || isVendorManager) {
    if (reviewId === 85001) {
      action = (
        <Button color="gold" variant="outlined" icon={<ClockCircleOutlined />} disabled>
          Pending
        </Button>
      );
    } else if (reviewId === 85002) {
      action = (
        <Button color="green" variant="outlined" icon={<MailOutlined />} loading={isPending} onClick={() => changeStatus({ hiringRequestId: hiringId, hiringStatusId: hiringStatusType.WIP })}>
          {isPending ? "Reactivating..." : "Reactivate"}
        </Button>
      );
    } else {
      action = (
        <Button color="gold" variant="outlined" icon={<PauseCircleOutlined />} onClick={() => setIsHoldDialogOpen(true)}>
          On Hold
        </Button>
      );
    }
  }

  return (
    <Flex vertical gap={16}>
      <Flex justify="space-between" align="center" wrap gap={8}>
        <Typography.Title level={5} style={{ margin: 0 }}>
          <Space>
            <UserOutlined />
            Hiring Request Details
          </Space>
        </Typography.Title>
        {action}
      </Flex>

      <Descriptions bordered size="small" column={{ xs: 1, sm: 2, lg: 4 }} items={items} />

      <Modal
        open={isHoldDialogOpen}
        title="Hold Hiring Request"
        destroyOnHidden
        onCancel={() => setIsHoldDialogOpen(false)}
        footer={
          <Space>
            <Button onClick={() => setIsHoldDialogOpen(false)}>Cancel</Button>
            <Button type="primary" loading={putOnHolds.isPending} onClick={() => holdForm.submit()}>
              {putOnHolds.isPending ? "Processing..." : "Put on Hold"}
            </Button>
          </Space>
        }
      >
        <Form form={holdForm} layout="vertical" onFinish={onHoldSubmit} initialValues={{ reason: "", onHoldRequestedBy: "", onholdComments: "" }} className="pt-4">
          {data?.hasChildRequests && (
            <Form.Item name="onholdCategoryId" label="OnHold Category" required rules={zodRules(holdFormBase, "onholdCategoryId")}>
              <Radio.Group options={[{ value: "1", label: "Fully" }, { value: "2", label: "Partially" }]} />
            </Form.Item>
          )}
          <Form.Item name="reason" label="Hold Reason" rules={zodRules(holdFormBase, "reason")}>
            <Select showSearch optionFilterProp="label" placeholder="Select a reason for putting this request on hold" options={toOptions(holdReasons)} />
          </Form.Item>
          <Form.Item name="onHoldRequestedBy" label="On hold requested by" rules={zodRules(holdFormBase, "onHoldRequestedBy")}>
            <Select showSearch optionFilterProp="label" placeholder="Select a onhold requested by" options={toOptions(onHoldRequestedBy)} />
          </Form.Item>
          {onholdCategoryId === "2" && (
            <Form.Item label="Select Candidate Transfer Category">
              <Space wrap>
                <Form.Item name="isTalentPool" valuePropName="checked" noStyle>
                  <Checkbox>Talent Pool</Checkbox>
                </Form.Item>
                <Form.Item name="isIdentifiedTalents" valuePropName="checked" noStyle>
                  <Checkbox>Identified Talents</Checkbox>
                </Form.Item>
              </Space>
            </Form.Item>
          )}
          <Form.Item name="onholdComments" label="Additional Comments (optional)" rules={zodRules(holdFormBase, "onholdComments")}>
            <Input.TextArea rows={3} placeholder="Enter comments or notes" />
          </Form.Item>
        </Form>
      </Modal>
    </Flex>
  );
}
