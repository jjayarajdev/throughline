"use client";
import * as React from "react";
import { Divider } from "antd";
import { cn } from "@/lib/utils";

function Separator({
  className,
  orientation = "horizontal",
  decorative: _decorative,
  ...props
}: React.ComponentProps<"div"> & { orientation?: "horizontal" | "vertical"; decorative?: boolean }) {
  return (
    <Divider
      data-slot="separator-root"
      orientation={orientation}
      style={{ margin: 0, ...(orientation === "vertical" ? { height: "100%" } : {}) }}
      className={cn(className)}
      {...(props as any)}
    />
  );
}

export { Separator };
