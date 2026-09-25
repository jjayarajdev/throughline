"use client";
import * as React from "react";
import { Popover as AntPopover } from "antd";
import { cn } from "@/lib/utils";
import { findChild, otherChildren, toPlacement, useOpenState } from "./_internal";

function PopoverTrigger(_props: React.ComponentProps<"button"> & { asChild?: boolean }) {
  return null; // read by <Popover>
}

function PopoverAnchor({ children }: { children?: React.ReactNode; asChild?: boolean }) {
  return <>{children}</>;
}

function PopoverContent(
  _props: React.ComponentProps<"div"> & { side?: "top" | "right" | "bottom" | "left"; align?: "start" | "center" | "end"; sideOffset?: number }
) {
  return null; // read by <Popover>
}

type PopoverProps = { children?: React.ReactNode; open?: boolean; defaultOpen?: boolean; onOpenChange?: (open: boolean) => void; modal?: boolean };

/** Popover on Ant Design (click trigger). PopoverContent's className styles the panel body. */
function Popover({ children, ...state }: PopoverProps) {
  const [open, setOpen] = useOpenState(state);
  const trigger = findChild<React.ComponentProps<"button"> & { asChild?: boolean }>(children, PopoverTrigger);
  const content = findChild<React.ComponentProps<typeof PopoverContent>>(children, PopoverContent);
  const rest = otherChildren(children, PopoverTrigger, PopoverContent);

  const target =
    trigger?.props.asChild && React.isValidElement(trigger.props.children)
      ? (trigger.props.children as React.ReactElement)
      : trigger
        ? <button type="button" className={trigger.props.className}>{trigger.props.children}</button>
        : rest[0] ?? <span />;

  const { className, children: body, side, align, sideOffset: _s, ...bodyProps } = content?.props ?? {};

  return (
    <AntPopover
      open={open}
      onOpenChange={setOpen}
      trigger="click"
      placement={toPlacement(side ?? "bottom", align ?? "center")}
      arrow={false}
      styles={{ content: { padding: 0 } }}
      content={
        <div data-slot="popover-content" className={cn("w-72 p-4", className)} {...(bodyProps as any)}>
          {body}
        </div>
      }
    >
      {target}
    </AntPopover>
  );
}

export { Popover, PopoverTrigger, PopoverContent, PopoverAnchor };
