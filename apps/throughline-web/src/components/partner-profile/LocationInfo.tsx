"use client";
import { Card, Flex, Typography, theme } from "antd";
import { EnvironmentOutlined } from "@ant-design/icons";

interface LocationInfoProps {
  partner: any;
}

/** Partner's registered location. */
export function LocationInfo({ partner }: LocationInfoProps) {
  const { token } = theme.useToken();
  return (
    <Card size="small">
      <Flex gap={12} align="start">
        <EnvironmentOutlined style={{ fontSize: 22, color: token.colorTextSecondary, marginTop: 4 }} />
        <Flex vertical>
          <Typography.Text strong>
            {partner?.countryName}, {partner?.stateName}, {partner?.cityName}
          </Typography.Text>
          <Typography.Text type="secondary">{partner?.address}</Typography.Text>
        </Flex>
      </Flex>
    </Card>
  );
}
