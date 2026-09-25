"use client";
import { Avatar, Flex, Space, Statistic, Typography } from "antd";

interface PartnerHeaderProps {
  partner: any;
}

/** Partner name, initials avatar and headline performance numbers. */
export function PartnerHeader({ partner }: PartnerHeaderProps) {
  return (
    <Flex align="center" gap={16} wrap>
      <Avatar shape="square" size={80} style={{ fontSize: 24, fontWeight: 600 }}>
        {partner?.partnerDetails?.nickname?.slice(0, 2) || "N/A"}
      </Avatar>
      <Flex vertical gap={4}>
        <Typography.Title level={4} style={{ margin: 0 }}>
          {partner?.partnerDetails?.partnerName}
        </Typography.Title>
        <Space size={24} wrap>
          <Statistic title="Total Profile Submitted" value={partner?.totalProfileSubmitted ?? 0} />
          <Statistic title="Total Closures" value={partner?.totalClosures ?? 0} />
          <Statistic title="Conversion Rate" value={partner?.conversionRate ?? 0} />
          <Statistic title="Score" value={Math.floor(partner?.score ?? 0)} />
          <Statistic title="Rank" value={Math.floor(partner?.rank ?? 0)} />
        </Space>
      </Flex>
    </Flex>
  );
}
