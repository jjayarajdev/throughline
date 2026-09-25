"use client";

import { useCallback, useEffect, useLayoutEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Breadcrumb, Card, Flex, Tabs } from "antd";
import ProfileForm from "@/components/partner-form/Profileform";
import ContactMatrixForm from "@/components/partner-form/ContactMatrixform";
import EscalationMatrixForm from "@/components/partner-form/EscalationMatrixForm";
import EngagementForm from "@/components/partner-form/EngagementForm";
import SowPoManagement from "@/components/partner-form/sow/SowPoManagement";
import { usePartnerStore } from "@/store/userPartnerStore";

const TABS = ["profile", "contact", "escalation", "engagement", "sow"] as const;
type TabKey = (typeof TABS)[number];

const toLabel = (segment: string) => segment.replace(/-/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());

export default function Home() {
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<TabKey>("profile");
  const { partnerStatus: partnerStatusName, isPartnerEmpanelled } = usePartnerStore();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useLayoutEffect(() => {
    setMounted(true);
  }, []);

  const handleTabChange = (value: string) => {
    setActiveTab(value as TabKey);
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", value);
    router.replace(`?${params.toString()}`);
  };

  useEffect(() => {
    const tab = searchParams.get("tab");
    setActiveTab(tab as TabKey);
  }, [searchParams]);

  const handlePrevious = useCallback(() => {
    const currentIndex = TABS.indexOf(activeTab);
    if (currentIndex > 0) setActiveTab(TABS[currentIndex - 1]);
  }, [activeTab]);

  const handleNext = useCallback(() => {
    const currentIndex = TABS.indexOf(activeTab);
    if (currentIndex < TABS.length - 1) setActiveTab(TABS[currentIndex + 1]);
  }, [activeTab]);

  if (!mounted) return null;

  const segments = pathname.split("/").filter(Boolean).filter((seg) => seg !== "home");
  const breadcrumbItems = [
    { title: <Link href="/home/dashboard">Home</Link> },
    ...segments.map((segment, idx) => {
      const isLast = idx === segments.length - 1;
      return isLast ? { title: toLabel(segment) } : { title: <a onClick={() => router.back()}>{toLabel(segment)}</a> };
    }),
  ];

  const items = [
    { key: "profile", label: "Profile", children: <ProfileForm onNext={handleNext} onPrevious={handlePrevious} /> },
    { key: "contact", label: "Contact Matrix", disabled: partnerStatusName, children: <ContactMatrixForm onNext={handleNext} onPrevious={handlePrevious} /> },
    { key: "escalation", label: "Escalation Matrix", disabled: partnerStatusName, children: <EscalationMatrixForm onNext={handleNext} onPrevious={handlePrevious} /> },
    { key: "engagement", label: "Engagement", disabled: partnerStatusName, children: <EngagementForm onNext={handleNext} onPrevious={handlePrevious} /> },
    { key: "sow", label: "SOW/PO Management", disabled: !isPartnerEmpanelled, children: <SowPoManagement /> },
  ];

  return (
    <Flex vertical gap={16} className="p-4">
      <Breadcrumb items={breadcrumbItems} />
      <Card>
        <Tabs activeKey={activeTab} onChange={handleTabChange} items={items} destroyOnHidden />
      </Card>
    </Flex>
  );
}
