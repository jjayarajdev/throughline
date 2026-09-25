"use client";

import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  MultiSelector,
  MultiSelectorContent,
  MultiSelectorInput,
  MultiSelectorItem,
  MultiSelectorList,
  MultiSelectorTrigger,
} from "@/components/ui/multiselect";
import { Control } from "react-hook-form";

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
      render={({ field: { onChange, value, ...field } }) => {
        const currentValues = value?.map((v: Option) => v.name || "") || [];

        const handleValuesChange = (selectedNames: string[]) => {
          // Transform back to the expected format using names
          const newValue = selectedNames
            .map((selectedName) => {
              const originalOption = options.find(
                (option) => option.name === selectedName
              );
              return {
                id: originalOption?.id,
                name: originalOption?.name,
                isRecommended: originalOption?.isRecommended,
              };
            })
            .filter(Boolean); // Remove any undefined values

          onChange(newValue);
        };

        return (
          <FormItem>
            <FormLabel className="text-sm font-medium">
              {label}
              {required && <span className="text-red-500">*</span>}
            </FormLabel>
            <FormControl>
               <div className={disabled ? "opacity-60 cursor-not-allowed" : ""}>
              <MultiSelector
                values={currentValues}
                onValuesChange={disabled ? () => {} : handleValuesChange}
                loop
                className={className}
                disabled={disabled}
              >
                <MultiSelectorTrigger className={disabled ? "cursor-not-allowed" : ""}>
                  <MultiSelectorInput disabled={disabled} placeholder={placeholder} />
                </MultiSelectorTrigger>
                {!disabled && (
                  <MultiSelectorContent>
                    <MultiSelectorList
                      className={`${
                        disabled ? "pointer-events-none opacity-50" : ""
                      } max-h-[200px] overflow-y-auto`}
                    >
                      {options.map((option) => (
                        <MultiSelectorItem
                          key={option.id}
                          value={option.name || ""}
                        >
                          {option.name}
                          {option.isRecommended && (
                            <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-1 rounded">
                              Recommended
                            </span>
                          )}
                        </MultiSelectorItem>
                      ))}
                    </MultiSelectorList>
                  </MultiSelectorContent>
                )}
              </MultiSelector>
              </div>
            </FormControl>
            <FormMessage />
          </FormItem>
        );
      }}
    />
  );
};
