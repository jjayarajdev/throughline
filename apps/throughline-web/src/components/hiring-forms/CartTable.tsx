"use client";
import React, { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button, Dropdown, Result, Select, Switch, Tooltip, Typography } from "antd";
import type { MenuProps } from "antd";
import { EditOutlined, EyeOutlined, FileAddOutlined, FilterOutlined, MoreOutlined, PlusOutlined } from "@ant-design/icons";

import DataTable, { type DataColumn } from "@/components/data-table/DataTable";
import { useTableState } from "@/components/data-table/useTableState";
import { useSearchColumns } from "@/components/data-table/useSearchColumns";
import { StatusBadge } from "@/components/status-badge";
import { toast } from "@/lib/toast";
import api from "@/lib/axiosInstance";
import { Hiring, hiringApi } from "@/services/api/hiring.api";
import { dropdownApi } from "@/services/api/master";
import { MasterTypes } from "@/constants/masterTypes";
import { FilterTypeEnum } from "@/constants/FilterTypeEnum";
import { formatDate, fyears, getTatColor, tatBetween } from "@/helpers/helper";
import {
  isAdmin,
  isDomainManager,
  isHiringAccept,
  isHiringCreate,
  isHiringEdit,
  isHiringManager,
  isPanel,
  isRmowner,
  isVendorManager,
  useUserStore,
} from "@/store/userStore";
import { AddPositionSheet } from "./SheetDrawer/AddPositionSheet";

const TAT_OPTIONS = [
  { value: 0, label: "All" },
  { value: 1, label: "0-30 days" },
  { value: 2, label: "30-60 days" },
  { value: 3, label: "60-90 days" },
  { value: 4, label: "90-120 days" },
  { value: 5, label: "120+ days" },
];
const QUARTER_OPTIONS = [
  { value: 5, label: "All quarters" },
  { value: 1, label: "Q1 (Nov-Jan)" },
  { value: 2, label: "Q2 (Feb-Apr)" },
  { value: 3, label: "Q3 (May-Jul)" },
  { value: 4, label: "Q4 (Aug-Oct)" },
];
const STATUS_HEADCOUNT_LABEL: Record<number, string> = {
  12002: "Open HeadCount",
  12007: "Closed HeadCount",
  12005: "On Hold HeadCount",
  12004: "Identified HeadCount",
};

/** All approved hiring requests ("cart") — the main hiring grid. */
export default function CartPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { userId } = useUserStore();
  const showHeadCount = isPanel || isDomainManager || isHiringManager || isAdmin || isRmowner || isVendorManager;

  const t = useTableState({ pageSize: 50, sortBy: "hrqId", sortOrder: "desc", searchColumn: "HrqId" });
  const searchColumns = useSearchColumns(FilterTypeEnum.HiringManagement);

  const [statusIds, setStatusIds] = useState<number[]>([12002]);
  // 1 = "All FY" (accepts any quarter); a specific year requires a quarter 1-4
  const [financialYear, setFinancialYear] = useState<number>(1);
  const [quarterId, setQuarterId] = useState<number>(5);
  const [durationId, setDurationId] = useState<number>(0);
  const [showAssigned, setShowAssigned] = useState(true);
  const [parentHrq, setParentHrq] = useState(true);
  const [addPositionFor, setAddPositionFor] = useState<Hiring | null>(null);
  const [acceptingIds, setAcceptingIds] = useState<Set<number>>(new Set());

  const { data: statusOptions = [] } = useQuery({
    queryKey: ["HiringStatus"],
    queryFn: () => dropdownApi.fetchDropdown(MasterTypes.HIRING_STATUS),
    select: (rows: { id: number; name: string }[]) => rows.filter((r) => r.id !== 12001),
  });

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["hiringCart", t.query, t.sortColumns, statusIds, showAssigned, parentHrq, durationId, financialYear, quarterId],
    queryFn: () =>
      hiringApi.getHiringCart({
        pageNumber: t.query.pageNumber,
        pageSize: t.query.pageSize,
        searchColumn: t.query.searchColumn,
        searchText: t.query.searchText,
        sortColumns: t.sortColumns,
        hiringStatusIds: statusIds,
        isBin: false,
        isAssigned: showAssigned,
        isParent: parentHrq,
        tatDurationId: durationId,
        financialYear,
        quarterId,
        startDate: null,
        endDate: null,
      }),
    enabled: !!financialYear,
  });

  const { mutate: exportExcel, isPending: exporting } = useMutation({
    mutationFn: () => downloadExcel({ statusIds, userId: userId!, durationId, financialYear, quarterId, showAssigned, parentHrq, sortColumns: t.sortColumns }),
    onSuccess: (blob) => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "hiring-requests.xlsx";
      a.click();
      URL.revokeObjectURL(url);
    },
    onError: () => toast.error("Export failed"),
  });

  const { mutate: acceptHiring } = useMutation({
    mutationFn: ({ id, userId }: { id: number; userId: number }) => hiringApi.hiringAcceptrmOwner(id, userId),
    onMutate: ({ id }) => setAcceptingIds((s) => new Set(s).add(id)),
    onSuccess: (res) => {
      toast.success(res?.message || "Accepted successfully");
      queryClient.invalidateQueries({ queryKey: ["hiringCart"] });
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || "Failed to accept hiring"),
    onSettled: (_r, _e, { id }) =>
      setAcceptingIds((s) => {
        const n = new Set(s);
        n.delete(id);
        return n;
      }),
  });

  const rowMenu = (hiring: Hiring): MenuProps["items"] => [
    ...(isHiringEdit
      ? [{ key: "edit", icon: <EditOutlined />, label: "Edit", onClick: () => router.push(`/home/hiring-management/${hiring.id}`) }]
      : []),
    ...(isHiringEdit && hiring.parentHrqId == null && hiring.hiringStatusName === "Open-WIP"
      ? [{ key: "add", icon: <FileAddOutlined />, label: "Add position", onClick: () => setAddPositionFor(hiring) }]
      : []),
    { key: "view", icon: <EyeOutlined />, label: "View hiring details", onClick: () => router.push(`/home/hiring-details?hrqid=${hiring.hrqId}`) },
  ];

  const columns = useMemo<DataColumn<Hiring>[]>(
    () => [
      {
        key: "hrqId",
        title: "HRQ ID",
        dataIndex: "hrqId",
        sorter: true,
        fixed: "left",
        render: (v: string) =>
          isPanel ? v : <Typography.Link onClick={() => router.push(`/home/hiring-management/hiring-profile?id=${v}`)}>{v}</Typography.Link>,
      },
      { key: "businessName", title: "Business", dataIndex: "businessName" },
      { key: "rcMsProjectId", title: "RCMS ID", dataIndex: "rcMsProjectId", defaultHidden: true },
      { key: "projectName", title: "Project", dataIndex: "projectName", defaultHidden: true },
      { key: "jobTitle", title: "Role Hired For", dataIndex: "jobTitle" },
      { key: "requestStartDate", title: "Request Start Date", dataIndex: "requestStartDate", sorter: true, render: (v: string) => (v ? formatDate(v) : "") },
      ...(isAdmin || isRmowner ? [{ key: "parentHrqId", title: "Parent HRQ ID", dataIndex: "parentHrqId", defaultHidden: true } as DataColumn<Hiring>] : []),
      ...(showHeadCount
        ? ([
            { key: "totalHeadCount", title: "Total HeadCount", dataIndex: "totalHeadCount", align: "center" },
            { key: "openHeadCount", title: "Open HeadCount", dataIndex: "openHeadCount", align: "center" },
            { key: "identifiedHeadCount", title: "Identified HeadCount", dataIndex: "identifiedHeadCount", align: "center", defaultHidden: true },
            { key: "onholdHeadCount", title: "OnHold HeadCount", dataIndex: "onholdHeadCount", align: "center", defaultHidden: true },
            { key: "closedHeadCount", title: "Closed HeadCount", dataIndex: "closedHeadCount", align: "center", defaultHidden: true },
            {
              key: "currentStatusHeadCount",
              title: STATUS_HEADCOUNT_LABEL[statusIds[0]] ?? "Current Positions",
              dataIndex: "currentStatusHeadCount",
              align: "center",
              defaultHidden: true,
            },
          ] as DataColumn<Hiring>[])
        : []),
      { key: "hiringStatusName", title: "Status", dataIndex: "hiringStatusName", render: (v: string) => <StatusBadge status={v} /> },
      {
        key: "rmOwner",
        title: "RM Owner",
        dataIndex: "rmOwnerName",
        render: (_: unknown, h: Hiring) =>
          h.isRMOwnerAccepted ? (
            h.rmOwnerName
          ) : h.hiringStatusName === "Cancelled" ? null : (
            <Button type="primary" size="small" loading={!!h.id && acceptingIds.has(h.id)} onClick={() => h.id && userId && acceptHiring({ id: h.id, userId })}>
              Accept
            </Button>
          ),
      },
      {
        key: "tatDate",
        title: (
          <span className="inline-flex items-center gap-1">
            TAT (Hours/Days)
            <Dropdown
              menu={{
                items: TAT_OPTIONS.map((o) => ({ key: String(o.value), label: o.label })),
                selectable: true,
                selectedKeys: [String(durationId)],
                onClick: ({ key }) => {
                  setDurationId(Number(key));
                  t.resetPage();
                },
              }}
              trigger={["click"]}
            >
              <Tooltip title="Filter by TAT">
                <Button type="text" size="small" icon={<FilterOutlined />} />
              </Tooltip>
            </Dropdown>
          </span>
        ),
        dataIndex: "tatDate",
        render: (_: unknown, h: Hiring) => <StatusBadge color={getTatColor(h.tatDate ? String(h.tatDate) : undefined, (h as any).tatEndDate)} status={tatBetween(h.tatDate ? String(h.tatDate) : undefined, (h as any).tatEndDate)} />,
      },
      {
        key: "actions",
        title: "Actions",
        locked: true,
        align: "center",
        width: 80,
        fixed: "right",
        render: (_: unknown, h: Hiring) => (
          <Dropdown menu={{ items: rowMenu(h) }} trigger={["click"]} disabled={!h.isRMOwnerAccepted}>
            <Button size="small" icon={<MoreOutlined />} />
          </Dropdown>
        ),
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [statusIds, durationId, acceptingIds, showHeadCount, userId]
  );

  if (error) return <Result status="error" title="Could not load hiring requests" subTitle={(error as Error).message} extra={<Button onClick={() => refetch()}>Retry</Button>} />;

  const filters = (
    <>
      <Select
        mode="multiple"
        allowClear
        maxTagCount="responsive"
        placeholder="Status"
        style={{ minWidth: 200 }}
        value={statusIds}
        options={(showAssigned ? statusOptions : statusOptions.filter((s) => [12002, 12008].includes(s.id))).map((s) => ({ value: s.id, label: s.name }))}
        onChange={(v) => {
          setStatusIds(v);
          t.resetPage();
        }}
      />
      <Select
        value={financialYear}
        options={fyears.map((f) => ({ value: f.id, label: f.name }))}
        onChange={(v) => {
          setFinancialYear(v);
          if (v !== 1 && quarterId === 5) setQuarterId(1);
          t.resetPage();
        }}
        style={{ minWidth: 110 }}
        popupMatchSelectWidth={false}
      />
      {financialYear !== 1 && (
        <Select
          value={quarterId}
          options={QUARTER_OPTIONS.filter((q) => q.value !== 5)}
          onChange={(v) => {
            setQuarterId(v);
            t.resetPage();
          }}
          style={{ minWidth: 140 }}
          popupMatchSelectWidth={false}
        />
      )}
      {(isAdmin || isRmowner || isVendorManager) && (
        <Switch checked={parentHrq} onChange={(v) => { setParentHrq(v); t.resetPage(); }} checkedChildren="Parent HRQ" unCheckedChildren="Parent HRQ" />
      )}
      {isHiringAccept && (
        <Switch checked={showAssigned} onChange={(v) => { setShowAssigned(v); t.resetPage(); }} checkedChildren="Assigned" unCheckedChildren="Unassigned" />
      )}
    </>
  );

  return (
    <>
      <DataTable<Hiring>
        storageKey="hiring-cart"
        rowKey="id"
        columns={columns}
        data={data?.data?.items}
        loading={isLoading}
        pagination={{ current: t.pageNumber, pageSize: t.pageSize, total: data?.data?.totalCount ?? 0 }}
        onChange={t.onTableChange}
        search={{ columns: searchColumns, column: t.searchColumn, text: t.searchText, onChange: t.setSearch, placeholder: "Search hiring requests" }}
        filters={filters}
        onExport={isAdmin || isRmowner || isVendorManager ? () => exportExcel() : undefined}
        exporting={exporting}
        actions={
          isHiringCreate ? (
            <Button type="primary" icon={<PlusOutlined />} onClick={() => router.push("/home/hiring-management/create-hiring")}>
              Create
            </Button>
          ) : null
        }
        emptyText="No hiring requests found"
      />
      {addPositionFor && <AddPositionSheet isOpen onClose={() => setAddPositionFor(null)} selectedCandidate={addPositionFor} />}
    </>
  );
}

async function downloadExcel({
  statusIds,
  durationId,
  financialYear,
  quarterId,
  userId,
  showAssigned,
  parentHrq,
  sortColumns,
}: {
  statusIds: number[];
  durationId: number;
  financialYear: number;
  quarterId: number;
  userId: number;
  showAssigned: boolean;
  parentHrq: boolean;
  sortColumns: { column: string; descending: boolean }[];
}) {
  const query = new URLSearchParams({
    isBin: "false",
    isAssigned: String(showAssigned),
    financialYearStart: String(financialYear),
    quarterId: String(quarterId),
    userId: String(userId),
    isParent: String(parentHrq),
  });
  if (durationId !== 0) query.append("durationId", String(durationId));
  if (statusIds.length) query.append("hiringStatusId", statusIds.join(","));
  const response = await api.post(`/HiringRequest/download-all-excel?${query}`, { sortColumns }, { responseType: "blob", headers: { accept: "*/*" } });
  return response.data as Blob;
}
