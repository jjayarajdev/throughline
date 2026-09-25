"use client";
import { Descriptions, Drawer, Empty } from "antd";
import type { CandidateDetailsTypes } from "../slot-management/types";

interface CandidateDetailsSheetProps {
  isOpen: boolean;
  onClose: () => void;
  candidate: CandidateDetailsTypes | null;
  children?: React.ReactNode;
  title?: string;
  /** rendered in the Drawer footer (actions) */
  footer?: React.ReactNode;
}

function formatArray(value?: string | string[] | null) {
  if (Array.isArray(value)) return value.map((day) => day.charAt(0).toUpperCase() + day.slice(1)).join(", ");
  return value || "-";
}

/** Right-hand drawer with the candidate summary; `children` render below the summary. */
export function CandidateDetailsSheet({ isOpen, onClose, candidate, children, title = "Candidate Details", footer }: CandidateDetailsSheetProps) {
  const c = candidate;
  const items = c
    ? [
        { key: "name", label: "Candidate Name", children: c.candidateName || c.fullName || "-" },
        ...(c.intakeStatusName ? [{ key: "status", label: "Status", children: c.intakeStatusName }] : []),
        ...(c.interviewModeName ? [{ key: "mode", label: "Mode of Interview", children: c.interviewModeName }] : []),
        ...(c.panelNames ? [{ key: "panel", label: "Panel Member", children: c.panelNames || "No panel members assigned" }] : []),
        ...(c.availableDays ? [{ key: "days", label: "Available Days", children: formatArray(c.availableDays) }] : []),
        ...(c.rejectionCount ? [{ key: "declined", label: "Declined", children: String(c.rejectionCount) }] : []),
        ...(c.hmComments ? [{ key: "hm", label: "Hiring Comments", children: c.hmComments || "No comments available" }] : []),
        ...(c.partnerComments ? [{ key: "partner", label: "Partner Comments", children: c.partnerComments || "No comments available" }] : []),
      ]
    : [];

  return (
    <Drawer open={isOpen} onClose={onClose} title={title} size="large" destroyOnHidden footer={footer}>
      {c ? (
        <>
          <Descriptions bordered size="small" column={1} styles={{ label: { width: 180 } }} items={items} />
          {children}
        </>
      ) : (
        <Empty description="No candidate selected" />
      )}
    </Drawer>
  );
}
