"use client";
import { Card, Table } from "antd";

interface EngagementTableProps {
  engagements: any[];
}

/** Read-only engagement list on the partner profile. */
export function EngagementTable({ engagements }: EngagementTableProps) {
  return (
    <Card size="small">
      <Table
        size="small"
        rowKey={(r: any) => r.id ?? `${r.engagementTypeName}-${r.businessUnitName}`}
        dataSource={engagements ?? []}
        pagination={false}
        scroll={{ x: "max-content" }}
        columns={[
          { key: "engagementTypeName", title: "Type", dataIndex: "engagementTypeName" },
          { key: "businessUnitName", title: "Business Unit Name", dataIndex: "businessUnitName" },
          { key: "engagementStatusName", title: "Engagement status", dataIndex: "engagementStatusName" },
          { key: "evaluatedBy", title: "Evaluated By", dataIndex: "evaluatedBy" },
          { key: "evaluationStatusName", title: "Evalutaion Status", dataIndex: "evaluationStatusName" },
        ]}
      />
    </Card>
  );
}
