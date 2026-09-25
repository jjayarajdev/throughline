"use client";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Badge, Button, Result, Space, Switch } from "antd";
import DataTable, { type DataColumn } from "@/components/data-table/DataTable";
import { useTableState } from "@/components/data-table/useTableState";
import { useSearchColumns } from "@/components/data-table/useSearchColumns";
import { slotApi } from "@/services/api/slot.api";
import { FilterTypeEnum } from "@/constants/FilterTypeEnum";
import { isDomainManager, isHiringManager, isPartner, useUserStore } from "@/store/userStore";
import { CandidateDetailsTypes } from "./types";
import { ScreeningSheet } from "./sheets/Screeningsheet";
import { InterviewSheet } from "./sheets/InterviewSheet";
import { apiErrorMessage, bySortKey, CandidateLink, DateRangeFilter, type DateRangeValue, HrqLink, PanelNames, ResumePreview, type SlotRow, TatCell } from "./cells";

/** Candidates in the screening / assessment round (Evaluation tab). */
export default function ScreeningPagination() {
  const { userId } = useUserStore();
  const t = useTableState({ pageSize: 50, searchColumn: "HrqId" });
  const searchColumns = useSearchColumns(FilterTypeEnum.Evaluation_Screening);

  const [dateRange, setDateRange] = useState<DateRangeValue>();
  const [isScreening, setIsScreening] = useState(true);
  const [isSelf, setIsSelf] = useState(true);
  const [selectedCandidate, setSelectedCandidate] = useState<CandidateDetailsTypes | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  const { data: screeningdata, isLoading, error, refetch } = useQuery({
    queryKey: ["screeningData", t.pageNumber, t.searchColumn, t.query.searchText, isScreening, t.pageSize, isSelf, dateRange],
    queryFn: () =>
      slotApi.getScreeningList({
        pageNumber: t.pageNumber,
        pageSize: t.pageSize,
        searchColumn: t.searchColumn,
        searchText: t.query.searchText,
        startDate: dateRange?.from || null,
        endDate: dateRange?.to || null,
        isSelf,
        isScreening,
      } as any),
    retry: 1,
    enabled: !!userId,
    refetchOnWindowFocus: true,
    refetchInterval: 30000,
  });

  const handleOpenSheet = (row: SlotRow) => {
    if (!row) return;
    setSelectedCandidate(row as CandidateDetailsTypes);
    setIsSheetOpen(true);
  };
  const handleCloseSheet = () => {
    setIsSheetOpen(false);
    setSelectedCandidate(null);
  };

  const columns = useMemo<DataColumn<SlotRow>[]>(
    () => [
      { key: "hrqId", title: "HRQ ID", dataIndex: "hrqId", sorter: bySortKey("hrqId"), render: (v: string) => <HrqLink hrqId={v} /> },
      { key: "candidateCode", title: "Candidate ID", dataIndex: "candidateCode", sorter: bySortKey("candidateCode"), render: (v: string) => <CandidateLink code={v} /> },
      { key: "candidateName", title: "Candidate Name", dataIndex: "candidateName" },
      { key: "jobTitle", title: "Role Hired For", dataIndex: "jobTitle" },
      ...(isPartner ? [] : [{ key: "nickname", title: "Partner", dataIndex: "nickname" } as DataColumn<SlotRow>]),
      { key: "currentRoundName", title: "Round Name", dataIndex: "currentRoundName" },
      { key: "panelNames", title: "Panel", dataIndex: "panelNames", defaultHidden: true, render: (v: string) => <PanelNames names={v} /> },
      { key: "noticePeriod", title: "Notice", dataIndex: "noticePeriod" },
      { key: "phone", title: "Contact", dataIndex: "phone" },
      { key: "interviewModeName", title: "Mode of Interview", dataIndex: "interviewModeName" },
      {
        key: "resume",
        title: "Resume",
        dataIndex: "resume",
        align: "center",
        render: (_: unknown, r: SlotRow) => <ResumePreview url={r.resume?.attachmentURL} fileName={`${r.candidateName}'s Resume`} />,
      },
      { key: "tatDate", title: "TAT(days)", dataIndex: "tatDate", render: (v: string) => <TatCell tatDate={v} /> },
      ...(isPartner
        ? []
        : [
            {
              key: "actions",
              title: "Action",
              locked: true,
              align: "center",
              width: 110,
              fixed: "right",
              render: (_: unknown, r: SlotRow) => (
                <Button type={r.isSlotAssigned ? "default" : "primary"} size="small" disabled={!!r.isSlotAssigned} onClick={() => handleOpenSheet(r)}>
                  {r.isSlotAssigned ? "Pending" : "Manage"}
                </Button>
              ),
            } as DataColumn<SlotRow>,
          ]),
    ],
    []
  );

  const getSheetComponent = () => {
    if (!selectedCandidate) return null;
    switch (selectedCandidate.interviewModeName?.toLowerCase()) {
      case "profile review":
      case "phone call":
      case "online link":
      case "online exercise":
      case "coding exercise":
        return <ScreeningSheet isOpen={isSheetOpen} onClose={handleCloseSheet} selectedCandidate={selectedCandidate} />;
      case "in-person":
      case "virtual":
        return <InterviewSheet isEdit={false} isOpen={isSheetOpen} onClose={handleCloseSheet} selectedCandidate={selectedCandidate} />;
      default:
        return null;
    }
  };

  if (error) return <Result status="error" title="Could not load candidates" subTitle={apiErrorMessage(error)} extra={<Button onClick={() => refetch()}>Retry</Button>} />;

  return (
    <>
      <DataTable<SlotRow>
        title="Screening/Assessment"
        storageKey="slot-screening"
        rowKey={(r) => String(r.candidateId)}
        columns={columns}
        data={screeningdata?.data?.items}
        loading={isLoading}
        pagination={{ current: t.pageNumber, pageSize: t.pageSize, total: screeningdata?.data?.totalCount ?? 0 }}
        onChange={t.onTableChange}
        search={{ columns: searchColumns, column: t.searchColumn, text: t.searchText, onChange: t.setSearch, placeholder: "Search by" }}
        filters={
          <>
            {(isHiringManager || isDomainManager) && (
              <Switch checked={isSelf} onChange={(v) => { setIsSelf(v); t.resetPage(); }} checkedChildren="Self" unCheckedChildren="Team" />
            )}
            <Space size={6}>
              <Switch checked={isScreening} onChange={(v) => { setIsScreening(v); t.resetPage(); }} checkedChildren="Screening" unCheckedChildren="Assessment" />
              <Badge count={screeningdata?.data?.totalCount || 0} showZero overflowCount={99999} color="blue" />
            </Space>
            <DateRangeFilter value={dateRange} onChange={(v) => { setDateRange(v); t.resetPage(); }} />
          </>
        }
        emptyText="No candidate found"
      />
      {getSheetComponent()}
    </>
  );
}
