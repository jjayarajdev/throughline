"use client";
import * as React from "react";
import { Dropdown } from "antd";
import type { MenuProps } from "antd";
import { CheckOutlined } from "@ant-design/icons";
import { cn } from "@/lib/utils";
import { findChild, flattenChildren, isElementOf, otherChildren, propsOf, toPlacement, useOpenState } from "./_internal";

/**
 * DropdownMenu on Ant Design's Dropdown, keeping the Radix compound API. The JSX inside
 * <DropdownMenuContent> is read once per render and turned into Ant menu items.
 */

type ItemProps = React.ComponentProps<"div"> & { inset?: boolean; variant?: "default" | "destructive"; disabled?: boolean; asChild?: boolean; onSelect?: (e: Event) => void };
type CheckboxItemProps = ItemProps & { checked?: boolean | "indeterminate"; onCheckedChange?: (checked: boolean) => void };
type RadioGroupProps = { value?: string; onValueChange?: (v: string) => void; children?: React.ReactNode };
type RadioItemProps = ItemProps & { value: string };
type SubProps = { children?: React.ReactNode; open?: boolean; onOpenChange?: (o: boolean) => void; defaultOpen?: boolean };

function DropdownMenuPortal({ children }: { children?: React.ReactNode }) {
  return <>{children}</>;
}
function DropdownMenuTrigger(_p: React.ComponentProps<"button"> & { asChild?: boolean }) {
  return null;
}
function DropdownMenuContent(_p: React.ComponentProps<"div"> & { sideOffset?: number; align?: "start" | "center" | "end"; side?: "top" | "bottom" | "left" | "right" }) {
  return null;
}
function DropdownMenuGroup(_p: { children?: React.ReactNode }) {
  return null;
}
function DropdownMenuItem(_p: ItemProps) {
  return null;
}
function DropdownMenuCheckboxItem(_p: CheckboxItemProps) {
  return null;
}
function DropdownMenuRadioGroup(_p: RadioGroupProps) {
  return null;
}
function DropdownMenuRadioItem(_p: RadioItemProps) {
  return null;
}
function DropdownMenuLabel(_p: React.ComponentProps<"div"> & { inset?: boolean }) {
  return null;
}
function DropdownMenuSeparator(_p: React.ComponentProps<"div">) {
  return null;
}
function DropdownMenuShortcut({ className, ...props }: React.ComponentProps<"span">) {
  return <span data-slot="dropdown-menu-shortcut" className={cn("ml-auto text-xs tracking-widest text-[var(--ant-color-text-tertiary)]", className)} {...props} />;
}
function DropdownMenuSub(_p: SubProps) {
  return null;
}
function DropdownMenuSubTrigger(_p: React.ComponentProps<"div"> & { inset?: boolean }) {
  return null;
}
function DropdownMenuSubContent(_p: React.ComponentProps<"div">) {
  return null;
}

type Items = NonNullable<MenuProps["items"]>;

function toItems(children: React.ReactNode, keyPrefix = "i", radio?: RadioGroupProps): Items {
  const items: Items = [];
  flattenChildren(children).forEach((el, i) => {
    const key = `${keyPrefix}-${i}`;
    if (isElementOf(el, DropdownMenuItem)) {
      const { children: label, onClick, disabled, variant, className, asChild, onSelect, inset: _i, ...rest } = propsOf<ItemProps>(el);
      items.push({
        key,
        disabled,
        danger: variant === "destructive",
        className: cn(className),
        label: asChild ? label : <span className="inline-flex items-center gap-2 [&_svg]:size-4">{label}</span>,
        onClick: (info) => {
          onSelect?.(info.domEvent as unknown as Event);
          onClick?.(info.domEvent as any);
        },
        ...(rest.title ? { title: rest.title } : {}),
      });
    } else if (isElementOf(el, DropdownMenuCheckboxItem)) {
      const { children: label, checked, onCheckedChange, disabled, className } = propsOf<CheckboxItemProps>(el);
      items.push({
        key,
        disabled,
        className: cn(className),
        icon: <CheckOutlined style={{ visibility: checked ? "visible" : "hidden" }} />,
        label,
        onClick: () => onCheckedChange?.(!checked),
      });
    } else if (isElementOf(el, DropdownMenuRadioGroup)) {
      const g = propsOf<RadioGroupProps>(el);
      items.push(...toItems(g.children, key, g));
    } else if (isElementOf(el, DropdownMenuRadioItem)) {
      const { children: label, value, disabled, className } = propsOf<RadioItemProps>(el);
      const selected = radio?.value === value;
      items.push({
        key,
        disabled,
        className: cn(className),
        icon: <CheckOutlined style={{ visibility: selected ? "visible" : "hidden" }} />,
        label,
        onClick: () => radio?.onValueChange?.(value),
      });
    } else if (isElementOf(el, DropdownMenuLabel)) {
      const l = propsOf<React.ComponentProps<"div">>(el);
      items.push({ key, type: "group", label: <span className={cn("text-xs font-medium", l.className)}>{l.children}</span> });
    } else if (isElementOf(el, DropdownMenuSeparator)) {
      items.push({ key, type: "divider" });
    } else if (isElementOf(el, DropdownMenuGroup)) {
      items.push(...toItems(propsOf<{ children?: React.ReactNode }>(el).children, key, radio));
    } else if (isElementOf(el, DropdownMenuSub)) {
      const sub = propsOf<SubProps>(el);
      const trig = findChild<React.ComponentProps<"div">>(sub.children, DropdownMenuSubTrigger);
      const content = findChild<React.ComponentProps<"div">>(sub.children, DropdownMenuSubContent);
      items.push({ key, label: trig?.props.children, children: toItems(content?.props.children, key, radio) });
    } else if (React.isValidElement(el) && (el.props as any)?.children !== undefined && typeof el.type === "string") {
      // plain wrapper element (div) around items
      items.push(...toItems((el.props as any).children, key, radio));
    } else if (React.isValidElement(el)) {
      items.push({ key, label: el, className: "!cursor-default hover:!bg-transparent", onClick: () => {} });
    }
  });
  return items;
}

type RootProps = { children?: React.ReactNode; open?: boolean; defaultOpen?: boolean; onOpenChange?: (open: boolean) => void; modal?: boolean; dir?: string };

function DropdownMenu({ children, ...state }: RootProps) {
  const [open, setOpen] = useOpenState(state);
  const trigger = findChild<React.ComponentProps<"button"> & { asChild?: boolean }>(children, DropdownMenuTrigger);
  const content = findChild<React.ComponentProps<typeof DropdownMenuContent>>(children, DropdownMenuContent);
  const rest = otherChildren(children, DropdownMenuTrigger, DropdownMenuContent);
  const items = React.useMemo(() => toItems(content?.props.children), [content?.props.children]);

  const target =
    trigger?.props.asChild && React.isValidElement(trigger.props.children)
      ? (trigger.props.children as React.ReactElement)
      : trigger
        ? <button type="button" className={trigger.props.className}>{trigger.props.children}</button>
        : rest[0] ?? <span />;

  return (
    <Dropdown
      open={open}
      onOpenChange={(o) => setOpen(o)}
      trigger={["click"]}
      placement={toPlacement(content?.props.side ?? "bottom", content?.props.align ?? "start")}
      menu={{ items, className: cn("min-w-[8rem]", content?.props.className) }}
      classNames={{ root: "tl-dropdown" }}
    >
      {target}
    </Dropdown>
  );
}

export {
  DropdownMenu,
  DropdownMenuPortal,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuItem,
  DropdownMenuCheckboxItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
};
