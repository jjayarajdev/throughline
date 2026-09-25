"use client";
import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Select, Spin, Tabs, Typography } from "antd";
import Link from "next/link";
import DataTable, { type DataColumn } from "@/components/data-table/DataTable";
import { useTableState } from "@/components/data-table/useTableState";
import { useSearchColumns } from "@/components/data-table/useSearchColumns";
import { StatusBadge } from "@/components/status-badge";
import { toast } from "@/lib/toast";
import { Partner, partnerApi } from "@/services/api/partner.profile.api";
import { dropdownApi } from "@/services/api/master";
import { FilterTypeEnum } from "@/constants/FilterTypeEnum";
import { MasterTypes } from "@/constants/masterTypes";
import { SowTable } from "@/components/sow-management/Sow-manament-table";

/** Active / up-for-renewal / inactive SOWs of one partner (the expanded row). */
function PartnerSows({ partnerId }: { partnerId: string }) {
  const { data: active, isLoading: l1 } = useQuery({
    queryKey: ["sowDetails", partnerId, 1],
    queryFn: () => partnerApi.getSowDetails(1, partnerId, {}),
  });
  const { data: expiring, isLoading: l2 } = useQuery({
    queryKey: ["sowDetails", partnerId, 2],
    queryFn: () => partnerApi.getSowDetails(2, partnerId, {}),
  });
  const { data: inactive, isLoading: l3 } = useQuery({
    queryKey: ["sowDetails", partnerId, 3],
    queryFn: () => partnerApi.getSowDetails(3, partnerId, {}),
  });
  const loading = l1 || l2 || l3;
  const items = [
    { key: "active", label: `Active (${active?.data?.items?.length || 0})`, children: <SowTable data={active?.data?.items || []} /> },
    {
      key: "expiring",
      label: (
        <span>
          Up for Renewal <Typography.Text type="danger">({expiring?.data?.items?.length || 0})</Typography.Text>
        </span>
      ),
      children: <SowTable data={expiring?.data?.items || []} />,
    },
    { key: "inactive", label: `Inactive (${inactive?.data?.items?.length || 0})`, children: <SowTable data={inactive?.data?.items || []} /> },
  ];
  return (
    <div className="p-2">
      {loading ? <Spin className="w-full p-4" /> : <Tabs defaultActiveKey="active" items={items} />}
    </div>
  );
}

/** Partner-wise SOW management: partners grid, each row expands to that partner's SOWs. */
export default function PartnerSowManagement() {
  const t = useTableState({ pageSize: 50 });
  const searchColumns = useSearchColumns(FilterTypeEnum.SOWManagement_PartnerSOWDetails);
  const [statusId, setStatusId] = useState<number[]>([19001]);
  const [expandedPartnerId, setExpandedPartnerId] = useState<string | null>(null);

  const { data: partnersResponse, isLoading, error } = useQuery({
    queryKey: ["partners", t.query, statusId],
    queryFn: () =>
      partnerApi.getPartners(
        { pageNumber: t.query.pageNumber, pageSize: t.query.pageSize, searchColumn: t.query.searchColumn, searchText: t.query.searchText || undefined },
        statusId,
        true
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

  const partners: Partner[] = useMemo(
    () => (partnersResponse?.data?.items || []).map(({ stateId, countryId, cityId, contactMatrices, engagements, capabilitiesDeckDocuments, ...rest }: any) => rest),
    [partnersResponse]
  );

  const columns: DataColumn<Partner>[] = [
    {
      key: "partnerCode",
      title: "Partner ID",
      dataIndex: "partnerCode",
      render: (v: string) => <Link href={`/home/partner-onboarding/partner-profile/${v}`}>{v}</Link>,
    },
    { key: "nickname", title: "Partner", dataIndex: "nickname" },
    {
      key: "engagementTypeName",
      title: "Engagement Type",
      dataIndex: "engagementTypeName",
      render: (v: string) => (
        <ul className="pl-4" style={{ listStyle: "disc", margin: 0 }}>
          {[...new Set((v || "").split(",").map((s) => s.trim()))].map((item, idx) => (
            <li key={idx} style={{ whiteSpace: "pre-line" }}>
              {item || "N/A"}
            </li>
          ))}
        </ul>
      ),
    },
    { key: "startDate", title: "Start Date", dataIndex: "startDate", render: (v: string) => new Date(v).toLocaleDateString() },
    { key: "partnerStatusName", title: "Empanelled Status", dataIndex: "partnerStatusName", render: (v: string) => <StatusBadge status={v} /> },
    { key: "approverName", title: "Approved By", dataIndex: "approverName", render: (v: string | null) => v || "N/A" },
    {
      key: "approvedStatus",
      title: "VM Approval",
      dataIndex: "approvedStatus",
      render: (v: boolean | null) => <Typography.Text type={v == null ? "warning" : v ? "success" : "danger"}>{v == null ? "Pending" : v ? "Approved" : "Rejected"}</Typography.Text>,
    },
  ];

  return (
    <DataTable<Partner>
      storageKey="partner-details"
      rowKey="id"
      columns={columns}
      data={partners}
      loading={isLoading}
      pagination={{ current: t.pageNumber, pageSize: t.pageSize, total: partnersResponse?.data?.totalCount ?? 0 }}
      onChange={t.onTableChange}
      search={{ columns: searchColumns, column: t.searchColumn, text: t.searchText, onChange: t.setSearch, placeholder: "Search by" }}
      filters={
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
      }
      expandable={{
        expandedRowKeys: expandedPartnerId ? [Number(expandedPartnerId)] : [],
        onExpand: (expanded, partner) => setExpandedPartnerId(expanded ? partner.id.toString() : null),
        expandedRowRender: (partner) => <PartnerSows partnerId={partner.id.toString()} />,
        columnTitle: "Sow",
      }}
      emptyText="No partners found"
    />
  );
}
