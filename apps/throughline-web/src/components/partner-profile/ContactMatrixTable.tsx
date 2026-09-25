"use client";
import { Card, Table } from "antd";
import { StatusBadge } from "../status-badge";

interface ContactMatrixTableProps {
  contacts: any[];
}

/** Read-only contact matrix on the partner profile. */
export function ContactMatrixTable({ contacts }: ContactMatrixTableProps) {
  return (
    <Card size="small">
      <Table
        size="small"
        rowKey={(r: any) => r.id ?? r.email}
        dataSource={contacts ?? []}
        pagination={false}
        scroll={{ x: "max-content" }}
        columns={[
          { key: "contactMatrixTypeName", title: "Contact Type", dataIndex: "contactMatrixTypeName" },
          { key: "name", title: "Name", dataIndex: "name" },
          { key: "email", title: "Email ID", dataIndex: "email" },
          { key: "contactNumber", title: "Contact Number", dataIndex: "contactNumber" },
          { key: "countryName", title: "Country", dataIndex: "countryName" },
          { key: "designation", title: "Designation", dataIndex: "designation" },
          { key: "statusName", title: "Status", dataIndex: "statusName", render: (v: string) => <StatusBadge status={v} /> },
        ]}
      />
    </Card>
  );
}
