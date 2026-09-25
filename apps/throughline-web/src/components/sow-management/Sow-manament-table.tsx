"use client";
import { Collapse, Empty, Table } from "antd";
import type { ColumnsType } from "antd/es/table";
import { format } from "date-fns";
import { StatusBadge } from "@/components/status-badge";

interface SowTableProps {
  data: any[];
}

const poColumns: ColumnsType<any> = [
  { key: "poNumber", title: "PO Number", dataIndex: "poNumber" },
  { key: "startDate", title: "Start Date", dataIndex: "startDate", render: (v: string) => format(new Date(v), "dd MMM yyyy") },
  { key: "endDate", title: "End Date", dataIndex: "endDate", render: (v: string) => format(new Date(v), "dd MMM yyyy") },
  { key: "poValue", title: "Value", dataIndex: "poValue", render: (v: number) => `₹${v.toLocaleString()}` },
  { key: "status", title: "Status", dataIndex: "status", render: (v: boolean) => <StatusBadge status={v ? "Active" : "Inactive"} /> },
];

const sowColumns: ColumnsType<any> = [
  { key: "sowNumber", title: "SOW Number", dataIndex: "sowNumber" },
  { key: "startDate", title: "Start Date", dataIndex: "startDate", render: (v: string) => format(new Date(v), "dd MMM yyyy") },
  { key: "endDate", title: "End Date", dataIndex: "endDate", render: (v: string) => format(new Date(v), "dd MMM yyyy") },
  { key: "tcValue", title: "TC Value", dataIndex: "tcValue", render: (v: number) => `₹${v.toLocaleString()}` },
  { key: "status", title: "Status", dataIndex: "status", render: (v: boolean) => <StatusBadge status={v ? "Active" : "Inactive"} /> },
];

/** SOW list with the POs of each SOW (active / inactive groups) in the expanded row. */
export const SowTable = ({ data }: SowTableProps) => {
  const renderPos = (sow: any) => {
    const pos: any[] = sow.poDetails ?? [];
    if (!pos.length) return <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No PO details available" />;
    const items = [true, false]
      .map((active) => ({ active, rows: pos.filter((po) => po.status === active) }))
      .filter((g) => g.rows.length > 0)
      .map((g) => ({
        key: `${sow.id}-${g.active ? "active" : "inactive"}`,
        label: `${g.active ? "Active POs" : "Inactive POs"} (${g.rows.length})`,
        children: <Table size="small" rowKey="id" columns={poColumns} dataSource={g.rows} pagination={false} scroll={{ x: "max-content" }} />,
      }));
    return <Collapse size="small" items={items} />;
  };

  return (
    <Table
      size="small"
      rowKey="id"
      columns={sowColumns}
      dataSource={data}
      pagination={false}
      expandable={{ expandedRowRender: renderPos, columnTitle: "PO Details" }}
      locale={{ emptyText: <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No SOWs found" /> }}
      scroll={{ x: "max-content" }}
    />
  );
};
