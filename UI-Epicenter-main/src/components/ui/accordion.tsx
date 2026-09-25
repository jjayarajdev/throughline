"use client";
import * as React from "react";
import { Collapse } from "antd";
import { cn } from "@/lib/utils";
import { findChild, findChildren } from "./_internal";

type ItemProps = React.ComponentProps<"div"> & { value: string; disabled?: boolean };

function AccordionItem(_p: ItemProps) {
  return null; // read by <Accordion>
}
function AccordionTrigger(_p: React.ComponentProps<"button">) {
  return null;
}
function AccordionContent(_p: React.ComponentProps<"div">) {
  return null;
}

type AccordionProps = Omit<React.ComponentProps<"div">, "defaultValue" | "onChange"> &
  (
    | { type: "single"; value?: string; defaultValue?: string; onValueChange?: (v: string) => void; collapsible?: boolean }
    | { type: "multiple"; value?: string[]; defaultValue?: string[]; onValueChange?: (v: string[]) => void }
  );

/** Accordion on Ant Design's Collapse, keeping the Radix compound API. */
function Accordion({ className, children, ...props }: AccordionProps) {
  const { type, value, defaultValue, onValueChange, ...rest } = props as any;
  const items = findChildren<ItemProps>(children, AccordionItem).map((item) => {
    const trigger = findChild<React.ComponentProps<"button">>(item.props.children, AccordionTrigger);
    const content = findChild<React.ComponentProps<"div">>(item.props.children, AccordionContent);
    return {
      key: item.props.value,
      label: <span className={cn("font-medium", trigger?.props.className)}>{trigger?.props.children}</span>,
      children: <div className={cn(content?.props.className)}>{content?.props.children}</div>,
      collapsible: item.props.disabled ? ("disabled" as const) : undefined,
      className: item.props.className,
    };
  });
  const single = type === "single";
  const { collapsible: _c, ...divProps } = rest;
  return (
    <Collapse
      data-slot="accordion"
      accordion={single}
      ghost
      items={items}
      {...(value !== undefined ? { activeKey: value } : { defaultActiveKey: defaultValue })}
      onChange={(k) => onValueChange?.(single ? ((Array.isArray(k) ? k[0] : k) ?? "") : (Array.isArray(k) ? k : [k]))}
      className={cn(className)}
      {...(divProps as any)}
    />
  );
}

export { Accordion, AccordionItem, AccordionTrigger, AccordionContent };
