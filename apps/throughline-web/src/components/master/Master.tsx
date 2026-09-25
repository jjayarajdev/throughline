"use client";
import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button, Form, Input, Modal, Radio, Select, Space, Tooltip } from "antd";
import { CheckOutlined, CloseOutlined, EditOutlined, PlusOutlined } from "@ant-design/icons";
import { z } from "zod";
import DataTable, { type DataColumn } from "@/components/data-table/DataTable";
import { useTableState } from "@/components/data-table/useTableState";
import { StatusBadge } from "@/components/status-badge";
import { toast } from "@/lib/toast";
import { validateWithZod, zodRules } from "@/lib/zodRules";
import api from "@/lib/axiosInstance";
import { dropdownApi } from "@/services/api/master";
import { onboarding } from "@/services/api/onboarding.api";

enum MasterTypes {
  REJECTION_REASON = 24,
  DOMAIN = 29,
  SUBDOMAIN = 30,
  SKILL = 31,
  FEEDBACK_CATEGORY = 33,
  TECHNICAL_SKILLS = 33001,
  COMMUNICATION_SKILLS = 33002,
  BEHAVIOURAL_SKILLS = 33003,
  CULTURAL_ART = 33004,
  LEADERSHIP_AND_OWNERSHIP = 33005,
  OVERALL_ASSESSMENT = 33006,
  NotificationCategory = 42,
}

/** master type used for the domain / sub-domain manager list */
const MANAGER_MASTER_TYPE = 75;
const NO_MANAGER = "0";

interface MasterData {
  id: number;
  name: string;
  isActive: boolean;
  domainManagerName?: string; // DOMAIN only
  subDomainManagerName?: string; // SUBDOMAIN only
  stateId?: number;
  countryId?: number;
  domainId?: number;
}

const itemSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  managerId: z.string().optional(),
});
type ItemValues = z.infer<typeof itemSchema>;

type ModalState = { mode: "add" } | { mode: "edit"; item: MasterData } | null;

const MASTER_TYPE_OPTIONS = Object.entries(MasterTypes)
  .filter(([key]) => isNaN(Number(key)))
  .map(([key, value]) => ({
    label: key
      .split("_")
      .map((word) => word.charAt(0)?.toUpperCase() + word.slice(1)?.toLowerCase())
      .join(" "),
    value: value.toString(),
  }));

/** Master-data maintenance: pick a master type, list its rows (server paged) and add / edit / (de)activate them. */
export default function Master() {
  const queryClient = useQueryClient();
  const [form] = Form.useForm<ItemValues>();
  const t = useTableState({ pageSize: 50 });

  const [selectedType, setSelectedType] = useState<MasterTypes | null>(null);
  const [selectedDomain, setSelectedDomain] = useState<string | null>(null);
  const [isActiveFilter, setIsActiveFilter] = useState(true);
  const [modal, setModal] = useState<ModalState>(null);

  const hasManager = selectedType === MasterTypes.DOMAIN || selectedType === MasterTypes.SUBDOMAIN;
  const needsDomain = selectedType === MasterTypes.SUBDOMAIN && !selectedDomain;
  const canAddNew = !!selectedType && !needsDomain;

  const { data: masterData, isLoading } = useQuery({
    queryKey: ["masterDataPaged", selectedType, selectedDomain, isActiveFilter, t.query],
    queryFn: () =>
      onboarding.fetchDropdownPaged({
        masterTypeId: selectedType,
        pageNumber: t.query.pageNumber,
        pageSize: t.query.pageSize,
        searchColumn: t.query.searchColumn ?? "",
        searchText: t.query.searchText ?? "",
        sortColumns: [],
        activeStatus: isActiveFilter,
        countryId: 0,
        stateId: 0,
        domainId: selectedType === MasterTypes.SUBDOMAIN && selectedDomain ? parseInt(selectedDomain) : 0,
      }),
    enabled: !!selectedType && !needsDomain,
  });

  const { data: managersList = [] } = useQuery({
    queryKey: ["managers"],
    queryFn: () => dropdownApi.fetchDropdown(MANAGER_MASTER_TYPE),
  });

  const { data: domains = [] } = useQuery({
    queryKey: ["domains"],
    queryFn: () => dropdownApi.fetchDropdown(MasterTypes.DOMAIN),
    enabled: selectedType === MasterTypes.SUBDOMAIN,
  });

  const invalidateList = () => queryClient.invalidateQueries({ queryKey: ["masterDataPaged"] });

  const updateMasterItem = useMutation({
    mutationFn: async (data: { id: number; name: string; typeId: number; managerId?: number; item: MasterData }) => {
      const payload = {
        id: data.id,
        isActive: true,
        masterTypeId: data.typeId,
        name: data.name,
        ...(data.item.stateId && { stateId: data.item.stateId }),
        ...(data.item.countryId && { countryId: data.item.countryId }),
        ...(data.item.domainId && { domainId: data.item.domainId }),
        ...(data.managerId && selectedType === MasterTypes.DOMAIN && { domainManagerId: data.managerId }),
        ...(data.managerId && selectedType === MasterTypes.SUBDOMAIN && { subDomainManagerId: data.managerId }),
      };
      const response = await api.put(`/Master/${data.typeId}/${data.id}`, payload);
      if (!response.status) throw new Error("Failed to update item");
      return response.data;
    },
    onSuccess: () => {
      toast.success("Item updated successfully");
      invalidateList();
      setModal(null);
    },
    onError: () => toast.error("Failed to update item"),
  });

  const addMasterItem = useMutation({
    mutationFn: async (data: { name: string; typeId: number; managerId?: number }) => {
      const payload = {
        id: 0,
        isActive: true,
        masterTypeId: data.typeId,
        name: data.name,
        ...(selectedType === MasterTypes.SUBDOMAIN && selectedDomain && { domainId: parseInt(selectedDomain) }),
        ...(data.managerId && selectedType === MasterTypes.DOMAIN && { domainManagerId: data.managerId }),
        ...(data.managerId && selectedType === MasterTypes.SUBDOMAIN && { subDomainManagerId: data.managerId }),
      };
      const response = await api.post(`/Master/${data.typeId}`, payload);
      if (!response.status) throw new Error("Failed to add item");
      return response.data;
    },
    onSuccess: () => {
      toast.success("Item added successfully");
      invalidateList();
      setModal(null);
    },
    onError: () => toast.error("Failed to add item"),
  });

  const toggleActiveStatus = useMutation({
    mutationFn: async (data: { id: number; typeId: number; currentStatus: boolean }) => {
      const response = await api.patch(`/Master/${data.typeId}/${data.id}?isActive=${!data.currentStatus}`);
      if (!response.status) throw new Error("Failed to toggle status");
      return response.data;
    },
    onSuccess: (_, variables) => {
      toast.success(`Item ${!variables.currentStatus ? "activated" : "deactivated"} successfully`);
      invalidateList();
    },
    onError: () => toast.error("Failed to toggle status"),
  });

  // reset dependent selections when the master type changes
  useEffect(() => {
    if (selectedType !== MasterTypes.SUBDOMAIN) setSelectedDomain(null);
    setModal(null);
    t.resetPage();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedType]);

  const managerOptions = useMemo(
    () => [
      { value: NO_MANAGER, label: "No Manager" },
      ...(Array.isArray(managersList) ? managersList.map((m: any) => ({ value: String(m.id), label: String(m.name) })) : []),
    ],
    [managersList]
  );

  /** current manager of a row, resolved by name against the managers list (the API only returns the name) */
  const managerIdOf = (item: MasterData) => {
    const name = selectedType === MasterTypes.DOMAIN ? item.domainManagerName : selectedType === MasterTypes.SUBDOMAIN ? item.subDomainManagerName : undefined;
    if (!name) return NO_MANAGER;
    const found = (managersList as any[]).find((m) => m.name === name);
    return found?.id != null ? String(found.id) : NO_MANAGER;
  };

  const onFinish = (values: ItemValues) => {
    const data = validateWithZod(itemSchema, form, values);
    if (!data || !selectedType || !modal) return;
    const managerId = hasManager && data.managerId && data.managerId !== NO_MANAGER ? parseInt(data.managerId) : undefined;
    if (modal.mode === "edit") {
      updateMasterItem.mutate({ id: modal.item.id, name: data.name, typeId: selectedType, managerId, item: modal.item });
    } else {
      addMasterItem.mutate({ name: data.name, typeId: selectedType, managerId });
    }
  };

  const columns = useMemo<DataColumn<MasterData>[]>(
    () => [
      { key: "sno", title: "S.no", width: 80, render: (_: unknown, __: MasterData, index: number) => index + 1 },
      { key: "name", title: "Name", dataIndex: "name" },
      ...(hasManager
        ? [
            {
              key: "manager",
              title: "Manager Name",
              dataIndex: selectedType === MasterTypes.DOMAIN ? "domainManagerName" : "subDomainManagerName",
              render: (v: string) => v || "-",
            } as DataColumn<MasterData>,
          ]
        : []),
      { key: "isActive", title: "Status", dataIndex: "isActive", width: 120, render: (v: boolean) => <StatusBadge status={v ? "Active" : "Inactive"} /> },
      {
        key: "actions",
        title: "Actions",
        locked: true,
        align: "right",
        width: 110,
        render: (_: unknown, item: MasterData) => (
          <Space size={4}>
            <Tooltip title="Edit item">
              <Button type="text" size="small" icon={<EditOutlined />} onClick={() => setModal({ mode: "edit", item })} />
            </Tooltip>
            <Tooltip title={item.isActive ? "Deactivate item" : "Activate item"}>
              <Button
                type="text"
                size="small"
                danger={item.isActive}
                icon={item.isActive ? <CloseOutlined /> : <CheckOutlined />}
                loading={toggleActiveStatus.isPending && toggleActiveStatus.variables?.id === item.id}
                onClick={() => selectedType && toggleActiveStatus.mutate({ id: item.id, typeId: selectedType, currentStatus: item.isActive })}
              />
            </Tooltip>
          </Space>
        ),
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [hasManager, selectedType, toggleActiveStatus.isPending, toggleActiveStatus.variables]
  );

  const emptyText = !selectedType
    ? "Select a type to view data"
    : needsDomain
      ? "Please select a domain first"
      : `No ${isActiveFilter ? "active" : "inactive"} data available`;

  const filters = (
    <>
      <Select
        placeholder="Select master type"
        value={selectedType?.toString()}
        options={MASTER_TYPE_OPTIONS}
        onChange={(v) => setSelectedType(Number(v) as MasterTypes)}
        style={{ minWidth: 240 }}
        popupMatchSelectWidth={false}
      />
      {selectedType === MasterTypes.SUBDOMAIN && (
        <Select
          placeholder="Select domain"
          showSearch
          optionFilterProp="label"
          value={selectedDomain ?? undefined}
          options={(domains as MasterData[]).map((d) => ({ value: d.id.toString(), label: d.name }))}
          onChange={(v) => {
            setSelectedDomain(v);
            t.resetPage();
          }}
          style={{ minWidth: 240 }}
          popupMatchSelectWidth={false}
        />
      )}
      <Radio.Group
        optionType="button"
        buttonStyle="solid"
        value={isActiveFilter}
        onChange={(e) => {
          setIsActiveFilter(e.target.value);
          t.resetPage();
        }}
        options={[
          { value: true, label: "Active" },
          { value: false, label: "Inactive" },
        ]}
      />
    </>
  );

  return (
    <>
      <DataTable<MasterData>
        storageKey="master-data"
        rowKey="id"
        title="Master Management"
        columns={columns}
        data={masterData?.data?.items}
        loading={isLoading}
        pagination={{ current: t.pageNumber, pageSize: t.pageSize, total: masterData?.data?.totalCount ?? 0 }}
        onChange={t.onTableChange}
        filters={filters}
        actions={
          canAddNew && isActiveFilter ? (
            <Button type="primary" icon={<PlusOutlined />} onClick={() => setModal({ mode: "add" })}>
              Add New
            </Button>
          ) : null
        }
        emptyText={emptyText}
      />

      <Modal
        open={!!modal}
        title={modal?.mode === "edit" ? "Edit item" : "Add new item"}
        destroyOnHidden
        onCancel={() => setModal(null)}
        okText={modal?.mode === "edit" ? "Save" : "Add"}
        confirmLoading={updateMasterItem.isPending || addMasterItem.isPending}
        onOk={() => form.submit()}
      >
        {modal && (
          <Form
            form={form}
            layout="vertical"
            onFinish={onFinish}
            className="mt-4"
            initialValues={
              modal.mode === "edit" ? { name: modal.item.name, managerId: managerIdOf(modal.item) } : { name: "", managerId: NO_MANAGER }
            }
          >
            <Form.Item name="name" label="Name" rules={zodRules(itemSchema, "name")}>
              <Input autoFocus placeholder={modal.mode === "edit" ? "Enter name" : "Enter new item name"} />
            </Form.Item>
            {hasManager && (
              <Form.Item name="managerId" label="Manager" rules={zodRules(itemSchema, "managerId")}>
                <Select showSearch optionFilterProp="label" options={managerOptions} placeholder="Select manager" />
              </Form.Item>
            )}
          </Form>
        )}
      </Modal>
    </>
  );
}
