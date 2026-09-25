"use client";
import * as React from "react";
import { cn } from "@/lib/utils";

/** Size-driven placeholder block (Ant's Skeleton is shape-driven, so this keeps the className API). */
function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="skeleton" className={cn("animate-pulse rounded-md bg-[var(--ant-color-fill-secondary)]", className)} {...props} />;
}

export { Skeleton };
