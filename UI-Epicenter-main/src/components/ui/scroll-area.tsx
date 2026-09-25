"use client";
import * as React from "react";
import { cn } from "@/lib/utils";

/** Native scrolling container (Ant Design has no scroll-area primitive; browsers' scrollbars are used). */
function ScrollArea({ className, children, ...props }: React.ComponentProps<"div">) {
  return (
    <div data-slot="scroll-area" className={cn("relative overflow-auto", className)} {...props}>
      {children}
    </div>
  );
}

function ScrollBar(_props: React.ComponentProps<"div"> & { orientation?: "vertical" | "horizontal" }) {
  return null;
}

export { ScrollArea, ScrollBar };
