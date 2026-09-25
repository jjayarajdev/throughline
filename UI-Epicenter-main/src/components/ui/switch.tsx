"use client";
import * as React from "react";
import { Switch as AntSwitch } from "antd";
import { cn } from "@/lib/utils";

export type SwitchProps = Omit<React.ComponentProps<"button">, "onChange" | "value"> & {
  checked?: boolean;
  defaultChecked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  value?: string;
  required?: boolean;
  size?: "small" | "default";
};

const Switch = React.forwardRef<HTMLButtonElement, SwitchProps>(function Switch(
  { className, checked, defaultChecked, onCheckedChange, disabled, id, size, ...props },
  ref
) {
  const controlled = checked !== undefined;
  return (
    <AntSwitch
      ref={ref as any}
      data-slot="switch"
      id={id}
      size={size}
      disabled={disabled}
      {...(controlled ? { checked } : { defaultChecked })}
      onChange={(next) => onCheckedChange?.(next)}
      className={cn(className)}
      {...(props as any)}
    />
  );
});

export { Switch };
