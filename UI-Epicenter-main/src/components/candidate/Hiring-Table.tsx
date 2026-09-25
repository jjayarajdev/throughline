"use client";
import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button, Dropdown, Result, Tooltip, Typography } from "antd";
import type { MenuProps } from "antd";
import { CloseOutlined, MoreOutlined, PlusOutlined } from "@ant-design/icons";

import DataTable, { type DataColumn } from "@/components/data-table/DataTable";
import { useTableState } from "@/components/data-table/useTableState";
import { useSearchColumns } from "@/components/data-table/useSearchColumns";
import { StatusBadge } from "@/components/status-badge";
import { toast } from "@/lib/toast";
import api from "@/lib/axiosInstance";
import { hiringApi } from "@/services/api/hiring.api";
import type { FilterTypeEnum } from "@/constants/FilterTypeEnum";
import { formatDate } from "@/helpers/helper";
import { isPartner, useUserStore } from "@/store/userStore";

export const searchList = [{ id: "HrqId", name: "HRQID" }];

type HiringRow = Record<string, any>;

/** Hiring requests assigned to a partner; partners add candidates, others can unassign. */
export function CandidateHiringRequests({ id, filterType }: { id: string | null; filterType: number }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { partnerId } = useUserStore();

  const t = useTableState({ pageSize: 50, searchColumn: "HrqId" });
  const searchColumns = useSearchColumns(filterType as FilterTypeEnum);

  const { data: getHiringDetails, isLoading, error, refetch } = useQuery({
    queryKey: ["gethiringDetails", id, t.query],
    queryFn: () =>
      hiringApi.getHiringRequestForPartners(
        { pageNumber: t.query.pageNumber, pageSize: t.query.pageSize, searchColumn: t.query.searchColumn, searchText: t.query.searchText },
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

  const partnerMenu = (h: HiringRow): MenuProps["items"] => [
    {
      key: "add",
      icon: <PlusOutlined />,
      label: "Add Candidate",
      onClick: () => router.push(`/home/candidate-management/create-candidate?hrqid=${h.hrqId}`),
    },
  ];
  const adminMenu = (h: HiringRow): MenuProps["items"] => [
    { key: "unassign", icon: <CloseOutlined />, label: "Unassign", danger: true, onClick: () => unassignMutation.mutate(parseInt(h.hiringRequestId)) },
  ];

  const columns = useMemo<DataColumn<HiringRow>[]>(
    () => [
      {
        key: "hrqId",
        title: "HRQID",
        dataIndex: "hrqId",
        fixed: "left",
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
              fixed: "right",
              render: (_: unknown, h: HiringRow) => (
                <Dropdown menu={{ items: adminMenu(h) }} trigger={["click"]}>
                  <Button size="small" icon={<MoreOutlined />} />
                </Dropdown>
              ),
            } as DataColumn<HiringRow>,
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
              fixed: "right",
              render: (_: unknown, h: HiringRow) => (
                <Tooltip title="Actions">
                  <Dropdown menu={{ items: partnerMenu(h) }} trigger={["click"]} disabled={h.isProxyPartner}>
                    <Button size="small" icon={<MoreOutlined />} />
                  </Dropdown>
                </Tooltip>
              ),
            } as DataColumn<HiringRow>,
          ]
        : []),
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [partnerId]
  );

  if (error)
    return (
      <Result
        status="error"
        title="Could not load hiring requests"
        subTitle={(error as any)?.response?.data?.message || (error as Error).message}
        extra={<Button onClick={() => refetch()}>Retry</Button>}
      />
    );

  return (
    <DataTable<HiringRow>
      storageKey="candidate-hiring-requests"
      rowKey="hiringRequestId"
      columns={columns}
      data={getHiringDetails?.data?.items || []}
      loading={isLoading}
      pagination={{ current: t.pageNumber, pageSize: t.pageSize, total: getHiringDetails?.data?.totalCount ?? 0 }}
      onChange={t.onTableChange}
      search={{ columns: searchColumns, column: t.searchColumn, text: t.searchText, onChange: t.setSearch, placeholder: "Search hiring requests" }}
      emptyText="No hiring Requests found"
    />
  );
}
