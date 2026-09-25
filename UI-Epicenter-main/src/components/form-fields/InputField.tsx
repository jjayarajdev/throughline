"use client";

import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import clsx from "clsx";
import { Control } from "react-hook-form";

interface InputFieldProps {
  control: Control<any>;
  name: string;
  label: string;
  placeholder?: string;
  type?: string;
  required?: boolean;
  disabled?: boolean;
  max?: number;
  maxLength?: number; // Add maxLength prop
  pattern?: string;   // Add pattern prop
  onKeyPress?: (e: React.KeyboardEvent<HTMLInputElement>) => void; // Add onKeyPress prop
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;     // Add onChange prop
}

export function InputField({
  control,
  name,
  label,
  placeholder,
  type = "text",
  required = false,
  disabled,
  max,
  maxLength,
  pattern,

  onChange
}: InputFieldProps) {
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
            <Input
              type={type}
              placeholder={placeholder}
              {...field}
              disabled={disabled}
              className={clsx(
                 "h-10 w-full",
                 disabled && "bg-gray-200 text-black dark:bg-gray-700 dark:text-white"
                 )}
              max={max}
              maxLength={maxLength}
              pattern={pattern}
          
              onChange={(e) => {
                if (type === 'tel') {
                  // Remove non-numeric characters
                  e.target.value = e.target.value.replace(/[^0-9]/g, '');
                }
                field.onChange(e);
                onChange?.(e);
              }}
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
