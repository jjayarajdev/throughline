"use client";
import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Button, Dropdown, Table, Tag, Tooltip, Typography } from "antd";
import type { MenuProps } from "antd";
import type { ColumnsType } from "antd/es/table";
import { DownOutlined, EditOutlined, MenuOutlined, PlusCircleOutlined, PlusOutlined } from "@ant-design/icons";
import { format } from "date-fns";
import DataTable, { type DataColumn } from "@/components/data-table/DataTable";
import { useTableState } from "@/components/data-table/useTableState";
import { StatusBadge } from "@/components/status-badge";
import { partnerApi } from "@/services/api/partner.profile.api";
import { MasterTypes } from "@/constants/masterTypes";
import { AddSowForm } from "./AddSowForm";
import { AddPoForm } from "./AddPoForm";

interface PODetails {
  poNumber: string;
  startDate: string;
  value: number;
  status: "Active" | "Inactive";
}

interface SOWDetails {
  sowNumber: string;
  startDate: string;
  endDate: string;
  tcValue: number;
  status: boolean;
  poDetails: PODetails[];
  partnerId: number;
  id: number;
  isActive: boolean;
}

interface EditSowData extends SOWDetails {
  isEditing?: boolean;
  isRateChange?: boolean;
}
type CRType = "rate-change" | "validity-extension" | "value-change" | "others";

const NO_FLAGS = { isRateChange: false, isValidityExtension: false, isValueChange: false, isOthers: false };
const toCrType = (name: string) => name.toLowerCase().replace(/\s+/g, "-") as CRType;

/** SOWs of the partner in `?id=` with their POs; opens the SOW / PO forms and CR flows. */
export default function SowPoManagement() {
  const [crType, setCrType] = useState<string | "validity-extension" | "value-change" | "others">("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [showPoForm, setShowPoForm] = useState(false);
  const [selectedSow, setSelectedSow] = useState<EditSowData | null>(null);
  const [selectedPo, setSelectedPo] = useState<PODetails | null>(null);
  const [activeSowNumber, setActiveSowNumber] = useState<string>("");
  const [activeSow, setActiveSow] = useState<SOWDetails | null>(null);
  const [selectedCrType, setSelectedCrType] = useState<number>(0);
  const [addPo, setAddPo] = useState(false);
  const [crFlags, setCrFlags] = useState(NO_FLAGS);
  const [selectedCRType, setSelectedCRType] = useState<number | null>(null);
  const searchParams = useSearchParams();
  const parnterId = searchParams.get("id") || "";

  const t = useTableState({ pageSize: 50 });

  const handleEdit = (sow: SOWDetails) => {
    setSelectedSow({ ...sow, isEditing: true });
    setShowAddForm(true);
    setCrFlags(NO_FLAGS);
  };
  const handleCRSelect = (sow: SOWDetails, type: CRType, crId: number) => {
    setSelectedSow(sow);
    setSelectedCRType(crId);
    setCrFlags({
      isRateChange: type === "rate-change",
      isValidityExtension: type === "validity-extension",
      isValueChange: type === "value-change",
      isOthers: type === "others",
    });
    setCrType(type);
    setShowAddForm(true);
  };
  const handleEditPo = (sow: SOWDetails, po: PODetails) => {
    setSelectedPo(po);
    setActiveSowNumber(sow.sowNumber);
    setShowPoForm(true);
    setCrType("");
  };
  const handleCrValueChange = (sow: SOWDetails, po: PODetails, type: CRType, crId: number) => {
    setSelectedPo(po);
    setActiveSowNumber(sow.sowNumber);
    setCrType(type);
    setShowPoForm(true);
    setSelectedCrType(crId);
  };
  const handleOpenAddForm = () => {
    setCrFlags(NO_FLAGS);
    setShowAddForm(true);
  };
  const handleCloseAddForm = () => {
    setShowAddForm(false);
    setSelectedSow(null);
  };
  const handleOpenPoForm = (sow: SOWDetails) => {
    setActiveSowNumber(sow.sowNumber);
    setActiveSow(sow);
    setShowPoForm(true);
    setAddPo(true);
    setCrType("");
  };

  const { data: getsowDetails, isPending } = useQuery({
    queryKey: ["getsowData", parnterId, t.query],
    queryFn: () => partnerApi.getSow(parnterId, { pageNumber: t.query.pageNumber, pageSize: t.query.pageSize, searchText: t.query.searchText || undefined }),
    enabled: !!parnterId,
    refetchOnWindowFocus: true,
  });

  const { data: masterData = [] } = useQuery({
    queryKey: ["getMasterData", MasterTypes.MASTERTYPEIDSOW],
    queryFn: () => partnerApi.getMasterData(MasterTypes.MASTERTYPEIDSOW),
    retry: 1,
  });
  const { data: masterDataPO = [] } = useQuery({
    queryKey: ["getMasterData", MasterTypes.MASTERTYPEIDPO],
    queryFn: () => partnerApi.getPoMasterData(MasterTypes.MASTERTYPEIDPO),
    retry: 1,
  });

  const sowMenu = (sow: SOWDetails): MenuProps["items"] => [
    { key: "edit", icon: <EditOutlined />, label: "Edit", onClick: () => handleEdit(sow) },
    {
      key: "cr",
      icon: <DownOutlined />,
      label: "CR",
      children: (masterData as any[]).map((item) => ({ key: `cr-${item.id}`, label: item.name, onClick: () => handleCRSelect(sow, toCrType(item.name), item.id) })),
    },
    { key: "po", icon: <PlusCircleOutlined />, label: "New PO", onClick: () => handleOpenPoForm(sow) },
  ];
  const poMenu = (sow: SOWDetails, po: PODetails): MenuProps["items"] => [
    { key: "edit", icon: <EditOutlined />, label: "Edit", onClick: () => handleEditPo(sow, po) },
    {
      key: "cr",
      icon: <DownOutlined />,
      label: "CR",
      children: (masterDataPO as any[]).map((item) => ({ key: `cr-${item.id}`, label: item.name, onClick: () => handleCrValueChange(sow, po, toCrType(item.name), item.id) })),
    },
  ];

  const columns: DataColumn<any>[] = [
    { key: "sowNumber", title: "SOW Number", dataIndex: "sowNumber" },
    { key: "startDate", title: "Start Date", dataIndex: "startDate", render: (v: string) => format(new Date(v), "yyyy-MM-dd") },
    { key: "endDate", title: "End Date", dataIndex: "endDate", render: (v: string) => format(new Date(v), "yyyy-MM-dd") },
    { key: "tcValue", title: "TC Value", dataIndex: "tcValue", render: (v: number) => v?.toLocaleString("en-IN") },
    {
      key: "approvalStatusId",
      title: "Approval Status",
      dataIndex: "approvalStatusId",
      render: (v: number) => (v === 1 ? <Tag color="red">Pending</Tag> : v === 2 ? <Tag color="green">Approved</Tag> : null),
    },
    { key: "status", title: "Status", dataIndex: "status", render: (v: boolean) => <StatusBadge status={v ? "Active" : "Inactive"} /> },
    {
      key: "actions",
      title: "Actions",
      locked: true,
      width: 90,
      render: (_: unknown, sow: SOWDetails) => (
        <Tooltip title="Edit SOW details">
          <Dropdown menu={{ items: sowMenu(sow) }} trigger={["click"]} disabled={!sow.status}>
            <Button size="small" icon={<MenuOutlined />}>
              <DownOutlined />
            </Button>
          </Dropdown>
        </Tooltip>
      ),
    },
  ];

  const poColumns = (sow: SOWDetails): ColumnsType<any> => [
    { key: "poNumber", title: "PO Number", dataIndex: "poNumber" },
    { key: "startDate", title: "Start Date", dataIndex: "startDate", render: (v: string) => format(new Date(v), "yyyy-MM-dd") },
    { key: "endDate", title: "End Date", dataIndex: "endDate", render: (v: string) => format(new Date(v), "yyyy-MM-dd") },
    { key: "poValue", title: "Value", dataIndex: "poValue", render: (v: number) => v?.toLocaleString("en-IN") },
    { key: "status", title: "Status", dataIndex: "status", render: (v: boolean) => <StatusBadge status={v ? "Active" : "Inactive"} /> },
    {
      key: "actions",
      title: "Actions",
      width: 90,
      render: (_: unknown, po: any) => (
        <Tooltip title="Edit PO details">
          <Dropdown menu={{ items: poMenu(sow, po) }} trigger={["click"]} disabled={!po.status}>
            <Button size="small" icon={<MenuOutlined />}>
              <DownOutlined />
            </Button>
          </Dropdown>
        </Tooltip>
      ),
    },
  ];

  if (showAddForm) {
    return (
      <AddSowForm
        onCancel={handleCloseAddForm}
        initialData={selectedSow || undefined}
        isEditing={!!selectedSow}
        crTypes={crType}
        crFlags={crFlags}
        selectedCRType={selectedCRType}
      />
    );
  }
  if (showPoForm) {
    return (
      <AddPoForm
        onCancel={() => {
          setShowPoForm(false);
          setSelectedPo(null);
          setActiveSow(null);
        }}
        sowData={activeSow as any}
        initialData={(selectedPo || undefined) as any}
        isEditing={!!selectedPo}
        crType={crType}
        selectedCrType={selectedCrType}
        addPo={addPo}
        sowNumber={activeSowNumber as any}
      />
    );
  }

  return (
    <DataTable<any>
      storageKey="sow-po-management"
      rowKey="sowNumber"
      title="SOW Management"
      columns={columns}
      data={getsowDetails?.items}
      loading={isPending && !!parnterId}
      pagination={{ current: t.pageNumber, pageSize: t.pageSize, total: getsowDetails?.totalCount ?? 0 }}
      onChange={t.onTableChange}
      actions={
        <Tooltip title="Create a new SOW">
          <Button type="primary" icon={<PlusOutlined />} onClick={handleOpenAddForm}>
            Add New SOW
          </Button>
        </Tooltip>
      }
      expandable={{
        expandedRowRender: (sow: SOWDetails) => (
          <div className="p-2">
            <Typography.Text strong>PO Details</Typography.Text>
            <Table size="small" rowKey="poNumber" className="mt-2" columns={poColumns(sow)} dataSource={sow.poDetails ?? []} pagination={false} scroll={{ x: "max-content" }} />
          </div>
        ),
      }}
      emptyText="No SOWs found"
    />
  );
}
