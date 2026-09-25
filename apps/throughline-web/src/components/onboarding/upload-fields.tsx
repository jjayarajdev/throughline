"use client";
import { List } from "@/components/throughline/List";
import React, { useState } from "react";
import { Button, Flex, Modal, Space, Spin, Table, Tooltip, Typography, Upload } from "antd";
import type { UploadProps } from "antd";
import { DeleteOutlined, DownloadOutlined, EyeOutlined, FileTextOutlined, UploadOutlined } from "@ant-design/icons";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/axiosInstance";
import { toast } from "@/lib/toast";
import { partnerApi } from "@/services/api/partner.profile.api";

/**
 * Attachment inputs for the onboarding forms, on Ant Design's Upload.
 * Files are pushed to `/FileServer/upload` as soon as they are picked (same as the
 * legacy FileField / MultiDocumentField); the form value stays `{ attachmentName, attachmentURL }`.
 */

export interface Attachment {
  id?: number;
  attachmentName?: string;
  attachmentURL?: string;
  [key: string]: any;
}

const ACCEPT = ".ppt,.pptx,.pdf,.doc,.docx";

/** Full URL for a stored file name (already-absolute URLs pass through). */
export const previewUrl = (file?: Attachment | null) => {
  const url = file?.attachmentURL;
  if (!url) return "";
  return url.startsWith("http") ? url : `${process.env.NEXT_PUBLIC_API_BASE_URL}/FileServer/${url}`;
};

export async function uploadToFileServer(file: File): Promise<string> {
  const formData = new FormData();
  formData.append("file", file);
  const res = await api.post("/FileServer/upload", formData, { headers: { "Content-Type": "multipart/form-data" } });
  return res.data.fileName || res.data;
}

/** Eye button that opens the document in a Modal (iframe) with a download action. */
export function DocPreviewButton({ url, fileName }: { url?: string; fileName?: string }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  return (
    <>
      <Tooltip title="View">
        <Button
          type="text"
          size="small"
          icon={<EyeOutlined />}
          onClick={() => {
            setLoading(true);
            setOpen(true);
          }}
        />
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
          <iframe src={url} title={fileName || "Document preview"} style={{ width: "100%", height: "80vh", border: 0 }} onLoad={() => setLoading(false)} />
        </Spin>
      </Modal>
    </>
  );
}

interface AttachmentUploadProps {
  value?: Attachment;
  onChange?: (value: Attachment) => void;
  accept?: string;
  disabled?: boolean;
  /** show an eye button that previews the current file */
  preview?: boolean;
  previewName?: string;
}

/** Single attachment (Form.Item-controlled). */
export function AttachmentUpload({ value, onChange, accept = ACCEPT, disabled, preview, previewName }: AttachmentUploadProps) {
  const [uploading, setUploading] = useState(false);
  const customRequest: UploadProps["customRequest"] = async ({ file, onSuccess, onError }) => {
    setUploading(true);
    try {
      const fileName = await uploadToFileServer(file as File);
      onChange?.({ attachmentURL: fileName, attachmentName: fileName });
      onSuccess?.(fileName);
    } catch (error) {
      console.error("Upload failed", error);
      onError?.(error as Error);
    } finally {
      setUploading(false);
    }
  };
  return (
    <Space wrap>
      <Upload accept={accept} showUploadList={false} customRequest={customRequest} disabled={disabled || uploading} maxCount={1}>
        <Button icon={<UploadOutlined />} loading={uploading} disabled={disabled}>
          Choose file
        </Button>
      </Upload>
      {value?.attachmentURL && (
        <Typography.Text type="secondary" ellipsis style={{ maxWidth: 240 }}>
          {value.attachmentName}
        </Typography.Text>
      )}
      {preview && <DocPreviewButton url={previewUrl(value)} fileName={previewName || value?.attachmentName} />}
    </Space>
  );
}

interface MultiDocumentUploadProps {
  value?: Attachment[];
  onChange?: (docs: Attachment[]) => void;
  accept?: string;
  disabled?: boolean;
  maxFiles?: number;
  candiadateBGVId?: number;
  isCreating?: boolean;
  isToggle?: boolean;
  docType?: number;
  additionalDocId?: number;
  uploadBGVDocId?: number;
}

/** Several attachments (Form.Item-controlled) with the "Previous Documents" history modal. */
export function MultiDocumentUpload({
  value,
  onChange,
  accept = ACCEPT,
  disabled,
  maxFiles = 10,
  candiadateBGVId,
  isCreating = false,
  isToggle,
  docType,
  additionalDocId,
  uploadBGVDocId,
}: MultiDocumentUploadProps) {
  const docs = value ?? [];
  const [uploading, setUploading] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);

  const historyUrl = `onboarding/CandidateBgv/paged/documents?bgvDocId=${candiadateBGVId}&docType=${docType}`;
  const { data: history, refetch, isFetching } = useQuery({
    queryKey: ["capabilityDeckDocuments", candiadateBGVId, docType, currentPage, pageSize],
    queryFn: () => partnerApi.getcapabilityDeckDocuments(historyUrl, { pageNumber: currentPage, pageSize, searchText: undefined }),
    enabled: historyOpen,
    refetchOnWindowFocus: true,
  });
  const historyRows: any[] = history?.items || [];

  const customRequest: UploadProps["customRequest"] = async ({ file, onSuccess, onError }) => {
    if (docs.length >= maxFiles) {
      toast.error(`Maximum ${maxFiles} files allowed`);
      return;
    }
    setUploading(true);
    try {
      const fileName = await uploadToFileServer(file as File);
      const doc: Attachment = {
        id: 0,
        attachmentURL: fileName,
        attachmentName: fileName,
        name: fileName,
        partnerId: 0,
        partnerEmpanelId: 0,
        candiadateBGVId: isCreating ? 0 : candiadateBGVId ? Number(candiadateBGVId) : 0,
      };
      onChange?.([...docs, doc]);
      toast.success("Document uploaded successfully");
      onSuccess?.(fileName);
    } catch (error) {
      console.error("Upload failed", error);
      toast.error("Failed to upload document");
      onError?.(error as Error);
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (doc: Attachment) => {
    try {
      if (doc?.attachmentURL) await api.delete(`/FileServer/${doc?.attachmentName}`);
      onChange?.(docs.filter((d) => d?.attachmentURL !== doc?.attachmentURL));
      if (historyOpen) await refetch();
      toast.success("Document deleted successfully");
    } catch (error: any) {
      console.error("Delete failed", error);
      toast.error(error?.response?.data?.message || error?.message || "Failed to delete document");
    }
  };

  const isLatestOnly = !isToggle && (!!additionalDocId || !!uploadBGVDocId);
  const shown = isLatestOnly && docs.length ? [docs[docs.length - 1]] : docs;
  const canShowHistory = !!additionalDocId || !!uploadBGVDocId;

  return (
    <Flex vertical gap={8}>
      <Space wrap>
        <Upload accept={accept} showUploadList={false} customRequest={customRequest} disabled={disabled || uploading || docs.length >= maxFiles}>
          <Button icon={<UploadOutlined />} loading={uploading} disabled={disabled || docs.length >= maxFiles}>
            Add document
          </Button>
        </Upload>
        <Button
          disabled={!canShowHistory}
          onClick={() => {
            setHistoryOpen(true);
            refetch();
          }}
        >
          Previous Documents
        </Button>
      </Space>
      {docs.length >= maxFiles && (
        <Typography.Text type="warning">Maximum {maxFiles} files allowed. Delete a file to upload a new one.</Typography.Text>
      )}
      {shown.length > 0 && (
        <List
          size="small"
          bordered
          dataSource={shown}
          rowKey={(d) => `${d?.attachmentName}-${d?.id ?? 0}`}
          renderItem={(doc, i) => {
            const index = isLatestOnly ? docs.length - 1 : i;
            const isLatest = index === docs.length - 1;
            return (
              <List.Item
                actions={[
                  <DocPreviewButton key="view" url={previewUrl(doc)} fileName={doc?.attachmentName} />,
                  <Tooltip key="delete" title="Delete document">
                    <Button type="text" size="small" danger icon={<DeleteOutlined />} disabled={disabled} onClick={() => handleDelete(doc)} />
                  </Tooltip>,
                ]}
              >
                <List.Item.Meta
                  avatar={<FileTextOutlined />}
                  title={
                    <Typography.Text ellipsis title={doc?.attachmentName}>
                      {doc?.attachmentName}
                    </Typography.Text>
                  }
                  description={isLatest ? "Latest Document" : `Document ${index + 1}`}
                />
              </List.Item>
            );
          }}
        />
      )}
      <Modal open={historyOpen} onCancel={() => setHistoryOpen(false)} title="Previous Documents" width={960} footer={null} destroyOnHidden>
        <Table
          size="small"
          rowKey={(r: any) => r?.id ?? r?.attachmentName}
          loading={isFetching}
          dataSource={historyRows}
          scroll={{ x: "max-content" }}
          pagination={{
            current: currentPage,
            pageSize,
            total: history?.totalCount ?? 0,
            showSizeChanger: true,
            onChange: (page, size) => {
              setCurrentPage(page);
              setPageSize(size);
            },
          }}
          columns={[
            { key: "sno", title: "S.No", render: (_: unknown, __: unknown, i: number) => (currentPage - 1) * pageSize + i + 1, width: 70 },
            { key: "attachmentName", title: "File Name", dataIndex: "attachmentName", ellipsis: true },
            { key: "createdDate", title: "Date", dataIndex: "createdDate" },
            { key: "createdTime", title: "Time", dataIndex: "createdTime" },
            { key: "view", title: "View", render: (_: unknown, d: any) => <DocPreviewButton url={d?.attachmentURL} fileName={d?.attachmentName} />, width: 70 },
            {
              key: "delete",
              title: "Delete",
              width: 80,
              render: (_: unknown, d: any) => (
                <Tooltip title="Delete document">
                  <Button type="text" size="small" danger icon={<DeleteOutlined />} onClick={() => handleDelete(d)} />
                </Tooltip>
              ),
            },
          ]}
        />
      </Modal>
    </Flex>
  );
}
