"use client";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button, Result } from "antd";
import DataTable, { type DataColumn } from "@/components/data-table/DataTable";
import { useTableState } from "@/components/data-table/useTableState";
import { useSearchColumns } from "@/components/data-table/useSearchColumns";
import { slotApi } from "@/services/api/slot.api";
import { SLOT_STATUS, SLOT_STATUS_CONFIG } from "@/constants/slot-status";
import type { FilterTypeEnum } from "@/constants/FilterTypeEnum";
import { formatDate } from "@/helpers/helper";
import { CandidateDetailsTypes } from "./types";
import { ScreeningSheet } from "./sheets/Screeningsheet";
import { InterviewSheet } from "./sheets/InterviewSheet";
import { apiErrorMessage, bySortKey, CandidateLink, DateRangeFilter, type DateRangeValue, HrqLink, PanelNames, type SlotRow, TatCell } from "./cells";

/** Slot-allocation grids (Assign Slot / Pending / Declined / Scheduled), one per `slotStatusTypeId`. */
export default function InterviewListPagination({ slotStatusTypeId, filterType }: { slotStatusTypeId: number; filterType: number }) {
  const config = SLOT_STATUS_CONFIG[slotStatusTypeId as keyof typeof SLOT_STATUS_CONFIG];
  const buttonName = config.actionButton;
  const pageName = config.title;

  const t = useTableState({ pageSize: 50, searchColumn: "CandidateCode" });
  const searchColumns = useSearchColumns(filterType as FilterTypeEnum);
  const [dateRange, setDateRange] = useState<DateRangeValue>();
  const [selectedCandidate, setSelectedCandidate] = useState<CandidateDetailsTypes | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  const { data: interviewListdata, isLoading, error, refetch } = useQuery({
    queryKey: ["interviewListData", t.pageNumber, t.query.searchText, t.searchColumn, slotStatusTypeId, t.pageSize, dateRange],
    queryFn: () =>
      slotApi.getInterviewLists({
        pageNumber: t.pageNumber,
        pageSize: t.pageSize,
        searchColumn: t.searchColumn,
        searchText: t.query.searchText,
        startDate: dateRange?.from || null,
        endDate: dateRange?.to || null,
        slotStatusTypeId,
      } as any),
    refetchOnWindowFocus: true,
  });

  const handleOpenSheet = (row: SlotRow) => {
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
      { key: "candidateName", title: "Candidate Name", dataIndex: "candidateName", sorter: bySortKey("candidateName") },
      { key: "jobTitle", title: "Role Hired For", dataIndex: "jobTitle" },
      { key: "nickname", title: "Partner", dataIndex: "nickname" },
      { key: "panelNames", title: "Panel", dataIndex: "panelNames", defaultHidden: true, render: (v: string) => <PanelNames names={v} /> },
      { key: "date", title: "Interview Date", dataIndex: "date", sorter: bySortKey("date"), defaultHidden: pageName === "Assign Slot", render: (v: string) => (v ? formatDate(v) : null) },
      { key: "time", title: "Time", dataIndex: "time", defaultHidden: pageName === "Assign Slot" },
      { key: "phone", title: "Contact", dataIndex: "phone" },
      { key: "interviewModeName", title: "Mode of Interview", dataIndex: "interviewModeName" },
      { key: "currentRoundName", title: "Round Name", dataIndex: "currentRoundName" },
      { key: "noticePeriod", title: "Notice", dataIndex: "noticePeriod" },
      { key: "rejectionCount", title: "Declined", dataIndex: "rejectionCount", defaultHidden: pageName !== "Declined" },
      { key: "tatDate", title: "TAT(days)", dataIndex: "tatDate", render: (v: string) => <TatCell tatDate={v} /> },
      { key: "rescheduleCount", title: "Reschedule Count", dataIndex: "rescheduleCount", defaultHidden: pageName !== "Assign Slot" },
      {
        key: "actions",
        title: "Action",
        locked: true,
        align: "center",
        fixed: "right",
        render: (_: unknown, r: SlotRow) => (
          <Button type={buttonName !== "Pending" ? "primary" : "default"} size="small" onClick={() => handleOpenSheet(r)}>
            {buttonName}
          </Button>
        ),
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [pageName, buttonName]
  );

  const getSheetComponent = () => {
    if (!selectedCandidate) return null;
    switch (slotStatusTypeId) {
      case SLOT_STATUS.ASSIGN_SLOT:
        return <InterviewSheet isEdit={selectedCandidate.interviewSlotId !== undefined} isOpen={isSheetOpen} onClose={handleCloseSheet} selectedCandidate={selectedCandidate} />;
      case SLOT_STATUS.PENDING:
        // legacy behaviour: the pending sheet is mounted closed, so the button has no visible effect
        return <ScreeningSheet isOpen={false} onClose={handleCloseSheet} selectedCandidate={selectedCandidate} />;
      case SLOT_STATUS.DECLINED:
      case SLOT_STATUS.SCHEDULED:
        return <InterviewSheet isEdit={true} isOpen={isSheetOpen} onClose={handleCloseSheet} selectedCandidate={selectedCandidate} />;
      default:
        return null;
    }
  };

  if (error) return <Result status="error" title="Could not load interview list" subTitle={apiErrorMessage(error)} extra={<Button onClick={() => refetch()}>Retry</Button>} />;

  return (
    <>
      <DataTable<SlotRow>
        title={pageName || "Interview List"}
        storageKey={`slot-interview-list-${slotStatusTypeId}`}
        rowKey={(r) => `${r.candidateId}-${r.interviewSlotId ?? ""}`}
        columns={columns}
        data={interviewListdata?.data?.items}
        loading={isLoading}
        pagination={{ current: t.pageNumber, pageSize: t.pageSize, total: interviewListdata?.data?.totalCount ?? 0 }}
        onChange={t.onTableChange}
        search={{ columns: searchColumns, column: t.searchColumn, text: t.searchText, onChange: t.setSearch, placeholder: "Search by" }}
        filters={<DateRangeFilter value={dateRange} onChange={(v) => { setDateRange(v); t.resetPage(); }} />}
        emptyText="No data found"
      />
      {getSheetComponent()}
    </>
  );
}
