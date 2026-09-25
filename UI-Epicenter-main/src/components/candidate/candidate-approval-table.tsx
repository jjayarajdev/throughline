"use client";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Button, Dropdown, Form, Input, Modal, Select, Space, Typography } from "antd";
import type { MenuProps } from "antd";
import { CheckOutlined, CloseOutlined, MoreOutlined } from "@ant-design/icons";

import DataTable, { type DataColumn } from "@/components/data-table/DataTable";
import { useTableState } from "@/components/data-table/useTableState";
import { useSearchColumns } from "@/components/data-table/useSearchColumns";
import { toast } from "@/lib/toast";
import api from "@/lib/axiosInstance";
import { partnerApi } from "@/services/api/partner.profile.api";
import { candidateApi } from "@/services/api/candidate.api";
import { FilterTypeEnum } from "@/constants/FilterTypeEnum";
import { ResumePreview } from "./ResumePreview";

interface Partner {
  id: string;
  partnerName: string;
}

type Candidate = Record<string, any>;

/** Duplicate-candidate exception requests awaiting approve / reject. */
export function CandidateApprovalTable() {
  const router = useRouter();
  const [commentForm] = Form.useForm<{ comments: string }>();

  const t = useTableState({ pageSize: 50 });
  const searchColumns = useSearchColumns(FilterTypeEnum.CandidateApprovalGrid);

  const [selectedPartner, setSelectedPartner] = useState<string | null>(null);
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const [showCommentDialog, setShowCommentDialog] = useState(false);
  const [actionType, setActionType] = useState<"approve" | "reject" | null>(null);
  const [loader, setLoader] = useState(false);
  const [commentsFor, setCommentsFor] = useState<Candidate | null>(null);

  const { data: partnersData } = useQuery({
    queryKey: ["allpartners", selectedPartner],
    queryFn: () => partnerApi.getAllPartner(),
  });

  const { data: candidatesResponse, isLoading, error, refetch: reFetchData } = useQuery({
    queryKey: ["candidatesApproval", t.query, selectedPartner],
    queryFn: () =>
      candidateApi.fetchCandidateApprovalList(
        { pageNumber: t.query.pageNumber, pageSize: t.query.pageSize, searchColumn: t.query.searchColumn, searchText: t.query.searchText },
        Number(selectedPartner)
      ),
    refetchIntervalInBackground: true,
    refetchOnWindowFocus: true,
  });

  useEffect(() => {
    if (error) toast.error("Failed to fetch candidates");
  }, [error]);

  const candidates: Candidate[] = candidatesResponse?.data?.items || [];

  const openDialog = (candidate: Candidate, type: "approve" | "reject") => {
    setSelectedCandidate(candidate);
    setActionType(type);
    setShowCommentDialog(true);
  };

  const closeDialog = () => {
    setShowCommentDialog(false);
    commentForm.resetFields();
    setSelectedCandidate(null);
    setActionType(null);
  };

  const handleApprove = async (candidateBinId: string, comments: string, candidateCode: string) => {
    setLoader(true);
    try {
      const payload = { candidateBinId, isApproved: true, hmComments: comments, existingCandidateCode: candidateCode };
      const res = await api.patch(`CandidateBin/manage-candidate-approval/${candidateBinId}`, payload);
      if (res.status === 200) {
        toast.success("Candidate Approved");
        reFetchData();
      } else {
        toast.error("Error approving candidate");
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Unexpected error occurred");
    }
    setLoader(false);
  };

  const handleReject = async (candidateBinId: string, comments: string) => {
    setLoader(true);
    try {
      const res = await api.patch(`CandidateBin/manage-candidate-approval/${candidateBinId}`, { candidateBinId, isApproved: false, hmComments: comments });
      if (res.status === 200) {
        toast.success("Candidate Rejected");
        reFetchData();
      } else {
        toast.error("Error rejecting candidate");
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Unexpected error occurred");
    }
    setLoader(false);
  };

  const handleCommentSubmit = async (data: { comments: string }) => {
    if (!selectedCandidate || !actionType) return;
    if (actionType === "approve") {
      await handleApprove(selectedCandidate.candidateBinId, data.comments, selectedCandidate.existingCandidateCodes);
    } else {
      await handleReject(selectedCandidate.candidateBinId, data.comments);
    }
    closeDialog();
  };

  const rowMenu = (c: Candidate): MenuProps["items"] => [
    { key: "accept", icon: <CheckOutlined />, label: "Accept", onClick: () => openDialog(c, "approve") },
    { key: "reject", icon: <CloseOutlined />, label: "Reject", danger: true, onClick: () => openDialog(c, "reject") },
  ];

  const columns = useMemo<DataColumn<Candidate>[]>(
    () => [
      {
        key: "hrqId",
        title: "HRQID",
        dataIndex: "hrqId",
        fixed: "left",
        render: (v: string) => <Typography.Link onClick={() => router.push(`/home/hiring-details?hrqid=${v}`)}>{v}</Typography.Link>,
      },
      { key: "fullName", title: "Candidate Name", dataIndex: "fullName" },
      { key: "email", title: "Candidate Email", dataIndex: "email" },
      { key: "phoneNumber", title: "Candidate Contact", dataIndex: "phoneNumber" },
      {
        key: "jobTitle",
        title: "Role Hired For",
        dataIndex: "jobTitle",
        render: (v: string) => v?.split(",").map((title, i) => <div key={i}>{title.trim()}</div>),
      },
      { key: "relevantExperience", title: "Experience", dataIndex: "relevantExperience" },
      {
        key: "resume",
        title: "Resume",
        dataIndex: "resume",
        render: (_: unknown, c: Candidate) =>
          c.resume?.attachmentURL ? (
            <ResumePreview url={c.resume.attachmentURL} fileName={`${c.fullName}'s Resume`} />
          ) : (
            <Typography.Text type="secondary">No resume</Typography.Text>
          ),
      },
      { key: "nickName", title: "Partner", dataIndex: "nickName" },
      {
        key: "partnerComments",
        title: "Partner's Comment",
        dataIndex: "partnerComments",
        render: (_: unknown, c: Candidate) => (
          <Button size="small" onClick={() => setCommentsFor(c)}>
            View
          </Button>
        ),
      },
      {
        key: "existingCandidateCodes",
        title: "ExistingCandidate",
        dataIndex: "existingCandidateCode",
        render: (v: string) => (
          <Typography.Link onClick={() => router.push(`/home/candidate-management/candidate-profile?id=${v}`)}>{v}</Typography.Link>
        ),
      },
      {
        key: "actions",
        title: "Actions",
        locked: true,
        align: "center",
        width: 80,
        fixed: "right",
        render: (_: unknown, c: Candidate) => (
          <Dropdown menu={{ items: rowMenu(c) }} trigger={["click"]}>
            <Button size="small" icon={<MoreOutlined />} />
          </Dropdown>
        ),
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  return (
    <>
      <DataTable<Candidate>
        storageKey="candidate-approval"
        rowKey="candidateBinId"
        columns={columns}
        data={candidates}
        loading={isLoading}
        pagination={{ current: t.pageNumber, pageSize: t.pageSize, total: candidatesResponse?.data?.totalCount ?? 0 }}
        onChange={t.onTableChange}
        search={{ columns: searchColumns, column: t.searchColumn, text: t.searchText, onChange: t.setSearch, placeholder: "Search candidates" }}
        filters={
          <Select
            allowClear
            showSearch
            optionFilterProp="label"
            placeholder="Select Partner"
            style={{ width: 200 }}
            value={selectedPartner ?? undefined}
            options={(partnersData?.data ?? []).map((p: Partner) => ({ value: String(p.id), label: p.partnerName }))}
            onChange={(v) => {
              setSelectedPartner(v ?? null);
              t.resetPage();
            }}
          />
        }
        emptyText="No candidates found"
      />

      <Modal open={!!commentsFor} onCancel={() => setCommentsFor(null)} footer={null} title="Partner Comments" destroyOnHidden>
        <Typography.Paragraph style={{ whiteSpace: "pre-wrap", maxHeight: 400, overflowY: "auto" }}>
          {commentsFor?.partnerComments || "No comments available."}
        </Typography.Paragraph>
      </Modal>

      <Modal
        open={showCommentDialog}
        onCancel={closeDialog}
        title={actionType === "approve" ? "Approve Candidate" : "Reject Candidate"}
        destroyOnHidden
        footer={
          <Space>
            <Button onClick={closeDialog}>Cancel</Button>
            <Button type="primary" danger={actionType === "reject"} loading={loader} onClick={() => commentForm.submit()}>
              {loader ? (actionType === "approve" ? "Approving..." : "Rejecting...") : actionType === "approve" ? "Approve" : "Reject"}
            </Button>
          </Space>
        }
      >
        <Typography.Paragraph type="secondary">
          {actionType === "approve" ? "Please provide a comment for approving this candidate." : "Please provide a reason for rejecting this candidate."}
        </Typography.Paragraph>
        <Form form={commentForm} layout="vertical" onFinish={handleCommentSubmit} initialValues={{ comments: "" }}>
          <Form.Item name="comments" label="Comments">
            <Input.TextArea rows={4} placeholder="Enter your comments here..." />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}
