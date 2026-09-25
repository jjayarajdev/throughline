"use client";
import { useState } from "react";
import { Card, Flex, Tabs, Typography } from "antd";
import EngagementStatusTable from "@/components/engagement-tables/engagement-status-table";

const TABS = [
  { key: "1", label: "Evaluation In Progress" },
  { key: "2", label: "Evaluation Expiring" },
  { key: "3", label: "Evaluation Completed" },
  { key: "4", label: "Empaneled" },
  { key: "5", label: "Evaluation Rejected" },
];

/** Engagement Management: partners grouped by evaluation status. */
export default function PartnerEngagement() {
  const [activeTab, setActiveTab] = useState("1");

  return (
    <Flex vertical gap={16} className="p-4">
      <Typography.Title level={4} style={{ margin: 0 }}>
        Engagement Management
      </Typography.Title>
      <Card>
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          destroyOnHidden
          items={TABS.map((tab) => ({ key: tab.key, label: tab.label, children: <EngagementStatusTable statusId={tab.key} /> }))}
        />
      </Card>
    </Flex>
  );
}
