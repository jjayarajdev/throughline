"use client";
import * as React from "react";
import { Select as AntSelect } from "antd";
import type { SelectProps as AntSelectProps } from "antd";
import { cn } from "@/lib/utils";
import { findChild, flattenChildren, isElementOf, propsOf } from "./_internal";

/**
 * Select on Ant Design, keeping the Radix compound API:
 *   <Select value onValueChange><SelectTrigger><SelectValue placeholder/></SelectTrigger>
 *     <SelectContent><SelectItem value>label</SelectItem>…</SelectContent></Select>
 * The JSX is read once and turned into Ant `options`.
 */

type ItemProps = { value: string; disabled?: boolean; children?: React.ReactNode; className?: string; textValue?: string };
type GroupProps = { children?: React.ReactNode; className?: string };
type LabelProps = { children?: React.ReactNode; className?: string };

function SelectGroup(_p: GroupProps) {
  return null;
}
function SelectLabel(_p: LabelProps) {
  return null;
}
function SelectItem(_p: ItemProps) {
  return null;
}
function SelectSeparator(_p: { className?: string }) {
  return null;
}
function SelectScrollUpButton(_p: { className?: string }) {
  return null;
}
function SelectScrollDownButton(_p: { className?: string }) {
  return null;
}
function SelectValue(_p: { placeholder?: React.ReactNode; children?: React.ReactNode; className?: string }) {
  return null;
}
function SelectTrigger(_p: React.ComponentProps<"button"> & { size?: "sm" | "default" }) {
  return null;
}
function SelectContent(_p: React.ComponentProps<"div"> & { position?: "popper" | "item-aligned" }) {
  return null;
}

function toOptions(children: React.ReactNode): NonNullable<AntSelectProps["options"]> {
  const out: NonNullable<AntSelectProps["options"]> = [];
  for (const el of flattenChildren(children)) {
    if (isElementOf(el, SelectItem)) {
      const p = propsOf<ItemProps>(el);
      out.push({ value: p.value, label: p.children, disabled: p.disabled });
    } else if (isElementOf(el, SelectGroup)) {
      const g = propsOf<GroupProps>(el);
      const label = findChild<LabelProps>(g.children, SelectLabel);
      const opts = toOptions(g.children);
      if (label) out.push({ label: label.props.children, options: opts } as any);
      else out.push(...opts);
    } else if (isElementOf(el, SelectLabel, SelectSeparator, SelectScrollUpButton, SelectScrollDownButton)) {
      // decorative in Radix; nothing to render
    } else if (React.isValidElement(el) && (el.props as any)?.children) {
      out.push(...toOptions((el.props as any).children)); // e.g. items wrapped in a div/map wrapper
    }
  }
  return out;
}

type SelectProps = {
  children?: React.ReactNode;
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  disabled?: boolean;
  required?: boolean;
  name?: string;
  dir?: "ltr" | "rtl";
  autoComplete?: string;
};

function Select({ children, value, defaultValue, onValueChange, open, defaultOpen, onOpenChange, disabled, name }: SelectProps) {
  const trigger = findChild<React.ComponentProps<typeof SelectTrigger>>(children, SelectTrigger);
  const placeholder = findChild<React.ComponentProps<typeof SelectValue>>(trigger?.props.children, SelectValue)?.props.placeholder;
  const content = findChild<React.ComponentProps<typeof SelectContent>>(children, SelectContent);
  const options = React.useMemo(() => toOptions(content?.props.children), [content?.props.children]);
  const controlled = value !== undefined;
  const norm = (v?: string) => (v === "" || v === undefined || v === null ? undefined : v);
  const searchable = options.length > 8;

  return (
    <AntSelect
      data-slot="select"
      {...(controlled ? { value: norm(value) } : { defaultValue: norm(defaultValue) })}
      onChange={(v) => onValueChange?.(v as string)}
      open={open}
      defaultOpen={defaultOpen}
      onOpenChange={onOpenChange}
      disabled={disabled || trigger?.props.disabled}
      placeholder={placeholder ?? "Select…"}
      options={options}
      showSearch={searchable}
      optionFilterProp="label"
      size={trigger?.props.size === "sm" ? "small" : "middle"}
      popupMatchSelectWidth={false}
      className={cn("min-w-[8rem]", trigger?.props.className)}
      classNames={{ popup: { root: content?.props.className } } as any}
      aria-label={trigger?.props["aria-label"]}
      id={trigger?.props.id}
      ref={undefined}
      {...(name ? { "data-name": name } : {})}
    />
  );
}

export { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectScrollDownButton, SelectScrollUpButton, SelectSeparator, SelectTrigger, SelectValue };
