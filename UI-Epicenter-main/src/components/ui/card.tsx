"use client";
import * as React from "react";
import { Card as AntCard } from "antd";
import { cn } from "@/lib/utils";

/**
 * Card on Ant Design. The Ant card body is `display: contents` so the shadcn
 * sub-components (CardHeader/CardContent/CardFooter with their own px-6) lay out
 * directly inside the flex column, exactly as before.
 */
function Card({ className, children, ...props }: React.ComponentProps<"div">) {
  return (
    <AntCard
      data-slot="card"
      variant="outlined"
      styles={{ body: { display: "contents", padding: 0 } }}
      className={cn("flex flex-col gap-6 py-6 overflow-visible", className)}
      {...(props as any)}
    >
      {children}
    </AntCard>
  );
}

function CardHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-header"
      className={cn("grid auto-rows-min grid-rows-[auto_auto] items-start gap-1.5 px-6 has-data-[slot=card-action]:grid-cols-[1fr_auto]", className)}
      {...props}
    />
  );
}

function CardTitle({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="card-title" className={cn("leading-none font-semibold text-[var(--ant-color-text)]", className)} {...props} />;
}

function CardDescription({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="card-description" className={cn("text-sm text-[var(--ant-color-text-secondary)]", className)} {...props} />;
}

function CardAction({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="card-action" className={cn("col-start-2 row-span-2 row-start-1 self-start justify-self-end", className)} {...props} />;
}

function CardContent({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="card-content" className={cn("px-6", className)} {...props} />;
}

function CardFooter({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="card-footer" className={cn("flex items-center px-6", className)} {...props} />;
}

export { Card, CardHeader, CardFooter, CardTitle, CardAction, CardDescription, CardContent };
