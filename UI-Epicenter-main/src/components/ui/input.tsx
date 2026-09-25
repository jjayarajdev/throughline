"use client";
import * as React from "react";
import { Input as AntInput } from "antd";
import type { InputRef } from "antd";
import { cn } from "@/lib/utils";

const NATIVE_TYPES = new Set(["file", "checkbox", "radio", "range", "color", "hidden", "submit", "reset", "button", "image"]);

export type InputProps = Omit<React.ComponentProps<"input">, "size" | "prefix"> & {
  size?: "small" | "middle" | "large";
  prefix?: React.ReactNode;
  suffix?: React.ReactNode;
  allowClear?: boolean;
};

/** Text input on Ant Design. Types Ant cannot render (file, checkbox, …) fall back to the native element. */
const Input = React.forwardRef<HTMLInputElement, InputProps>(function Input(
  { className, type = "text", size, prefix, suffix, allowClear, ...props },
  ref
) {
  const antRef = React.useRef<InputRef>(null);
  React.useImperativeHandle(ref, () => antRef.current?.input as HTMLInputElement, []);

  if (NATIVE_TYPES.has(type)) {
    return (
      <input
        ref={ref}
        type={type}
        data-slot="input"
        className={cn(
          "flex h-9 w-full min-w-0 rounded-md border border-[var(--ant-color-border)] bg-[var(--ant-color-bg-container)] px-3 py-1 text-sm file:mr-3 file:rounded file:border-0 file:bg-[var(--ant-color-fill-secondary)] file:px-2 file:py-1 file:text-sm",
          className
        )}
        {...props}
      />
    );
  }

  if (type === "password") {
    return (
      <AntInput.Password
        ref={antRef}
        data-slot="input"
        size={size}
        prefix={prefix}
        className={cn("w-full", className)}
        {...(props as any)}
      />
    );
  }

  return (
    <AntInput
      ref={antRef}
      type={type}
      data-slot="input"
      size={size}
      prefix={prefix}
      suffix={suffix}
      allowClear={allowClear}
      className={cn("w-full", className)}
      {...(props as any)}
    />
  );
});

export { Input };
