"use client";
import { Button, Card, List, Tooltip, Typography } from "antd";
import { DownloadOutlined, FileTextOutlined } from "@ant-design/icons";

interface DocumentsListProps {
  documents: any[];
}

/** Partner's uploaded files with a download link each. */
export function DocumentsList({ documents }: DocumentsListProps) {
  return (
    <Card size="small">
      <List
        size="small"
        dataSource={documents ?? []}
        locale={{ emptyText: "No documents" }}
        renderItem={(file: any) => (
          <List.Item
            actions={
              file.attachmentURL
                ? [
                    <Tooltip title="Download" key="download">
                      <Button type="text" icon={<DownloadOutlined />} href={file.attachmentURL} target="_blank" />
                    </Tooltip>,
                  ]
                : undefined
            }
          >
            <List.Item.Meta
              avatar={<FileTextOutlined style={{ fontSize: 20 }} />}
              title={
                <Typography.Text ellipsis={{ tooltip: file.attachmentName }} style={{ maxWidth: 220 }}>
                  {file.attachmentName}
                </Typography.Text>
              }
              description={file.size ? <Typography.Text type="secondary">{file.size}</Typography.Text> : undefined}
            />
          </List.Item>
        )}
      />
    </Card>
  );
}
