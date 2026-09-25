"use client";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Button, Result, Space, Switch, Tag } from "antd";
import DataTable, { type DataColumn } from "@/components/data-table/DataTable";
import { useTableState } from "@/components/data-table/useTableState";
import { useSearchColumns } from "@/components/data-table/useSearchColumns";
import { slotApi } from "@/services/api/slot.api";
import { FilterTypeEnum } from "@/constants/FilterTypeEnum";
import { formatDate } from "@/helpers/helper";
import { isDomainManager, isHiringManager, isPartner } from "@/store/userStore";
import { CandidateDetailsTypes } from "./types";
import { FeedbackPendingSheet } from "./sheets/FeedbackPendingSheet";
import { apiErrorMessage, bySortKey, CandidateLink, DateRangeFilter, type DateRangeValue, HrqLink, PanelNames, ResumePreview, type SlotRow, TatCell } from "./cells";

/** Interviews that still need feedback (Evaluation tab). */
export default function FeebackPendingPagination() {
  const router = useRouter();
  const t = useTableState({ pageSize: 50, searchColumn: "HrqId" });
  const searchColumns = useSearchColumns(FilterTypeEnum.Evaluation_FeedbackPending);

  const [dateRange, setDateRange] = useState<DateRangeValue>();
  const [isSelf, setIsSelf] = useState(true);
  const [selectedCandidate, setSelectedCandidate] = useState<CandidateDetailsTypes | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  const { data: feedbackPendingData, isLoading, error, refetch } = useQuery({
    queryKey: ["feedbackPending", t.pageNumber, t.searchColumn, t.query.searchText, t.pageSize, isSelf, dateRange],
    queryFn: () =>
      slotApi.getFeedbackPending({
        pageNumber: t.pageNumber,
        pageSize: t.pageSize,
        searchColumn: t.searchColumn,
        searchText: t.query.searchText,
        startDate: dateRange?.from || null,
        endDate: dateRange?.to || null,
        isSelf,
      } as any),
    retry: 1,
    refetchOnWindowFocus: true,
    refetchInterval: 30000,
  });

  const handleOpenSheet = (row: SlotRow) => {
    if (!row) return;
    setSelectedCandidate(row as CandidateDetailsTypes);
    setIsSheetOpen(true);
  };

  const columns = useMemo<DataColumn<SlotRow>[]>(
    () => [
      { key: "hrqId", title: "HRQ ID", dataIndex: "hrqId", sorter: bySortKey("hrqId"), render: (v: string) => <HrqLink hrqId={v} /> },
      { key: "candidateCode", title: "Candidate ID", dataIndex: "candidateCode", sorter: bySortKey("candidateCode"), render: (v: string) => <CandidateLink code={v} /> },
      { key: "candidateName", title: "Candidate Name", dataIndex: "candidateName" },
      { key: "jobTitle", title: "Role Hired For", dataIndex: "jobTitle" },
      ...(isPartner ? [] : [{ key: "nickname", title: "Partner", dataIndex: "nickname" } as DataColumn<SlotRow>]),
      { key: "noticePeriod", title: "Notice", dataIndex: "noticePeriod", sorter: bySortKey("noticePeriod") },
      { key: "phone", title: "Contact", dataIndex: "phone" },
      { key: "currentRoundName", title: "Round Name", dataIndex: "currentRoundName" },
      { key: "panelNames", title: "Panel", dataIndex: "panelNames", defaultHidden: true, render: (v: string) => <PanelNames names={v} /> },
      { key: "interviewModeName", title: "Interview Mode", dataIndex: "interviewModeName" },
      { key: "date", title: "Interview Date", dataIndex: "date", sorter: bySortKey("date"), render: (v: string) => formatDate(v) },
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
              fixed: "right",
              render: (_: unknown, r: SlotRow) => (
                <Space size={4}>
                  {r.hasInterviewFeedback && r.candidateInterviewStatusName !== "Onhold" ? (
                    <Button type="primary" size="small" onClick={() => router.push(`/panel-feedback/${r.interviewSlotId}`)}>
                      Add Feedback
                    </Button>
                  ) : (
                    <Button type="primary" size="small" onClick={() => handleOpenSheet(r)}>
                      Add Feedback
                    </Button>
                  )}
                  {r.candidateInterviewStatusName === "Onhold" && <Tag color="red">On Hold</Tag>}
                </Space>
              ),
            } as DataColumn<SlotRow>,
          ]),
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  if (error) return <Result status="error" title="Could not load feedback pending list" subTitle={apiErrorMessage(error)} extra={<Button onClick={() => refetch()}>Retry</Button>} />;

  return (
    <>
      <DataTable<SlotRow>
        title="Feedback Pending"
        storageKey="slot-feedback-pending"
        rowKey={(r) => `${r.candidateId}-${r.interviewSlotId ?? ""}`}
        columns={columns}
        data={feedbackPendingData?.data?.items}
        loading={isLoading}
        pagination={{ current: t.pageNumber, pageSize: t.pageSize, total: feedbackPendingData?.data?.totalCount ?? 0 }}
        onChange={t.onTableChange}
        search={{ columns: searchColumns, column: t.searchColumn, text: t.searchText, onChange: t.setSearch, placeholder: "Search by" }}
        filters={
          <>
            {(isHiringManager || isDomainManager) && (
              <Switch checked={isSelf} onChange={(v) => { setIsSelf(v); t.resetPage(); }} checkedChildren="Self" unCheckedChildren="Team" />
            )}
            <DateRangeFilter value={dateRange} onChange={(v) => { setDateRange(v); t.resetPage(); }} />
          </>
        }
        emptyText="No data found"
      />
      {selectedCandidate && (
        <FeedbackPendingSheet
          isOpen={isSheetOpen}
          onClose={() => {
            setIsSheetOpen(false);
            setSelectedCandidate(null);
          }}
          selectedCandidate={selectedCandidate}
        />
      )}
    </>
  );
}
