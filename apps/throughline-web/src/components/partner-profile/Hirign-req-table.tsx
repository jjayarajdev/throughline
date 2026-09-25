"use client";
import React, { useMemo } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button, Dropdown, Result, Typography } from "antd";
import type { MenuProps } from "antd";
import { CloseOutlined, MoreOutlined, PlusOutlined } from "@ant-design/icons";

import DataTable, { type DataColumn } from "@/components/data-table/DataTable";
import { useTableState } from "@/components/data-table/useTableState";
import { useSearchColumns } from "@/components/data-table/useSearchColumns";
import { StatusBadge } from "@/components/status-badge";
import { toast } from "@/lib/toast";
import api from "@/lib/axiosInstance";
import { hiringApi } from "@/services/api/hiring.api";
import { FilterTypeEnum } from "@/constants/FilterTypeEnum";
import { formatDate } from "@/helpers/helper";
import { isPartner, useUserStore } from "@/store/userStore";

interface HrqTableProps {
  /** partner id whose assigned HRQs are listed */
  id: number | string | null | undefined;
  filterType?: FilterTypeEnum;
}

interface PartnerHrqItem {
  [key: string]: any;
  id: number;
  hrqId: string;
  jobTitle: string;
  businessName: string;
  rmOwnerName: string;
  partnerAssignedDate: string;
  numberOfPositions?: number;
  currentStatusHeadCount?: number;
  jobPriorityName?: string;
  hiringStatusName?: string;
  hiringRequestId: string | number;
  isProxyPartner?: boolean;
}

/** Hiring requests assigned to a partner (profile "Hiring Details" tab). */
const HirignReqTable = ({ id, filterType = FilterTypeEnum.PartnerProfileHiringDetails }: HrqTableProps) => {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { partnerId } = useUserStore();
  const t = useTableState({ pageSize: 50, searchColumn: "HrqId" });
  const searchColumns = useSearchColumns(filterType);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["gethiringDetails", id, t.query],
    queryFn: () =>
      hiringApi.getHiringRequestForPartners(
        {
          pageNumber: t.query.pageNumber,
          pageSize: t.query.pageSize,
          searchColumn: t.query.searchColumn ?? "HrqId",
          searchText: t.query.searchText || undefined,
        },
        Number(id)
      ),
    enabled: !!id,
    refetchOnWindowFocus: true,
  });

  const unassignMutation = useMutation({
    mutationFn: async (hiringRequestId: number) => {
      const response = await api.patch(`/HiringRequest/partner-hrqs/remove-partner/${hiringRequestId}/${id}`);
      return response.data;
    },
    onSuccess: () => {
      toast.success("Hiring Request unassigned successfully");
      queryClient.invalidateQueries({ queryKey: ["gethiringDetails", id] });
    },
    onError: () => toast.error("Failed to unassign partner"),
  });

  const adminMenu = (row: PartnerHrqItem): MenuProps["items"] => [
    { key: "unassign", icon: <CloseOutlined />, label: "Unassign", danger: true, onClick: () => unassignMutation.mutate(parseInt(String(row.hiringRequestId))) },
  ];
  const partnerMenu = (row: PartnerHrqItem): MenuProps["items"] => [
    { key: "add", icon: <PlusOutlined />, label: "Add Candidate", onClick: () => router.push(`/home/candidate-management/create-candidate?hrqid=${row.hrqId}`) },
  ];

  const columns = useMemo<DataColumn<PartnerHrqItem>[]>(
    () => [
      {
        key: "hrqId",
        title: "HRQID",
        dataIndex: "hrqId",
        render: (v: string) => <Typography.Link onClick={() => router.push(`/home/hiring-details?hrqid=${v}`)}>{v}</Typography.Link>,
      },
      { key: "jobTitle", title: "Role Hired For", dataIndex: "jobTitle" },
      { key: "businessName", title: "Business Name", dataIndex: "businessName" },
      { key: "rmOwnerName", title: "RM Owner", dataIndex: "rmOwnerName" },
      { key: "partnerAssignedDate", title: "Assigned Date", dataIndex: "partnerAssignedDate", render: (v: string) => formatDate(v) },
      { key: "numberOfPositions", title: "Total Positions", dataIndex: "numberOfPositions", align: "center" },
      { key: "currentStatusHeadCount", title: "Current Positions", dataIndex: "currentStatusHeadCount", align: "center" },
      { key: "jobPriorityName", title: "Priority", dataIndex: "jobPriorityName" },
      { key: "hiringStatusName", title: "Status", dataIndex: "hiringStatusName", render: (v: string) => <StatusBadge status={v} /> },
      ...(!isPartner
        ? [
            {
              key: "actions",
              title: "Actions",
              locked: true,
              align: "center",
              width: 80,
              render: (_: unknown, r: PartnerHrqItem) => (
                <Dropdown menu={{ items: adminMenu(r) }} trigger={["click"]}>
                  <Button size="small" icon={<MoreOutlined />} loading={unassignMutation.isPending && unassignMutation.variables === parseInt(String(r.hiringRequestId))} />
                </Dropdown>
              ),
            } as DataColumn<PartnerHrqItem>,
          ]
        : []),
      ...(isPartner && partnerId !== null
        ? [
            {
              key: "partnerAction",
              title: "Action",
              locked: true,
              align: "center",
              width: 80,
              render: (_: unknown, r: PartnerHrqItem) => (
                <Dropdown menu={{ items: partnerMenu(r) }} trigger={["click"]} disabled={r.isProxyPartner}>
                  <Button size="small" icon={<MoreOutlined />} disabled={r.isProxyPartner} />
                </Dropdown>
              ),
            } as DataColumn<PartnerHrqItem>,
          ]
        : []),
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [partnerId, unassignMutation.isPending, unassignMutation.variables]
  );

  if (error)
    return <Result status="error" title="Could not load hiring requests" subTitle={(error as any)?.response?.data?.message || (error as Error).message} extra={<Button onClick={() => refetch()}>Retry</Button>} />;

  return (
    <DataTable<PartnerHrqItem>
      storageKey="hirng-details"
      rowKey={(r) => String(r.hiringRequestId ?? r.id)}
      columns={columns}
      data={data?.data?.items}
      loading={isLoading}
      pagination={{ current: t.pageNumber, pageSize: t.pageSize, total: data?.data?.totalCount ?? 0 }}
      onChange={t.onTableChange}
      search={{ columns: searchColumns, column: t.searchColumn, text: t.searchText, onChange: t.setSearch, placeholder: "Search by" }}
      emptyText="No hiring Requests found"
    />
  );
};

export default HirignReqTable;
