"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Button, Dropdown, Form, Input, Modal, Typography, theme } from "antd";
import type { MenuProps } from "antd";
import { CheckOutlined, CloseOutlined, MoreOutlined } from "@ant-design/icons";
import DataTable, { type DataColumn } from "@/components/data-table/DataTable";
import { useTableState } from "@/components/data-table/useTableState";
import { useSearchColumns } from "@/components/data-table/useSearchColumns";
import { DocPreviewButton } from "@/components/onboarding/upload-fields";
import { toast } from "@/lib/toast";
import api from "@/lib/axiosInstance";
import { FilterTypeEnum } from "@/constants/FilterTypeEnum";
import { onboarding } from "@/services/api/onboarding.api";
import { formatDate } from "@/helpers/helper";
import { useOnboardCandidateStore } from "@/store/useCandidateOnboarding";

interface Candidate {
  [key: string]: any;
  id: string;
  hrqId: string;
  candidateCode: string;
  fullName: string;
  email: string;
  jobTitle: string;
  candidateId: string;
}

const isOlderThan72Hours = (doc: any) => {
  if (!doc?.createdDate || !doc?.createdTime) return false;
  const docDateTime = new Date(`${doc.createdDate}T${doc.createdTime}`);
  const diffHours = (Date.now() - docDateTime.getTime()) / (1000 * 60 * 60);
  return diffHours > 72;
};

/** BGV document approvals: accept / reject the NDA & CDA documents with a comment. */
export function DocsApprovalTable() {
  const router = useRouter();
  const { token } = theme.useToken();
  const [commentForm] = Form.useForm<{ comments: string }>();
  const t = useTableState({ pageSize: 50 });
  const searchColumns = useSearchColumns(FilterTypeEnum.CandidateOnboarding_Identified);

  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const [showCommentDialog, setShowCommentDialog] = useState(false);
  const [actionType, setActionType] = useState<"approve" | "reject" | null>(null);
  const [loader, setLoader] = useState(false);

  const { data: candidatesResponse, isLoading, error, refetch: reFetchData } = useQuery({
    queryKey: ["docsApproval", t.query],
    queryFn: () =>
      onboarding.docsApprovalList({
        pageNumber: t.query.pageNumber,
        pageSize: t.query.pageSize,
        searchColumn: t.query.searchColumn ?? "",
        searchText: t.query.searchText || undefined,
      }),
    refetchIntervalInBackground: true,
    refetchOnWindowFocus: true,
  });

  if (error) toast.error("Failed to fetch candidates");

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

  const confirm = async (id: string, candidateId: string, approve: boolean, comments: string) => {
    const label = approve ? "approving" : "rejecting";
    try {
      const res = await api.post(`/CandidateForm/candidate-bgv-confirmation`, { candidateId, approve, comments, candidatePersonalDetailsId: Number(id) });
      if (res.status === 200) {
        toast.success(approve ? "Candidate Approved" : "Candidate Rejected");
        reFetchData();
      } else {
        toast.error(`Error ${label} candidate`);
      }
    } catch {
      toast.error(`Error ${label} candidate`);
    }
  };

  const handleCommentSubmit = async (data: { comments: string }) => {
    if (!selectedCandidate || !actionType) return;
    setLoader(true);
    await confirm(selectedCandidate.candidatePersonalDetailsId, selectedCandidate.candidateId, actionType === "approve", data.comments);
    setLoader(false);
    closeDialog();
  };

  const handleCandidateProfile = (candidate: any) => {
    useOnboardCandidateStore.getState().setOnboardCandidate({ candidateRateCardId: candidate?.candidateRateCardId });
    router.push(`/home/candidate-onboarding/candidate-profile?id=${candidate?.candidatePersonalDetailsId}`);
  };

  const rowMenu = (c: Candidate): MenuProps["items"] => [
    { key: "accept", icon: <CheckOutlined />, label: "Accept", onClick: () => openDialog(c, "approve") },
    { key: "reject", icon: <CloseOutlined />, label: "Reject", danger: true, onClick: () => openDialog(c, "reject") },
  ];

  const columns = useMemo<DataColumn<Candidate>[]>(
    () => [
      { key: "hrqId", title: "HRQID", dataIndex: "hrqId", render: (v: string) => <Typography.Link onClick={() => router.push(`/home/hiring-details?hrqid=${v}`)}>{v}</Typography.Link> },
      { key: "candidateCode", title: "Candidate Code", dataIndex: "candidateCode", render: (v: string) => <Link href={`/home/candidate-management/candidate-profile?id=${v}`}>{v}</Link> },
      { key: "candidateName", title: "Candidate Name", dataIndex: "candidateName" },
      { key: "employeeId", title: "Employee ID", dataIndex: "employeeId", render: (v: string, c) => <Typography.Link onClick={() => handleCandidateProfile(c)}>{v}</Typography.Link> },
      { key: "resourceTypeName", title: "Resource Type", dataIndex: "resourceTypeName" },
      { key: "candidateContact", title: "Candidate Contact", dataIndex: "candidateContact" },
      { key: "jobTitle", title: "Role Hired For", dataIndex: "jobTitle" },
      { key: "nickName", title: "Partner", dataIndex: "nickName" },
      { key: "ndaDoc", title: "NDA DOC", dataIndex: "ndaDoc", align: "center", render: (doc: any) => <DocPreviewButton url={doc?.attachmentURL} fileName={`${doc?.attachmentName}'s`} /> },
      { key: "cdaDoc", title: "CDA DOC", dataIndex: "cdaDoc", align: "center", render: (doc: any) => <DocPreviewButton url={doc?.attachmentURL} fileName={`${doc?.attachmentName}'s`} /> },
      { key: "intakeStatusName", title: "Candidate Status", dataIndex: "intakeStatusName" },
      { key: "dateOfJoining", title: "DOJ", dataIndex: "dateOfJoining", render: (v: string) => formatDate(v) },
      {
        key: "actions",
        title: "Actions",
        locked: true,
        align: "center",
        width: 80,
        fixed: "right",
        render: (_: unknown, c) => (
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
        storageKey="docs-approval"
        rowKey={(c) => c.candidateCode ?? c.candidatePersonalDetailsId ?? c.id}
        columns={columns}
        data={candidatesResponse?.data?.items}
        loading={isLoading}
        pagination={{ current: t.pageNumber, pageSize: t.pageSize, total: candidatesResponse?.data?.totalCount ?? 0 }}
        onChange={t.onTableChange}
        search={{ columns: searchColumns, column: t.searchColumn, text: t.searchText, onChange: t.setSearch, placeholder: "Search by" }}
        // documents pending for more than 72 hours are highlighted
        onRow={(c) => (isOlderThan72Hours(c?.cdaDoc) && isOlderThan72Hours(c?.ndaDoc) ? { style: { background: token.colorErrorBg } } : {})}
        emptyText="No candidates found"
      />

      <Modal
        open={showCommentDialog}
        onCancel={closeDialog}
        title={actionType === "approve" ? "Approve Candidate" : "Reject Candidate"}
        destroyOnHidden
        footer={
          <>
            <Button onClick={closeDialog}>Cancel</Button>
            <Button type="primary" danger={actionType === "reject"} loading={loader} onClick={() => commentForm.submit()}>
              {loader ? (actionType === "approve" ? "Approving..." : "Rejecting...") : actionType === "approve" ? "Approve" : "Reject"}
            </Button>
          </>
        }
      >
        <Typography.Text type="secondary">
          {actionType === "approve" ? "Please provide a comment for approving this candidate." : "Please provide a reason for rejecting this candidate."}
        </Typography.Text>
        <Form form={commentForm} layout="vertical" onFinish={handleCommentSubmit} initialValues={{ comments: "" }} className="mt-4">
          <Form.Item name="comments" label="Comments">
            <Input.TextArea rows={4} placeholder="Enter your comments here..." />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}
