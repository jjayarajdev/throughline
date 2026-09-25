"use client";
import React, { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button, Card, Dropdown, Table, Tag, Typography } from "antd";
import type { MenuProps } from "antd";
import { CheckOutlined, CloseOutlined, MoreOutlined } from "@ant-design/icons";

import DataTable, { type DataColumn } from "@/components/data-table/DataTable";
import { useTableState } from "@/components/data-table/useTableState";
import { useSearchColumns } from "@/components/data-table/useSearchColumns";
import { toast } from "@/lib/toast";
import api from "@/lib/axiosInstance";
import { onboarding } from "@/services/api/onboarding.api";
import { formatDate } from "@/helpers/helper";
import { FilterTypeEnum } from "@/constants/FilterTypeEnum";

interface PoRow {
  poNumber: string;
  startDate: string;
  endDate: string;
  poValue?: number;
  status: boolean;
}

interface SowRow {
  [key: string]: any;
  id?: string | number;
  type?: number;
  sowNumber: string;
  startDate: string;
  endDate: string;
  tcValue?: number;
  status: boolean;
  poDetails?: PoRow[];
}

const activeTag = (active: boolean) => <Tag color={active ? "green" : "red"}>{active ? "Active" : "Inactive"}</Tag>;

/** Pending SOW / PO entries awaiting approval; each SOW expands to its POs. */
export default function SowApproval() {
  const t = useTableState({ pageSize: 50 });
  const searchColumns = useSearchColumns(FilterTypeEnum.SOW);
  const [actingKey, setActingKey] = useState<string | null>(null);

  const { data: response, isLoading, refetch } = useQuery({
    queryKey: ["SowApproval", t.query],
    queryFn: () =>
      onboarding.fetchSowformApprovalList({
        pageNumber: t.query.pageNumber,
        pageSize: t.query.pageSize,
        searchColumn: t.query.searchColumn ?? "",
        searchText: t.query.searchText || undefined,
      }),
    refetchIntervalInBackground: true,
  });

  const handleApprove = async (sow: SowRow, status: number) => {
    setActingKey(sow.sowNumber);
    try {
      const payload = { id: sow?.id, newStatus: status, type: sow?.type };
      const res = await api.post(`/Partner/approve-SOW-matrix`, payload);
      if (res.status === 200) {
        toast.success(res.data?.message || "Candidate Approved");
        refetch();
      } else {
        toast.error("Error approving candidate");
      }
    } catch {
      toast.error("Error approving candidate");
    }
    setActingKey(null);
  };

  const rowMenu = (sow: SowRow): MenuProps["items"] => [
    { key: "accept", icon: <CheckOutlined />, label: "Accept", onClick: () => handleApprove(sow, 2) },
    { key: "reject", icon: <CloseOutlined />, label: "Reject", danger: true, onClick: () => handleApprove(sow, 3) },
  ];

  const columns = useMemo<DataColumn<SowRow>[]>(
    () => [
      { key: "sowNumber", title: "SOW Number", dataIndex: "sowNumber", render: (v: string) => <Typography.Text strong>{v}</Typography.Text> },
      { key: "startDate", title: "Start Date", dataIndex: "startDate", render: (v: string) => formatDate(v) },
      { key: "endDate", title: "End Date", dataIndex: "endDate", render: (v: string) => formatDate(v) },
      { key: "tcValue", title: "TC Value", dataIndex: "tcValue", render: (v?: number) => v?.toLocaleString("en-IN") },
      { key: "status", title: "Status", dataIndex: "status", render: (v: boolean) => activeTag(v) },
      {
        key: "actions",
        title: "Actions",
        locked: true,
        align: "center",
        width: 80,
        render: (_: unknown, s: SowRow) => (
          <Dropdown menu={{ items: rowMenu(s) }} trigger={["click"]}>
            <Button size="small" icon={<MoreOutlined />} loading={actingKey === s.sowNumber} />
          </Dropdown>
        ),
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [actingKey]
  );

  const poColumns = [
    { key: "poNumber", title: "PO Number", dataIndex: "poNumber" },
    { key: "startDate", title: "Start Date", dataIndex: "startDate", render: (v: string) => formatDate(v) },
    { key: "endDate", title: "End Date", dataIndex: "endDate", render: (v: string) => formatDate(v) },
    { key: "poValue", title: "Value", dataIndex: "poValue", render: (v?: number) => v?.toLocaleString("en-IN") },
    { key: "status", title: "Status", dataIndex: "status", render: (v: boolean) => activeTag(v) },
  ];

  return (
    <Card>
      <DataTable<SowRow>
        storageKey="sow-approval"
        rowKey="sowNumber"
        columns={columns}
        data={response?.data?.items}
        loading={isLoading}
        pagination={{ current: t.pageNumber, pageSize: t.pageSize, total: response?.data?.totalCount ?? 0 }}
        onChange={t.onTableChange}
        search={{ columns: searchColumns, column: t.searchColumn, text: t.searchText, onChange: t.setSearch, placeholder: "Search by" }}
        emptyText="No SOWs found"
        expandable={{
          expandedRowRender: (sow) => (
            <Table<PoRow>
              title={() => <Typography.Text strong>PO Details</Typography.Text>}
              size="small"
              rowKey="poNumber"
              columns={poColumns}
              dataSource={sow.poDetails ?? []}
              pagination={false}
            />
          ),
          rowExpandable: () => true,
        }}
      />
    </Card>
  );
}
