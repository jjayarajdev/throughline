"use client";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { Button, Checkbox, Dropdown, Form, Input, Modal, Space, theme, Tooltip, Typography } from "antd";
import type { MenuProps } from "antd";
import { MoreOutlined, PlusOutlined, SendOutlined, UploadOutlined } from "@ant-design/icons";

import DataTable, { type DataColumn } from "@/components/data-table/DataTable";
import { useTableState } from "@/components/data-table/useTableState";
import { useSearchColumns } from "@/components/data-table/useSearchColumns";
import { toast } from "@/lib/toast";
import api from "@/lib/axiosInstance";
import { candidateApi } from "@/services/api/candidate.api";
import { FilterTypeEnum } from "@/constants/FilterTypeEnum";
import { useUserStore } from "@/store/userStore";
import { ResumePreview } from "./ResumePreview";
import { ResumeUploadField, type Attachment } from "./candidate-forms/ResumeUploadField";
import { TermsConditionsModal } from "@/components/dialog/TermsConditionsModal";

export const searchList = [{ id: "HrqId", name: "HRQID" }];

type Candidate = Record<string, any>;

/** Candidates awaiting review ("bin"): upload resume, agree to terms, request exception for duplicates. */
export function CandidateBinTable() {
  const router = useRouter();
  const { token } = theme.useToken();
  const { userId } = useUserStore();

  const t = useTableState({ pageSize: 50 });
  const searchColumns = useSearchColumns(FilterTypeEnum.CandidateManagement);

  const [showTermsDialog, setShowTermsDialog] = useState(false);
  const [showResumeDialog, setShowResumeDialog] = useState(false);
  const [showExceptionDialog, setShowExceptionDialog] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState<any>(null);
  const [resumeForm] = Form.useForm<{ resume: Attachment }>();
  const [exceptionForm] = Form.useForm<{ comments: string }>();
  const resumeValue = Form.useWatch("resume", resumeForm);
  const [savingResume, setSavingResume] = useState(false);
  const [acceptingTerms, setAcceptingTerms] = useState(false);
  const [sendingException, setSendingException] = useState(false);

  const { data: candidatesResponse, isLoading, error, refetch: reFetchData } = useQuery({
    queryKey: ["candidatesBin", t.query, t.sortColumns],
    queryFn: () =>
      candidateApi.fetchBinCandidateList(
        {
          pageNumber: t.query.pageNumber,
          pageSize: t.query.pageSize,
          searchColumn: t.query.searchColumn,
          searchText: t.query.searchText,
          sortColumns: t.sortColumns,
        },
        userId
      ),
    refetchOnWindowFocus: true,
  });

  if (error) {
    toast.error((error as any)?.response?.data?.message || "Failed to fetch candidates");
  }

  const candidates: Candidate[] = candidatesResponse?.data?.items || [];

  const handleTermsClick = (candidate: any) => {
    if (!candidate.resume?.attachmentURL) {
      toast.error("Please upload resume first");
      return;
    }
    if (candidate.isDuplicate) {
      toast.error("Duplicate candidate needs approval first");
      return;
    }
    setSelectedCandidate(candidate);
    setShowTermsDialog(true);
  };

  const handleResumeUpload = (candidate: any) => {
    setSelectedCandidate(candidate);
    setShowResumeDialog(true);
    resumeForm.resetFields();
  };

  const handleResumeSubmit = async (data: { resume?: Attachment }) => {
    if (!selectedCandidate || !data.resume) return;
    setSavingResume(true);
    try {
      await api.put(`/CandidateBin/${selectedCandidate.candidateBinId}`, {
        ...selectedCandidate,
        resume: { attachmentName: data.resume.attachmentName, attachmentURL: data.resume.attachmentURL },
      });
      toast.success("Resume uploaded successfully");
      setShowResumeDialog(false);
      resumeForm.resetFields();
      reFetchData();
    } catch (err) {
      console.error(err);
      toast.error("Error uploading resume");
    } finally {
      setSavingResume(false);
    }
  };

  const handleTermsAccept = async () => {
    if (!selectedCandidate) return;
    setAcceptingTerms(true);
    try {
      await api.patch(`/CandidateBin/Acknowledge/${selectedCandidate.candidateBinId}?isAgreedTerms=true`);
      reFetchData();
      setShowTermsDialog(false);
    } catch (err) {
      if (err instanceof AxiosError && err.response?.data?.message) {
        toast.error(err.response.data?.message || "Error accepting terms");
      } else {
        toast.error("An unexpected error occurred");
      }
    } finally {
      setAcceptingTerms(false);
    }
  };

  const handleRequestException = (candidateId: string) => {
    setSelectedCandidate({ candidateBinId: candidateId });
    setShowExceptionDialog(true);
  };

  const closeExceptionDialog = () => {
    setShowExceptionDialog(false);
    exceptionForm.resetFields();
    setSelectedCandidate(null);
  };

  const handleExceptionSubmit = async (data: { comments: string }) => {
    if (!selectedCandidate) return;
    setSendingException(true);
    try {
      await api.patch(`/CandidateBin/request-for-exception/${selectedCandidate.candidateBinId}`, {
        candidateBinId: selectedCandidate.candidateBinId,
        partnerComments: data.comments,
      });
      toast.success("Approval sent successfully");
      closeExceptionDialog();
      reFetchData();
    } catch (err) {
      console.error(err);
      const axiosError = err as AxiosError<{ message: string }>;
      toast.error(axiosError?.response?.data?.message || "Error sending approval request");
    } finally {
      setSendingException(false);
    }
  };

  const rowMenu = (c: Candidate): MenuProps["items"] =>
    c.isDuplicate
      ? [
          {
            key: "exception",
            icon: <SendOutlined />,
            label: "Request Exception",
            disabled: !c.resume?.attachmentURL || c.isRequestException,
            onClick: () => handleRequestException(c.candidateBinId),
          },
        ]
      : [];

  const columns = useMemo<DataColumn<Candidate>[]>(
    () => [
      {
        key: "hrqId",
        title: "HRQID",
        dataIndex: "hrqId",
        sorter: true,
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
            <Button type="link" size="small" icon={<UploadOutlined />} onClick={() => handleResumeUpload(c)}>
              Upload
            </Button>
          ),
      },
      { key: "nickName", title: "Partner", dataIndex: "nickName" },
      {
        key: "termsAndConditions",
        title: "Terms & Conditions",
        render: (_: unknown, c: Candidate) => (
          <Space size={4}>
            <Checkbox checked={c.isAgreedForTermsConditions} disabled />
            {c.isDuplicate ? (
              <Typography.Text type="danger">{c.resume?.attachmentURL ? "Send for approval" : "Upload resume first"}</Typography.Text>
            ) : c.resume?.attachmentURL ? (
              <Typography.Link onClick={() => handleTermsClick(c)}>{c.isAgreedForTermsConditions ? "Agreed" : "Click to agree"}</Typography.Link>
            ) : (
              <Typography.Text type="secondary" onClick={() => handleTermsClick(c)}>
                {c.isAgreedForTermsConditions ? "Agreed" : "Click to agree"}
              </Typography.Text>
            )}
          </Space>
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
          <Tooltip title="Actions">
            <Dropdown menu={{ items: rowMenu(c) }} trigger={["click"]} disabled={!c.isDuplicate}>
              <Button size="small" icon={<MoreOutlined />} />
            </Dropdown>
          </Tooltip>
        ),
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  return (
    <>
      <DataTable<Candidate>
        storageKey="candidate-bin"
        rowKey="candidateBinId"
        columns={columns}
        data={candidates}
        loading={isLoading}
        pagination={{ current: t.pageNumber, pageSize: t.pageSize, total: candidatesResponse?.data?.totalCount ?? 0 }}
        onChange={t.onTableChange}
        search={{ columns: searchColumns, column: t.searchColumn, text: t.searchText, onChange: t.setSearch, placeholder: "Search candidates" }}
        onRow={(c) => (c.isDuplicate ? { style: { background: token.colorErrorBg } } : {})}
        actions={
          <Tooltip title="Create New candidate">
            <Button type="primary" icon={<PlusOutlined />} onClick={() => router.push("/home/candidate-management/create-candidate")}>
              Create
            </Button>
          </Tooltip>
        }
        emptyText="No candidates found"
      />

      <TermsConditionsModal open={showTermsDialog} onCancel={() => setShowTermsDialog(false)} onAccept={handleTermsAccept} confirmLoading={acceptingTerms} />

      <Modal
        open={showResumeDialog}
        onCancel={() => setShowResumeDialog(false)}
        title="Upload Resume"
        destroyOnHidden
        footer={
          <Space>
            <Button onClick={() => setShowResumeDialog(false)}>Cancel</Button>
            <Button type="primary" loading={savingResume} disabled={!resumeValue?.attachmentURL} onClick={() => resumeForm.submit()}>
              Upload
            </Button>
          </Space>
        }
      >
        <Typography.Paragraph type="secondary">Please upload the candidate&apos;s resume in PDF, DOC, or DOCX format.</Typography.Paragraph>
        <Form form={resumeForm} layout="vertical" onFinish={handleResumeSubmit}>
          <Form.Item name="resume" label="Resume" rules={[{ required: true, message: "Resume is required" }]}>
            <ResumeUploadField accept=".ppt,.pptx,.pdf,.doc,.docx" />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        open={showExceptionDialog}
        onCancel={closeExceptionDialog}
        title="Request Exception"
        destroyOnHidden
        footer={
          <Space>
            <Button onClick={closeExceptionDialog}>Cancel</Button>
            <Button type="primary" loading={sendingException} onClick={() => exceptionForm.submit()}>
              Submit Request
            </Button>
          </Space>
        }
      >
        <Typography.Paragraph type="secondary">Please provide a reason for requesting an exception for this candidate.</Typography.Paragraph>
        <Form form={exceptionForm} layout="vertical" onFinish={handleExceptionSubmit} initialValues={{ comments: "" }}>
          <Form.Item name="comments" label="Comments">
            <Input.TextArea rows={4} placeholder="Enter your comments here..." />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}
