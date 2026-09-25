"use client";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Flex, Tabs, Typography } from "antd";
import { CalendarOutlined, CheckCircleOutlined, ClockCircleOutlined, FileTextOutlined, TeamOutlined } from "@ant-design/icons";
import ScreeningPagination from "@/components/slot-management/ScreeningPagination";
import CompletedPagination from "@/components/slot-management/CompletedPagination";
import FeebackPendingPagination from "@/components/slot-management/FeedbackPendingPagination";
import InterviewListPagination from "@/components/slot-management/InterviewListPagination";
import PanelScheduled from "@/components/slot-management/PanelScheduled";
import { isDomainManager, isHiringManager, isPanel, isShowslotAllocation } from "@/store/userStore";
import { FilterTypeEnum, SlotAllocationType } from "@/constants/FilterTypeEnum";

const DEFAULT_SECTION = "evaluation";
const DEFAULT_EVALUATION_TAB = "screening";
const DEFAULT_SLOT_ALLOCATION_TAB = "assignslot";

/** Evaluation (screening, feedback, completed) and Slot Allocation grids, synced to `?section=&tab=`. */
export default function SlotManagementPage() {
  const router = useRouter();
  const params = useSearchParams();
  const urlSection = params.get("section");
  const urlTab = params.get("tab");

  const [activeMainTab, setActiveMainTab] = useState(urlSection ?? DEFAULT_SECTION);
  const [evaluationTab, setEvaluationTab] = useState((urlSection ?? DEFAULT_SECTION) === "evaluation" && urlTab ? urlTab : DEFAULT_EVALUATION_TAB);
  const [slotAllocationTab, setSlotAllocationTab] = useState(urlSection === "slot-allocation" && urlTab ? urlTab : DEFAULT_SLOT_ALLOCATION_TAB);

  useEffect(() => {
    if (!params.get("section") && !params.get("tab")) {
      router.replace(`?section=${DEFAULT_SECTION}&tab=${DEFAULT_EVALUATION_TAB}`);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleMainTabChange = (value: string) => {
    setActiveMainTab(value);
    if (value === "evaluation") {
      router.replace(`?section=${value}&tab=${evaluationTab || DEFAULT_EVALUATION_TAB}`);
    } else if (value === "slot-allocation") {
      router.replace(`?section=${value}&tab=${DEFAULT_SLOT_ALLOCATION_TAB}`);
    }
  };

  const handleEvaluationTabChange = (value: string) => {
    setEvaluationTab(value);
    router.replace(`?section=evaluation&tab=${value}`);
  };

  const handleSlotAllocationTabChange = (value: string) => {
    setSlotAllocationTab(value);
    router.replace(`?section=slot-allocation&tab=${value}`);
  };

  const evaluationItems = [
    { key: "screening", label: "Screening/Assessment", icon: <TeamOutlined />, children: <ScreeningPagination /> },
    { key: "feedback-pending", label: "Feedback Pending", icon: <FileTextOutlined />, children: <FeebackPendingPagination /> },
    ...(isPanel || isHiringManager || isDomainManager
      ? [{ key: "panelsheduled", label: "Interview Scheduled", icon: <CheckCircleOutlined />, children: <PanelScheduled /> }]
      : []),
    ...(!isPanel ? [{ key: "completed", label: "Completed", icon: <CheckCircleOutlined />, children: <CompletedPagination /> }] : []),
  ];

  const slotAllocationItems = [
    {
      key: "assignslot",
      label: "Assign Slots",
      icon: <ClockCircleOutlined />,
      children: <InterviewListPagination filterType={FilterTypeEnum.SlotAllocation_AssignSlots} slotStatusTypeId={SlotAllocationType.assignslot} />,
    },
    {
      key: "pending",
      label: "Pending",
      icon: <CalendarOutlined />,
      children: <InterviewListPagination filterType={FilterTypeEnum.SlotAllocation_Pending} slotStatusTypeId={SlotAllocationType.pending} />,
    },
    {
      key: "declined",
      label: "Declined",
      icon: <CalendarOutlined />,
      children: <InterviewListPagination filterType={FilterTypeEnum.SlotAllocation_Declined} slotStatusTypeId={SlotAllocationType.declined} />,
    },
    {
      key: "scheduled",
      label: "Interview Scheduled",
      icon: <CalendarOutlined />,
      children: <InterviewListPagination filterType={FilterTypeEnum.SlotAllocation_Scheduled} slotStatusTypeId={SlotAllocationType.scheduled} />,
    },
  ];

  const evaluation = <Tabs activeKey={evaluationTab} items={evaluationItems} destroyOnHidden onChange={handleEvaluationTabChange} />;

  const mainItems = [
    { key: "evaluation", label: "Evaluation", icon: <TeamOutlined />, children: evaluation },
    ...(!isPanel
      ? [
          {
            key: "slot-allocation",
            label: "Slot Allocation",
            icon: <CalendarOutlined />,
            children: <Tabs activeKey={slotAllocationTab} items={slotAllocationItems} destroyOnHidden onChange={handleSlotAllocationTabChange} />,
          },
        ]
      : []),
  ];

  return (
    <Flex vertical gap={16} className="p-4">
      <Typography.Title level={4} style={{ margin: 0 }}>
        Slot Management
      </Typography.Title>
      {isShowslotAllocation ? (
        <Tabs type="card" activeKey={activeMainTab} items={mainItems} destroyOnHidden onChange={handleMainTabChange} />
      ) : (
        evaluation
      )}
    </Flex>
  );
}
