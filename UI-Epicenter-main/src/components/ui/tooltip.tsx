"use client";
import * as React from "react";
import { Tooltip as AntTooltip } from "antd";
import { cn } from "@/lib/utils";
import { findChild, otherChildren, toPlacement } from "./_internal";

function TooltipProvider({ children }: { children?: React.ReactNode; delayDuration?: number; skipDelayDuration?: number }) {
  return <>{children}</>;
}

function TooltipTrigger(_props: React.ComponentProps<"button"> & { asChild?: boolean }) {
  return null; // read by <Tooltip>
}

function TooltipContent(
  _props: React.ComponentProps<"div"> & { side?: "top" | "right" | "bottom" | "left"; align?: "start" | "center" | "end"; sideOffset?: number }
) {
  return null; // read by <Tooltip>
}

type TooltipProps = {
  children?: React.ReactNode;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  delayDuration?: number;
};

/** Tooltip on Ant Design: TooltipTrigger's child is the target, TooltipContent's children the title. */
function Tooltip({ children, open, defaultOpen, onOpenChange, delayDuration }: TooltipProps) {
  const trigger = findChild<React.ComponentProps<"button"> & { asChild?: boolean }>(children, TooltipTrigger);
  const content = findChild<React.ComponentProps<typeof TooltipContent>>(children, TooltipContent);
  const rest = otherChildren(children, TooltipTrigger, TooltipContent);

  const target =
    trigger?.props.asChild && React.isValidElement(trigger.props.children)
      ? (trigger.props.children as React.ReactElement)
      : trigger
        ? <span className={cn("inline-flex", trigger.props.className)}>{trigger.props.children}</span>
        : rest[0] ?? <span />;

  return (
    <AntTooltip
      title={content?.props.children}
      placement={toPlacement(content?.props.side ?? "top", content?.props.align ?? "center")}
      open={open}
      defaultOpen={defaultOpen}
      onOpenChange={onOpenChange}
      mouseEnterDelay={(delayDuration ?? 100) / 1000}
      classNames={{ container: content?.props.className }}
    >
      {target}
    </AntTooltip>
  );
}

export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider };
