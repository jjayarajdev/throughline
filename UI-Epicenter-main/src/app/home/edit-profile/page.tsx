"use client";
import { useCallback, useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Breadcrumb, Card, Flex, Tabs, Typography } from "antd";
import ProfileForm from "@/components/partner-form/Profileform";
import ContactMatrixForm from "@/components/partner-form/ContactMatrixform";
import EscalationMatrixForm from "@/components/partner-form/EscalationMatrixForm";
import EngagementForm from "@/components/partner-form/EngagementForm";
import SowPoManagement from "@/components/partner-form/sow/SowPoManagement";
import { usePartnerStore } from "@/store/userPartnerStore";

const TABS = ["profile", "contact", "escalation", "engagement", "sow"] as const;
type TabKey = (typeof TABS)[number];

/** Partner self-service profile editor (the partner role's own record). */
export default function EditProfilePage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { partnerStatus: partnerStatusName, isPartnerEmpanelled } = usePartnerStore() as { partnerStatus?: unknown; isPartnerEmpanelled?: boolean };
  const [activeTab, setActiveTab] = useState<TabKey>("profile");

  useEffect(() => {
    const tab = searchParams.get("tab") as TabKey | null;
    if (tab && TABS.includes(tab)) setActiveTab(tab);
  }, [searchParams]);

  const goTo = useCallback(
    (tab: TabKey) => {
      setActiveTab(tab);
      const params = new URLSearchParams(searchParams.toString());
      params.set("tab", tab);
      router.replace(`${pathname}?${params.toString()}`);
    },
    [pathname, router, searchParams]
  );
  const handlePrevious = useCallback(() => {
    const i = TABS.indexOf(activeTab);
    if (i > 0) goTo(TABS[i - 1]);
  }, [activeTab, goTo]);
  const handleNext = useCallback(() => {
    const i = TABS.indexOf(activeTab);
    if (i < TABS.length - 1) goTo(TABS[i + 1]);
  }, [activeTab, goTo]);

  const locked = !!partnerStatusName;
  const items = [
    { key: "profile", label: "Profile", children: <ProfileForm onNext={handleNext} onPrevious={handlePrevious} /> },
    { key: "contact", label: "Contact Matrix", disabled: locked, children: <ContactMatrixForm onNext={handleNext} onPrevious={handlePrevious} /> },
    { key: "escalation", label: "Escalation Matrix", disabled: locked, children: <EscalationMatrixForm onNext={handleNext} onPrevious={handlePrevious} /> },
    { key: "engagement", label: "Engagement", disabled: locked, children: <EngagementForm onNext={handleNext} onPrevious={handlePrevious} /> },
    ...(isPartnerEmpanelled ? [{ key: "sow", label: "SOW/PO Management", children: <SowPoManagement /> }] : [{ key: "sow", label: "SOW/PO Management", disabled: true }]),
  ];

  return (
    <Flex vertical gap={16} className="p-4">
      <Breadcrumb items={[{ title: "Home", href: "/home/dashboard" }, { title: "Edit profile" }]} />
      <Typography.Title level={4} style={{ margin: 0 }}>
        Partner profile
      </Typography.Title>
      <Card>
        <Tabs activeKey={activeTab} onChange={(k) => goTo(k as TabKey)} items={items} destroyOnHidden />
      </Card>
    </Flex>
  );
}
