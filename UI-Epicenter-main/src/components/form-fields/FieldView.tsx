"use client";

import { FormItem, FormLabel } from "@/components/ui/form";
import clsx from "clsx";

interface ViewFieldProps {
  label: string;
  value?: string | number | null;
  required?: boolean;
  className?: string;
}

export function FieldView({ label, value, required, className }: ViewFieldProps) {
  return (
    <FormItem className={clsx("flex flex-col", className)}>
      <FormLabel className="text-sm font-medium">
        {label}
        {required && <span className="text-red-500">*</span>}
      </FormLabel>
      <div
        className={clsx(
          "h-10 w-full rounded-md border border-input bg-gray-100 px-3 py-2 text-sm text-gray-800",
          "flex items-center",
          "dark:bg-gray-800 dark:text-gray-100"
        )}
      >
        {value || "—"}
      </div>
    </FormItem>
  );
}
