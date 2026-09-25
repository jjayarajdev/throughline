"use client";

import React, { use, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  MoreHorizontal,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  hasNext?: boolean;
  hasPrevious?: boolean;
  showFirstLast?: boolean;
  showPageNumbers?: boolean;
  maxVisiblePages?: number;
  className?: string;
  size?: "sm" | "md" | "lg";
  value?: number;
  onChange: (value: number) => void;
  options?: number[];
  totalEntry?: number;
}

export default function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  hasNext = true,
  hasPrevious = true,
  showFirstLast = true,
  showPageNumbers = true,
  maxVisiblePages = 5,
  size = "md",
  value,
  onChange,
  className = "",
  totalEntry,
}: PaginationProps) {
  // Generate page numbers to display
  const getVisiblePages = () => {
    if (totalPages <= maxVisiblePages) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    const half = Math.floor(maxVisiblePages / 2);
    let start = Math.max(currentPage - half, 1);
    let end = Math.min(start + maxVisiblePages - 1, totalPages);

    if (end - start + 1 < maxVisiblePages) {
      start = Math.max(end - maxVisiblePages + 1, 1);
    }

    const pages = [];
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    return pages;
  };

  const visiblePages = getVisiblePages();
  const showStartEllipsis = visiblePages[0] > 2;
  const showEndEllipsis =
    visiblePages[visiblePages.length - 1] < totalPages - 1;

  const buttonSizes = {
    sm: "h-8 px-2 text-sm",
    md: "h-9 px-3 text-sm",
    lg: "h-10 px-4 text-base",
  };

  const iconSizes = {
    sm: "h-3 w-3",
    md: "h-4 w-4",
    lg: "h-5 w-5",
  };

  const ButtonComponent = ({
    onClick,
    disabled,
    children,
    isActive = false,
    variant = "outline" as const,
  }: {
    onClick?: () => void;
    disabled?: boolean;
    children: React.ReactNode;
    isActive?: boolean;
    variant?: "outline" | "ghost";
  }) => (
    <Button
      variant={variant}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        buttonSizes[size],
        "border-gray-300 dark:border-gray-600",
        isActive &&
          "bg-[#01a982] border-[#01a982] text-white hover:bg-[#007E61] dark:bg-[#00d99a] dark:border-[#00d99a] dark:text-gray-900 dark:hover:bg-[#00b388]",
        !isActive &&
          "hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300",
        disabled && "opacity-50 cursor-not-allowed"
      )}
    >
      {children}
    </Button>
  );
  const defaultOptions = [10, 25, 50, 100];
  const recordOptions = [50];
  const pageCountOptions =
    totalEntry < 10
      ? [10] // force default to 10
      : defaultOptions
          .filter((opt) => opt <= totalEntry)
          .concat(totalEntry > Math.max(...defaultOptions) ? [totalEntry] : []);

  const [entry, setEntry] = useState(value);

  useEffect(() => {
    if (
      typeof totalEntry === "number" &&
      totalEntry > 0 &&
      entry !== totalEntry
    ) {
      setEntry(totalEntry);
      onPageChange(1);
    }
  }, [totalEntry]);

  return (
    <>
      {" "}
      <div className={`flex items-center gap-2 ${className}`}>
        <span className="text-sm text-muted-foreground">Records per page:</span>
        <Select
          disabled={totalEntry === 0}
          value={String(value)}
          onValueChange={(val) => {
            onChange(Number(val));
            onPageChange(1);
          }}
        >
          <SelectTrigger className="w-[80px] h-8">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {recordOptions.map((opt) => (
              <SelectItem key={opt} value={String(opt)}>
                {opt}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <span className="text-sm text-bold"> Total {totalEntry} records </span>
      </div>
      <nav
        className={cn("flex items-center justify-center space-x-1", className)}
        aria-label="Pagination Navigation"
      >
        {/* First Page Button */}
        {showFirstLast && (
          <ButtonComponent
            onClick={() => onPageChange(1)}
            disabled={!hasPrevious || currentPage === 1}
            variant="ghost"
          >
            <ChevronsLeft className={iconSizes[size]} />
            <span className="sr-only">Go to first page</span>
          </ButtonComponent>
        )}

        {/* Previous Button */}
        <ButtonComponent
          onClick={() => onPageChange(currentPage - 1)}
          disabled={!hasPrevious}
          variant="ghost"
        >
          <ChevronLeft className={iconSizes[size]} />
          <span className="sr-only">Go to previous page</span>
        </ButtonComponent>

        {/* Page Numbers */}
        {showPageNumbers && (
          <>
            {/* First page if not in visible range */}
            {showStartEllipsis && (
              <>
                <ButtonComponent
                  onClick={() => onPageChange(1)}
                  isActive={currentPage === 1}
                >
                  1
                </ButtonComponent>
                <div className="flex items-center px-2">
                  <MoreHorizontal className="h-4 w-4 text-gray-400" />
                </div>
              </>
            )}

            {/* Visible page numbers */}
            {visiblePages.map((page) => (
              <ButtonComponent
                key={page}
                onClick={() => onPageChange(page)}
                isActive={currentPage === page}
              >
                {page}
              </ButtonComponent>
            ))}

            {/* Last page if not in visible range */}
            {showEndEllipsis && (
              <>
                <div className="flex items-center px-2">
                  <MoreHorizontal className="h-4 w-4 text-gray-400" />
                </div>
                <ButtonComponent
                  onClick={() => onPageChange(totalPages)}
                  isActive={currentPage === totalPages}
                >
                  {totalPages}
                </ButtonComponent>
              </>
            )}
          </>
        )}

        {/* Next Button */}
        <ButtonComponent
          onClick={() => onPageChange(currentPage + 1)}
          disabled={!hasNext}
          variant="ghost"
        >
          <ChevronRight className={iconSizes[size]} />
          <span className="sr-only">Go to next page</span>
        </ButtonComponent>

        {/* Last Page Button */}
        {showFirstLast && (
          <ButtonComponent
            onClick={() => onPageChange(totalPages)}
            disabled={!hasNext || currentPage === totalPages}
            variant="ghost"
          >
            <ChevronsRight className={iconSizes[size]} />
            <span className="sr-only">Go to last page</span>
          </ButtonComponent>
        )}
      </nav>
    </>
  );
}
