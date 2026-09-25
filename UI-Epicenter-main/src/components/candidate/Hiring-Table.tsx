"use client";

import TooltipWrapper from "@/components/tooltio-wrapper";
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
  ChevronDown,
  Menu,
  Pencil,
  Plus,
  PlusIcon,
  X,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { StatusBadge } from "@/components/status-badge";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ErrorHandler } from "../error/ErrorHandler";
import { hiringApi } from "@/services/api/hiring.api";
import ColumnsPopover from "../common/PopoverColumns";
import { getHiringType } from "../hiring-forms/types";
import SearchFilter from "../common/SearchFilter";
import { FilterTypeEnum } from "@/constants/FilterTypeEnum";
import Pagination from "../common/Pagination";
import { isPartner, useUserStore } from "@/store/userStore";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { toast } from "@/lib/toast";
import api from "@/lib/axiosInstance";
import { formatDate } from "@/helpers/helper";
import Link from "next/link";

export const searchList = [
  {
    id: "HrqId",
    name: "HRQID",
  },
];

interface Candidate {
  id: string;
  hrqId: string;
  candidateCode: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  jobTitle: string;
  relevantExperience: number;
  resume: string;
  partnerName: string;
  acknowledged: boolean;
  intakeStatusName: string;
}
interface Column {
  id: keyof getHiringType | "actions";
  label: string;
  visible: boolean;
  sortable?: boolean;
}

type SortConfig = {
  key: keyof Candidate;
  direction: "asc" | "desc";
} | null;

export function CandidateHiringRequests({
  id,
  filterType,
}: {
  id: string | null;
  filterType: number;
}) {
  const { partnerId } = useUserStore();

  const [columns, setColumns] = useState<Column[]>([
    { id: "hrqId", label: "HRQID", visible: true },
    { id: "jobTitle", label: "Role Hired For ", visible: true },
    {
      id: "businessName",
      label: "Business Name",
      visible: true,
      sortable: true,
    },
    { id: "rmOwnerName", label: "RM Owner", visible: true },
    { id: "partnerAssignedDate", label: "Assigned Date", visible: true },

    { id: "numberOfPositions", label: "Total Positions", visible: true },
    { id: "currentStatusHeadCount", label: "Current Positions", visible: true },
    { id: "jobPriorityName", label: "Priority", visible: true },
    { id: "hiringStatusName", label: "Status", visible: true },
  ...(!isPartner ? [{ id: "actions", label: "Actions", visible: !isPartner }] : []),
  ...(isPartner ? [ { id: "partnerAction", label: "Action", visible: partnerId !== null },] : []),
   ]);

    const [sortConfig, setSortConfig] = useState<SortConfig>({
    key: "",
    direction: "desc",
  });
  const [searchText, setSearchText] = useState("");
  const [searchColumn, setSearchColumn] = useState<string>("HrqId");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);

  const {
    data: getHiringDetails,
    isLoading,
    error,
    refetch: reFetchData,
  } = useQuery({
    queryKey: ["gethiringDetails", id, currentPage, searchColumn, searchText,pageSize],
    queryFn: () =>
      hiringApi.getHiringRequestForPartners(
        {
          pageNumber: currentPage,
          pageSize,
          searchColumn: searchColumn,
          searchText: searchText || undefined,
        },
        Number(id)
      ),
    enabled: !!id,
    refetchOnWindowFocus: true,
  });
  const handleSort = (key: keyof Candidate) => {
    let direction: "asc" | "desc" = "asc";
    if (
      sortConfig &&
      sortConfig.key === key &&
      sortConfig?.direction === "asc"
    ) {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  const toggleColumn = (columnId: string) => {
    setColumns(
      columns.map((col) =>
        col.id === columnId ? { ...col, visible: !col.visible } : col
      )
    );
  };

  const visibleColumns = columns.filter((col) => col.visible);

  const getSortIcon = (columnId: keyof Candidate) => {
      // if (!sortConfig || sortConfig.key !== columnId) {
    //   return null;
    // }
     return (sortConfig?.direction === "asc"&& sortConfig?.key ===columnId) ? (
      <ArrowUpIcon className="h-4 w-4 ml-1" />
    ) : (
      <ArrowDownIcon className="h-4 w-4 ml-1" />
    );
  };

  const candidates = getHiringDetails?.data?.items || [];
  const hasPrevious = getHiringDetails?.data.hasPrevious;
  const hasNext = getHiringDetails?.data.hasNext;
  const totalPages = getHiringDetails?.data.totalPages;
  const currentPageNumber = getHiringDetails?.data.currentPage;
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
  const queryClient = useQueryClient();
  const unassignMutation = useMutation({
    mutationFn: async (hiringRequestId: number) => {
      const response = await api.patch(
        `/HiringRequest/partner-hrqs/remove-partner/${hiringRequestId}/${id}`
      );
      return response.data;
    },
    onSuccess: () => {
      toast.success("Hiring Request unassigned successfully");
      queryClient.invalidateQueries({ queryKey: ["gethiringDetails", id] });
    },
    onError: () => {
      toast.error("Failed to unassign partner");
    },
  });

  const handleUnassign = (hiringRequestId: number) => {
    unassignMutation.mutate(hiringRequestId);
  };

  if (error) return <ErrorHandler error={error} />;
  const router = useRouter();
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <SearchFilter
          filterType={filterType}
             onFilterChange={handleFilterChange}
          onClear={handleClear}
          placeholder="Search by"
          setCurrentPage={setCurrentPage}
        />
        <ColumnsPopover
          columns={columns}
          toggleColumn={toggleColumn}
          screeningData={candidates}
          buttonName="hirng-details"
        />
      </div>

      <div className="bg-gray-50 dark:bg-gray-900 rounded-lg shadow">
        <Table>
          <TableHeader>
            <TableRow className="bg-teal-200 dark:bg-gray-700">
              {visibleColumns.map((column) => (
                <TableHead
                  key={column.id}
                  className={
                    column.sortable ? "cursor-pointer select-none" : ""
                  }
                  onClick={() =>
                    column.sortable && handleSort(column.id as keyof Candidate)
                  }
                >
                  <div className="flex items-center">
                    {column.label}
                    {column.sortable &&
                      getSortIcon(column.id as keyof Candidate)}
                  </div>
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell
                  colSpan={visibleColumns.length}
                  className="text-center py-4"
                >
                  Loading...
                </TableCell>
              </TableRow>
            ) : candidates.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={visibleColumns.length}
                  className="text-center py-4"
                >
                  No hiring Requests found
                </TableCell>
              </TableRow>
            ) : (
              candidates.map((candidate: any) => (
                <TableRow key={candidate.hiringRequestId}>
                  {visibleColumns.map((column) => (
                    <TableCell key={`${candidate.id}-${column.id}`}>
                      { column.id === "hrqId" ? (
                        <h2
                          className="text-green-600 hover:cursor-pointer underline"
                          onClick={() =>
                            router.push(
                              `/home/hiring-details?hrqid=${candidate.hrqId}`
                            )
                          }
                        >
                          {candidate.hrqId}
                        </h2>
                      ) :
                      
                      column.id === "partnerAssignedDate" ? (
                        <div>{formatDate(candidate.partnerAssignedDate)}</div>
                      ) : column.id === "hiringStatusName" ? (
                           <StatusBadge
                            status={candidate.hiringStatusName as any}
                          />
                      ): column.id === "partnerAction" ? (
                            <div className="flex items-center gap-2" >
                          <TooltipWrapper content="Edit">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button disabled={candidate.isProxyPartner} variant="outline" className="h-8 p-2">
                                  <Menu className="h-4 w-4 mr-1" />
                                  <ChevronDown className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent
                                  align="end"
                                  className="w-[160px] hover:cursor-pointer"
                              >
                                <DropdownMenuItem
                                      onClick={() =>
                                        router.push(
                                          `/home/candidate-management/create-candidate?hrqid=${candidate.hrqId}`
                                        )
                                      }
                                    >
                                      <PlusIcon className="h-4 w-4 text-green-700" />
                                      Add Candidate
                                    </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TooltipWrapper>
                        </div>
                      )
                      
                      : column.id === "actions" ? (
                        <div className="flex items-center gap-2">
                          <TooltipWrapper content="Edit">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="outline" className="h-8 p-2">
                                  <Menu className="h-4 w-4 mr-1" />
                                  <ChevronDown className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent
                                align="end"
                                className="w-[160px]"
                              >
                                <DropdownMenuItem
                                  onClick={() =>
                                    handleUnassign(
                                      parseInt(candidate.hiringRequestId)
                                    )
                                  }
                                  className="h-8 text-red-600 hover:text-red-700"
                                >
                                  <X className="h-4 w-4 mr-2" />
                                  Unassign
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TooltipWrapper>
                        </div>
                      ) : (
                        candidate[column.id as keyof Candidate]
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        <div className="flex items-center justify-between p-4">
          <div className="text-sm text-gray-500">
            Page {currentPageNumber} of {totalPages}
          </div>
       <Pagination
            value={pageSize}
            totalEntry={getHiringDetails?.data.totalCount}
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
