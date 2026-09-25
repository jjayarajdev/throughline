"use client";

import { useEffect, useMemo, useState } from "react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Filter } from "lucide-react";
import clsx from "clsx";

type OptionType = {
  id: number | string;
  name: string;
  [key: string]: any;
};

interface MultiSelectDropdownProps {
  options: OptionType[];
  defaultSelected?: (number | string)[];
  onChange: (selectedIds: (number | string)[]) => void;
  placeholder?: string;
}

export default function MultiSelectDropdown({
  options,
  defaultSelected = [],
  onChange,
  placeholder = "Select...",
}: MultiSelectDropdownProps) {
  const [selectedIds, setSelectedIds] = useState<(number | string)[]>(defaultSelected);
  const [selectAll, setSelectAll] = useState(false);

  const handleSelectAll = (e: React.MouseEvent) => {
    e.preventDefault();
    const newSelectAll = !selectAll;
    setSelectAll(newSelectAll);
    const newSelectedIds = newSelectAll ? options.map(item => item.id) : [];
    setSelectedIds(newSelectedIds);
    onChange(newSelectedIds);
  };

  const toggleSelect = (id: number | string) => {
    const newSelectedIds = selectedIds.includes(id) 
      ? selectedIds.filter(item => item !== id)
      : [...selectedIds, id];
    setSelectedIds(newSelectedIds);
    onChange(newSelectedIds);
  };

  // Get selected items for display
  const selectedItems = options.filter((item) => selectedIds.includes(item.id));
  const displayText = 
    selectedItems.length === 0 ? placeholder :
    selectedItems.length <= 2 ? selectedItems.map(item => item.name).join(", ") :
    `${selectedItems[0].name} + ${selectedItems.length - 1} more`;

  const filteredSelectedIds = useMemo(() => 
    options.filter(item => defaultSelected.includes(item.id)).map(item => item.id),
    [options, defaultSelected]
  );

  useEffect(() => {
    setSelectedIds(filteredSelectedIds);
  }, [filteredSelectedIds]);
    
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          className="w-auto justify-between bg-transparent"
          aria-label={`Selected: ${selectedItems.length} items`}
        >
          <span className="truncate">{selectAll ? "All Status" : displayText }</span>
          <Filter className="ml-2 h-4 w-4 text-green-700 shrink-0" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56">
        <DropdownMenuItem
          key="select-all"
          className="flex items-center gap-1 cursor-pointer"
          onClick={handleSelectAll}
        >
          <Checkbox
            checked={selectAll}
            data-indeterminate={!selectAll && selectedIds.length > 0}
            className={clsx(
              "data-[state=checked]:bg-gray-200 data-[state=checked]:border-gray-200",
              "data-[indeterminate=true]:bg-gray-100 data-[indeterminate=true]:border-gray-100"
            )}
          />
          <span>{selectAll ? "Clear  All" : "Select All"}</span>
        </DropdownMenuItem>
        <DropdownMenuItem className="h-px bg-gray-200 p-0 m-1" />
        {options.map((item) => (
          <DropdownMenuItem
            key={item.id}
            className="flex items-center gap-1 cursor-pointer"
            onClick={(e) => {
              e.preventDefault();
              setSelectAll(false)
              toggleSelect(item.id);
            }}
          >
            <Checkbox
              checked={selectedIds.includes(item.id)}
              className={clsx(
                "data-[state=checked]:bg-gray-200 cursor-pointer data-[state=checked]:border-gray-200"
              )}
            />
            <span>{item.name}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
