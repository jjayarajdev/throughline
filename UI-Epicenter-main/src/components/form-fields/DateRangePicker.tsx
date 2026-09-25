"use client";
import * as React from "react";
import { DatePicker } from "antd";
import dayjs, { type Dayjs } from "dayjs";
import { cn } from "@/lib/utils";

export type DateRange = { from: Date | undefined; to?: Date | undefined };

interface DateRangePickerProps {
  value?: DateRange;
  onChange: (range: DateRange | undefined) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  maxDate?: Date;
  minDate?: Date;
  showClear?: boolean;
}

/** Date range on Ant Design's RangePicker; keeps the `{ from, to }` value shape. */
export function DateRangePicker({
  value,
  onChange,
  placeholder = "Pick a date range",
  className,
  disabled = false,
  maxDate,
  minDate,
  showClear = true,
}: DateRangePickerProps) {
  const from = value?.from ? dayjs(value.from) : null;
  const to = value?.to ? dayjs(value.to) : null;
  return (
    <DatePicker.RangePicker
      value={from || to ? [from, to] : null}
      onChange={(range) => {
        const [f, t] = (range ?? [null, null]) as [Dayjs | null, Dayjs | null];
        onChange(f || t ? { from: f?.toDate(), to: t?.toDate() } : undefined);
      }}
      allowClear={showClear}
      allowEmpty={[false, true]}
      disabled={disabled}
      placeholder={[placeholder, "End date"]}
      format="DD-MM-YYYY"
      disabledDate={(d) => (!!maxDate && d.toDate() > maxDate) || (!!minDate && d.toDate() < minDate)}
      className={cn("w-auto", className)}
    />
  );
}
