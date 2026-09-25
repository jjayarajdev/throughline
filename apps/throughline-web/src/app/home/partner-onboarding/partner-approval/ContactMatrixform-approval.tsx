"use client";
import React, { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button, Dropdown, Typography } from "antd";
import type { MenuProps } from "antd";
import { CheckOutlined, CloseOutlined, MoreOutlined } from "@ant-design/icons";

import DataTable, { type DataColumn } from "@/components/data-table/DataTable";
import { useTableState } from "@/components/data-table/useTableState";
import { useSearchColumns } from "@/components/data-table/useSearchColumns";
import { toast } from "@/lib/toast";
import api from "@/lib/axiosInstance";
import { onboarding } from "@/services/api/onboarding.api";
import { FilterTypeEnum } from "@/constants/FilterTypeEnum";

interface MatrixRow {
  [key: string]: any;
  id: string;
  type?: number;
  contactTypeName?: string;
  escalationMatrixTypeName?: string;
  name?: string;
  email?: string;
  contactNumber?: string;
  partnerName?: string;
  countryName?: string;
  designation?: string;
  statusName?: string;
}

/** Pending contact / escalation matrix entries awaiting approval. */
export function ContactMatrixformApproval() {
  const t = useTableState({ pageSize: 50 });
  const searchColumns = useSearchColumns(FilterTypeEnum.MATRIXESCALATION);
  const [actingId, setActingId] = useState<string | null>(null);

  const { data: response, isLoading, error, refetch } = useQuery({
    queryKey: ["ContactMatrixformApproval", t.query],
    queryFn: () =>
      onboarding.fetchContactMatrixformApprovalList({
        pageNumber: t.query.pageNumber,
        pageSize: t.query.pageSize,
        searchColumn: t.query.searchColumn ?? "",
        searchText: t.query.searchText || undefined,
      }),
    refetchIntervalInBackground: true,
  });

  useEffect(() => {
    if (error) toast.error("Failed to fetch candidates");
  }, [error]);

  const handleApprove = async (row: MatrixRow, status: number) => {
    setActingId(row.id);
    try {
      const payload = { id: row?.id, newStatus: status, type: row?.type };
      const res = await api.post(`/Partner/approve-matrix`, payload);
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

  const rowMenu = (row: MatrixRow): MenuProps["items"] => [
    { key: "accept", icon: <CheckOutlined />, label: "Accept", onClick: () => handleApprove(row, 2) },
    { key: "reject", icon: <CloseOutlined />, label: "Reject", danger: true, onClick: () => handleApprove(row, 3) },
  ];

  const columns = useMemo<DataColumn<MatrixRow>[]>(
    () => [
      {
        key: "contactTypeName",
        title: "Contact Type",
        dataIndex: "contactTypeName",
        render: (_: unknown, r: MatrixRow) => r?.contactTypeName || r?.escalationMatrixTypeName,
      },
      { key: "name", title: "Name", dataIndex: "name" },
      { key: "email", title: "Email ID", dataIndex: "email" },
      { key: "contactNumber", title: "Contact Number", dataIndex: "contactNumber" },
      { key: "partnerName", title: "Partner", dataIndex: "partnerName" },
      { key: "countryName", title: "Country", dataIndex: "countryName" },
      { key: "designation", title: "Designation", dataIndex: "designation" },
      {
        key: "statusName",
        title: "Status",
        dataIndex: "statusName",
        render: (v: string) => (
          <Typography.Text type={v?.toLowerCase() === "active" ? "success" : "secondary"} strong>
            {v}
          </Typography.Text>
        ),
      },
      {
        key: "actions",
        title: "Actions",
        locked: true,
        align: "center",
        width: 80,
        render: (_: unknown, r: MatrixRow) => (
          <Dropdown menu={{ items: rowMenu(r) }} trigger={["click"]}>
            <Button size="small" icon={<MoreOutlined />} loading={actingId === r.id} />
          </Dropdown>
        ),
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [actingId]
  );

  return (
    <DataTable<MatrixRow>
      storageKey="candidates-details"
      rowKey={(r) => r.id ?? `${r.type}-${r.email}`}
      columns={columns}
      data={response?.data?.items}
      loading={isLoading}
      pagination={{ current: t.pageNumber, pageSize: t.pageSize, total: response?.data?.totalCount ?? 0 }}
      onChange={t.onTableChange}
      search={{ columns: searchColumns, column: t.searchColumn, text: t.searchText, onChange: t.setSearch, placeholder: "Search by" }}
      emptyText="No candidates found"
    />
  );
}
