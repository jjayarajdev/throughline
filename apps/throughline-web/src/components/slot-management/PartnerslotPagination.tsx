"use client";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button, Result } from "antd";
import DataTable, { type DataColumn } from "@/components/data-table/DataTable";
import { useTableState } from "@/components/data-table/useTableState";
import { useSearchColumns } from "@/components/data-table/useSearchColumns";
import { StatusBadge } from "@/components/status-badge";
import { slotApi } from "@/services/api/slot.api";
import { PARTNER_SLOT_STATUS, PARTNER_SLOT_STATUS_CONFIG } from "@/constants/slot-status";
import { FilterTypeEnum } from "@/constants/FilterTypeEnum";
import { formatDate, isAfterDateTime } from "@/helpers/helper";
import { useUserStore } from "@/store/userStore";
import { CandidateDetailsTypes } from "./types";
import { ParnterSlotsheet } from "./sheets/Parnterslotsheet";
import { PartnerConfirmsheet } from "./sheets/ParnterConfirmsheet";
import { apiErrorMessage, bySortKey, CandidateLink, DateRangeFilter, type DateRangeValue, HrqLink, type SlotRow, TatCell } from "./cells";

/** Partner-side slot grids: Accept Slot (1) and Scheduled (2). */
export default function PartnerSlotPagination({ slotStatusTypeId }: { slotStatusTypeId: number }) {
  const config = PARTNER_SLOT_STATUS_CONFIG[slotStatusTypeId as keyof typeof PARTNER_SLOT_STATUS_CONFIG];
  const buttonName = config.actionButton;
  const { partnerId } = useUserStore();
  const ispartnerId = partnerId === null ? 0 : Number(partnerId);

  const t = useTableState({ pageSize: 50, searchColumn: "HrqId" });
  const searchColumns = useSearchColumns(FilterTypeEnum.Evaluation_Screening);
  const [dateRange, setDateRange] = useState<DateRangeValue>();
  const [selectedCandidate, setSelectedCandidate] = useState<CandidateDetailsTypes | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const durationId = 0;

  const { data: partnerSlotData, error, isPending, refetch } = useQuery({
    queryKey: ["partnerSlot", t.pageNumber, t.searchColumn, t.query.searchText, slotStatusTypeId, t.pageSize, durationId, dateRange],
    queryFn: () =>
      slotApi.getPartnerSlot(
        slotStatusTypeId,
        ispartnerId,
        {
          pageNumber: t.pageNumber,
          pageSize: t.pageSize,
          searchColumn: t.searchColumn,
          searchText: t.query.searchText,
          startDate: dateRange?.from || null,
          endDate: dateRange?.to || null,
        } as any,
        durationId
      ),
    enabled: true,
    refetchOnWindowFocus: true,
    refetchInterval: 30000,
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
      { key: "candidateName", title: "Candidate Name", dataIndex: "candidateName" },
      { key: "jobTitle", title: "Role Hired For", dataIndex: "jobTitle" },
      { key: "nickname", title: "Partner", dataIndex: "nickname" },
      { key: "date", title: "Interview Date", dataIndex: "date", render: (v: string) => (v ? formatDate(v) : null) },
      { key: "time", title: "Interview Time", dataIndex: "time", sorter: bySortKey("time") },
      { key: "phone", title: "Contact", dataIndex: "phone" },
      { key: "status", title: "Round Name", dataIndex: "currentRoundName", render: (v: string) => <StatusBadge status={v} /> },
      { key: "noticePeriod", title: "Notice", dataIndex: "noticePeriod" },
      { key: "tatDate", title: "TAT(days)", dataIndex: "tatDate", render: (v: string) => <TatCell tatDate={v} /> },
      {
        key: "actions",
        title: "Action",
        locked: true,
        align: "center",
        fixed: "right",
        render: (_: unknown, r: SlotRow) => (
          <Button type="primary" size="small" disabled={!isAfterDateTime(r.date, r.time) && slotStatusTypeId === 2} onClick={() => handleOpenSheet(r)}>
            {buttonName}
          </Button>
        ),
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [slotStatusTypeId, buttonName]
  );

  const getSheetComponent = () => {
    if (!selectedCandidate) return null;
    switch (slotStatusTypeId) {
      case PARTNER_SLOT_STATUS.ASSIGN_SLOT:
        return <ParnterSlotsheet isOpen={isSheetOpen} onClose={handleCloseSheet} selectedCandidate={selectedCandidate} />;
      case PARTNER_SLOT_STATUS.SCHEDULED:
        return <PartnerConfirmsheet isOpen={isSheetOpen} onClose={handleCloseSheet} selectedCandidate={selectedCandidate} />;
      default:
        return null;
    }
  };

  if (error) return <Result status="error" title="Could not load slots" subTitle={apiErrorMessage(error)} extra={<Button onClick={() => refetch()}>Retry</Button>} />;

  return (
    <>
      <DataTable<SlotRow>
        title={config.title}
        storageKey={`partner-slot-${slotStatusTypeId}`}
        rowKey={(r) => `${r.candidateId}-${r.interviewSlotId ?? ""}`}
        columns={columns}
        data={partnerSlotData?.data?.items}
        loading={isPending}
        pagination={{ current: t.pageNumber, pageSize: t.pageSize, total: partnerSlotData?.data?.totalCount ?? 0 }}
        onChange={t.onTableChange}
        search={{ columns: searchColumns, column: t.searchColumn, text: t.searchText, onChange: t.setSearch, placeholder: "Search by" }}
        filters={<DateRangeFilter value={dateRange} onChange={(v) => { setDateRange(v); t.resetPage(); }} />}
        emptyText="No data found"
      />
      {getSheetComponent()}
    </>
  );
}
