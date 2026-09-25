"use client";
import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Button, Dropdown, Result } from "antd";
import { EditOutlined, MoreOutlined } from "@ant-design/icons";

import DataTable, { type DataColumn } from "@/components/data-table/DataTable";
import { useTableState } from "@/components/data-table/useTableState";
import { useSearchColumns } from "@/components/data-table/useSearchColumns";
import { FilterTypeEnum } from "@/constants/FilterTypeEnum";
import { formatDate } from "@/helpers/helper";
import { partnerApi } from "@/services/api/partner.profile.api";
import { EngagementItem, EngagementResponse, statusTableProps } from "./types";

/** Partners' engagements filtered by evaluation status (one tab of Engagement Management). */
const EngagementStatusTable = ({ statusId }: statusTableProps) => {
  const router = useRouter();
  const partnerId = "";
  const t = useTableState({ pageSize: 50, searchColumn: "partnerName" });
  const searchColumns = useSearchColumns(FilterTypeEnum.Engagement_Management);

  const { data: partnersResponse, isLoading, error, refetch } = useQuery<EngagementResponse>({
    queryKey: ["partnersStatusPaged", t.query.pageNumber, statusId, partnerId, t.query.searchText, t.query.pageSize, t.searchColumn],
    queryFn: () =>
      partnerApi.getEngagementListByEvaluationStatus(
        {
          pageNumber: t.query.pageNumber,
          pageSize: t.query.pageSize,
          searchColumn: t.searchColumn,
          searchText: t.query.searchText || undefined,
        },
        statusId,
        partnerId
      ),
    refetchOnWindowFocus: true,
  });

  const columns = useMemo<DataColumn<EngagementItem>[]>(
    () => [
      { key: "partnerCode", title: "Partner ID", dataIndex: "partnerCode" },
      { key: "nickname", title: "Partner", dataIndex: "nickname", render: (v: string) => v ?? "-" },
      { key: "businessCenter", title: "Business Center", dataIndex: "businessCenter", render: (v: string) => v ?? "-" },
      { key: "tenuareInDays", title: "Tenure", dataIndex: "tenuareInDays", render: (v: number) => v ?? "-" },
      {
        key: "evaluationPeriod",
        title: "Evaluation Period",
        dataIndex: "evaluationPeriod",
        render: (_: unknown, item) => `${formatDate(item.evaluationStartDate)} - ${formatDate(item.evaluationEndDate)}`,
      },
      { key: "evaluationStatusName", title: "Status", dataIndex: "evaluationStatusName", render: (v: string) => v ?? "-" },
      { key: "engagementTypeName", title: "Type", dataIndex: "engagementTypeName", render: (v: string) => v ?? "-" },
      { key: "businessUnitName", title: "Business Unit", dataIndex: "businessUnitName", render: (v: string) => v ?? "-" },
      {
        key: "actions",
        title: "Action",
        locked: true,
        align: "center",
        width: 80,
        render: (_: unknown, item) => (
          <Dropdown
            trigger={["click"]}
            menu={{
              items: [
                {
                  key: "edit",
                  icon: <EditOutlined />,
                  label: "Edit",
                  onClick: () => router.push(`/home/partner-onboarding/edit-partner?id=${item.partnerId}&tab=engagement`),
                },
              ],
            }}
          >
            <Button size="small" icon={<MoreOutlined />} />
          </Dropdown>
        ),
      },
    ],
    [router]
  );

  if (error) return <Result status="error" title="Error loading data" subTitle={(error as Error).message} extra={<Button onClick={() => refetch()}>Retry</Button>} />;

  return (
    <DataTable<EngagementItem>
      storageKey={`engagement-status-${statusId}`}
      rowKey="id"
      columns={columns}
      data={partnersResponse?.data?.items}
      loading={isLoading}
      pagination={{ current: t.pageNumber, pageSize: t.pageSize, total: partnersResponse?.data?.totalCount ?? 0 }}
      onChange={t.onTableChange}
      search={{ columns: searchColumns, column: t.searchColumn, text: t.searchText, onChange: t.setSearch, placeholder: "Search by" }}
    />
  );
};

export default EngagementStatusTable;
