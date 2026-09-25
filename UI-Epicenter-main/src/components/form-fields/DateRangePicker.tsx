"use client";

import * as React from "react";
import { Calendar as CalendarIcon, X } from "lucide-react";
import { format, isValid, isBefore } from "date-fns";
import { DateRange } from "react-day-picker";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface DateRangePickerProps {
  value?: DateRange;
  onChange: (range: DateRange | undefined) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  maxDate?: Date;
  minDate?: Date;
  showClear?: boolean; // New prop to control clear button visibility
}

export function DateRangePicker({
  value,
  onChange,
  placeholder = "Pick a date range",
  className,
  disabled = false,
  maxDate,
  minDate,
  showClear = true, // Default to true to show clear button
}: DateRangePickerProps) {
  const [open, setOpen] = React.useState(false);

  const formatDateRange = React.useCallback((range: DateRange | undefined) => {
    if (!range) return placeholder;

    const from =
      range.from && isValid(range.from) ? format(range.from, "dd-MM-yyyy") : "";
    const to =
      range.to && isValid(range.to) ? format(range.to, "dd-MM-yyyy") : "";

    if (from && to) return `From ${from}  To ${to}`;
    if (from) return `From ${from}`;
    return placeholder;
  }, [placeholder]);

  const isDateDisabled = React.useCallback((date: Date) => {
    // Disable dates before selected 'from' date to prevent confusion
    if (value?.from && !value?.to && isBefore(date, value.from)) {
      return true;
    }
    return false;
  }, [value]);

  const handleClear = React.useCallback((e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent opening the popover
    onChange(undefined);
    setOpen(false);
  }, [onChange]);

  const hasValue = value?.from || value?.to;

  return (
    <Popover open={disabled ? false : open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "w-auto justify-start text-left font-normal relative",
            !value && "text-muted-foreground",
            disabled && "opacity-50 cursor-not-allowed",
            className
          )}
          disabled={disabled}
        >
          <CalendarIcon className="mr-2 h-4 w-4 flex-shrink-0" />
          <span className="flex-1 truncate">{formatDateRange(value)}</span>

          {/* Clear button */}
          {showClear && hasValue && !disabled && (
            <button
              type="button"
              onClick={handleClear}
              className="ml-2 p-1 hover:bg-gray-100 rounded-sm transition-colors flex-shrink-0 group"
              aria-label="Clear date range"
            >
              <X className="h-3 w-3 text-gray-400 group-hover:text-gray-600" />
            </button>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          initialFocus
          showOutsideDays={true}
          mode="range"
          defaultMonth={value?.from}
          selected={value}
          onSelect={onChange}
          numberOfMonths={1}
          disabled={(date) => {
            if (maxDate && date > maxDate) return true;
            if (minDate && date < minDate) return true;
            return isDateDisabled(date);
          }}
        />

        {/* Clear button in footer */}
        {showClear && hasValue && (
          <div className="p-3 border-t border-gray-100">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                onChange(undefined);
                setOpen(false);
              }}
              className="w-full cursor-pointer text-xs"
            >
              <X className="w-3 h-3 mr-1" />
              Clear Selection
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
