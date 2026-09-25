"use client";
import * as React from "react";
import { Tag } from "antd";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center justify-center rounded-md border px-2 py-0.5 text-xs font-medium w-fit whitespace-nowrap shrink-0 gap-1 [&>svg]:size-3",
  {
    variants: {
      variant: {
        default: "border-transparent bg-[var(--ant-color-primary)] text-white",
        secondary: "border-transparent bg-[var(--ant-color-fill-secondary)] text-[var(--ant-color-text)]",
        destructive: "border-transparent bg-[var(--ant-color-error)] text-white",
        outline: "border-[var(--ant-color-border)] text-[var(--ant-color-text)]",
      },
    },
    defaultVariants: { variant: "default" },
  }
);

type Variant = NonNullable<VariantProps<typeof badgeVariants>["variant"]>;

const TAG: Record<Variant, { color?: string; variant?: "filled" | "outlined" | "solid"; className?: string }> = {
  default: { color: "blue" },
  secondary: { variant: "filled" },
  destructive: { color: "red" },
  outline: { variant: "outlined" },
};

function Badge({
  className,
  variant = "default",
  asChild: _asChild,
  children,
  ...props
}: React.ComponentProps<"span"> & VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const t = TAG[(variant ?? "default") as Variant] ?? TAG.default;
  return (
    <Tag
      data-slot="badge"
      color={t.color}
      variant={t.variant}
      className={cn("inline-flex items-center gap-1 m-0 text-xs [&>svg]:size-3", className)}
      {...(props as any)}
    >
      {children}
    </Tag>
  );
}

export { Badge, badgeVariants };
