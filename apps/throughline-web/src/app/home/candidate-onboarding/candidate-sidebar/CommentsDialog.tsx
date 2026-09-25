"use client";
import { useState } from "react";
import { Button, Modal, Tooltip, Typography } from "antd";
import { EyeOutlined } from "@ant-design/icons";

interface ReasonForDeclineDialogProps {
  comments?: string;
  title?: string;
  description?: string;
}

/** Eye button that opens the comment text in a modal. */
export function CommentsDialog({ comments, title = "Reason for Rescheduled", description = "Detailed explanation of why the candidate was rescheduled Date." }: ReasonForDeclineDialogProps) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Tooltip title="View Comments">
        <Button type="text" size="small" icon={<EyeOutlined />} onClick={() => setOpen(true)} />
      </Tooltip>
      <Modal open={open} onCancel={() => setOpen(false)} footer={null} title={title} width={720} destroyOnHidden>
        <Typography.Text type="secondary">{description}</Typography.Text>
        <Typography.Paragraph className="mt-4" style={{ whiteSpace: "pre-wrap", maxHeight: 400, overflowY: "auto" }}>
          {comments || "No comments available."}
        </Typography.Paragraph>
      </Modal>
    </>
  );
}
