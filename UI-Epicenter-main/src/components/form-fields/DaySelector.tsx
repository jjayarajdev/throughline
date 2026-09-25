import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { Controller } from "react-hook-form";

interface DaySelectorProps {
  control: any;
  name: string;
  label: string;
  required?: boolean;
}

export function DaySelector({
  control,
  name,
  label,
  required,
}: DaySelectorProps) {
  const DAYS = [
    "Mon",
    "Tue",
    "Wed",
    "Thu",
    "Fri",
    "Sat",
    "Sun",
  ];

  return (
    <div className="w-full md:col-span-2 space-y-2">
      <Label className="text-sm font-medium dark:text-gray-200">
        {label} {required && <span className="text-red-500">*</span>}
      </Label>
      <Controller
        control={control}
        name={name}
        render={({ field, fieldState: { error } }) => (
          <div className="space-y-3">
            <div className="flex items-center gap-2 flex-wrap">
              {DAYS.map((day) => (
                <Button
                  key={day}
                  type="button"
                  variant="outline"
                  onClick={() => {
                    const selectedDays = field.value || [];
                    const isSelected = selectedDays.includes(day);

                    field.onChange(
                      isSelected
                        ? selectedDays.filter(
                            (selectedDay: string) => selectedDay !== day
                          )
                        : [...selectedDays, day]
                    );
                  }}
                  className={cn(
                    "px-4 py-2 rounded-md border transition-colors",
                    field.value?.includes(day)
                     ? "bg-[#01a982] text-white border-[#01a982] hover:bg-[#019173] dark:bg-[#00b388] dark:hover:bg-[#019173]"
                      : "border-gray-300 text-gray-800 dark:border-gray-600 dark:text-gray-200 hover:border-[#01a982] hover:text-[#01a982]"

                  )}
                >
                  {day}
                </Button>
              ))}
            </div>
            {error && <p className="text-sm text-red-500 dark:text-red-400">{error.message}</p>}
          </div>
        )}
      />
    </div>
  );
}
