"use client";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Flex, Tabs, Typography } from "antd";
import { SettingOutlined, TeamOutlined } from "@ant-design/icons";
import MasterTypesPage from "@/components/master/Master";
import UserRoleMapping from "@/components/master/Approval-roles";

const DEFAULT_TAB = "master";

export default function MasterPage() {
  const router = useRouter();
  const params = useSearchParams();
  const [tab, setTab] = useState(params.get("tab") ?? DEFAULT_TAB);

  // keep the active tab in sync with the URL
  useEffect(() => {
    const urlTab = params.get("tab");
    if (urlTab && urlTab !== tab) setTab(urlTab);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params]);

  const handleTabChange = (value: string) => {
    setTab(value);
    router.replace(`?tab=${value}`);
  };

  return (
    <Flex vertical gap={16} className="p-4">
      <Typography.Title level={4} style={{ margin: 0 }}>
        Master
      </Typography.Title>
      <Tabs
        activeKey={tab}
        onChange={handleTabChange}
        destroyOnHidden
        items={[
          { key: "master", label: "Master Management", icon: <SettingOutlined />, children: <MasterTypesPage /> },
          { key: "user-roles", label: "User Roles", icon: <TeamOutlined />, children: <UserRoleMapping /> },
        ]}
      />
    </Flex>
  );
}
