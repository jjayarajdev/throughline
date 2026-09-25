"use client";

import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ArrowDownIcon,
  ArrowUpIcon,
  Ban,
  Check,
  ChevronDown,
  Menu,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Partner } from "@/services/api/partner.profile.api";
import { toast } from "sonner";
import { Hiring, hiringApi } from "@/services/api/hiring.api";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { StatusBadge } from "../status-badge";
import TableSkeletonLoader from "../skelton/TableSkelton";
import { useDebounce } from "@/lib/useDebounce";
import SearchFilter from "../common/SearchFilter";
import { FilterTypeEnum } from "@/constants/FilterTypeEnum";
import ColumnsPopover from "../common/PopoverColumns";
import Pagination from "../common/Pagination";
import { EntriesSelector } from "../common/PageEntries";
import { formatDate, sortData, tatFormat } from "@/helpers/helper";
import { isAdmin, isRmowner } from "@/store/userStore";

interface Column {
  id: keyof Hiring | "actions";
  label: string;
  visible: boolean;
  sortable?: boolean;
}

type SortColumn = {
  column: string;
  descending: boolean;
};

type SortConfig = {
  sortColumns: SortColumn[];
} | null;

export default function BinPage() {
  const router = useRouter();
  const [columns, setColumns] = useState<Column[]>([
    { id: "hrqId", label: "HRQ ID", visible: true, sortable: true },
    { id: "businessName", label: "Business", visible: true},
    { id: "rcMsProjectId", label: "RCMS ID", visible: false},
    { id: "projectName", label: "Project", visible: true },
    { id: "requestorName", label: "Requester", visible: true },
    { id: "jobTitle", label: "Role Hired For", visible: true },
    {
      id: "requestStartDate",
      label: "Request Start Date",
      visible: true,
      sortable: true,
    },
    { id: "hiringStatusName", label: "Status", visible: true },
         ...((isAdmin || isRmowner ) ? [ { id: "parentHrqId", label: "Parent HRQID", visible: false }] : []),
    { id: "tatDate", label: "TAT (Hours/Days)", visible: true },
    { id: "actions", label: "Actions", visible: true },
  ]);

  const [sortConfig, setSortConfig] = useState<SortConfig>({
    sortColumns: [{ column: "hrqId", descending: true }],
  });
  const [searchText, setSearchText] = useState("");

  const [currentPage, setCurrentPage] = useState(1);

  const debouncedSearch = useDebounce(searchText, 300);
  const [searchColumn, setSearchColumn] = useState("HrqId");
  const [pageSize, setPageSize] = useState(50);

  const {
    data: hiringBindData,
    isLoading,
    error,
    refetch: reFetchData,
  } = useQuery({
    queryKey: [
      "hiringBin",
      currentPage,
      searchColumn,
      debouncedSearch,
      pageSize,
      sortConfig,
    ],
    queryFn: () =>
      hiringApi.getHiringBin({
        pageNumber: currentPage,
        pageSize,
        searchColumn,
        searchText: debouncedSearch || undefined,
        sortColumns: sortConfig.sortColumns,
        isBin: true,
      }),
    refetchOnWindowFocus: true,
  });

  if (error) {
    toast.error("Failed to fetch hiring");
  }

  const toggleColumn = (columnId: string) => {
    setColumns(
      columns.map((col) =>
        col.id === columnId ? { ...col, visible: !col.visible } : col
      )
    );
  };

  const handleSort = (column: string) => {
    const columnIndex = sortConfig.sortColumns.findIndex(
      (sort) => sort.column === column
    );

    let newSortColumns: SortColumn[] = [...sortConfig.sortColumns];

    if (columnIndex >= 0) {
      newSortColumns[columnIndex] = {
        ...newSortColumns[columnIndex],
        descending: !newSortColumns[columnIndex].descending,
      };
    } else {
      newSortColumns = [
        { column, descending: true },
        ...newSortColumns.slice(0, 2),
      ];
    }

    setSortConfig({ sortColumns: newSortColumns });
  };

  const visibleColumns = columns.filter((col) => col.visible);

  const getSortIcon = (columnId: string) => {
    const columnIndex = sortConfig.sortColumns.findIndex(
      (sort) => sort.column === columnId
    );

    if (columnIndex === -1) {
      return null;
    }

    const sortColumn = sortConfig.sortColumns[columnIndex];

    return (
      <div className="flex items-center gap-1">
        {sortColumn.descending ? (
          <ArrowDownIcon className="h-4 w-4" />
        ) : (
          <ArrowUpIcon className="h-4 w-4" />
        )}
        {sortConfig.sortColumns.length > 1 && columnIndex > 0 && (
          <span className="ml-1 text-xs font-medium bg-gray-200 dark:bg-gray-700 rounded-full w-4 h-4 flex items-center justify-center">
            {columnIndex + 1}
          </span>
        )}
      </div>
    );
  };

  const hiringData = hiringBindData?.data?.items || [];
  const hasPrevious = hiringBindData?.data.hasPrevious;
  const hasNext = hiringBindData?.data.hasNext;
  const totalPages = hiringBindData?.data.totalPages;
  const currentPageNumber = hiringBindData?.data.currentPage;

  const handleFilterChange = (column: string, text: string) => {
    setSearchColumn(column);
    setSearchText(text);
  };

  const handleClear = () => {
    setSearchColumn("");
    setSearchText("");
    setCurrentPage(1);
    reFetchData();
  };
  return (
    <div className="p-2">
      <h1 className="text-xl font-semibold mb-6">Hiring Review Requests</h1>

      <div className="flex items-center justify-between mb-8">
        <SearchFilter
          filterType={FilterTypeEnum.HiringManagement}
          onFilterChange={handleFilterChange}
          onClear={handleClear}
          placeholder="Search by"
          setCurrentPage={setCurrentPage}
        />
        <ColumnsPopover
          columns={columns}
          toggleColumn={toggleColumn}
          screeningData={hiringData}
          buttonName="hiringData-details"
        />
      </div>

      <div className="bg-gray-50 dark:bg-gray-900 rounded-lg shadow">
        {isLoading ? (
          <TableSkeletonLoader />
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="bg-teal-200 dark:bg-gray-700">
                {visibleColumns.map((column) => (
                  <TableHead
                    key={column.id}
                    className={
                      column.sortable ? "cursor-pointer select-none" : ""
                    }
                    onClick={() => column.sortable && handleSort(column.id)}
                  >
                    <div className="flex items-center">
                      {column.label}
                      {column.sortable && getSortIcon(column.id)}
                    </div>
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {hiringData.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={visibleColumns.length}
                    className="text-center py-4"
                  >
                    No Hiring Request found
                  </TableCell>
                </TableRow>
              ) : (
                hiringData.map((hiring) => (
                  <TableRow key={hiring.id}>
                    {visibleColumns?.map((column) => (
                      <TableCell key={`${hiring.id}-${column.id}`}>
                        {column.id === "hrqId" ? (
                          <div className="text-[#00b388] hover:underline">
                            {hiring.hrqId}
                          </div>
                        ) : column.id === "hiringStatusName" ? (
                          <StatusBadge
                            status={hiring?.hiringStatusName as any}
                          />
                        ) : column.id === "requestStartDate" ? (
                          hiring?.requestStartDate ? (
                            formatDate(hiring?.requestStartDate)
                          ) : (
                            ""
                          )
                        ) : column.id === "tatDate" ? (
                          <StatusBadge
                            status={tatFormat(String(hiring?.requestStartDate))}
                          />
                        ) : column.id === "actions" ? (
                          <div className="flex items-center gap-2">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="outline" className="h-8  p-2">
                                  <Menu />
                                  <ChevronDown />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent
                                align="end"
                                className="w-[160px]"
                              >
                                <DropdownMenuItem
                                  onClick={() =>
                                    router.push(
                                      `/home/hiring-review-requests/hiring-requests?id=${encodeURIComponent(
                                        Number(hiring.id)
                                      )}&statusId=${encodeURIComponent(32001)}`
                                    )
                                  }
                                >
                                  <Check className="h-4 w-4 text-green-600" />
                                  Approve
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() =>
                                    router.push(
                                      `/home/hiring-review-requests/hiring-requests?id=${Number(
                                        hiring.id
                                      )}&statusId=${32002}`
                                    )
                                  }
                                >
                                  <Ban className="h-5 w-5 text-red-600" />
                                  Reject
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        ) : (
                          hiring[column.id as keyof Hiring]
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        )}

        <div className="flex items-center justify-between p-4">
          <div className="text-sm text-gray-500">
            Page {currentPageNumber} of {totalPages}
          </div>
          <Pagination
            value={pageSize}
            totalEntry={hiringBindData?.data.totalCount}
            onChange={(newSize) => {
              setPageSize(newSize);
            }}
            currentPage={currentPage}
            totalPages={totalPages || 0}
            onPageChange={setCurrentPage}
            hasNext={hasNext}
            hasPrevious={hasPrevious}
          />
        </div>
      </div>
    </div>
  );
}
