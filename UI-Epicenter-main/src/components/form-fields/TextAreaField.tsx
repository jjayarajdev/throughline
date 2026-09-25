"use client";

import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import clsx from "clsx";
import { Control } from "react-hook-form";

interface TextareaFieldProps {
  control: Control<any>;
  name: string;
  label: string;
  placeholder?: string;
  rows?: number;
  required?: boolean;
  disabled?: boolean;
}

export function TextareaField({
  control,
  name,
  label,
  placeholder,
  rows = 4,
  required = false,
  disabled = false,
}: TextareaFieldProps) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel className="text-sm font-medium">
            {label}
            {required && <span className="text-red-500">*</span>}
          </FormLabel>
          <FormControl>
            <Textarea
              placeholder={placeholder}
              rows={rows}
              {...field}
              disabled={disabled}
              className={clsx("w-full rounded-md border focus:ring-2 focus:ring-offset-0", "max-h-60 overflow-y-auto",  {
                "bg-gray-200 text-black": disabled,
              })}
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
