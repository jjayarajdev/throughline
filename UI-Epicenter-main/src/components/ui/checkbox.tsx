"use client";
import * as React from "react";
import { Checkbox as AntCheckbox } from "antd";
import type { CheckboxRef } from "antd";
import { cn } from "@/lib/utils";

type CheckedState = boolean | "indeterminate";

export type CheckboxProps = Omit<React.ComponentProps<"button">, "onChange" | "value" | "checked" | "defaultChecked"> & {
  checked?: CheckedState;
  defaultChecked?: CheckedState;
  onCheckedChange?: (checked: boolean) => void;
  value?: string;
  required?: boolean;
};

/** Checkbox on Ant Design with the Radix `checked` / `onCheckedChange` contract. */
const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(function Checkbox(
  { className, checked, defaultChecked, onCheckedChange, disabled, id, name, value, onBlur, ...props },
  ref
) {
  const antRef = React.useRef<CheckboxRef>(null);
  React.useImperativeHandle(ref, () => antRef.current?.input as HTMLInputElement, []);
  const controlled = checked !== undefined;
  return (
    <AntCheckbox
      ref={antRef}
      data-slot="checkbox"
      id={id}
      name={name}
      value={value}
      disabled={disabled}
      indeterminate={checked === "indeterminate"}
      {...(controlled ? { checked: checked === true } : { defaultChecked: defaultChecked === true })}
      onChange={(e) => onCheckedChange?.(e.target.checked)}
      onBlur={onBlur as any}
      className={cn(className)}
      {...(props as any)}
    />
  );
});

export { Checkbox };
