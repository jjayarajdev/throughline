"use client";
import * as React from "react";
import { DatePicker } from "antd";
import dayjs, { type Dayjs } from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";
import { Control } from "react-hook-form";
import { cn } from "@/lib/utils";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { isDateDisabledBy, type Matcher } from "./DatePickerField";

dayjs.extend(customParseFormat);
export type { Matcher };

interface DatePickerFieldProps {
  control: Control<any>;
  name: string;
  label: string;
  required?: boolean;
  disabled?: boolean;
  placeholder?: string;
  disabledDates?: Matcher[];
}

/** Accepts "DD/MM" or an ISO date-time string, as the API returns both. */
const toDayjs = (value: string | undefined): Dayjs | null => {
  if (!value) return null;
  const d = value.includes("/") ? dayjs(value, "DD/MM", true) : dayjs(value);
  return d.isValid() ? d : null;
};

/** Day/month field (e.g. a recurring date) on Ant Design's DatePicker; the form value stays a `DD/MM` string. */
export function DayMonthPickerField({
  control,
  name,
  label,
  required = false,
  disabled = false,
  disabledDates = [],
  placeholder = "DD/MM",
}: DatePickerFieldProps) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem className="flex flex-col">
          <FormLabel className="text-sm font-medium">
            {label}
            {required && <span className="text-red-500">*</span>}
          </FormLabel>
          <FormControl>
            <DatePicker
              value={toDayjs(field.value)}
              onChange={(d: Dayjs | null) => {
                if (d) field.onChange(d.format("DD/MM"));
              }}
              onBlur={field.onBlur}
              disabled={disabled}
              placeholder={placeholder}
              format="DD/MM"
              disabledDate={(d) => isDateDisabledBy(disabledDates, d.toDate())}
              className={cn("w-full")}
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
