import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Control } from "react-hook-form";
import clsx from "clsx";

interface Option {
  id: number | string;
  name: string;
}

interface SelectFieldProps {
  control: Control<any>;
  name: string;
  label: string;
  placeholder?: string;
  options: Option[];
  required?: boolean;
  disabled?: boolean;
}

export function SelectField({
  control,
  name,
  label,
  placeholder,
  options,
  required = false,
  disabled = false,
}: SelectFieldProps) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem className="w-full">
          <FormLabel className="text-sm font-medium text-gray-700 dark:text-gray-200">
            {label}
            {required && <span className="text-red-500">*</span>}
          </FormLabel>
          <Select
            onValueChange={field.onChange}
            value={field.value?.toString()}
            disabled={disabled}
          >
            <FormControl>
              <SelectTrigger
                className={clsx("h-10 w-full", {
                  "bg-gray-200 text-gray-500 dark:text-white cursor-not-allowed": disabled,
                })}
              >
                <SelectValue placeholder={placeholder}>
                  {field.value &&
                    options.find(
                      (opt) => opt.id.toString() === field.value?.toString()
                    )?.name}
                </SelectValue>
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              {options.map((option) => (
                <SelectItem
                  key={option.id}
                  value={option.id.toString()}
                  className={clsx({
                    "text-gray-500": disabled,
                  })}
                >
                  {option.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
