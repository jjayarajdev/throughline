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
import { ArrowDownIcon, ArrowUpIcon } from "lucide-react";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Hiring } from "@/services/api/hiring.api";
import { format } from "date-fns";
import { StatusBadge } from "@/components/status-badge";
import TableSkeletonLoader from "@/components/skelton/TableSkelton";
import RoundDropdown from "@/components/form-fields/Dropdown";
import { useDebounce } from "@/lib/useDebounce";
import { slotApi } from "@/services/api/slot.api";
import { ErrorHandler } from "@/components/error/ErrorHandler";
import {
  EnumType,
  InterviewFilterOptions,
  SLOT_STATUS,
  SLOT_STATUS_CONFIG,
} from "@/constants/slot-status";
import { useEffect } from "react";
import { CandidateDetailsTypes, Column, SortConfig } from "./types";
import { ScreeningSheet } from "./sheets/Screeningsheet";
import { InterviewSheet } from "./sheets/InterviewSheet";
import ColumnsPopover from "@/components/common/PopoverColumns";
import { cn } from "@/lib/utils";
import {
  formatDate,
  getTatHours,
  isAfterDateTime,
  sortData,
  tatFormat,
} from "@/helpers/helper";
import Pagination from "../common/Pagination";
import SearchFilter from "../common/SearchFilter";
import { FilterTypeEnum, SlotAllocationType } from "@/constants/FilterTypeEnum";
import { useUserStore } from "@/store/userStore";
import { useRouter } from "next/navigation";
import { PartnerConfirmsheet } from "./sheets/ParnterConfirmsheet";
import { DateRange } from "react-day-picker";
import { DateRangePicker } from "../form-fields/DateRangePicker";

export default function PanelScheduled() {
  const slotStatusTypeId = SlotAllocationType.scheduled;

  const buttonName =
    SLOT_STATUS_CONFIG[slotStatusTypeId as keyof typeof SLOT_STATUS_CONFIG]
      .actionButton;

  const pageName =
    SLOT_STATUS_CONFIG[slotStatusTypeId as keyof typeof SLOT_STATUS_CONFIG]
      .title;

  const [columns, setColumns] = useState<Column[]>([
    { id: "hrqId", label: "HRQ ID", visible: true, sortable: true },
    {
      id: "candidateCode",
      label: "Candidate ID",
      visible: true,
      sortable: true,
    },
    { id: "candidateName", label: "Candidate Name", visible: true, sortable: false },
    {
      id: "jobTitle",
      label: "Role Hired For",
      visible: true,
      sortable: false,
    },
    {
      id: "date",
      label: "Interview Date",
      visible: pageName !== "Assign Slot",
      sortable: true,
    },
    {
      id: "time",
      label: "Time",
      visible: pageName !== "Assign Slot",
      sortable: false,
    },

    { id: "phone", label: "Contact", visible: true, sortable: false },
    {
      id: "interviewModeName",
      label: "Mode of Interview",
      visible: true,
      sortable: false,
    },
    {
      id: "currentRoundName",
      label: "Round Name",
      visible: true,
      sortable: false,
    },
    { id: "noticePeriod", label: "Notice", visible: true, sortable: false },

    {
      id: "rejectionCount",
      label: "Declined",
      visible: pageName === "Declined",
      sortable: false,
    },

    { id: "tatDate", label: "TAT(days)", visible: true, sortable: false },

    {
      id: "rescheduleCount",
      label: "Reschedule Count",
      visible: pageName == "Assign Slot",
      sortable: false,
    },
    // {
    //   id: "actions",
    //   label: "Action",
    //   visible: true,
    //   sortable: false,
    // },
  ]);
  const { userId } = useUserStore();
  const [sortConfig, setSortConfig] = useState<SortConfig>({
    key: "",
    direction: "desc",
  });
  const [searchText, setSearchText] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
    const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const debouncedSearch = useDebounce(searchText, 300);
  const [searchColumn, setSearchColumn] = useState("HrqId");
  const [pageSize, setPageSize] = useState(50);
  const [interviewFilter, setInterviewFilter] = useState(3);
  const {
    data: interviewListdata,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: [
      "interviewListData",
      currentPage,
      debouncedSearch,
      searchColumn,
      slotStatusTypeId,
      interviewFilter,
      pageSize,dateRange
    ],
    queryFn: () =>
      slotApi.getInterviewLists(
        {
          pageNumber: currentPage,
          pageSize,
          searchColumn,
          searchText: debouncedSearch || undefined,
          startDate: dateRange?.from || null,
          endDate: dateRange?.to  || null,
          slotStatusTypeId: slotStatusTypeId,
        }
      ),
      refetchOnWindowFocus: true,
      refetchInterval: 30000,
  });

  useEffect(() => {
    // refetch();
  }, [interviewFilter]);

  const toggleColumn = (columnId: string) => {
    setColumns(
      columns.map((col) =>
        col.id === columnId ? { ...col, visible: !col.visible } : col
      )
    );
  };

  const handleSort = (key: keyof CandidateDetailsTypes) => {
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

  const visibleColumns = columns.filter((col) => col.visible);

  const getSortIcon = (columnId: keyof CandidateDetailsTypes) => {
    // if (!sortConfig || sortConfig.key !== columnId) {
    //   return null;
    // }
    return sortConfig?.direction === "asc" && sortConfig?.key === columnId ? (
      <ArrowUpIcon className="h-4 w-4 ml-1" />
    ) : (
      <ArrowDownIcon className="h-4 w-4 ml-1" />
    );
  };

  const screeningData = interviewListdata?.data?.items || [];
  const sortedDate = sortData(screeningData, sortConfig || undefined);
  const hasPrevious = interviewListdata?.data.hasPrevious;
  const hasNext = interviewListdata?.data.hasNext;
  const totalPages = interviewListdata?.data.totalPages;
  const currentPageNumber = interviewListdata?.data.currentPage;
  const [selectedCandidate, setSelectedCandidate] =
    useState<CandidateDetailsTypes | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  useEffect(() => {
    refetch();
  }, [slotStatusTypeId]);

  const handleOpenSheet = (data: CandidateDetailsTypes) => {
    setSelectedCandidate(data);
    setIsSheetOpen(true);
  };

  const handleCloseSheet = () => {
    setIsSheetOpen(false);
    setSelectedCandidate(null);
  };

  const handleClear = () => {
    setSearchColumn("");
    setSearchText("");
    setCurrentPage(1);
  };
  const handleFilterChange = (column: string, text: string) => {
    setSearchColumn(column);
    setSearchText(text);
  };

  if (error) {
    return <ErrorHandler error={error} />;
  }
  const router = useRouter();
  return (
    <div className="p-2">
      <h1 className="text-xl font-semibold mb-6">
        {pageName || "Interview List"}
      </h1>

      <div className="flex items-center justify-between mb-8">
        <SearchFilter
          filterType={FilterTypeEnum.CMSGrid}
          onFilterChange={handleFilterChange}
          onClear={handleClear}
          placeholder="Search by"
          setCurrentPage={setCurrentPage}
        />
        <div className="flex">
            <DateRangePicker
            value={dateRange}
            onChange={setDateRange}
            disabled={false}
            maxDate={new Date()}
            minDate={new Date(2023, 0, 1)}
            placeholder="Select date range"
          />
          <RoundDropdown
            defaultLabel="Today's Interview"
            options={InterviewFilterOptions}
            onSelect={(e) => setInterviewFilter(Number(e.id))}
          />

          <ColumnsPopover
            columns={columns}
            toggleColumn={toggleColumn}
            screeningData={screeningData}
            buttonName={buttonName}
          />
        </div>
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
                    onClick={() =>
                      column.sortable &&
                      handleSort(column.id as keyof CandidateDetailsTypes)
                    }
                  >
                    <div className="flex items-center">
                      {column.label}
                      {column.sortable &&
                        getSortIcon(column.id as keyof CandidateDetailsTypes)}
                    </div>
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {screeningData.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={visibleColumns.length}
                    className="text-center py-4"
                  >
                    No data found
                  </TableCell>
                </TableRow>
              ) : (
                sortedDate?.map((data: any) => (
                  <TableRow key={data.candidateId}>
                    {visibleColumns?.map((column) => (
                      <TableCell
                        className={cn(
                          getTatHours(data.tatDate) > EnumType.tat &&
                            " text-black"
                        )}
                        key={`${data.id}-${column.id}`}
                      >
                        {column.id === "hrqId" ? (
                          <h2
                            className="text-green-600 hover:cursor-pointer"
                            onClick={() =>
                              router.push(
                                `/home/hiring-details?hrqid=${data.hrqId}`
                              )
                            }
                          >
                            {data.hrqId}
                          </h2>
                        ):column.id === "candidateCode" ? (
                          <h2
                            className="text-green-600 hover:cursor-pointer"
                            onClick={() =>
                              router.push(
                                `/home/candidate-management/candidate-profile?id=${data?.candidateCode}`
                              )
                            }
                          >
                            {data?.candidateCode}
                          </h2>
                        ) : column.id === "status" ? (
                          <StatusBadge status={data.currentRoundName as any} />
                        ) : column.id === "date" ? (
                          <>{data?.date && <p>{formatDate(data?.date)}</p>}</>
                        ) : column.id === "time" ? (
                          <>{data?.time && <p>{data?.time?.slice(0, 5)}</p>}</>
                        ) : column.id === "tatDate" ? (
                          <>
                             <div
                                className={cn(
                                  getTatHours(data?.tatDate) > EnumType.tat &&
                                    "text-red-500"
                                )}
                              >
                                {tatFormat(data?.tatDate)}
                              </div>
                          </>
                        ) : column.id === "actions" ? (
                          <div className="flex items-center gap-2">
                            <Button
                              variant="hpButton"
                              size="sm"
                              disabled={
                                !isAfterDateTime(data?.date, data?.time)
                              }
                              onClick={() => handleOpenSheet(data)}
                            >
                              confirm
                            </Button>
                          </div>
                        ) : (
                          data[column.id as keyof Hiring]
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
            totalEntry={interviewListdata?.data.totalCount}
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
      {selectedCandidate && (
        <PartnerConfirmsheet
          isOpen={isSheetOpen}
          onClose={handleCloseSheet}
          selectedCandidate={selectedCandidate}
        />
      )}
    </div>
  );
}
