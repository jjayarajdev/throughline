"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Button, Dropdown, Flex, Select, Tabs, Typography } from "antd";
import type { MenuProps } from "antd";
import { CodeOutlined, EditOutlined, MoreOutlined, PauseCircleOutlined, UserAddOutlined } from "@ant-design/icons";
import DataTable, { type DataColumn } from "@/components/data-table/DataTable";
import { useTableState } from "@/components/data-table/useTableState";
import { useSearchColumns } from "@/components/data-table/useSearchColumns";
import { onboarding } from "@/services/api/onboarding.api";
import { FilterTypeEnum } from "@/constants/FilterTypeEnum";
import { isPartner, isVendorManager, useUserStore } from "@/store/userStore";
import { useOnboardCandidateStore } from "@/store/useCandidateOnboarding";
import { formatDate } from "@/helpers/helper";
import { MoveSidebar } from "./candidate-sidebar/MoveSidebar";
import { CommentsDialog } from "./candidate-sidebar/CommentsDialog";

export interface Resume {
  id: number;
  attachmentName: string;
  attachmentURL: string;
}

export interface CandidateItem {
  [key: string]: any;
  partnerId: number;
  partnerName: string;
  hiringStatusId: number;
  hiringStatusName: string;
  jobTitle: string;
  candidateCode: string;
  isSingleEntry: boolean;
  hiringRequestId: number;
  hrqId: string;
  fullName: string;
  phoneNumber: string;
  email: string;
  skills: number[];
  resourceTypeId: number;
  countryId: number;
  stateId: number;
  cityId: number;
  diversity: string;
  noticePeriod: number;
  relevantExperience: number;
  currentlyWorking: string;
  currentCTC: number;
  resume: Resume;
  requestedMicrosoftAccount: boolean;
  consideredForFutureRequirements: boolean;
  intakeStatusId: number;
  intakeStatusName: string;
  isAgreedForTermsConditions: boolean;
  enableCandidateHrqTransfer: boolean;
  isParentHrq: boolean;
  id: number;
  isActive: boolean;
}

type TabKey = "candidate_identified" | "candidates_offered" | "candidates_declined" | "view_Joiners";

const CANDIDATE_IDENTIFIED = 12004;
const OPEN_WIP = 12002;
const INTAKE_IDENTIFIED = 15009;
const OFFERED_ACCEPTED = 15011;
const On_Hold = 12005;

const statusIdMap: Record<TabKey, number> = {
  candidate_identified: 1,
  candidates_offered: 2,
  candidates_declined: 3,
  view_Joiners: 4,
};

const statusOptions = [
  { value: 15007, label: "Offer Rolled Out" },
  { value: 15011, label: "Offer Accepted" },
];

const currentDayOptions = [
  { value: 0, label: "All" },
  { value: 1, label: "Today" },
  { value: 2, label: "Week" },
  { value: 3, label: "Month" },
];

const byText = (key: string) => (a: CandidateItem, b: CandidateItem) => String(a?.[key] ?? "").localeCompare(String(b?.[key] ?? ""));

/** Candidate onboarding grid: identified / offered / declined / joiners, with the move actions. */
export default function CandidateOnboardingPage() {
  const router = useRouter();
  const params = useSearchParams();
  const { partnerId } = useUserStore();
  const DEFAULT_TAB: TabKey = isPartner ? "candidates_offered" : "candidate_identified";
  const tabFromUrl = params.get("tab");
  const [tab, setTab] = useState<string>(tabFromUrl ?? DEFAULT_TAB);

  const t = useTableState({ pageSize: 50, searchColumn: "HrqId" });
  const searchColumns = useSearchColumns(FilterTypeEnum.CandidateOnboarding_Identified);

  const [showMoveToRec, setShowMoveToRec] = useState(false);
  const [selectedCandidateId, setSelectedCandidateId] = useState<CandidateItem | null>(null);
  const [moveAction, setMoveAction] = useState("rec");
  const [selectedStatus, setSelectedStatus] = useState<number | undefined>(undefined);
  const [selectedDuration, setSelectedDuration] = useState<number | undefined>(undefined);

  useEffect(() => {
    if (tabFromUrl && tabFromUrl !== tab) setTab(tabFromUrl);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tabFromUrl]);

  const handleTabChange = (value: string) => {
    setTab(value);
    t.resetPage();
    router.replace(`?tab=${encodeURIComponent(value)}`);
  };

  const statusId = statusIdMap[tab as TabKey];
  const queryParams = new URLSearchParams();
  queryParams.append("intakeStatusCategoryId", String(statusId));
  if (selectedStatus) queryParams.append("intakeStatusId", String(selectedStatus));
  if (selectedDuration) queryParams.append("durationId", String(selectedDuration));
  if (isPartner) queryParams.append("partnerId", String(partnerId));
  const url = `/CandidateForm/paged/final-list?${queryParams.toString()}`;

  const { data: getOnboarding, isLoading } = useQuery({
    queryKey: ["getOnboardingDetails", statusId, selectedStatus, selectedDuration, t.query],
    queryFn: () =>
      onboarding.getAllTypeCandidates(url, {
        pageNumber: t.query.pageNumber,
        pageSize: t.query.pageSize,
        searchColumn: t.query.searchColumn ?? t.searchColumn,
        searchText: t.query.searchText || undefined,
      }),
    enabled: !!statusId,
    refetchOnWindowFocus: true,
  });

  const openMove = (candidate: CandidateItem, action: string) => {
    setSelectedCandidateId(candidate);
    setShowMoveToRec(true);
    setMoveAction(action);
  };

  const handleAddCandidate = (candidate: CandidateItem) => {
    if (candidate?.candidatePersonalDetailsId) {
      router.push(`/home/candidate-onboarding/${candidate?.candidatePersonalDetailsId}`);
    } else {
      useOnboardCandidateStore.getState().setOnboardCandidate({ hiringRequestId: candidate?.hiringRequestId, candidateId: candidate?.id });
      router.push("/home/candidate-onboarding/new");
    }
  };

  const handleCandidateProfile = (candidate: CandidateItem) => {
    useOnboardCandidateStore.getState().setOnboardCandidate({ candidateRateCardId: candidate?.candidateRateCardId });
    router.push(`/home/candidate-onboarding/candidate-profile?id=${candidate?.candidatePersonalDetailsId}`);
  };

  const rowMenu = (c: CandidateItem): MenuProps["items"] => {
    if (tab === "candidates_offered" || tab === "view_Joiners" || isPartner) {
      if (c?.candidatePersonalDetailsId && !c?.isJoinConfirmed) {
        return [{ key: "join", label: "Confirm Joining", onClick: () => openMove(c, "Joined") }];
      }
      const items: MenuProps["items"] = [];
      if (c.intakeStatusId !== OFFERED_ACCEPTED) {
        items.push({ key: "offer", icon: <EditOutlined />, label: "Accept Offer", onClick: () => openMove(c, "offer-status") });
      }
      if (!c?.candidateBGVCompleted) {
        if (c?.intakeStatusId === OFFERED_ACCEPTED) {
          items.push({
            key: "onboard",
            icon: <UserAddOutlined />,
            danger: !!c?.candidatePersonalDetailsId,
            label: c?.candidatePersonalDetailsId ? "Resume Onboarding" : "Onboard Candidate",
            onClick: () => handleAddCandidate(c),
          });
        }
      } else {
        items.push({ key: "edit", icon: <EditOutlined />, label: "Edit", onClick: () => handleAddCandidate(c) });
      }
      return items;
    }
    return [
      {
        key: "rec",
        icon: <CodeOutlined />,
        label: "Move To Rec",
        disabled: !(c?.intakeStatusId === INTAKE_IDENTIFIED && c?.hiringStatusId === OPEN_WIP),
        onClick: () => openMove(c, "rec"),
      },
      {
        key: "onboarding",
        icon: <UserAddOutlined />,
        label: "Move To Onboarding",
        disabled: !(c.intakeStatusId === INTAKE_IDENTIFIED && c.hiringStatusId === CANDIDATE_IDENTIFIED),
        onClick: () => openMove(c, "onboarding"),
      },
      {
        key: "hold",
        icon: <PauseCircleOutlined />,
        label: "On Hold",
        disabled: !(c.intakeStatusId === INTAKE_IDENTIFIED && c.hiringStatusId === On_Hold),
        onClick: () => router.push(`/home/hiring-management/hiring-profile?id=${c?.hrqId}`),
      },
    ];
  };

  const columns = useMemo<DataColumn<CandidateItem>[]>(() => {
    const all: DataColumn<CandidateItem>[] = [
      { key: "hrqId", title: "HRQID", dataIndex: "hrqId", sorter: byText("hrqId"), render: (v: string) => <Typography.Link onClick={() => router.push(`/home/hiring-details?hrqid=${v}`)}>{v}</Typography.Link> },
      { key: "candidateCode", title: "Candidate Code", dataIndex: "candidateCode", sorter: byText("candidateCode"), render: (v: string) => <Link href={`/home/candidate-management/candidate-profile?id=${v}`}>{v}</Link> },
      { key: "fullName", title: "Candidate Name", dataIndex: "fullName", sorter: byText("fullName") },
      { key: "employeeId", title: "Employee ID", dataIndex: "employeeId", render: (v: string, c) => <Typography.Link onClick={() => handleCandidateProfile(c)}>{v}</Typography.Link> },
      { key: "resourceTypeName", title: "Resource Type", dataIndex: "resourceTypeName" },
      { key: "phoneNumber", title: "Candidate Contact", dataIndex: "phoneNumber" },
      {
        key: "jobTitle",
        title: "Role Hired For",
        dataIndex: "jobTitle",
        render: (v: string) => (
          <div>
            {v?.split(",").map((item, idx) => (
              <div key={idx} style={{ whiteSpace: "pre-line" }}>
                {item.trim() || ""}
              </div>
            ))}
          </div>
        ),
      },
      { key: "nickName", title: "Partner", dataIndex: "nickName" },
      { key: "intakeStatusName", title: "Candidate Status", dataIndex: "intakeStatusName" },
      { key: "doj", title: "DOJ", dataIndex: "doj", render: (v: string) => formatDate(v) },
      {
        key: "joiningConfirmationComments",
        title: "Comments",
        dataIndex: "joiningConfirmationComments",
        align: "center",
        render: (v: string) => <CommentsDialog comments={v} title="Reason for Decline" description="Detailed explanation of why the candidate was declined." />,
      },
    ];
    const hidden = tab === "candidates_declined" ? ["employeeId", "doj"] : tab === "candidates_offered" || tab === "view_Joiners" ? ["joiningConfirmationComments"] : ["employeeId", "doj", "joiningConfirmationComments"];
    const visible = all.filter((c) => !hidden.includes(c.key));
    if (tab !== "candidates_declined") {
      visible.push({
        key: "actions",
        title: "Action",
        locked: true,
        align: "center",
        width: 80,
        fixed: "right",
        render: (_: unknown, c) => (
          <Dropdown menu={{ items: rowMenu(c) }} trigger={["click"]} disabled={!!c?.candidateBGVCompleted}>
            <Button size="small" icon={<MoreOutlined />} />
          </Dropdown>
        ),
      });
    }
    return visible;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  const tabItems = [
    ...(!isPartner ? [{ key: "candidate_identified", label: "Candidate Identified" }] : []),
    ...(!isVendorManager ? [{ key: "candidates_offered", label: "Candidates Offered" }] : []),
    { key: "candidates_declined", label: "Candidates Declined" },
    { key: "view_Joiners", label: "View Joiners" },
  ];

  const filters = (
    <>
      {tab === "candidates_offered" && (
        <Select
          placeholder="Select..."
          allowClear
          style={{ minWidth: 200 }}
          value={selectedStatus}
          options={statusOptions}
          onChange={(v) => {
            setSelectedStatus(v);
            t.resetPage();
          }}
        />
      )}
      {tab === "view_Joiners" && (
        <Select
          placeholder="Select..."
          allowClear
          style={{ minWidth: 200 }}
          value={selectedDuration}
          options={currentDayOptions}
          onChange={(v) => {
            setSelectedDuration(v);
            t.resetPage();
          }}
        />
      )}
    </>
  );

  return (
    <Flex vertical gap={16} className="p-4">
      <Flex justify="space-between" align="center" wrap gap={8}>
        <Typography.Title level={4} style={{ margin: 0 }}>
          Candidate Onboarding
        </Typography.Title>
        <Tabs activeKey={tab} items={tabItems} onChange={handleTabChange} size="small" />
      </Flex>

      <DataTable<CandidateItem>
        storageKey="candidate-onboarding"
        rowKey="id"
        columns={columns}
        data={getOnboarding?.data?.items}
        loading={isLoading}
        pagination={{ current: t.pageNumber, pageSize: t.pageSize, total: getOnboarding?.data?.totalCount ?? 0 }}
        onChange={t.onTableChange}
        search={{ columns: searchColumns, column: t.searchColumn, text: t.searchText, onChange: t.setSearch, placeholder: "Search by" }}
        filters={filters}
        emptyText="No Data Available"
      />

      <MoveSidebar open={showMoveToRec} onOpenChange={setShowMoveToRec} candidate={selectedCandidateId} actionType={moveAction} />
    </Flex>
  );
}
