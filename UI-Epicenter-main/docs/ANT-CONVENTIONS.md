# Throughline UI — Ant Design conventions

The UI is being rewritten natively on **Ant Design 6** (`antd`, `@ant-design/icons`). This is
the contract every rewritten file follows. Reference implementations:

- Grid page: `src/components/hiring-forms/CartTable.tsx` + `src/app/home/(hiring-management)/hiring-management/page.tsx`
- Form in a drawer: `src/components/hiring-forms/SheetDrawer/AddPositionSheet.tsx`

## Rules

1. **Ant components only.** No `@/components/ui/*` (the shadcn-compat layer is being deleted),
   no Radix, no react-hook-form, no `@tanstack/react-table`, no lucide icons, no sonner.
2. **Layout with Ant, spacing with Tailwind.** `Flex`, `Space`, `Row/Col`, `Card`, `Descriptions`,
   `Typography` do structure and text. Tailwind is allowed only for spacing/sizing utilities
   (`p-4`, `gap-2`, `w-full`, `min-w-[…]`, `hidden lg:block`). Never Tailwind colours, borders,
   font sizes, rounded corners or shadows — those come from Ant tokens.
3. **Colours from tokens.** Use `theme.useToken()` (`token.colorPrimary`, `colorTextSecondary`,
   `colorSuccess`…) or preset names on `Tag`/`Badge`/`Button color=`. No hex literals.
4. **Text.** `Typography.Title level={4|5}` for page/section headings, `Typography.Text type="secondary"`
   for muted text, `Typography.Link` for inline links.
5. **Icons.** `@ant-design/icons` only. Mapping from lucide:
   Plus→PlusOutlined, Pencil/PencilIcon→EditOutlined, Eye/View→EyeOutlined, Trash2→DeleteOutlined,
   Download→DownloadOutlined, Upload→UploadOutlined, X→CloseOutlined, Check→CheckOutlined,
   CheckCircle/CheckCircle2→CheckCircleOutlined, XCircle→CloseCircleOutlined, AlertCircle→ExclamationCircleOutlined,
   Loader2→LoadingOutlined (or Button `loading`), Filter/ListFilter→FilterOutlined, Calendar→CalendarOutlined,
   Clock/Timer→ClockCircleOutlined, ArrowLeft/MoveLeft→ArrowLeftOutlined, ChevronDown→DownOutlined,
   ChevronUp→UpOutlined, ChevronRight→RightOutlined, ArrowUpIcon/ArrowDownIcon→(use Table sorter),
   Menu→MenuOutlined, MoreVertical→MoreOutlined, Users/Users2/User/User2→UserOutlined / TeamOutlined,
   UserPlus→UserAddOutlined, UserCheck→UserSwitchOutlined, FileText/ClipboardList→FileTextOutlined,
   Paperclip→PaperClipOutlined, Briefcase→ShopOutlined, Building/Building2→BankOutlined, MapPin→EnvironmentOutlined,
   Star→StarOutlined, Settings2Icon/Setting→SettingOutlined, RefreshCw→ReloadOutlined, PauseCircle→PauseCircleOutlined,
   Inbox/InboxIcon→InboxOutlined, Columns4→TableOutlined, Bell→BellOutlined, FolderCode/Code2→CodeOutlined,
   CloudCog→CloudOutlined, Dot/Circle→(use Badge status).

## Grids

Use `DataTable` (`src/components/data-table/DataTable.tsx`) with `useTableState` and
`useSearchColumns`:

```tsx
const t = useTableState({ pageSize: 50, sortBy: "hrqId", sortOrder: "desc", searchColumn: "HrqId" });
const searchColumns = useSearchColumns(FilterTypeEnum.HiringManagement);
const { data, isLoading } = useQuery({
  queryKey: ["hiringCart", t.query, statusIds],
  queryFn: () => hiringApi.getHiringCart({ ...t.query, sortColumns: t.sortColumns, hiringStatusIds: statusIds }),
});
<DataTable<Hiring>
  storageKey="hiring-cart"
  rowKey="id"
  columns={columns}              // DataColumn<T>[]: key, title, dataIndex, render, sorter: true, defaultHidden, locked
  data={data?.data.items}
  loading={isLoading}
  pagination={{ current: t.pageNumber, pageSize: t.pageSize, total: data?.data.totalCount ?? 0 }}
  onChange={t.onTableChange}
  search={{ columns: searchColumns, column: t.searchColumn, text: t.searchText, onChange: t.setSearch }}
  filters={<Select … /> <Switch … />}
  actions={<Button type="primary" icon={<PlusOutlined />}>Create</Button>}
  onExport={…}
/>
```

- Server-side sorting: set `sorter: true` on the column; `key` must be the API's sort column name.
- Row actions: `Dropdown menu={{ items }}` with a `Button icon={<MoreOutlined />}`; links via `Typography.Link`.
- Status pills: `StatusBadge` (`src/components/status-badge.tsx`, Ant `Tag`).
- Loading: let the Table's `loading` prop handle it. Delete skeleton components.
- Empty state: handled by `DataTable`.

## Forms

Ant `Form` with `Form.useForm()`; keep the existing zod schema as the source of validation via
`src/lib/zodRules.ts`:

```tsx
const [form] = Form.useForm<Values>();
<Form form={form} layout="vertical" onFinish={(v) => { const data = validateWithZod(schema, form, v); if (data) mutate(data); }}>
  <Form.Item name="email" label="Email" rules={zodRules(schema, "email")}><Input /></Form.Item>
  <Form.Item name="startDate" label="Start date" rules={zodRules(schema, "startDate")}><DatePicker className="w-full" /></Form.Item>
```

- Dates: `DatePicker` / `DatePicker.RangePicker` with `dayjs`; convert to the API string in `onFinish`.
- Selects: `Select` with `options`, `showSearch optionFilterProp="label"`; multi: `mode="multiple"`.
- Uploads: `Upload` (`beforeUpload={() => false}` for manual submit) with `Button icon={<UploadOutlined />}`.
- Yes/No: `Radio.Group optionType="button"` or `Switch`.
- Submit: `Button type="primary" htmlType="submit" loading={isPending}`.
- Field groups: `Row gutter={[16, 8]}` + `Col xs={24} md={12}`; section titles via `Divider titlePlacement="left"` or `Card title`.

## Overlays

- Modal dialogs: `Modal` (`open`, `onCancel`, `footer` or `onOk` + `confirmLoading`), `Modal.confirm` for destructive confirms.
- Side panels: `Drawer` (`open`, `onClose`, `width`, `extra` for header actions, `footer` for actions).
- Menus: `Dropdown menu={{ items }}`; tooltips: `Tooltip title`; popovers: `Popover content trigger="click"`.

## Feedback

- `toast.success/error/info/warning` from `@/lib/toast` (Ant message under the hood; `toast.notify` for rich notifications).
- Errors from the API: `toast.error(err?.response?.data?.message || "…")`.
- Page-level errors: `Result status="error"`; missing data: `Empty`.

## Pages

- Page shell: `<Flex vertical gap={16} className="p-4">` with a `Typography.Title level={4}` and, when useful, `Breadcrumb`.
- Detail pages: `Card` + `Descriptions bordered size="small" column={{ xs: 1, md: 2 }}`.
- Tabs: `Tabs items={[…]}` (sync `activeKey` with the URL where the old page did).
- Stats: `Statistic` inside `Card`; progress: `Progress`.
