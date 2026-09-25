"use client";
import * as React from "react";
import { Button as AntButton } from "antd";
import type { ButtonProps as AntButtonProps } from "antd";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

/**
 * Button on Ant Design, keeping the shadcn API (variant / size / asChild / native button props).
 * `buttonVariants` is kept for the few places that use it to style links like buttons.
 */
const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors disabled:pointer-events-none disabled:opacity-50 [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 cursor-pointer",
  {
    variants: {
      variant: {
        default: "bg-[var(--ant-color-primary)] text-white hover:bg-[var(--ant-color-primary-hover)]",
        destructive: "bg-[var(--ant-color-error)] text-white hover:bg-[var(--ant-color-error-hover)]",
        outline:
          "border border-[var(--ant-color-border)] bg-[var(--ant-color-bg-container)] text-[var(--ant-color-text)] hover:text-[var(--ant-color-primary-hover)] hover:border-[var(--ant-color-primary-hover)]",
        secondary: "bg-[var(--ant-color-fill-secondary)] text-[var(--ant-color-text)] hover:bg-[var(--ant-color-fill)]",
        ghost: "text-[var(--ant-color-text)] hover:bg-[var(--ant-color-fill-tertiary)]",
        link: "text-[var(--ant-color-primary)] hover:text-[var(--ant-color-primary-hover)]",
        hpButton: "bg-[var(--ant-color-primary)] text-white hover:bg-[var(--ant-color-primary-hover)]",
        hpReject: "bg-[var(--ant-color-error)] text-white hover:bg-[var(--ant-color-error-hover)]",
        hpPending: "bg-[var(--ant-color-warning)] text-white hover:bg-[var(--ant-color-warning-hover)]",
        borderless: "text-[var(--ant-color-text)] hover:bg-[var(--ant-color-fill-tertiary)]",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 px-3",
        lg: "h-10 px-6",
        icon: "size-9 p-0",
        small: "h-8 px-3",
        middle: "h-9 px-4",
        large: "h-10 px-6",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  }
);

type Variant = NonNullable<VariantProps<typeof buttonVariants>["variant"]>;
type Size = NonNullable<VariantProps<typeof buttonVariants>["size"]>;

const VARIANT: Record<Variant, Pick<AntButtonProps, "color" | "variant">> = {
  default: { color: "primary", variant: "solid" },
  hpButton: { color: "primary", variant: "solid" },
  destructive: { color: "danger", variant: "solid" },
  hpReject: { color: "danger", variant: "solid" },
  hpPending: { color: "orange", variant: "solid" },
  outline: { color: "default", variant: "outlined" },
  secondary: { color: "default", variant: "filled" },
  ghost: { color: "default", variant: "text" },
  borderless: { color: "default", variant: "text" },
  link: { color: "primary", variant: "link" },
};

const SIZE: Record<Size, AntButtonProps["size"]> = {
  default: "middle",
  sm: "small",
  lg: "large",
  icon: "middle",
  small: "small",
  middle: "middle",
  large: "large",
};

export type ButtonProps = Omit<React.ComponentProps<"button">, "color" | "type"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
    /** native button type; mapped to Ant's htmlType */
    type?: "button" | "submit" | "reset";
    loading?: boolean;
    icon?: React.ReactNode;
  };

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { className, variant = "default", size = "default", asChild = false, type = "button", loading, icon, children, ...props },
  ref
) {
  if (asChild) {
    return <Slot ref={ref as any} data-slot="button" className={cn(buttonVariants({ variant, size }), className)} {...(props as any)}>{children}</Slot>;
  }
  const v = VARIANT[(variant ?? "default") as Variant] ?? VARIANT.default;
  const s = SIZE[(size ?? "default") as Size] ?? "middle";
  const iconOnly = size === "icon";
  return (
    <AntButton
      ref={ref}
      data-slot="button"
      htmlType={type}
      color={v.color}
      variant={v.variant}
      size={s}
      loading={loading}
      icon={icon}
      className={cn("inline-flex items-center justify-center gap-2 [&_svg:not([class*='size-'])]:size-4", iconOnly && "w-9 px-0", className)}
      {...(props as any)}
    >
      {children}
    </AntButton>
  );
});

export { Button, buttonVariants };
