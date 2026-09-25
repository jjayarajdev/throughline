"use client";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button, Result, Select } from "antd";
import DataTable, { type DataColumn } from "@/components/data-table/DataTable";
import { useTableState } from "@/components/data-table/useTableState";
import { useSearchColumns } from "@/components/data-table/useSearchColumns";
import { slotApi } from "@/services/api/slot.api";
import { FilterTypeEnum } from "@/constants/FilterTypeEnum";
import { InterviewFilterOptions } from "@/constants/slot-status";
import { apiErrorMessage, bySortKey, CandidateLink, HrqLink, PanelNames, type SlotRow, TatCell } from "./cells";

/** Partner's candidates still waiting for an interview slot ("Awaiting Slot"). */
export default function UnAllooatedCandidate() {
  const t = useTableState({ pageSize: 50, searchColumn: "HrqId" });
  const searchColumns = useSearchColumns(FilterTypeEnum.Evaluation_Completed);
  const [durationId, setDurationId] = useState(0);

  const { data: completedData, isLoading, error, refetch } = useQuery({
    queryKey: ["unallocatedCandidate", t.pageNumber, t.query.searchText, t.searchColumn, t.pageSize, durationId],
    queryFn: () =>
      slotApi.getUnallocatedCandidate(
        {
          pageNumber: t.pageNumber,
          pageSize: t.pageSize,
          searchColumn: t.searchColumn,
          searchText: t.query.searchText,
        },
        durationId
      ),
    retry: 1,
    refetchOnWindowFocus: true,
    refetchInterval: 30000,
  });

  const columns = useMemo<DataColumn<SlotRow>[]>(
    () => [
      { key: "hrqId", title: "HRQ ID", dataIndex: "hrqId", sorter: bySortKey("hrqId"), render: (v: string) => <HrqLink hrqId={v} /> },
      { key: "candidateCode", title: "Candidate ID", dataIndex: "candidateCode", sorter: bySortKey("candidateCode"), render: (v: string) => <CandidateLink code={v} /> },
      { key: "phone", title: "Contact", dataIndex: "phone" },
      { key: "noticePeriod", title: "Notice", dataIndex: "noticePeriod", sorter: bySortKey("noticePeriod") },
      { key: "candidateName", title: "Candidate Name", dataIndex: "candidateName" },
      { key: "panelNames", title: "Panel", dataIndex: "panelNames", defaultHidden: true, render: (v: string) => <PanelNames names={v} /> },
      { key: "jobTitle", title: "Role Hired For", dataIndex: "jobTitle" },
      { key: "currentRoundName", title: "Current Round", dataIndex: "currentRoundName" },
      { key: "interviewModeName", title: "Mode of Interview", dataIndex: "interviewModeName" },
      { key: "tatDate", title: "TAT(days)", dataIndex: "tatDate", render: (v: string) => <TatCell tatDate={v} /> },
    ],
    []
  );

  if (error) return <Result status="error" title="Could not load candidates" subTitle={apiErrorMessage(error)} extra={<Button onClick={() => refetch()}>Retry</Button>} />;

  return (
    <DataTable<SlotRow>
      title="Awaiting Slot"
      storageKey="slot-awaiting"
      rowKey={(r) => String(r.candidateId)}
      columns={columns}
      data={completedData?.data?.items}
      loading={isLoading}
      pagination={{ current: t.pageNumber, pageSize: t.pageSize, total: completedData?.data?.totalCount ?? 0 }}
      onChange={t.onTableChange}
      search={{ columns: searchColumns, column: t.searchColumn, text: t.searchText, onChange: t.setSearch, placeholder: "Search by" }}
      filters={
        <Select
          allowClear
          placeholder="Today's Interview"
          style={{ minWidth: 200 }}
          popupMatchSelectWidth={false}
          value={durationId || undefined}
          options={InterviewFilterOptions.map((o) => ({ value: o.id, label: o.name }))}
          onChange={(v) => { setDurationId(Number(v ?? 0)); t.resetPage(); }}
        />
      }
      emptyText="No Candidate found"
    />
  );
}
