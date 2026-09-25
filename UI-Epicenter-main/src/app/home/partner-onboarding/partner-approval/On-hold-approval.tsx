"use client";
import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Button, Dropdown, Typography } from "antd";
import type { MenuProps } from "antd";
import { CheckOutlined, CloseOutlined, MoreOutlined } from "@ant-design/icons";

import DataTable, { type DataColumn } from "@/components/data-table/DataTable";
import { useTableState } from "@/components/data-table/useTableState";
import { StatusBadge } from "@/components/status-badge";
import { toast } from "@/lib/toast";
import api from "@/lib/axiosInstance";
import { onboarding } from "@/services/api/onboarding.api";
import { formatDate } from "@/helpers/helper";

interface OnholdRow {
  [key: string]: any;
  hiringRequestId: number | string;
  hrqId: string;
  roleHiredFor?: string;
  onholdReasonName?: string;
  onholdComments?: string;
  onholdRequestedByRoleName?: string;
  onholdRequestedDate?: string;
  reviewStatusName?: string;
}

/** Hiring requests put on hold, awaiting approval of the hold. */
export function Onholdapproval() {
  const router = useRouter();
  const t = useTableState({ pageSize: 10 });
  const [actingId, setActingId] = useState<number | string | null>(null);

  const { data: response, isLoading, error, refetch } = useQuery({
    queryKey: ["OnholdApproval", t.query],
    queryFn: () =>
      onboarding.fetchOnholdApprovalList({
        pageNumber: t.query.pageNumber,
        pageSize: t.query.pageSize,
        searchColumn: "",
        searchText: undefined,
      }),
    refetchIntervalInBackground: true,
  });

  useEffect(() => {
    if (error) toast.error("Failed to fetch candidates");
  }, [error]);

  const handleApprove = async (row: OnholdRow, status: number) => {
    setActingId(row.hiringRequestId);
    try {
      const res = await api.patch(`/HiringRequest/approve-onhold/${row.hiringRequestId}?reviewStatusId=${status}`);
      if (res.status === 200) {
        toast.success(res.data?.message || "Candidate Approved");
        refetch();
      } else {
        toast.error("Error approving candidate");
      }
    } catch {
      toast.error("Error approving candidate");
    }
    setActingId(null);
  };

  const rowMenu = (row: OnholdRow): MenuProps["items"] => [
    { key: "accept", icon: <CheckOutlined />, label: "Accept", onClick: () => handleApprove(row, 85002) },
    { key: "reject", icon: <CloseOutlined />, label: "Reject", danger: true, onClick: () => handleApprove(row, 85003) },
  ];

  const columns = useMemo<DataColumn<OnholdRow>[]>(
    () => [
      {
        key: "hrqId",
        title: "HRQ ID",
        dataIndex: "hrqId",
        render: (v: string) => <Typography.Link onClick={() => router.push(`/home/hiring-details?hrqid=${v}`)}>{v}</Typography.Link>,
      },
      { key: "roleHiredFor", title: "Role Hired For", dataIndex: "roleHiredFor" },
      { key: "onholdReasonName", title: "Reasons For Onhold", dataIndex: "onholdReasonName" },
      { key: "onholdComments", title: "Comments", dataIndex: "onholdComments" },
      { key: "onholdRequestedByRoleName", title: "Requested By", dataIndex: "onholdRequestedByRoleName" },
      { key: "onholdRequestedDate", title: "Requested Date", dataIndex: "onholdRequestedDate", render: (v: string) => formatDate(v) },
      { key: "reviewStatusName", title: "Approval Status", dataIndex: "reviewStatusName", render: (v: string) => <StatusBadge status={v} /> },
      {
        key: "actions",
        title: "Actions",
        locked: true,
        align: "center",
        width: 80,
        render: (_: unknown, r: OnholdRow) => (
          <Dropdown menu={{ items: rowMenu(r) }} trigger={["click"]} disabled={r.reviewStatusName === "Approved"}>
            <Button size="small" icon={<MoreOutlined />} loading={actingId === r.hiringRequestId} disabled={r.reviewStatusName === "Approved"} />
          </Dropdown>
        ),
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [actingId]
  );

  return (
    <DataTable<OnholdRow>
      storageKey="onhold-approval"
      rowKey={(r) => String(r.hiringRequestId ?? r.hrqId)}
      columns={columns}
      data={response?.data?.items}
      loading={isLoading}
      pagination={{ current: t.pageNumber, pageSize: t.pageSize, total: response?.data?.totalCount ?? 0 }}
      onChange={t.onTableChange}
      emptyText="No candidates found"
    />
  );
}
