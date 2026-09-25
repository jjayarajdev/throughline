"use client";
import React, { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Breadcrumb, Button, Modal, Spin, Tooltip, Typography } from "antd";
import { DownloadOutlined, EyeOutlined } from "@ant-design/icons";
import type { FormItemProps } from "antd";
import axios from "axios";
import dayjs, { type Dayjs } from "dayjs";

/** Shared bits for the hiring area: breadcrumb, document preview, error text and Form.Item value adapters. */

type IdName = { id: number | string; name: string };

/** Single-select options with string values — the legacy SelectField stored `String(id)`. */
export const toOptions = (list?: IdName[] | null) => (list ?? []).map((o) => ({ value: String(o.id), label: o.name }));

/** Multi-select options keyed by numeric id. */
export const toIdOptions = (list?: IdName[] | null) => (list ?? []).map((o) => ({ value: o.id as number, label: o.name }));

/**
 * Form.Item adapter so a `Select mode="multiple" labelInValue` keeps the legacy value shape
 * `[{ id, name }]` in the form store (the zod schemas and payload mappers rely on it).
 */
export const idNameMulti: Pick<FormItemProps, "getValueProps" | "normalize"> = {
  getValueProps: (v?: { id: number; name: string }[]) => ({ value: (v ?? []).map((o) => ({ value: o.id, label: o.name })) }),
  normalize: (v?: { value: number; label: React.ReactNode }[]) => (v ?? []).map((o) => ({ id: o.value, name: String(o.label ?? "") })),
};

/** Form.Item adapter so a `DatePicker` stores the legacy "YYYY-MM-DD" string. */
export const dateItem: Pick<FormItemProps, "getValueProps" | "normalize"> = {
  getValueProps: (v?: string) => ({ value: v ? dayjs(v) : undefined }),
  normalize: (v?: Dayjs | null) => (v ? v.format("YYYY-MM-DD") : ""),
};

/** Human message for a failed request (same rules as the legacy ErrorHandler). */
export function errorMessage(err: unknown): string {
  const msg = axios.isAxiosError(err) ? (err.response?.data as { message?: string } | undefined)?.message || err.message : (err as Error | undefined)?.message;
  if (msg === "Object reference not set to an instance of an object.") return "No data available at the moment. Please try again later.";
  return msg || "Something went wrong. Please try again.";
}

const label = (s: string) => s.replace(/-/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());

/** Breadcrumb from the pathname: Home → segments; intermediate crumbs go back in history like the legacy Breadcrumbs. */
export function PathBreadcrumb() {
  const pathname = usePathname();
  const router = useRouter();
  const segments = pathname.split("/").filter(Boolean).filter((s) => s !== "home");
  return (
    <Breadcrumb
      items={[
        { title: <Link href="/home/dashboard">Home</Link> },
        ...segments.map((seg, idx) =>
          idx === segments.length - 1 ? { title: label(seg) } : { title: <Typography.Link onClick={() => router.back()}>{label(seg)}</Typography.Link> }
        ),
      ]}
    />
  );
}

/** Eye button that previews a document URL in a modal, with a download action. */
export function DocumentPreview({ url, fileName }: { url: string; fileName?: string }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  return (
    <>
      <Tooltip title="Preview">
        <Button type="text" size="small" icon={<EyeOutlined />} onClick={() => setOpen(true)} />
      </Tooltip>
      <Modal
        open={open}
        onCancel={() => setOpen(false)}
        title={fileName || "Document"}
        width="94vw"
        style={{ top: 16 }}
        destroyOnHidden
        footer={
          <Button icon={<DownloadOutlined />} onClick={() => window.open(url, "_blank")}>
            Download
          </Button>
        }
      >
        <Spin spinning={loading} description="Loading document...">
          <iframe src={url} title="Document preview" style={{ width: "100%", height: "80vh", border: 0 }} onLoad={() => setLoading(false)} />
        </Spin>
      </Modal>
    </>
  );
}
