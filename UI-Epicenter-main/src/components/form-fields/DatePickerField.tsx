"use client";
import * as React from "react";
import { DatePicker } from "antd";
import dayjs, { type Dayjs } from "dayjs";
import { Control } from "react-hook-form";
import { cn } from "@/lib/utils";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

/** Date matchers kept from the previous react-day-picker API. */
export type DateRange = { from: Date | undefined; to?: Date | undefined };
export type Matcher =
  | boolean
  | ((date: Date) => boolean)
  | Date
  | Date[]
  | DateRange
  | { before: Date }
  | { after: Date }
  | { before: Date; after: Date }
  | { dayOfWeek: number | number[] };

const sameDay = (a: Date, b: Date) => a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());

export function isDateDisabledBy(matchers: Matcher[] | undefined, date: Date): boolean {
  if (!matchers?.length) return false;
  const day = startOfDay(date);
  return matchers.some((m) => {
    if (typeof m === "boolean") return m;
    if (typeof m === "function") return m(date);
    if (m instanceof Date) return sameDay(m, date);
    if (Array.isArray(m)) return m.some((d) => sameDay(d, date));
    if ("dayOfWeek" in m) return ([] as number[]).concat(m.dayOfWeek).includes(date.getDay());
    if ("before" in m && "after" in m) return day < startOfDay(m.before) && day > startOfDay(m.after);
    if ("before" in m) return day < startOfDay(m.before);
    if ("after" in m) return day > startOfDay(m.after);
    if ("from" in m || "to" in m) {
      const from = m.from ? startOfDay(m.from) : undefined;
      const to = m.to ? startOfDay(m.to) : undefined;
      return (!from || day >= from) && (!to || day <= to);
    }
    return false;
  });
}

interface DatePickerFieldProps {
  control: Control<any>;
  name: string;
  label: string;
  required?: boolean;
  disabled?: boolean;
  placeholder?: string;
  disabledDates?: Matcher[];
}

/** Date field on Ant Design's DatePicker; the form value stays a `yyyy-MM-dd` string. */
export function DatePickerField({
  control,
  name,
  label,
  required = false,
  disabled = false,
  disabledDates = [{ before: new Date() }],
  placeholder = "YYYY-MM-DD",
}: DatePickerFieldProps) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => {
        const parsed = field.value ? dayjs(field.value) : null;
        return (
          <FormItem className="flex flex-col">
            <FormLabel className="text-sm font-medium">
              {label}
              {required && <span className="text-red-500">*</span>}
            </FormLabel>
            <FormControl>
              <DatePicker
                value={parsed?.isValid() ? parsed : null}
                onChange={(d: Dayjs | null) => field.onChange(d ? d.format("YYYY-MM-DD") : "")}
                onBlur={field.onBlur}
                disabled={disabled}
                placeholder={placeholder}
                format="YYYY-MM-DD"
                disabledDate={(d) => isDateDisabledBy(disabledDates, d.toDate())}
                className={cn("w-full")}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        );
      }}
    />
  );
}
