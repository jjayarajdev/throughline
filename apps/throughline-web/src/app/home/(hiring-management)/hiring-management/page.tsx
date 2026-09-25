"use client";
import React, { useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Flex, Tabs, Typography } from "antd";
import { FileTextOutlined, InboxOutlined, TeamOutlined } from "@ant-design/icons";
import CartPage from "@/components/hiring-forms/CartTable";
import BinPage from "@/components/hiring-forms/BinPage";
import PartnerHrqs from "@/components/hiring-forms/PartnerHrqs";
import { isAdmin, isAllhrqidReviewRequest, isHiringEdit, isRmowner, isVendorManager } from "@/store/userStore";

type TabKey = "cart" | "partner" | "bin";

const HiringTabsPage = () => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [value, setValue] = useState<TabKey>("cart");

  useEffect(() => {
    const tab = searchParams.get("tab");
    if (tab === "cart" || tab === "bin" || tab === "partner") setValue(tab);
  }, [searchParams]);

  const items = [
    { key: "cart", label: "All Approved Requests", icon: <InboxOutlined />, children: <CartPage /> },
    ...(isRmowner || isVendorManager || isAdmin ? [{ key: "partner", label: "Partners Wise", icon: <TeamOutlined />, children: <PartnerHrqs /> }] : []),
    ...(isAllhrqidReviewRequest ? [{ key: "bin", label: "Review Requests", icon: <FileTextOutlined />, children: <BinPage /> }] : []),
  ];

  return (
    <Flex vertical gap={8} className="p-4">
      <Typography.Title level={4} style={{ margin: 0 }}>
        Hiring Management
      </Typography.Title>
      {isHiringEdit || isAllhrqidReviewRequest ? (
        <Tabs
          activeKey={value}
          items={items}
          destroyOnHidden
          onChange={(k) => {
            setValue(k as TabKey);
            router.replace(`${pathname}?tab=${k}`);
          }}
        />
      ) : (
        <CartPage />
      )}
    </Flex>
  );
};

export default HiringTabsPage;
