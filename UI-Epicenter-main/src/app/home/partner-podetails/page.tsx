"use client";
import { useState } from "react";
import { Flex, Tabs, Typography } from "antd";
import PartnerSowManagement from "@/components/sow-management/partner-sow-list";
import CompleteSowList from "@/components/sow-management/sow-list";

/** SOW management: partner-wise SOWs and the complete SOW list. */
export default function SowManagement() {
  const [activeTab, setActiveTab] = useState("partnerwise");

  return (
    <Flex vertical gap={16} className="p-4">
      <Typography.Title level={4} style={{ margin: 0 }}>
        Sow Management
      </Typography.Title>
      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        destroyOnHidden
        items={[
          { key: "partnerwise", label: "Partner Wise", children: <PartnerSowManagement /> },
          { key: "sowList", label: "Complete Sow List", children: <CompleteSowList /> },
        ]}
      />
    </Flex>
  );
}
