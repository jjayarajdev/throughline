"use client";

import * as React from "react";
import { format, parse } from "date-fns";
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
import { DateAfter, DateBefore, DateInterval, DateRange, DayOfWeek } from "react-day-picker";

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



export function DatePickerField({
  control,
  name,
  label,
  required = false,
  disabled = false,
 disabledDates = [{ before: new Date() }],
  placeholder = "YYYY-MM-DD",
}: DatePickerFieldProps) {
  const [open, setOpen] = React.useState(false);

  const formatDate = (date: Date | undefined) => {
    if (!date) return "";
    return format(date, "yyyy-MM-dd");
  };

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
                    formatDate(new Date(field.value))
                  ) : (
                    <span>{placeholder}</span>
                  )}
                  <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                </Button>
              </FormControl>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={field.value ? new Date(field.value) : undefined}
                onSelect={(date) => {
                  field.onChange(date ? formatDate(date) : "");
                  setOpen(false); // Close the calendar after selection
                }}
                disabled={disabledDates}
                // disabled={(date) =>
                //   date < new Date()
                // }
                fromDate={new Date(2024, 5, 25)} // Set a reasonable minimum date
                initialFocus
              />
            </PopoverContent>
          </Popover>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}