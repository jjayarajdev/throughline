"use client";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Button, Result, Select } from "antd";
import DataTable, { type DataColumn } from "@/components/data-table/DataTable";
import { useTableState } from "@/components/data-table/useTableState";
import { useSearchColumns } from "@/components/data-table/useSearchColumns";
import { StatusBadge } from "@/components/status-badge";
import { slotApi } from "@/services/api/slot.api";
import { FilterTypeEnum } from "@/constants/FilterTypeEnum";
import { InterviewFilterOptions } from "@/constants/slot-status";
import { apiErrorMessage, CandidateLink, DateRangeFilter, type DateRangeValue, HrqLink, PanelNames, ResumePreview, type SlotRow, TatCell } from "./cells";

/** Candidates whose interview process is completed (Evaluation tab). */
export default function CompletedPagination() {
  const router = useRouter();
  const t = useTableState({ pageSize: 50, searchColumn: "HrqId" });
  const searchColumns = useSearchColumns(FilterTypeEnum.Evaluation_Completed);

  const [statusId, setStatusId] = useState<number[]>([15009]);
  const [dateRange, setDateRange] = useState<DateRangeValue>();

  const { data: completedData, isLoading, error, refetch } = useQuery({
    queryKey: ["completedInterview", t.pageNumber, t.query.searchText, t.searchColumn, t.pageSize, dateRange, statusId],
    queryFn: () =>
      slotApi.getCompletedInterview({
        pageNumber: t.pageNumber,
        pageSize: t.pageSize,
        searchColumn: t.searchColumn,
        searchText: t.query.searchText,
        startDate: dateRange?.from || null,
        endDate: dateRange?.to || null,
        intakeStatusIds: statusId,
      } as any),
    retry: 1,
    refetchOnWindowFocus: true,
    refetchInterval: 30000,
  });

  const columns = useMemo<DataColumn<SlotRow>[]>(
    () => [
      { key: "hrqId", title: "HRQ ID", dataIndex: "hrqId", render: (v: string) => <HrqLink hrqId={v} /> },
      { key: "candidateCode", title: "Candidate ID", dataIndex: "candidateCode", render: (v: string) => <CandidateLink code={v} /> },
      { key: "candidateName", title: "Candidate Name", dataIndex: "candidateName" },
      { key: "panelNames", title: "Panel", dataIndex: "panelNames", defaultHidden: true, render: (v: string) => <PanelNames names={v} /> },
      { key: "jobTitle", title: "Role Hired For", dataIndex: "jobTitle" },
      { key: "nickname", title: "Partner", dataIndex: "nickname" },
      { key: "intakeStatusName", title: "Status", dataIndex: "intakeStatusName", render: (v: string) => <StatusBadge status={v} /> },
      {
        key: "resume",
        title: "Resume",
        dataIndex: "resume",
        align: "center",
        render: (_: unknown, r: SlotRow) => <ResumePreview url={r.resume?.attachmentURL} fileName={`${r.candidateName}'s Resume`} />,
      },
      { key: "tatDate", title: "TAT(days)", dataIndex: "tatDate", render: (v: string) => <TatCell tatDate={v} /> },
      {
        key: "actions",
        title: "Action",
        locked: true,
        align: "center",
        fixed: "right",
        render: (_: unknown, r: SlotRow) => (
          <Button type="primary" size="small" onClick={() => router.push(`/home/candidate-management/candidate-profile?id=${r.candidateCode}`)}>
            Review Feedback
          </Button>
        ),
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  if (error) return <Result status="error" title="Could not load completed candidates" subTitle={apiErrorMessage(error)} extra={<Button onClick={() => refetch()}>Retry</Button>} />;

  return (
    <DataTable<SlotRow>
      title="Completed"
      storageKey="slot-completed"
      rowKey={(r) => String(r.candidateId)}
      columns={columns}
      data={completedData?.data?.items}
      loading={isLoading}
      pagination={{ current: t.pageNumber, pageSize: t.pageSize, total: completedData?.data?.totalCount ?? 0 }}
      onChange={t.onTableChange}
      search={{ columns: searchColumns, column: t.searchColumn, text: t.searchText, onChange: t.setSearch, placeholder: "Search by" }}
      filters={
        <>
          <DateRangeFilter value={dateRange} onChange={(v) => { setDateRange(v); t.resetPage(); }} />
          <Select
            mode="multiple"
            allowClear
            maxTagCount="responsive"
            placeholder="Choose status"
            style={{ minWidth: 220 }}
            value={statusId}
            options={InterviewFilterOptions.map((o) => ({ value: o.id, label: o.name }))}
            onChange={(v) => { setStatusId(v); t.resetPage(); }}
          />
        </>
      }
      emptyText="No Candidate found"
    />
  );
}
