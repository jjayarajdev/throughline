"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, DatePicker, Flex, Modal, Spin, Tooltip, Typography } from "antd";
import { DownloadOutlined, EyeOutlined } from "@ant-design/icons";
import dayjs, { type Dayjs } from "dayjs";
import { AxiosError } from "axios";
import { EnumType } from "@/constants/slot-status";
import { getTatHours, tatFormat } from "@/helpers/helper";
import type { CandidateDetailsTypes } from "./types";

/** A row of any slot-management grid: the shared candidate shape plus whatever the endpoint adds. */
export type SlotRow = Omit<CandidateDetailsTypes, "resume"> & {
  /** the list endpoints return the attachment object, not the legacy string */
  resume?: { id?: number; attachmentName?: string; attachmentURL?: string } | null;
  [key: string]: any;
};

/** `{ from, to }` range kept as Dates so the API receives the same ISO strings as before. */
export type DateRangeValue = { from?: Date; to?: Date } | undefined;

const RANGE_MIN = dayjs(new Date(2023, 0, 1));

/** Date-range filter shared by the slot grids (2023-01-01 .. today). */
export function DateRangeFilter({ value, onChange }: { value: DateRangeValue; onChange: (v: DateRangeValue) => void }) {
  const from = value?.from ? dayjs(value.from) : null;
  const to = value?.to ? dayjs(value.to) : null;
  return (
    <DatePicker.RangePicker
      value={from || to ? [from, to] : null}
      minDate={RANGE_MIN}
      maxDate={dayjs()}
      placeholder={["Start date", "End date"]}
      allowClear
      onChange={(range) => {
        const [f, t] = (range ?? [null, null]) as [Dayjs | null, Dayjs | null];
        onChange(f || t ? { from: f?.toDate(), to: t?.toDate() } : undefined);
      }}
    />
  );
}

/** HRQ ID cell linking to the hiring details page. */
export function HrqLink({ hrqId }: { hrqId?: string }) {
  const router = useRouter();
  if (!hrqId) return null;
  return <Typography.Link onClick={() => router.push(`/home/hiring-details?hrqid=${hrqId}`)}>{hrqId}</Typography.Link>;
}

/** Candidate code cell linking to the candidate profile. */
export function CandidateLink({ code }: { code?: string }) {
  const router = useRouter();
  if (!code) return null;
  return <Typography.Link onClick={() => router.push(`/home/candidate-management/candidate-profile?id=${code}`)}>{code}</Typography.Link>;
}

/** Comma-separated names, one per line. */
export function PanelNames({ names }: { names?: string | null }) {
  if (!names) return null;
  const parts = names
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  return (
    <Flex vertical gap={2}>
      {parts.map((p, i) => (
        <span key={i}>{p}</span>
      ))}
    </Flex>
  );
}

/** TAT in days; red once the TAT threshold (hours) is exceeded. */
export function TatCell({ tatDate }: { tatDate?: string }) {
  if (!tatDate) return null;
  const overdue = getTatHours(tatDate) > EnumType.tat;
  return <Typography.Text type={overdue ? "danger" : undefined}>{tatFormat(tatDate)}</Typography.Text>;
}

/** Eye button that opens the resume in a full-height modal (iframe) with a download action. */
export function ResumePreview({ url, fileName }: { url?: string; fileName?: string }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  if (!url) return null;
  return (
    <>
      <Tooltip title="Preview resume">
        <Button type="text" size="small" icon={<EyeOutlined />} onClick={() => setOpen(true)} />
      </Tooltip>
      <Modal
        open={open}
        onCancel={() => setOpen(false)}
        title={fileName || "Document"}
        width="94vw"
        destroyOnHidden
        afterClose={() => setLoading(true)}
        footer={
          <Button icon={<DownloadOutlined />} onClick={() => window.open(url, "_blank")}>
            Download
          </Button>
        }
      >
        <Spin spinning={loading} description="Loading document...">
          <iframe src={url} title="Resume Preview" style={{ width: "100%", height: "78vh", border: 0 }} onLoad={() => setLoading(false)} />
        </Spin>
      </Modal>
    </>
  );
}

/** Client-side comparator for the columns the legacy grids sorted in the browser. */
export const bySortKey =
  (key: string) =>
  (a: SlotRow, b: SlotRow): number => {
    const av = a[key] ?? "";
    const bv = b[key] ?? "";
    if (typeof av === "string" && typeof bv === "string") return av.localeCompare(bv);
    if (typeof av === "number" && typeof bv === "number") return av - bv;
    return 0;
  };

/** Message for a failed request, matching the legacy ErrorHandler wording. */
export function apiErrorMessage(error: unknown): string {
  let message = "Something went wrong. Please try again.";
  if (error instanceof AxiosError) message = (error.response?.data as { message?: string } | undefined)?.message || error.message;
  else if (error instanceof Error && error.message) message = error.message;
  return message === "Object reference not set to an instance of an object." ? "No data available at the moment. Please try again later." : message;
}
