"use client";
import * as React from "react";
import { Button, Checkbox, Dropdown, Empty, Flex, Input, Select, Space, Table, Tooltip, Typography } from "antd";
import type { TableProps } from "antd";
import type { ColumnsType, ColumnType, TablePaginationConfig } from "antd/es/table";
import { DownloadOutlined, ReloadOutlined, SearchOutlined, SettingOutlined } from "@ant-design/icons";

/**
 * The app's grid: Ant Design Table with the toolbar every list page needs.
 *   - server-side pagination (`pagination.total` from the API) and sorting via `onChange`
 *   - search box with a column selector (feeds the API's searchColumn / searchText)
 *   - column chooser (persisted per `storageKey` in localStorage)
 *   - optional export / refresh / create actions and free-form filter slots
 */

export type DataColumn<T> = ColumnType<T> & {
  key: string;
  title: React.ReactNode;
  /** hidden by default; the user can enable it from the column chooser */
  defaultHidden?: boolean;
  /** never shown in the column chooser and always visible (e.g. actions) */
  locked?: boolean;
};

export interface DataTablePagination {
  current: number;
  pageSize: number;
  total: number;
  pageSizeOptions?: number[];
}

export interface DataTableProps<T> extends Omit<TableProps<T>, "columns" | "pagination" | "title" | "dataSource"> {
  columns: DataColumn<T>[];
  data: T[] | undefined;
  rowKey: TableProps<T>["rowKey"];
  loading?: boolean;
  pagination?: DataTablePagination | false;
  /** grid title shown at the left of the toolbar */
  title?: React.ReactNode;
  /** search box; `columns` are the API's searchable columns */
  search?: {
    columns: { value: string; label: string }[];
    column?: string;
    text?: string;
    onChange: (column: string | undefined, text: string) => void;
    placeholder?: string;
  };
  /** extra filter controls rendered after the search box */
  filters?: React.ReactNode;
  /** primary and secondary actions rendered at the right of the toolbar */
  actions?: React.ReactNode;
  onExport?: () => void;
  exporting?: boolean;
  onRefresh?: () => void;
  /** localStorage key for the user's column visibility */
  storageKey?: string;
  emptyText?: React.ReactNode;
}

function useColumnVisibility<T>(columns: DataColumn<T>[], storageKey?: string) {
  const defaults = React.useMemo(
    () => Object.fromEntries(columns.map((c) => [c.key, !c.defaultHidden])) as Record<string, boolean>,
    [columns]
  );
  const [visible, setVisible] = React.useState<Record<string, boolean>>(defaults);
  React.useEffect(() => {
    if (!storageKey) return;
    try {
      const saved = JSON.parse(localStorage.getItem(`tl.columns.${storageKey}`) || "null");
      if (saved && typeof saved === "object") setVisible({ ...defaults, ...saved });
    } catch {
      /* ignore */
    }
  }, [storageKey, defaults]);
  const toggle = (key: string, on: boolean) => {
    setVisible((prev) => {
      const next = { ...prev, [key]: on };
      if (storageKey) {
        try {
          localStorage.setItem(`tl.columns.${storageKey}`, JSON.stringify(next));
        } catch {
          /* ignore */
        }
      }
      return next;
    });
  };
  const reset = () => {
    setVisible(defaults);
    if (storageKey) {
      try {
        localStorage.removeItem(`tl.columns.${storageKey}`);
      } catch {
        /* ignore */
      }
    }
  };
  return { visible, toggle, reset };
}

export default function DataTable<T extends object>({
  columns,
  data,
  rowKey,
  loading,
  pagination,
  title,
  search,
  filters,
  actions,
  onExport,
  exporting,
  onRefresh,
  storageKey,
  emptyText = "No records found",
  size = "middle",
  scroll,
  ...tableProps
}: DataTableProps<T>) {
  const { visible, toggle, reset } = useColumnVisibility(columns, storageKey);
  const shown: ColumnsType<T> = columns
    .filter((c) => c.locked || visible[c.key] !== false)
    .map(({ defaultHidden: _d, locked: _l, ...c }) => ({ ellipsis: true, ...c }));

  const chooser = (
    <div style={{ padding: 8, minWidth: 220 }} onClick={(e) => e.stopPropagation()}>
      <Flex vertical gap={4}>
        {columns
          .filter((c) => !c.locked)
          .map((c) => (
            <Checkbox key={c.key} checked={visible[c.key] !== false} onChange={(e) => toggle(c.key, e.target.checked)}>
              {c.title}
            </Checkbox>
          ))}
        <Button type="link" size="small" onClick={reset} style={{ alignSelf: "flex-start", paddingInline: 0 }}>
          Reset to default
        </Button>
      </Flex>
    </div>
  );

  const antPagination: TablePaginationConfig | false = pagination
    ? {
        current: pagination.current,
        pageSize: pagination.pageSize,
        total: pagination.total,
        showSizeChanger: true,
        pageSizeOptions: pagination.pageSizeOptions ?? [10, 25, 50, 100],
        showTotal: (total, [from, to]) => `${from}-${to} of ${total}`,
      }
    : false;

  const hasToolbar = title || search || filters || actions || onExport || onRefresh;

  return (
    <Flex vertical gap={12}>
      {hasToolbar && (
        <Flex wrap gap={8} align="center" justify="space-between">
          <Space wrap size={8}>
            {title && (
              <Typography.Title level={5} style={{ margin: 0, marginInlineEnd: 8 }}>
                {title}
              </Typography.Title>
            )}
            {search && (
              <Space.Compact>
                {search.columns.length > 1 && (
                  <Select
                    value={search.column ?? search.columns[0]?.value}
                    onChange={(col) => search.onChange(col, search.text ?? "")}
                    options={search.columns}
                    style={{ minWidth: 150 }}
                    popupMatchSelectWidth={false}
                  />
                )}
                <Input
                  allowClear
                  prefix={<SearchOutlined />}
                  placeholder={search.placeholder ?? "Search"}
                  value={search.text}
                  onChange={(e) => search.onChange(search.column ?? search.columns[0]?.value, e.target.value)}
                  style={{ width: 240 }}
                />
              </Space.Compact>
            )}
            {filters}
          </Space>
          <Space wrap size={8}>
            {actions}
            {onRefresh && (
              <Tooltip title="Refresh">
                <Button icon={<ReloadOutlined />} onClick={onRefresh} />
              </Tooltip>
            )}
            {onExport && (
              <Button icon={<DownloadOutlined />} onClick={onExport} loading={exporting}>
                Export
              </Button>
            )}
            <Dropdown popupRender={() => <div className="ant-dropdown-menu">{chooser}</div>} trigger={["click"]} placement="bottomRight">
              <Button icon={<SettingOutlined />}>Columns</Button>
            </Dropdown>
          </Space>
        </Flex>
      )}
      <Table<T>
        size={size}
        rowKey={rowKey}
        columns={shown}
        dataSource={data ?? []}
        loading={loading}
        pagination={antPagination}
        scroll={scroll ?? { x: "max-content" }}
        locale={{ emptyText: <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={emptyText} /> }}
        {...tableProps}
      />
    </Flex>
  );
}
