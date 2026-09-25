"use client";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button, Result, Select } from "antd";
import DataTable, { type DataColumn } from "@/components/data-table/DataTable";
import { useTableState } from "@/components/data-table/useTableState";
import { useSearchColumns } from "@/components/data-table/useSearchColumns";
import { slotApi } from "@/services/api/slot.api";
import { InterviewFilterOptions, SLOT_STATUS_CONFIG } from "@/constants/slot-status";
import { FilterTypeEnum, SlotAllocationType } from "@/constants/FilterTypeEnum";
import { formatDate } from "@/helpers/helper";
import { apiErrorMessage, bySortKey, CandidateLink, DateRangeFilter, type DateRangeValue, HrqLink, type SlotRow, TatCell } from "./cells";

/** Interviews scheduled for the current panel member (Evaluation tab, read-only). */
export default function PanelScheduled() {
  const slotStatusTypeId = SlotAllocationType.scheduled;
  const config = SLOT_STATUS_CONFIG[slotStatusTypeId as keyof typeof SLOT_STATUS_CONFIG];
  const pageName = config.title;

  const t = useTableState({ pageSize: 50, searchColumn: "HrqId" });
  const searchColumns = useSearchColumns(FilterTypeEnum.CMSGrid);
  const [dateRange, setDateRange] = useState<DateRangeValue>();
  // legacy filter: part of the query key only, never sent to the API
  const [interviewFilter, setInterviewFilter] = useState(3);

  const { data: interviewListdata, isLoading, error, refetch } = useQuery({
    queryKey: ["interviewListData", t.pageNumber, t.query.searchText, t.searchColumn, slotStatusTypeId, interviewFilter, t.pageSize, dateRange],
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
    refetchInterval: 30000,
  });

  const columns = useMemo<DataColumn<SlotRow>[]>(
    () => [
      { key: "hrqId", title: "HRQ ID", dataIndex: "hrqId", sorter: bySortKey("hrqId"), render: (v: string) => <HrqLink hrqId={v} /> },
      { key: "candidateCode", title: "Candidate ID", dataIndex: "candidateCode", sorter: bySortKey("candidateCode"), render: (v: string) => <CandidateLink code={v} /> },
      { key: "candidateName", title: "Candidate Name", dataIndex: "candidateName" },
      { key: "jobTitle", title: "Role Hired For", dataIndex: "jobTitle" },
      { key: "date", title: "Interview Date", dataIndex: "date", sorter: bySortKey("date"), defaultHidden: pageName === "Assign Slot", render: (v: string) => (v ? formatDate(v) : null) },
      { key: "time", title: "Time", dataIndex: "time", defaultHidden: pageName === "Assign Slot", render: (v: string) => (v ? v.slice(0, 5) : null) },
      { key: "phone", title: "Contact", dataIndex: "phone" },
      { key: "interviewModeName", title: "Mode of Interview", dataIndex: "interviewModeName" },
      { key: "currentRoundName", title: "Round Name", dataIndex: "currentRoundName" },
      { key: "noticePeriod", title: "Notice", dataIndex: "noticePeriod" },
      { key: "rejectionCount", title: "Declined", dataIndex: "rejectionCount", defaultHidden: pageName !== "Declined" },
      { key: "tatDate", title: "TAT(days)", dataIndex: "tatDate", render: (v: string) => <TatCell tatDate={v} /> },
      { key: "rescheduleCount", title: "Reschedule Count", dataIndex: "rescheduleCount", defaultHidden: pageName !== "Assign Slot" },
    ],
    [pageName]
  );

  if (error) return <Result status="error" title="Could not load scheduled interviews" subTitle={apiErrorMessage(error)} extra={<Button onClick={() => refetch()}>Retry</Button>} />;

  return (
    <DataTable<SlotRow>
      title={pageName || "Interview List"}
      storageKey="slot-panel-scheduled"
      rowKey={(r) => `${r.candidateId}-${r.interviewSlotId ?? ""}`}
      columns={columns}
      data={interviewListdata?.data?.items}
      loading={isLoading}
      pagination={{ current: t.pageNumber, pageSize: t.pageSize, total: interviewListdata?.data?.totalCount ?? 0 }}
      onChange={t.onTableChange}
      search={{ columns: searchColumns, column: t.searchColumn, text: t.searchText, onChange: t.setSearch, placeholder: "Search by" }}
      filters={
        <>
          <DateRangeFilter value={dateRange} onChange={(v) => { setDateRange(v); t.resetPage(); }} />
          <Select
            placeholder="Today's Interview"
            style={{ minWidth: 200 }}
            popupMatchSelectWidth={false}
            value={InterviewFilterOptions.some((o) => o.id === interviewFilter) ? interviewFilter : undefined}
            options={InterviewFilterOptions.map((o) => ({ value: o.id, label: o.name }))}
            onChange={(v) => setInterviewFilter(Number(v))}
          />
        </>
      }
      emptyText="No data found"
    />
  );
}
