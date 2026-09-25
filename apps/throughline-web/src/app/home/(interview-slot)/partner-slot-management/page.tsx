"use client";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Flex, Tabs, Typography } from "antd";
import { CalendarOutlined, ClockCircleOutlined } from "@ant-design/icons";
import PartnerSlotPagination from "@/components/slot-management/PartnerslotPagination";
import UnAllooatedCandidate from "@/components/slot-management/UnAllocatedPagination";
import ScreeningPagination from "@/components/slot-management/ScreeningPagination";
import FeebackPendingPagination from "@/components/slot-management/FeedbackPendingPagination";
import { isPartner } from "@/store/userStore";

/** Partner's slot allocation: screening, awaiting slots, feedback pending, accept slots, scheduled. */
export default function PartnerSlotManagementPage() {
  const DEFAULT_TAB = isPartner ? "screening_assessment" : "assignslot";
  const router = useRouter();
  const params = useSearchParams();
  const [tab, setTab] = useState(params.get("tab") ?? DEFAULT_TAB);

  useEffect(() => {
    const urlTab = params.get("tab");
    if (urlTab && urlTab !== tab) setTab(urlTab);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params]);

  const handleTabChange = (value: string) => {
    setTab(value);
    router.replace(`?tab=${value}`);
  };

  const items = [
    ...(isPartner
      ? [
          { key: "screening_assessment", label: "Screening/Assessment", icon: <ClockCircleOutlined />, children: <ScreeningPagination /> },
          { key: "awaitingslot", label: "Awaiting Slots", icon: <ClockCircleOutlined />, children: <UnAllooatedCandidate /> },
          { key: "feedback_pending", label: "Feedback Pending", icon: <ClockCircleOutlined />, children: <FeebackPendingPagination /> },
        ]
      : []),
    { key: "assignslot", label: "Accept Slots", icon: <ClockCircleOutlined />, children: <PartnerSlotPagination slotStatusTypeId={1} /> },
    { key: "scheduled", label: "Scheduled Interviews", icon: <CalendarOutlined />, children: <PartnerSlotPagination slotStatusTypeId={2} /> },
  ];

  return (
    <Flex vertical gap={16} className="p-4">
      <Typography.Title level={4} style={{ margin: 0 }}>
        Slot Allocation
      </Typography.Title>
      <Tabs activeKey={tab} items={items} destroyOnHidden onChange={handleTabChange} />
    </Flex>
  );
}
