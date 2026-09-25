"use client";
import React from "react";
import { Descriptions, Drawer, Empty } from "antd";
import type { CandidateDetailsTypes } from "../types";

interface CandidateDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  candidate: CandidateDetailsTypes | null;
  title?: string;
  /** rendered in the Drawer footer (actions) */
  footer?: React.ReactNode;
  children?: React.ReactNode;
}

function formatDays(value?: string | string[] | null) {
  if (Array.isArray(value)) return value.map((d) => d.charAt(0).toUpperCase() + d.slice(1)).join(", ");
  return value || "-";
}

/** Right-hand drawer with the candidate summary; `children` (the action form) render below it. */
export function CandidateDrawer({ isOpen, onClose, candidate, title = "Candidate Details", footer, children }: CandidateDrawerProps) {
  const c = candidate as (CandidateDetailsTypes & { additionalPanel?: number[] }) | null;
  return (
    <Drawer open={isOpen} onClose={onClose} title={title} size="large" destroyOnHidden footer={footer}>
      {c ? (
        <>
          <Descriptions bordered size="small" column={1} styles={{ label: { width: 180 } }}>
            <Descriptions.Item label="Candidate Name">{c.candidateName || c.fullName || "-"}</Descriptions.Item>
            {c.intakeStatusName && <Descriptions.Item label="Status">{c.intakeStatusName}</Descriptions.Item>}
            {c.interviewModeName && <Descriptions.Item label="Mode of Interview">{c.interviewModeName}</Descriptions.Item>}
            {c.panelNames && <Descriptions.Item label="Panel Member">{c.panelNames}</Descriptions.Item>}
            {c.availableDays && <Descriptions.Item label="Available Days">{formatDays(c.availableDays)}</Descriptions.Item>}
            {c.rejectionCount ? <Descriptions.Item label="Declined">{c.rejectionCount}</Descriptions.Item> : null}
            {c.hmComments && <Descriptions.Item label="Hiring Comments">{c.hmComments}</Descriptions.Item>}
            {c.partnerComments && <Descriptions.Item label="Partner Comments">{c.partnerComments}</Descriptions.Item>}
          </Descriptions>
          {children}
        </>
      ) : (
        <Empty description="No candidate selected" />
      )}
    </Drawer>
  );
}
