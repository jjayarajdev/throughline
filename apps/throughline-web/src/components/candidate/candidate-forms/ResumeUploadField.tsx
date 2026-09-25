"use client";
import { useState } from "react";
import { Button, Space, Typography, Upload } from "antd";
import { UploadOutlined } from "@ant-design/icons";
import api from "@/lib/axiosInstance";
import { toast } from "@/lib/toast";

export interface Attachment {
  attachmentName: string;
  attachmentURL: string;
}

interface ResumeUploadFieldProps {
  value?: Attachment;
  onChange?: (value: Attachment) => void;
  accept?: string;
  disabled?: boolean;
}

/**
 * Form control for a single attachment: the picked file is posted to `/FileServer/upload`
 * immediately and the form value becomes `{ attachmentName, attachmentURL }` (same as the legacy FileField).
 */
export function ResumeUploadField({ value, onChange, accept = ".pdf,.doc,.docx", disabled }: ResumeUploadFieldProps) {
  const [uploading, setUploading] = useState(false);

  const upload = async (file: File) => {
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await api.post("/FileServer/upload", formData, { headers: { "Content-Type": "multipart/form-data" } });
      const fileName = res.data.fileName || res.data;
      onChange?.({ attachmentURL: fileName, attachmentName: fileName });
    } catch (error) {
      console.error("Upload failed", error);
      toast.error("Upload failed");
    } finally {
      setUploading(false);
    }
    return false;
  };

  return (
    <Space wrap>
      <Upload accept={accept} showUploadList={false} beforeUpload={upload} disabled={disabled || uploading} maxCount={1}>
        <Button icon={<UploadOutlined />} loading={uploading} disabled={disabled}>
          {value?.attachmentURL ? "Replace file" : "Choose file"}
        </Button>
      </Upload>
      {value?.attachmentURL && (
        <Typography.Text type="secondary" ellipsis style={{ maxWidth: 260 }}>
          {value.attachmentName}
        </Typography.Text>
      )}
    </Space>
  );
}

export default ResumeUploadField;
