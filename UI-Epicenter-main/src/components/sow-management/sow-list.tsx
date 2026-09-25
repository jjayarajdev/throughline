"use client";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Empty, Table, Tabs, Typography } from "antd";
import type { ColumnsType } from "antd/es/table";
import { format } from "date-fns";
import DataTable, { type DataColumn } from "@/components/data-table/DataTable";
import { StatusBadge } from "@/components/status-badge";
import { partnerApi } from "@/services/api/partner.profile.api";

interface SOW {
  sowNumber: string;
  startDate: string;
  endDate: string;
  tcValue: number;
  status: boolean;
  poDetails: PODetail[];
  soW_CRs: SOWCR[];
  partnerId: number;
  partnerName: string;
  partnerCode: string;
  id: number;
  isActive: boolean;
}

interface PODetail {
  poNumber: string;
  startDate: string;
  endDate: string;
  poValue: number;
  status: boolean;
  pO_CRs: unknown[];
  sowId: number;
  sowNumber: string;
  id: number;
  isActive: boolean;
}

interface SOWCR {
  crTypeId: number;
  crNumber: string;
  crRequestDate: string;
  extendedDate?: string;
  isRateChanged: boolean;
  comments?: string;
  sowId: number;
  id: number;
  isActive: boolean;
}

const fmt = (v: string) => format(new Date(v), "dd MMM yyyy");

const poColumns: ColumnsType<PODetail> = [
  { key: "poNumber", title: "PO Number", dataIndex: "poNumber" },
  { key: "startDate", title: "Start Date", dataIndex: "startDate", render: fmt },
  { key: "endDate", title: "End Date", dataIndex: "endDate", render: fmt },
  { key: "poValue", title: "PO Value", dataIndex: "poValue", render: (v: number) => `₹${v.toLocaleString()}` },
  { key: "status", title: "Status", dataIndex: "status", render: (v: boolean) => <StatusBadge status={v ? "Active" : "Inactive"} /> },
];

const sowColumns: DataColumn<SOW>[] = [
  { key: "partnerCode", title: "Partner Code", dataIndex: "partnerCode" },
  { key: "sowNumber", title: "SOW Number", dataIndex: "sowNumber" },
  { key: "startDate", title: "Start Date", dataIndex: "startDate", render: fmt },
  { key: "endDate", title: "End Date", dataIndex: "endDate", render: fmt },
  { key: "tcValue", title: "TC Value", dataIndex: "tcValue", render: (v: number) => `₹${v.toLocaleString()}` },
  { key: "status", title: "Status", dataIndex: "status", render: (v: boolean) => <StatusBadge status={v ? "Active" : "Inactive"} /> },
];

/** Every SOW across partners, split into Active / Up for Renewal / Inactive. */
export default function CompleteSowList() {
  const [currentPage, setCurrentPage] = useState(1);
  const [activeTab, setActiveTab] = useState(1);
  const [pageSize, setPageSize] = useState(50);

  const { data: activeSows, isLoading: isLoadingActive } = useQuery({
    queryKey: ["sowDetails", 1, currentPage, pageSize],
    queryFn: () => partnerApi.getCompleteSowList(1, { pageNumber: currentPage, pageSize }),
  });
  const { data: upForRenewalSows, isLoading: isLoadingRenewal } = useQuery({
    queryKey: ["sowDetails", 2, currentPage, pageSize],
    queryFn: () => partnerApi.getCompleteSowList(2, { pageNumber: currentPage, pageSize }),
  });
  const { data: inactiveSows, isLoading: isLoadingInactive } = useQuery({
    queryKey: ["sowDetails", 3, currentPage, pageSize],
    queryFn: () => partnerApi.getCompleteSowList(3, { pageNumber: currentPage, pageSize }),
  });

  const isLoading = isLoadingActive || isLoadingRenewal || isLoadingInactive;
  const currentData = activeTab === 1 ? activeSows?.data : activeTab === 2 ? upForRenewalSows?.data : activeTab === 3 ? inactiveSows?.data : null;

  const items = [
    { key: "1", label: `Active (${activeSows?.data?.totalCount || 0})` },
    {
      key: "2",
      label: (
        <span>
          Up for Renewal <Typography.Text type="danger">({upForRenewalSows?.data?.totalCount || 0})</Typography.Text>
        </span>
      ),
    },
    { key: "3", label: `Inactive (${inactiveSows?.data?.totalCount || 0})` },
  ];

  return (
    <div>
      <Tabs
        activeKey={String(activeTab)}
        items={items}
        onChange={(k) => {
          setPageSize(10);
          setActiveTab(Number(k));
          setCurrentPage(1);
        }}
      />
      <DataTable<SOW>
        storageKey="complete-sow-list"
        rowKey="id"
        columns={sowColumns}
        data={currentData?.items || []}
        loading={isLoading}
        pagination={{ current: currentPage, pageSize, total: currentData?.totalCount ?? 0 }}
        onChange={(p) => {
          if (p.pageSize && p.pageSize !== pageSize) {
            setPageSize(p.pageSize);
            setCurrentPage(1);
          } else if (p.current) {
            setCurrentPage(p.current);
          }
        }}
        expandable={{
          expandedRowRender: (sow) =>
            sow.poDetails?.length ? (
              <Table<PODetail> size="small" rowKey="id" columns={poColumns} dataSource={sow.poDetails} pagination={false} scroll={{ x: "max-content" }} />
            ) : (
              <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No PO details available" />
            ),
        }}
        emptyText="No SOWs found"
      />
    </div>
  );
}
