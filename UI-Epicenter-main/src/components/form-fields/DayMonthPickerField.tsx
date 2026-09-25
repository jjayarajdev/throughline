"use client";

import * as React from "react";
import { format, parse, parseISO, isValid } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Control } from "react-hook-form";
import {
  DateAfter,
  DateBefore,
  DateInterval,
  DateRange,
  DayOfWeek,
} from "react-day-picker";

// === Types ===
export type Matcher =
  | boolean
  | ((date: Date) => boolean)
  | Date
  | Date[]
  | DateRange
  | DateBefore
  | DateAfter
  | DateInterval
  | DayOfWeek;

interface DatePickerFieldProps {
  control: Control<any>;
  name: string;
  label: string;
  required?: boolean;
  disabled?: boolean;
  placeholder?: string;
  disabledDates?: Matcher[];
}

// === Convert any supported value to Date ===
const toValidDate = (value: string | undefined): Date | undefined => {
  if (!value) return undefined;

  let parsed: Date | undefined = undefined;

  if (value.includes("/")) {
    parsed = parse(value, "dd/MM", new Date());
  } else if (value.includes("T")) {
    parsed = parseISO(value);
  }

  return isValid(parsed) ? parsed : undefined;
};

export function DayMonthPickerField({
  control,
  name,
  label,
  required = false,
  disabled = false,
  disabledDates = [],
  placeholder = "DD/MM",
}: DatePickerFieldProps) {
  const [open, setOpen] = React.useState(false);

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
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <FormControl>
                <Button
                  variant={"outline"}
                  disabled={disabled}
                  className={cn(
                    "w-full pl-3 text-left font-normal",
                    !field.value && "text-muted-foreground"
                  )}
                >
                  {field.value ? (
                    format(toValidDate(field.value)!, "dd/MM")
                  ) : (
                    <span>{placeholder}</span>
                  )}
                  <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                </Button>
              </FormControl>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              {/* <Calendar
                mode="single"
                selected={toValidDate(field.value)}
                onSelect={(date) => {
                  if (date) {
                    const formatted = format(date, "dd/MM");
                    field.onChange(formatted);
                  }
                  setOpen(false);
                }}
                disabled={disabledDates}
                
                initialFocus
              /> */}
              <Calendar
                mode="single"
                selected={toValidDate(field.value)}
                onSelect={(date) => {
                  if (date) {
                    const formatted = format(date, "dd/MM");
                    field.onChange(formatted);
                  }
                  setOpen(false);
                }}
                disabled={disabledDates}
                initialFocus
                captionLayout="dropdown"
                formatters={{
                  formatCaption: (month) => format(month, "MMMM"),
                }}
              />
            </PopoverContent>
          </Popover>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
