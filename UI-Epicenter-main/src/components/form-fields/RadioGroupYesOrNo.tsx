"use client";

import { Controller } from "react-hook-form";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";

interface YesNoRadioGroupProps {
  control: any;
  name: string;
  label: string;
  disabled?: boolean;
  required?: boolean;
}

export function RadioGroupYesOrNo({
  control,
  name,
  label,
  disabled = false,
}: YesNoRadioGroupProps) {
  return (
    <div className="space-y-2 mt-5">
      <Label className="text-sm font-medium">{label}</Label>
      <Controller
        control={control}
        name={name}
        render={({ field }) => (
          <RadioGroup
            value={
              typeof field.value === "boolean" ? String(field.value) : undefined
            }
            onValueChange={(val) => field.onChange(val === "true")}
            className="flex gap-4"
            disabled={disabled}
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="true" id={`${name}-yes`} />
              <Label htmlFor={`${name}-yes`}>Yes</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="false" id={`${name}-no`} />
              <Label htmlFor={`${name}-no`}>No</Label>
            </div>
          </RadioGroup>
        )}
      />
    </div>
  );
}
