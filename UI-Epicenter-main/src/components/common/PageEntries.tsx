"use client";

import React from "react";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";

interface EntriesSelectorProps {
  value: number;
  onChange: (value: number) => void;
  options?: number[];
  className?: string;
  totalEntry?:number;
}

export const EntriesSelector: React.FC<EntriesSelectorProps> = ({
  value,
  onChange,
  options = [10, 25, 50],
  className = "",
  totalEntry
}) => {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <span className="text-sm text-muted-foreground">Show</span>
      <Select
        value={String(value)}
        onValueChange={(val) => onChange(Number(val))}
      >
        <SelectTrigger className="w-[80px] h-8">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map((opt) => (
            <SelectItem key={opt} value={String(opt)}>
              {opt}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <span className="text-sm text-muted-foreground">/{totalEntry} entries</span>
    </div>
  );
};
