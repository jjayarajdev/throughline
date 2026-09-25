"use client";
import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Button, Result, Select, Space, Typography } from "antd";
import DataTable, { type DataColumn } from "@/components/data-table/DataTable";
import { useTableState } from "@/components/data-table/useTableState";
import { useSearchColumns } from "@/components/data-table/useSearchColumns";
import { StatusBadge } from "@/components/status-badge";
import { toast } from "@/lib/toast";
import { Partner, partnerApi } from "@/services/api/partner.profile.api";
import { dropdownApi } from "@/services/api/master";
import { MasterTypes } from "@/constants/masterTypes";
import { FilterTypeEnum } from "@/constants/FilterTypeEnum";
import { CandidateHiringRequests } from "../candidate/Hiring-Table";

/** Partners with their hiring requests; expand a row to see the partner's HRQs. */
export default function PartnerHrqs() {
  const router = useRouter();
  const t = useTableState({ pageSize: 50 });
  const searchColumns = useSearchColumns(FilterTypeEnum.SOWManagement_PartnerSOWDetails);
  const [statusId, setStatusId] = useState<number[]>([19001]);
  const [expandedPartnerId, setExpandedPartnerId] = useState<number | null>(null);

  const { data: partnersResponse, isLoading, error, refetch } = useQuery({
    queryKey: ["partners", t.query, statusId],
    queryFn: () =>
      partnerApi.getPartners(
        {
          pageNumber: t.query.pageNumber,
          pageSize: t.query.pageSize,
          searchColumn: t.query.searchColumn,
          searchText: t.query.searchText,
        },
        statusId,
        true
      ),
    enabled: !!statusId,
    refetchOnWindowFocus: true,
  });

  const { data: PARTNER_STATUS = [] } = useQuery({
    queryKey: ["PARTNER_STATUS"],
    queryFn: () => dropdownApi.fetchDropdown(MasterTypes.PARTNER_STATUS),
    select: (rows: { id: number; name: string }[]) => rows.filter((item) => item.id !== 19004),
  });

  useEffect(() => {
    if (error) toast.error("Failed to fetch partners");
  }, [error]);

  const columns = useMemo<DataColumn<Partner>[]>(
    () => [
      {
        key: "partnerCode",
        title: "Partner ID",
        dataIndex: "partnerCode",
        render: (v: string) => <Typography.Link onClick={() => router.push(`/home/partner-onboarding/partner-profile/${v}`)}>{v}</Typography.Link>,
      },
      { key: "nickname", title: "Partner", dataIndex: "nickname" },
      {
        key: "engagementTypeName",
        title: "Engagement Type",
        dataIndex: "engagementTypeName",
        render: (v: string) => (
          <Space direction="vertical" size={0}>
            {[...new Set((v || "").split(",").map((item) => item.trim()))].map((item, idx) => (
              <Typography.Text key={idx}>{item || "N/A"}</Typography.Text>
            ))}
          </Space>
        ),
      },
      { key: "startDate", title: "Start Date", dataIndex: "startDate", render: (v: string) => new Date(v).toLocaleDateString() },
      { key: "partnerStatusName", title: "Empanelled Status", dataIndex: "partnerStatusName", render: (v: string) => <StatusBadge status={v} /> },
      { key: "approverName", title: "Approved By", dataIndex: "approverName", render: (v: string | null) => v || "N/A" },
      {
        key: "approvedStatus",
        title: "VM Approval",
        dataIndex: "approvedStatus",
        render: (v: boolean | null) => <StatusBadge showIcon={false} status={v == null ? "Pending" : v ? "Approved" : "Rejected"} />,
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  if (error) return <Result status="error" title="Could not load partners" subTitle={(error as Error).message} extra={<Button onClick={() => refetch()}>Retry</Button>} />;

  return (
    <DataTable<Partner>
      storageKey="partner-hrqs"
      rowKey="id"
      columns={columns}
      data={partnersResponse?.data?.items}
      loading={isLoading}
      pagination={{ current: t.pageNumber, pageSize: t.pageSize, total: partnersResponse?.data?.totalCount ?? 0 }}
      onChange={t.onTableChange}
      search={{ columns: searchColumns, column: t.searchColumn, text: t.searchText, onChange: t.setSearch, placeholder: "Search by" }}
      filters={
        <Select
          mode="multiple"
          allowClear
          maxTagCount="responsive"
          placeholder="Choose status"
          style={{ minWidth: 200 }}
          value={statusId}
          options={PARTNER_STATUS.map((s) => ({ value: s.id, label: s.name }))}
          onChange={(v) => {
            setStatusId(v);
            t.resetPage();
          }}
        />
      }
      expandable={{
        expandedRowKeys: expandedPartnerId == null ? [] : [expandedPartnerId],
        onExpand: (expanded, partner) => setExpandedPartnerId(expanded ? partner.id : null),
        expandedRowRender: (partner) => <CandidateHiringRequests filterType={FilterTypeEnum.All_HRQID} id={String(partner.id)} />,
      }}
      emptyText="No partners found"
    />
  );
}
