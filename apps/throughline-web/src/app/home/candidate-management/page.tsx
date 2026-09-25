"use client";
import { useState } from "react";
import { Flex, Tabs, Typography } from "antd";
import { FileTextOutlined, InboxOutlined, TeamOutlined } from "@ant-design/icons";
import { CandidateCartTable } from "@/components/candidate/candidate-cart-table";
import { CandidateBinTable } from "@/components/candidate/candidate-bin-table";
import { CandidateHiringRequests } from "@/components/candidate/Hiring-Table";
import { useUserStore } from "@/store/userStore";
import { FilterTypeEnum } from "@/constants/FilterTypeEnum";

type TabKey = "cart" | "all" | "bin";

export default function CandidateManagement() {
  const { partnerId } = useUserStore();
  const [activeTab, setActiveTab] = useState<TabKey>(partnerId ? "all" : "cart");

  const items = [
    { key: "cart", label: "Candidates List", icon: <InboxOutlined />, children: <CandidateCartTable /> },
    ...(partnerId
      ? [{ key: "all", label: "All HRQID", icon: <TeamOutlined />, children: <CandidateHiringRequests filterType={FilterTypeEnum.All_HRQID} id={partnerId as any} /> }]
      : []),
    { key: "bin", label: "Review Candidates", icon: <FileTextOutlined />, children: <CandidateBinTable /> },
  ];

  return (
    <Flex vertical gap={8} className="p-4">
      <Typography.Title level={4} style={{ margin: 0 }}>
        Candidate Management
      </Typography.Title>
      <Tabs activeKey={activeTab} items={items} destroyOnHidden onChange={(k) => setActiveTab(k as TabKey)} />
    </Flex>
  );
}
