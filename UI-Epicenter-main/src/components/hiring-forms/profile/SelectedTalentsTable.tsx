"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Empty, Table, Typography } from "antd";
import type { ColumnsType } from "antd/es/table";
import { SwapOutlined } from "@ant-design/icons";
import { StatusBadge } from "@/components/status-badge";
import { tatFormat } from "@/helpers/helper";
import { isAdmin, isRmowner, isVendorManager } from "@/store/userStore";
import type { CandidateDetailsTypes } from "@/components/slot-management/types";
import TransferCandidateSheet from "@/components/hiring-forms/profile/sheets/TransferCandidateSheet";
import { DocumentPreview } from "../shared";

interface Talent {
  candidateName: any;
  nickName: string;
  currentInterviewRoundName: string;
  interviewTatDate?: any;
  id: string;
  name: string;
  email: string;
  partner: string;
  status: string;
  candidateCode: string;
  fullName: string;
  partnerName: string;
  intakeStatusName: string;
  enableCandidateHrqTransfer?: boolean;
  resume?: {
    attachmentURL?: string;
  };
}

interface SelectedTalentsTableProps {
  talents: Talent[];
  onToggleAll?: (checked: boolean) => void;
  onToggleOne?: (id: string, checked: boolean) => void;
  actionVisible?: boolean;
}

/** Candidates attached to a hiring request (talent pool / pipeline / identified / rejected). */
export function SelectedTalentsTable({ talents, actionVisible = false }: SelectedTalentsTableProps) {
  const router = useRouter();
  const [selectedCandidate, setSelectedCandidate] = useState<CandidateDetailsTypes | null>(null);

  if (!talents || talents.length === 0) {
    return <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="There are no candidates at the moment." />;
  }

  const showActions = actionVisible && (isRmowner || isAdmin || isVendorManager);

  const columns: ColumnsType<Talent> = [
    {
      key: "candidateCode",
      title: "Candidate ID",
      dataIndex: "candidateCode",
      render: (v: string) => <Typography.Link onClick={() => router.push(`/home/candidate-management/candidate-profile?id=${v}`)}>{v}</Typography.Link>,
    },
    { key: "fullName", title: "Candidate Name", dataIndex: "fullName" },
    { key: "email", title: "Candidate Email", dataIndex: "email" },
    { key: "nickName", title: "Partner", dataIndex: "nickName" },
    { key: "intakeStatusName", title: "Intake Status", dataIndex: "intakeStatusName", render: (v: string) => <StatusBadge status={v} /> },
    {
      key: "resume",
      title: "Resume",
      render: (_: unknown, t) => (t.resume?.attachmentURL ? <DocumentPreview url={t.resume.attachmentURL} fileName={`${t.candidateName}'s Resume`} /> : null),
    },
    { key: "tat", title: "TAT (Hours/Days)", render: (_: unknown, t) => <StatusBadge status={tatFormat(t.interviewTatDate as any)} /> },
    ...(showActions
      ? [
          {
            key: "actions",
            title: "Actions",
            width: 130,
            render: (_: unknown, t: Talent) =>
              t.enableCandidateHrqTransfer ? (
                <Button type="primary" size="small" icon={<SwapOutlined />} onClick={() => setSelectedCandidate(t as unknown as CandidateDetailsTypes)}>
                  Transfer
                </Button>
              ) : null,
          } as ColumnsType<Talent>[number],
        ]
      : []),
  ];

  return (
    <>
      <Table<Talent> size="middle" rowKey="id" columns={columns} dataSource={talents} pagination={false} scroll={{ x: "max-content" }} />
      {selectedCandidate && <TransferCandidateSheet isOpen onClose={() => setSelectedCandidate(null)} selectedCandidate={selectedCandidate} />}
    </>
  );
}
