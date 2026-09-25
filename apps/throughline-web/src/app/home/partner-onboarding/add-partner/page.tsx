"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Breadcrumb, Card, Flex, Steps, Typography } from "antd";
import CreateProfileForm from "@/components/partner-form/create-forms/CreateProfileForm";
import CreateContactMatrixForm from "@/components/partner-form/create-forms/CreateContactMatrixForm";
import CreateEscalationMatrixForm from "@/components/partner-form/create-forms/CreateEscalationMatrixForm";
import { usePartnerStore } from "@/store/userPartnerStore";

const TABS = ["profile", "contact", "escalation", "engagement", "po"];

const getLabel = (segment: string) => segment.replace(/-/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());

export default function AddPartner() {
  const pathname = usePathname();
  const [activeTab, setActiveTab] = useState("profile");
  const { partnerId, contactMatrixId } = usePartnerStore();

  const handlePrevious = () => {
    const currentIndex = TABS.indexOf(activeTab);
    if (currentIndex > 0) {
      setActiveTab(TABS[currentIndex - 1]);
    }
  };

  const handleNext = () => {
    const currentIndex = TABS.indexOf(activeTab);
    if (currentIndex < TABS.length - 1) {
      setActiveTab(TABS[currentIndex + 1]);
    }
  };

  const segments = pathname.split("/").filter(Boolean).filter((seg) => seg !== "home");
  const breadcrumbItems = [
    { title: <Link href="/home/dashboard">Home</Link> },
    ...segments.map((segment, idx) => {
      const href = "/" + ["home", ...segments.slice(0, idx + 1)].join("/");
      const isLast = idx === segments.length - 1;
      return { title: isLast ? getLabel(segment) : <Link href={href}>{getLabel(segment)}</Link> };
    }),
  ];

  const steps = [
    { key: "profile", title: "Profile", disabled: false },
    { key: "contact", title: "Contact Matrix", disabled: !partnerId },
    { key: "escalation", title: "Escalation Matrix", disabled: !contactMatrixId },
  ];
  const current = Math.max(0, steps.findIndex((s) => s.key === activeTab));

  return (
    <Flex vertical gap={16} className="p-4">
      <Breadcrumb items={breadcrumbItems} />
      <Typography.Title level={4} style={{ margin: 0 }}>
        Add Partner
      </Typography.Title>
      <Card>
        <Flex vertical gap={24}>
          <Steps current={current} items={steps.map(({ title, disabled }) => ({ title, disabled }))} onChange={(i) => setActiveTab(steps[i].key)} />
          {activeTab === "profile" && <CreateProfileForm onNext={handleNext} onPrevious={handlePrevious} />}
          {activeTab === "contact" && <CreateContactMatrixForm onNext={handleNext} onPrevious={handlePrevious} />}
          {activeTab === "escalation" && <CreateEscalationMatrixForm onNext={handleNext} onPrevious={handlePrevious} />}
        </Flex>
      </Card>
    </Flex>
  );
}
