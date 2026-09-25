"use client";
import * as React from "react";
import { Select } from "antd";
import { cn } from "@/lib/utils";

export interface Option {
  value: string;
  label: string;
}

interface SearchableDropdownProps {
  options: Option[];
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  noResultsText?: string;
  className?: string;
  disabled?: boolean;
}

/** Searchable single select on Ant Design's Select (showSearch). */
export function SearchableDropdown({
  options,
  value,
  onChange,
  placeholder = "Select an option",
  noResultsText = "No results found.",
  className,
  disabled = false,
}: SearchableDropdownProps) {
  return (
    <Select
      showSearch
      value={value === "" || value === undefined ? undefined : value}
      onChange={(v) => onChange(v)}
      options={options ?? []}
      optionFilterProp="label"
      placeholder={placeholder}
      notFoundContent={noResultsText}
      disabled={disabled}
      className={cn("w-full", className)}
      popupMatchSelectWidth
    />
  );
}
