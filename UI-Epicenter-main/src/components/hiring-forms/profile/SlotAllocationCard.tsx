"use client";
import { List } from "@/components/throughline/List";
import type { ReactNode } from "react";
import { Card, Empty, Space, Tag, Typography } from "antd";
import { BankOutlined, TeamOutlined } from "@ant-design/icons";

interface Partner {
  nickname: ReactNode;
  partnerId: number;
  partnerName: string;
  partnerCode: string;
  contributions: number;
}

/** Side card with the partners contributing candidates to the hiring request. */
export function SlotAllocationCard({ data }: { data?: Partner[] }) {
  if (!data || data.length === 0) {
    return (
      <Card title="Partner Allocation" size="small">
        <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="There is not partner allocated" />
      </Card>
    );
  }

  return (
    <Card
      title="Partner Allocation"
      size="small"
      extra={
        <Tag style={{ marginInlineEnd: 0 }}>
          {data.length} {data.length === 1 ? "Partner" : "Partners"}
        </Tag>
      }
    >
      <List
        size="small"
        dataSource={data}
        rowKey={(p) => p.partnerCode}
        style={{ maxHeight: 320, overflowY: "auto" }}
        renderItem={(partner) => (
          <List.Item extra={<Tag style={{ marginInlineEnd: 0 }}>{partner.partnerCode}</Tag>}>
            <List.Item.Meta
              title={
                <Space size={6}>
                  <BankOutlined />
                  {partner.nickname}
                </Space>
              }
              description={
                <Typography.Text type="secondary">
                  <Space size={6}>
                    <TeamOutlined />
                    {partner.contributions} Submissions
                  </Space>
                </Typography.Text>
              }
            />
          </List.Item>
        )}
      />
    </Card>
  );
}
