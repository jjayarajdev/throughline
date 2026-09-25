"use client";
import React, { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import RoundDropdown from "@/components/form-fields/Dropdown";
import { useQuery } from "@tanstack/react-query";
import { dropdownApi } from "@/services/api/master";
import { FilterTypeEnum } from "@/constants/FilterTypeEnum";

interface SearchFilterProps {
  filterType: FilterTypeEnum;
  onFilterChange: (searchColumn: string, searchText: string) => void;
  onClear: () => void;
  placeholder?: string;
  className?: string;
}

export default function SearchFilter({
  filterType,
  onFilterChange,
  onClear,
  placeholder = "Search...",
  className = "flex gap-2 flex-1 max-w-lg",
}: SearchFilterProps) {
  const [searchText, setSearchText] = useState("");
  const [searchColumn, setSearchColumn] = useState<string>("");

  const { data: filterOptions } = useQuery({
    queryKey: ["filterOptions", filterType],
    queryFn: () => dropdownApi.fetchFilter(filterType),
     staleTime: 30000,
  });

  useEffect(() => {
    if (filterOptions && filterOptions.length > 0 && !searchColumn) {
      setSearchColumn(filterOptions[0].value);
    }
  }, [filterOptions, searchColumn]);

  useEffect(() => {
    if (searchColumn) {
      onFilterChange(searchColumn, searchText);
    }
  }, [searchColumn, searchText, onFilterChange]);

  const handleClear = () => {
    setSearchText("");
    onClear();
  };

  return (
    <div className={className}>
      {filterOptions && filterOptions.length > 0 && (
        <>
          <RoundDropdown
            options={filterOptions}
            defaultLabel="Select Filter"
            onSelect={(selectedItem) => {
              setSearchColumn(String(selectedItem.value));
            }}
          />
          <div className="w-auto">
            <Input
              placeholder='Search records...'
              className="h-9 "
              value={searchText}
              onChange={(e) => {
                setSearchText(e.target.value);
              }}
            />
          </div>
          {searchText && (
            <Button
              size="sm"
              variant="hpButton"
              className="h-9"
              onClick={handleClear}
            >
              Clear
            </Button>
          )}
        </>
      )}
    </div>
  );
}