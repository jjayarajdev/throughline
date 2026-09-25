"use client";
import * as React from "react";
import { Progress as AntProgress } from "antd";
import { cn } from "@/lib/utils";

function Progress({ className, value, max = 100, ...props }: React.ComponentProps<"div"> & { value?: number | null; max?: number }) {
  const percent = Math.max(0, Math.min(100, ((value ?? 0) / max) * 100));
  return <AntProgress data-slot="progress" percent={percent} showInfo={false} size="small" className={cn("m-0 w-full", className)} {...(props as any)} />;
}

export { Progress };
