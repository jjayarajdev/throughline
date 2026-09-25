"use client";
import React, { useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Button, Dropdown, Result } from "antd";
import type { MenuProps } from "antd";
import { CheckOutlined, MoreOutlined, StopOutlined } from "@ant-design/icons";
import DataTable, { type DataColumn } from "@/components/data-table/DataTable";
import { useTableState } from "@/components/data-table/useTableState";
import { useSearchColumns } from "@/components/data-table/useSearchColumns";
import { StatusBadge } from "@/components/status-badge";
import { toast } from "@/lib/toast";
import { Hiring, hiringApi } from "@/services/api/hiring.api";
import { FilterTypeEnum } from "@/constants/FilterTypeEnum";
import { formatDate, tatFormat } from "@/helpers/helper";
import { isAdmin, isRmowner } from "@/store/userStore";

/** Hiring requests waiting for review ("bin") — approve / reject from the row menu. */
export default function BinPage() {
  const router = useRouter();
  const t = useTableState({ pageSize: 50, sortBy: "hrqId", sortOrder: "desc", searchColumn: "HrqId" });
  const searchColumns = useSearchColumns(FilterTypeEnum.HiringManagement);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["hiringBin", t.query, t.sortColumns],
    queryFn: () =>
      hiringApi.getHiringBin({
        pageNumber: t.query.pageNumber,
        pageSize: t.query.pageSize,
        searchColumn: t.query.searchColumn,
        searchText: t.query.searchText,
        sortColumns: t.sortColumns,
        isBin: true,
      }),
    refetchOnWindowFocus: true,
  });

  useEffect(() => {
    if (error) toast.error("Failed to fetch hiring");
  }, [error]);

  const rowMenu = (hiring: Hiring): MenuProps["items"] => [
    {
      key: "approve",
      icon: <CheckOutlined />,
      label: "Approve",
      onClick: () => router.push(`/home/hiring-review-requests/hiring-requests?id=${encodeURIComponent(Number(hiring.id))}&statusId=${encodeURIComponent(32001)}`),
    },
    {
      key: "reject",
      icon: <StopOutlined />,
      label: "Reject",
      danger: true,
      onClick: () => router.push(`/home/hiring-review-requests/hiring-requests?id=${Number(hiring.id)}&statusId=${32002}`),
    },
  ];

  const columns = useMemo<DataColumn<Hiring>[]>(
    () => [
      { key: "hrqId", title: "HRQ ID", dataIndex: "hrqId", sorter: true, fixed: "left" },
      { key: "businessName", title: "Business", dataIndex: "businessName" },
      { key: "rcMsProjectId", title: "RCMS ID", dataIndex: "rcMsProjectId", defaultHidden: true },
      { key: "projectName", title: "Project", dataIndex: "projectName" },
      { key: "requestorName", title: "Requester", dataIndex: "requestorName" },
      { key: "jobTitle", title: "Role Hired For", dataIndex: "jobTitle" },
      { key: "requestStartDate", title: "Request Start Date", dataIndex: "requestStartDate", sorter: true, render: (v: string) => (v ? formatDate(v) : "") },
      { key: "hiringStatusName", title: "Status", dataIndex: "hiringStatusName", render: (v: string) => <StatusBadge status={v} /> },
      ...(isAdmin || isRmowner ? [{ key: "parentHrqId", title: "Parent HRQID", dataIndex: "parentHrqId", defaultHidden: true } as DataColumn<Hiring>] : []),
      { key: "tatDate", title: "TAT (Hours/Days)", dataIndex: "tatDate", render: (_: unknown, h: Hiring) => <StatusBadge status={tatFormat(String(h.requestStartDate))} /> },
      {
        key: "actions",
        title: "Actions",
        locked: true,
        align: "center",
        width: 80,
        fixed: "right",
        render: (_: unknown, h: Hiring) => (
          <Dropdown menu={{ items: rowMenu(h) }} trigger={["click"]}>
            <Button size="small" icon={<MoreOutlined />} />
          </Dropdown>
        ),
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  if (error) return <Result status="error" title="Could not load hiring review requests" subTitle={(error as Error).message} extra={<Button onClick={() => refetch()}>Retry</Button>} />;

  return (
    <DataTable<Hiring>
      title="Hiring Review Requests"
      storageKey="hiring-bin"
      rowKey="id"
      columns={columns}
      data={data?.data?.items}
      loading={isLoading}
      pagination={{ current: t.pageNumber, pageSize: t.pageSize, total: data?.data?.totalCount ?? 0 }}
      onChange={t.onTableChange}
      search={{ columns: searchColumns, column: t.searchColumn, text: t.searchText, onChange: t.setSearch, placeholder: "Search by" }}
      emptyText="No Hiring Request found"
    />
  );
}
