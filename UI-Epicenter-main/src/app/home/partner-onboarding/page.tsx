"use client";
import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Button, Dropdown, Flex, Select, Switch, Tooltip, Typography } from "antd";
import type { MenuProps } from "antd";
import { EditOutlined, MoreOutlined, PlusOutlined } from "@ant-design/icons";

import DataTable, { type DataColumn } from "@/components/data-table/DataTable";
import { useTableState } from "@/components/data-table/useTableState";
import { useSearchColumns } from "@/components/data-table/useSearchColumns";
import { StatusBadge } from "@/components/status-badge";
import { toast } from "@/lib/toast";
import api from "@/lib/axiosInstance";
import { Partner, partnerApi } from "@/services/api/partner.profile.api";
import { dropdownApi } from "@/services/api/master";
import { MasterTypes } from "@/constants/masterTypes";
import { FilterTypeEnum } from "@/constants/FilterTypeEnum";
import { formatDate } from "@/helpers/helper";
import { usePartnerStore } from "@/store/userPartnerStore";
import { isPartner } from "@/store/userStore";

/** Partner Management list — all partners with status / VM-approval filters. */
export default function PartnerPage() {
  const router = useRouter();
  const { setPartnerStatus, setPartnerCode, setPartnerId, setIsPartnerEmpanelled, setContactMatriId } = usePartnerStore();

  const t = useTableState({ pageSize: 50, sortBy: "partnerCode", sortOrder: "desc" });
  const searchColumns = useSearchColumns(FilterTypeEnum.PartnerManagement);

  const [statusId, setStatusId] = useState<number[]>([19001]);
  const [isVMApproved, setIsVMApproved] = useState(true);

  const { data: partnersResponse, isLoading, error } = useQuery({
    queryKey: ["partners", t.query, t.sortColumns, statusId, isVMApproved],
    queryFn: () =>
      partnerApi.getPartners(
        {
          pageNumber: t.query.pageNumber,
          pageSize: t.query.pageSize,
          searchColumn: t.query.searchColumn ?? "",
          searchText: t.query.searchText || undefined,
          sortColumns: t.sortColumns,
        },
        statusId,
        isVMApproved
      ),
    enabled: !!statusId,
    refetchOnWindowFocus: true,
  });

  const { data: PARTNER_STATUS = [] } = useQuery({
    queryKey: ["PARTNER_STATUS"],
    queryFn: () => dropdownApi.fetchDropdown(MasterTypes.PARTNER_STATUS),
    select: (data: { id: number; name: string }[]) => data.filter((item) => item.id !== 19004),
  });

  useEffect(() => {
    if (error) toast.error("Failed to fetch partners");
  }, [error]);

  const partners = partnersResponse?.data?.items || [];

  const { mutate: exportExcel, isPending: exporting } = useMutation({
    mutationFn: downloadExcel,
    onSuccess: (blob) => {
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "partner-list.xlsx";
      a.click();
      window.URL.revokeObjectURL(url);
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || "Download failed"),
  });

  const rowMenu = (partner: Partner): MenuProps["items"] => [
    {
      key: "edit",
      icon: <EditOutlined />,
      label: "Edit",
      disabled: partner.approvedStatus == null,
      onClick: () => {
        setPartnerStatus(partner.partnerStatusName === "Inactive");
        setPartnerId(partner.id.toString());
        setPartnerCode(partner.partnerCode);
        setIsPartnerEmpanelled(partner.isEmpaneled);
        router.push(`/home/partner-onboarding/edit-partner?id=${partner.id}&tab=profile`);
      },
    },
  ];

  const columns = useMemo<DataColumn<Partner>[]>(
    () => [
      {
        key: "partnerCode",
        title: "Partner ID",
        dataIndex: "partnerCode",
        sorter: true,
        render: (v: string) => <Typography.Link onClick={() => router.push(`/home/partner-onboarding/partner-profile/${v}`)}>{v}</Typography.Link>,
      },
      { key: "nickname", title: "Partner", dataIndex: "nickname" },
      {
        key: "engagementTypeName",
        title: "Engagement Type",
        dataIndex: "engagementTypeName",
        render: (v: string) => (
          <Flex vertical>
            {[...new Set((v || "").split(",").map((n) => n.trim()).filter(Boolean))].map((name) => (
              <Typography.Text key={name}>{name}</Typography.Text>
            ))}
          </Flex>
        ),
      },
      { key: "startDate", title: "Start Date", dataIndex: "startDate", sorter: true, render: (v: string) => formatDate(v) },
      { key: "partnerStatusName", title: "Partner Status", dataIndex: "partnerStatusName", render: (v: string) => <StatusBadge status={v} /> },
      { key: "approverName", title: "Approved By", dataIndex: "approverName" },
      {
        key: "approvedStatus",
        title: "VM Approval",
        dataIndex: "approvedStatus",
        render: (v: boolean | null) => (
          <Typography.Text strong type={v == null ? "warning" : v ? "success" : "danger"}>
            {v == null ? "Pending" : v ? "Approved" : "Rejected"}
          </Typography.Text>
        ),
      },
      {
        key: "actions",
        title: "Actions",
        locked: true,
        align: "center",
        width: 80,
        render: (_: unknown, p: Partner) => (
          <Dropdown menu={{ items: rowMenu(p) }} trigger={["click"]}>
            <Button size="small" icon={<MoreOutlined />} />
          </Dropdown>
        ),
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  const filters = (
    <>
      <Select
        mode="multiple"
        allowClear
        maxTagCount="responsive"
        placeholder="Partner status"
        style={{ minWidth: 200 }}
        value={statusId}
        options={PARTNER_STATUS.map((s) => ({ value: s.id, label: s.name }))}
        onChange={(v) => {
          setStatusId(v);
          t.resetPage();
        }}
      />
      <Switch
        checked={isVMApproved}
        onChange={(v) => {
          setIsVMApproved(v);
          t.resetPage();
        }}
        checkedChildren="Approved"
        unCheckedChildren="Unapproved"
      />
    </>
  );

  return (
    <Flex vertical gap={16} className="p-4">
      <Typography.Title level={4} style={{ margin: 0 }}>
        Partner Management
      </Typography.Title>
      <DataTable<Partner>
        storageKey="partner-details"
        rowKey="id"
        columns={columns}
        data={partners}
        loading={isLoading}
        pagination={{ current: t.pageNumber, pageSize: t.pageSize, total: partnersResponse?.data?.totalCount ?? 0 }}
        onChange={t.onTableChange}
        search={{ columns: searchColumns, column: t.searchColumn, text: t.searchText, onChange: t.setSearch, placeholder: "Search partners" }}
        filters={filters}
        onExport={!isPartner && partners.length ? () => exportExcel({ statusId, sortColumns: t.sortColumns }) : undefined}
        exporting={exporting}
        actions={
          <Tooltip title="Create New Partner">
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => {
                setPartnerCode("PID***");
                setPartnerId("");
                setContactMatriId("");
                router.push("/home/partner-onboarding/add-partner");
              }}
            >
              Create
            </Button>
          </Tooltip>
        }
        emptyText="No partners found"
      />
    </Flex>
  );
}

async function downloadExcel({ statusId, sortColumns }: { statusId: number[]; sortColumns: { column: string; descending: boolean }[] }) {
  const query = new URLSearchParams();
  let url = `Partner/download-all-excel`;
  if (statusId && statusId.length > 0) query.append("statusId", statusId.join(","));
  const queryString = query.toString();
  if (queryString) url += `?${queryString}`;
  const response = await api.post(url, { sortColumns: sortColumns || [] }, { responseType: "blob", headers: { accept: "*/*" } });
  return response.data as Blob;
}
