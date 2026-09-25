"use client";
import { Descriptions, Drawer, Empty } from "antd";
import type { Hiring } from "@/services/api/hiring.api";
import { StatusBadge } from "../status-badge";

interface HiringDetailSheetProps {
  isOpen: boolean;
  onClose: () => void;
  candidate: Hiring | null;
  children?: React.ReactNode;
  title?: string;
  /** rendered in the Drawer footer (actions) */
  footer?: React.ReactNode;
}

/** Right-hand drawer with the hiring request summary; `children` render below the summary. */
export function HiringDetailSheet({ isOpen, onClose, candidate, children, title = "Hiring Details", footer }: HiringDetailSheetProps) {
  const c = candidate as (Hiring & { interviewModeName?: string; panelNames?: string; requestorName?: string }) | null;
  return (
    <Drawer open={isOpen} onClose={onClose} title={title} size="large" destroyOnHidden footer={footer}>
      {c ? (
        <>
          <Descriptions bordered size="small" column={1} styles={{ label: { width: 180 } }}>
            <Descriptions.Item label="Hiring status">
              <StatusBadge status={c.hiringStatusName ?? ""} />
            </Descriptions.Item>
            <Descriptions.Item label="HRQ ID">{c.hrqId || "-"}</Descriptions.Item>
            <Descriptions.Item label="Project">{c.projectName || "-"}</Descriptions.Item>
            <Descriptions.Item label="Requestor">{c.requestorName || "-"}</Descriptions.Item>
            <Descriptions.Item label="Role hired for">{c.jobTitle || "-"}</Descriptions.Item>
            {c.interviewModeName && <Descriptions.Item label="Mode of interview">{c.interviewModeName}</Descriptions.Item>}
            {c.panelNames && <Descriptions.Item label="Panel members">{c.panelNames}</Descriptions.Item>}
          </Descriptions>
          {children}
        </>
      ) : (
        <Empty description="No hiring request selected" />
      )}
    </Drawer>
  );
}
