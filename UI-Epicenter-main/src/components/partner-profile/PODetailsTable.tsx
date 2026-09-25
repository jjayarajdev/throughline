"use client";
import { Card, Table, Tag, Typography } from "antd";
import { format } from "date-fns";

interface PODetailsTableProps {
  poDetails: any[];
}

const fmt = (d?: string) => (d ? format(new Date(d), "yyyy-MM-dd") : "");
const activeTag = (active: boolean) => <Tag color={active ? "green" : "red"}>{active ? "Active" : "Inactive"}</Tag>;

/** SOWs on the partner profile; each row expands to its PO list. */
export function PODetailsTable({ poDetails }: PODetailsTableProps) {
  return (
    <Card size="small">
      <Table
        size="small"
        rowKey="sowNumber"
        dataSource={poDetails ?? []}
        pagination={false}
        scroll={{ x: "max-content", y: 520 }}
        columns={[
          { key: "sowNumber", title: "SOW Number", dataIndex: "sowNumber", render: (v: string) => <Typography.Text strong>{v}</Typography.Text> },
          { key: "startDate", title: "Start Date", dataIndex: "startDate", render: fmt },
          { key: "endDate", title: "End Date", dataIndex: "endDate", render: fmt },
          { key: "tcValue", title: "TC Value", dataIndex: "tcValue" },
          { key: "status", title: "Status", dataIndex: "status", render: (v: boolean) => activeTag(v) },
        ]}
        expandable={{
          expandedRowRender: (sow: any) => (
            <Table
              size="small"
              rowKey="poNumber"
              title={() => <Typography.Text strong>PO Details</Typography.Text>}
              dataSource={sow.poDetails ?? []}
              pagination={false}
              columns={[
                { key: "poNumber", title: "PO Number", dataIndex: "poNumber" },
                { key: "startDate", title: "Start Date", dataIndex: "startDate", render: fmt },
                { key: "endDate", title: "End Date", dataIndex: "endDate", render: fmt },
                { key: "poValue", title: "Value", dataIndex: "poValue" },
                { key: "status", title: "Status", dataIndex: "status", render: (v: boolean) => activeTag(v) },
              ]}
            />
          ),
        }}
      />
    </Card>
  );
}
