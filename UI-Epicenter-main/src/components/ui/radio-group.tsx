"use client";
import * as React from "react";
import { Radio } from "antd";
import { cn } from "@/lib/utils";

export type RadioGroupProps = Omit<React.ComponentProps<"div">, "onChange" | "defaultValue"> & {
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  disabled?: boolean;
  name?: string;
  required?: boolean;
  orientation?: "horizontal" | "vertical";
};

/** Radio group on Ant Design with the Radix `value` / `onValueChange` contract. */
function RadioGroup({ className, value, defaultValue, onValueChange, disabled, name, children, orientation: _o, required: _r, ...props }: RadioGroupProps) {
  const controlled = value !== undefined;
  return (
    <Radio.Group
      data-slot="radio-group"
      name={name}
      disabled={disabled}
      {...(controlled ? { value } : { defaultValue })}
      onChange={(e) => onValueChange?.(e.target.value)}
      className={cn("grid gap-3", className)}
      {...(props as any)}
    >
      {children}
    </Radio.Group>
  );
}

export type RadioGroupItemProps = Omit<React.ComponentProps<"button">, "value"> & { value: string };

const RadioGroupItem = React.forwardRef<HTMLInputElement, RadioGroupItemProps>(function RadioGroupItem(
  { className, value, disabled, id, children, ...props },
  ref
) {
  return (
    <Radio ref={ref as any} data-slot="radio-group-item" id={id} value={value} disabled={disabled} className={cn("m-0", className)} {...(props as any)}>
      {children}
    </Radio>
  );
});

export { RadioGroup, RadioGroupItem };
