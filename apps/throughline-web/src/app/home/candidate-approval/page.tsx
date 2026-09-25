"use client";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, Flex, Tabs, Typography } from "antd";
import { CheckCircleOutlined, UserSwitchOutlined } from "@ant-design/icons";
import { CandidateApprovalTable } from "@/components/candidate/candidate-approval-table";
import { OnboardApprovalTable } from "../candidate-onboarding/candidate-sidebar/Onboard-approval-table";
import { DocsApprovalTable } from "../candidate-onboarding/candidate-sidebar/Docs-approval-table";
import { isAdmin, isRmowner, isVendorManager } from "@/store/userStore";
import { ContactMatrixformApproval } from "../partner-onboarding/partner-approval/ContactMatrixform-approval";
import SowApproval from "../partner-onboarding/partner-approval/Sow-approval";
import { Onholdapproval } from "../partner-onboarding/partner-approval/On-hold-approval";

const DEFAULT_TAB = "candidate";
const DEFAULT_CHILD_TABS: Record<string, string> = {
  onboarding: "final-onboard",
  Vendor: "sow",
};

/** Exception approvals: candidate, onboarding and partner exceptions; tab state is mirrored in the URL. */
export default function CandidateApprovalPage() {
  const router = useRouter();
  const params = useSearchParams();

  const [tab, setTab] = useState(params.get("tab") ?? DEFAULT_TAB);
  const [childTabs, setChildTabs] = useState(DEFAULT_CHILD_TABS);

  useEffect(() => {
    const urlTab = params.get("tab") ?? DEFAULT_TAB;
    const urlChildTab = params.get("childTab");
    if (urlTab !== tab) setTab(urlTab);
    if (urlChildTab) setChildTabs((prev) => ({ ...prev, [urlTab]: urlChildTab }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params]);

  const handleChildTabChange = (parent: string, value: string) => {
    setChildTabs((prev) => ({ ...prev, [parent]: value }));
    router.replace(`?tab=${tab}&childTab=${value}`);
  };

  const handleTabChange = (value: string) => {
    setTab(value);
    const child = childTabs[value] ?? "";
    router.replace(`?tab=${value}&childTab=${child}`);
  };

  const items = [
    {
      key: "candidate",
      label: "Candidate Exception",
      icon: <UserSwitchOutlined />,
      children: (
        <Card>
          <CandidateApprovalTable />
        </Card>
      ),
    },
    ...(!isRmowner
      ? [
          {
            key: "onboarding",
            label: "Onboarding Exception",
            icon: <CheckCircleOutlined />,
            children: (
              <Card>
                <Tabs
                  activeKey={childTabs.onboarding}
                  onChange={(v) => handleChildTabChange("onboarding", v)}
                  destroyOnHidden
                  items={[
                    { key: "final-onboard", label: "Final Onboard Acceptance", children: <OnboardApprovalTable /> },
                    { key: "nda-cda", label: "NDA/CDA Confirmation", children: <DocsApprovalTable /> },
                  ]}
                />
              </Card>
            ),
          },
        ]
      : []),
    ...(isVendorManager || isAdmin
      ? [
          {
            key: "Vendor",
            label: "Partner Exception",
            icon: <UserSwitchOutlined />,
            children: (
              <Card>
                <Tabs
                  activeKey={childTabs.Vendor}
                  onChange={(v) => handleChildTabChange("Vendor", v)}
                  destroyOnHidden
                  items={[
                    { key: "sow", label: "Sow", children: <SowApproval /> },
                    { key: "contact", label: "Contact & Escalation Matrix", children: <ContactMatrixformApproval /> },
                    ...(isAdmin ? [{ key: "on-Hold", label: "On Hold", children: <Onholdapproval /> }] : []),
                  ]}
                />
              </Card>
            ),
          },
        ]
      : []),
  ];

  return (
    <Flex vertical gap={8} className="p-4">
      <Typography.Title level={4} style={{ margin: 0 }}>
        Exception Approvals
      </Typography.Title>
      <Tabs activeKey={tab} items={items} destroyOnHidden onChange={handleTabChange} />
    </Flex>
  );
}
