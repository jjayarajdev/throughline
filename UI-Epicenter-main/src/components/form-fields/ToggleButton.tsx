"use client";

import React from "react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

interface AssignedToggleSwitchProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  id?: string;
  disabled?: boolean;
  size?: "sm" | "md" | "lg";
  variant?: "default" | "compact";
  className?: string;
  checkedLabel?: string;
  uncheckedLabel?: string;
}

export default function ToggleButton({
  checked,
  onCheckedChange,
  id = "assigned-mode",
  disabled = false,
  size = "md",
  variant = "default",
  className = "",
  checkedLabel = "Assigned",
  uncheckedLabel = "Unassigned",
}: AssignedToggleSwitchProps) {
  const sizeClasses = {
    sm: "text-xs",
    md: "text-sm",
    lg: "text-base",
  };

  const spacingClasses = {
    default: "space-x-2",
    compact: "space-x-1",
  };

  return (
    <div className={`flex items-center ${spacingClasses[variant]} ${className}`}>
      <Switch
        id={id}
        checked={checked}
        onCheckedChange={onCheckedChange}
        disabled={disabled}
        className="data-[state=checked]:bg-[#007E61] data-[state=checked]:border-[#007E61] dark:data-[state=checked]:bg-[#00cc99] dark:data-[state=checked]:border-[#00cc99]"
      />
      <Label
        htmlFor={id}
        className={`font-medium text-[#007E61] dark:text-[#00cc99] cursor-pointer ${sizeClasses[size]} ${
          disabled ? "opacity-50 cursor-not-allowed" : ""
        }`}
      >
        {checked ? checkedLabel : uncheckedLabel}
      </Label>
    </div>
  );
}