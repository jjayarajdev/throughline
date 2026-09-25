"use client";
import { useState } from "react";
import { Button, Modal, Table, Tooltip, Typography } from "antd";
import type { ColumnsType } from "antd/es/table";
import { EditOutlined, EyeOutlined } from "@ant-design/icons";
import { format, parseISO } from "date-fns";
import { formatDate } from "@/helpers/helper";

export interface SowCR {
  crNumber: string;
  crRequestDate: string;
  crTypeId: number;
  extendedDate: string;
  id: number;
  isActive: boolean;
  isRateChanged?: boolean;
  sowId: number;
  comments?: string;
  crValue?: string;
}

interface Iprops {
  crData: SowCR[];
  onEditCR: (cr: SowCR) => void;
  /** show the "Rate Change" column (SOW CRs only) */
  isToggle: boolean;
}

function isDate(utcDateStr: string): string {
  if (!utcDateStr) return "";
  return format(parseISO(utcDateStr), "yyyy/MM/dd");
}

function crCategory(cr: SowCR) {
  return cr?.comments ? "Others" : cr?.extendedDate ? "Validity-extension" : cr?.isRateChanged ? "Rate-Change" : "Value-Change";
}

/** History of change requests raised on a SOW / PO, with edit + comment preview. */
export default function CrHistoryDetails({ crData, onEditCR, isToggle }: Iprops) {
  const [commentsOf, setCommentsOf] = useState<SowCR | null>(null);

  const columns: ColumnsType<SowCR> = [
    { key: "category", title: "CR Category", render: (_, cr) => crCategory(cr) },
    { key: "crNumber", title: "CR Number", dataIndex: "crNumber" },
    { key: "crRequestDate", title: "CR Requested Date", dataIndex: "crRequestDate", render: (v: string) => formatDate(v) },
    { key: "extendedDate", title: "Extended End Date", dataIndex: "extendedDate", render: (v: string) => isDate(v) },
    { key: "crValue", title: "Value Change", dataIndex: "crValue" },
    ...(isToggle ? [{ key: "isRateChanged", title: "Rate Change", dataIndex: "isRateChanged", render: (v: boolean) => (v ? "yes" : "") } as ColumnsType<SowCR>[number]] : []),
    {
      key: "comments",
      title: "Others",
      render: (_, cr) => (
        <Tooltip title="View Comments">
          <Button type="text" size="small" icon={<EyeOutlined />} onClick={() => setCommentsOf(cr)} />
        </Tooltip>
      ),
    },
    {
      key: "action",
      title: "Action",
      align: "center",
      render: (_, cr) => <Button type="text" size="small" icon={<EditOutlined />} onClick={() => onEditCR(cr)} />,
    },
  ];

  return (
    <>
      <Table<SowCR> size="small" rowKey="id" columns={columns} dataSource={crData ?? []} pagination={false} locale={{ emptyText: "No CRs found" }} scroll={{ x: "max-content" }} />
      <Modal open={!!commentsOf} onCancel={() => setCommentsOf(null)} footer={null} title="CR Comments" destroyOnHidden>
        <Typography.Text type="secondary">Detailed explanation of the requested change.</Typography.Text>
        <Typography.Paragraph className="mt-4" style={{ whiteSpace: "pre-wrap" }}>
          {commentsOf?.comments || "No comments available."}
        </Typography.Paragraph>
      </Modal>
    </>
  );
}
