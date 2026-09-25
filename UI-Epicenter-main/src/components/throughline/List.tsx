"use client";
import * as React from "react";
import { Divider, Empty, Flex, Listy, Pagination, Space, Spin, Typography, theme } from "antd";
import type { PaginationProps } from "antd";

/**
 * Throughline's list, built on Ant Design 6's `Listy` (the replacement for the deprecated
 * `List`). Keeps the familiar `dataSource` / `renderItem` / `List.Item` / `List.Item.Meta`
 * surface so call sites stay simple; items are laid out with Flex and Typography.
 */

type Size = "small" | "default" | "large";

export interface ListProps<T> {
  dataSource?: T[];
  renderItem: (item: T, index: number) => React.ReactNode;
  rowKey?: keyof T | ((item: T, index: number) => React.Key);
  size?: Size;
  bordered?: boolean;
  split?: boolean;
  header?: React.ReactNode;
  footer?: React.ReactNode;
  loading?: boolean;
  locale?: { emptyText?: React.ReactNode };
  className?: string;
  style?: React.CSSProperties;
  /** virtualise long lists: fixed viewport height in px */
  height?: number;
  itemLayout?: "horizontal" | "vertical";
  /** Ant Pagination props (server or client paging handled by the caller) */
  pagination?: PaginationProps | false;
}

const PAD: Record<Size, string> = { small: "8px 12px", default: "12px 16px", large: "16px 24px" };
const SizeCtx = React.createContext<Size>("default");
const SplitCtx = React.createContext<boolean>(true);

type Row<T> = { __k: React.Key; item: T; index: number };

function ListInner<T>({ dataSource, renderItem, rowKey, size = "default", bordered, split = true, header, footer, loading, locale, className, style, height, pagination }: ListProps<T>) {
  const { token } = theme.useToken();
  const rows: Row<T>[] = (dataSource ?? []).map((item, index) => {
    const k =
      typeof rowKey === "function"
        ? rowKey(item, index)
        : rowKey
          ? ((item as any)?.[rowKey] as React.Key)
          : ((item as any)?.id ?? (item as any)?.key ?? index);
    return { __k: k ?? index, item, index };
  });

  const frame: React.CSSProperties = bordered
    ? { border: `1px solid ${token.colorBorderSecondary}`, borderRadius: token.borderRadius, background: token.colorBgContainer }
    : {};

  return (
    <SizeCtx.Provider value={size}>
      <SplitCtx.Provider value={split}>
        <div className={className} style={{ ...frame, ...style }}>
          {header && (
            <div style={{ padding: PAD[size], borderBottom: `1px solid ${token.colorBorderSecondary}`, fontWeight: 500 }}>{header}</div>
          )}
          <Spin spinning={!!loading}>
            {rows.length === 0 ? (
              <div style={{ padding: PAD[size] }}>
                <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={locale?.emptyText ?? "No data"} />
              </div>
            ) : (
              <Listy<Row<T>> items={rows} rowKey="__k" height={height} virtual={!!height} itemRender={(row) => renderItem(row.item, row.index)} />
            )}
          </Spin>
          {pagination && (
            <Flex justify="flex-end" style={{ padding: PAD[size] }}>
              <Pagination size="small" {...pagination} />
            </Flex>
          )}
          {footer && <div style={{ padding: PAD[size], borderTop: `1px solid ${token.colorBorderSecondary}` }}>{footer}</div>}
        </div>
      </SplitCtx.Provider>
    </SizeCtx.Provider>
  );
}

export interface ListItemProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "title"> {
  actions?: React.ReactNode[];
  extra?: React.ReactNode;
}

function Item({ children, actions, extra, style, ...rest }: ListItemProps) {
  const { token } = theme.useToken();
  const size = React.useContext(SizeCtx);
  const split = React.useContext(SplitCtx);
  return (
    <div
      {...rest}
      style={{
        padding: PAD[size],
        borderBottom: split ? `1px solid ${token.colorBorderSecondary}` : undefined,
        ...style,
      }}
      className={["tl-list-item", rest.className].filter(Boolean).join(" ")}
    >
      <Flex align="center" gap={12} wrap>
        <div style={{ flex: 1, minWidth: 0 }}>{children}</div>
        {actions && actions.length > 0 && (
          <Space split={<Divider orientation="vertical" style={{ margin: 0 }} />} size={4}>
            {actions.map((a, i) => (
              <React.Fragment key={i}>{a}</React.Fragment>
            ))}
          </Space>
        )}
        {extra}
      </Flex>
    </div>
  );
}

export interface ListItemMetaProps {
  avatar?: React.ReactNode;
  title?: React.ReactNode;
  description?: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

function Meta({ avatar, title, description, className, style }: ListItemMetaProps) {
  return (
    <Flex align="flex-start" gap={12} className={className} style={style}>
      {avatar && <div style={{ flexShrink: 0, display: "flex", alignItems: "center" }}>{avatar}</div>}
      <div style={{ minWidth: 0, flex: 1 }}>
        {title && <div style={{ fontWeight: 500 }}>{title}</div>}
        {description && (
          <Typography.Text type="secondary" style={{ display: "block", fontSize: 13 }}>
            {description}
          </Typography.Text>
        )}
      </div>
    </Flex>
  );
}

type ListComponent = (<T>(props: ListProps<T>) => React.ReactElement) & { Item: typeof Item & { Meta: typeof Meta } };

const ItemWithMeta = Object.assign(Item, { Meta });
export const List = Object.assign(ListInner, { Item: ItemWithMeta }) as ListComponent;
export default List;
