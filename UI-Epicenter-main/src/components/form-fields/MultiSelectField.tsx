"use client";
import { Select, Tag } from "antd";
import { Control } from "react-hook-form";
import { cn } from "@/lib/utils";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

interface Option {
  id?: number;
  name?: string;
  isActive?: boolean;
  isRecommended?: boolean;
  partnerCode?: string;
}

interface MultiSelectFieldProps {
  control: Control<any>;
  name: string;
  label: string;
  options: Option[];
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
}

/** Multi-select on Ant Design's Select (mode="multiple"); the form value stays `[{ id, name, isRecommended }]`. */
export const MultiSelectField = ({
  control,
  name,
  label,
  options,
  placeholder = "Select options",
  required = false,
  disabled = false,
  className,
}: MultiSelectFieldProps) => {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field: { onChange, value, onBlur } }) => {
        const currentValues: string[] = value?.map((v: Option) => v.name || "") || [];
        const handleChange = (selectedNames: string[]) => {
          onChange(
            selectedNames
              .map((selectedName) => options.find((o) => o.name === selectedName))
              .filter(Boolean)
              .map((o) => ({ id: o!.id, name: o!.name, isRecommended: o!.isRecommended }))
          );
        };
        return (
          <FormItem>
            <FormLabel className="text-sm font-medium">
              {label}
              {required && <span className="text-red-500">*</span>}
            </FormLabel>
            <FormControl>
              <Select
                mode="multiple"
                value={currentValues}
                onChange={handleChange}
                onBlur={onBlur}
                disabled={disabled}
                placeholder={placeholder}
                allowClear
                showSearch
                optionFilterProp="label"
                maxTagCount="responsive"
                className={cn("w-full", className)}
                options={options.map((o) => ({
                  value: o.name || "",
                  label: (
                    <span className="inline-flex items-center gap-2">
                      {o.name}
                      {o.isRecommended && (
                        <Tag color="blue" variant="filled" className="m-0 text-xs">
                          Recommended
                        </Tag>
                      )}
                    </span>
                  ),
                }))}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        );
      }}
    />
  );
};
