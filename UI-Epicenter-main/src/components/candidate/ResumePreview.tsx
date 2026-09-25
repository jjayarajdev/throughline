"use client";
import { useState } from "react";
import { Button, Flex, Modal, Spin, Tooltip, Typography } from "antd";
import { DownloadOutlined, EyeOutlined } from "@ant-design/icons";

interface ResumePreviewProps {
  url: string;
  fileName?: string;
}

/** Eye button that opens the document in a large modal with an iframe and a download link. */
export function ResumePreview({ url, fileName }: ResumePreviewProps) {
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
        afterOpenChange={(o) => o && setLoading(true)}
        footer={
          <Flex justify="flex-end">
            <Button icon={<DownloadOutlined />} onClick={() => window.open(url, "_blank")}>
              Download
            </Button>
          </Flex>
        }
      >
        <Spin spinning={loading} description="Loading document...">
          <iframe src={url} title="Resume Preview" style={{ width: "100%", height: "78vh", border: 0 }} onLoad={() => setLoading(false)} />
        </Spin>
        {loading && (
          <Typography.Text type="secondary" className="block mt-2">
            This may take a few seconds
          </Typography.Text>
        )}
      </Modal>
    </>
  );
}

export default ResumePreview;
