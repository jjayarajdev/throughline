"use client";
import { useCallback, useMemo, useState } from "react";
import type { SorterResult, TablePaginationConfig } from "antd/es/table/interface";
import { useDebounce } from "@/lib/useDebounce";

export type SortOrder = "asc" | "desc";

export interface TableQueryState {
  pageNumber: number;
  pageSize: number;
  sortBy?: string;
  sortOrder?: SortOrder;
  searchColumn?: string;
  searchText?: string;
}

interface Options {
  pageSize?: number;
  sortBy?: string;
  sortOrder?: SortOrder;
  searchColumn?: string;
  debounceMs?: number;
}

/**
 * Page / size / sort / search state for a server-paged grid, shaped like the API's
 * `pageNumber`, `pageSize`, `sortBy`, `sortOrder`, `searchColumn`, `searchText` inputs.
 * Pass `onTableChange` to <DataTable> and spread `query` into the react-query key + request.
 */
export function useTableState(opts: Options = {}) {
  const [pageNumber, setPageNumber] = useState(1);
  const [pageSize, setPageSize] = useState(opts.pageSize ?? 50);
  const [sortBy, setSortBy] = useState<string | undefined>(opts.sortBy);
  const [sortOrder, setSortOrder] = useState<SortOrder | undefined>(opts.sortOrder);
  const [searchColumn, setSearchColumn] = useState<string | undefined>(opts.searchColumn);
  const [searchText, setSearchText] = useState("");
  const debouncedSearch = useDebounce(searchText, opts.debounceMs ?? 300);

  const onTableChange = useCallback(
    (pagination: TablePaginationConfig, _filters: unknown, sorter: SorterResult<any> | SorterResult<any>[]) => {
      const s = Array.isArray(sorter) ? sorter[0] : sorter;
      if (pagination.current && pagination.current !== pageNumber) setPageNumber(pagination.current);
      if (pagination.pageSize && pagination.pageSize !== pageSize) {
        setPageSize(pagination.pageSize);
        setPageNumber(1);
      }
      if (s) {
        const key = (s.columnKey ?? s.field) as string | undefined;
        setSortBy(s.order ? key : opts.sortBy);
        setSortOrder(s.order === "ascend" ? "asc" : s.order === "descend" ? "desc" : opts.sortOrder);
      }
    },
    [pageNumber, pageSize, opts.sortBy, opts.sortOrder]
  );

  const setSearch = useCallback((column: string | undefined, text: string) => {
    setSearchColumn(column);
    setSearchText(text);
    setPageNumber(1);
  }, []);

  const query: TableQueryState = useMemo(
    () => ({ pageNumber, pageSize, sortBy, sortOrder, searchColumn: debouncedSearch ? searchColumn : undefined, searchText: debouncedSearch || undefined }),
    [pageNumber, pageSize, sortBy, sortOrder, searchColumn, debouncedSearch]
  );

  /** Same sort as `sortColumns: [{ column, descending }]`, the shape several list endpoints take. */
  const sortColumns = useMemo(
    () => (sortBy ? [{ column: sortBy, descending: sortOrder !== "asc" }] : []),
    [sortBy, sortOrder]
  );

  return {
    query,
    sortColumns,
    pageNumber,
    pageSize,
    sortBy,
    sortOrder,
    searchColumn,
    searchText,
    setPageNumber,
    setPageSize,
    setSearch,
    /** reset to page 1 when a filter outside the table changes */
    resetPage: () => setPageNumber(1),
    onTableChange,
  };
}
