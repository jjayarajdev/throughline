"use client";
import { Avatar, Card, Empty, Flex, List, Space, Tag, Typography } from "antd";
import { CalendarOutlined, FileTextOutlined, ShopOutlined } from "@ant-design/icons";
import { format } from "date-fns";

interface Interview {
  interviewSlotId: number;
  time: any;
  date: any;
  nickname: string;
  candidateName: string | undefined;
  id: string;
  name: string;
  avatarUrl?: string;
  candidateId: string;
  company: string;
  round: string;
  datetime: string;
}

interface UpcomingInterviewsCardProps {
  interviews: Interview[];
  onSeeAll?: () => void;
}

const initials = (name?: string) =>
  name
    ?.split(" ")
    .map((n) => n[0])
    .join("") || "?";

/** Side card listing the next scheduled interviews for the hiring request. */
export function UpcomingInterviewsCard({ interviews }: UpcomingInterviewsCardProps) {
  return (
    <Card title="Upcoming Interviews" size="small">
      {!interviews || interviews.length === 0 ? (
        <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="There is no upcoming Interviews" />
      ) : (
        <List
          size="small"
          dataSource={interviews}
          rowKey={(i) => i.interviewSlotId}
          style={{ maxHeight: 240, overflowY: "auto" }}
          renderItem={(i) => (
            <List.Item>
              <List.Item.Meta
                avatar={<Avatar src={i.avatarUrl}>{initials(i.candidateName)}</Avatar>}
                title={
                  <Flex justify="space-between" align="center" gap={8}>
                    <span>{i.candidateName}</span>
                    <Tag color="blue" style={{ marginInlineEnd: 0 }}>
                      {i.round}
                    </Tag>
                  </Flex>
                }
                description={
                  <Space direction="vertical" size={2}>
                    <Typography.Text type="secondary">
                      <Space size={6}>
                        <FileTextOutlined />
                        {i.candidateId}
                        <ShopOutlined />
                        {i.nickname}
                      </Space>
                    </Typography.Text>
                    <Typography.Text type="secondary">
                      <Space size={6}>
                        <CalendarOutlined />
                        {format(new Date(`${String(i.date).split("T")[0]}T${i.time}`), "MMM dd, yyyy - hh:mm aa")}
                      </Space>
                    </Typography.Text>
                  </Space>
                }
              />
            </List.Item>
          )}
        />
      )}
    </Card>
  );
}
