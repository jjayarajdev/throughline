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
import { formatDate, getTatHours, sortData, tatFormat } from "@/helpers/helper";
import Pagination from "../common/Pagination";
import SearchFilter from "../common/SearchFilter";
import { useUserStore } from "@/store/userStore";
import { useRouter } from "next/navigation";
import { SplitNames } from "../common/SplitNames";
import { DateRange } from "react-day-picker";
import { DateRangePicker } from "../form-fields/DateRangePicker";

export default function InterviewListPagination({
  slotStatusTypeId,
  filterType,
}: {
  slotStatusTypeId: number;
  filterType: number;
}) {
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
    {
      id: "candidateName",
      label: "Candidate Name",
      visible: true,
      sortable: true,
    },
    {
      id: "jobTitle",
      label: "Role Hired For",
      visible: true,
      sortable: false,
    },
    { id: "nickname", label: "Partner", visible: true, sortable: false },
    { id: "panelNames", label: "Panel", visible: false, sortable: false },
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

    {
      id: "actions",
      label: "Action",
      visible: true,
      sortable: false,
    },
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
  const [searchColumn, setSearchColumn] = useState("CandidateCode");
  const [pageSize, setPageSize] = useState(50);
  const [durationId, setDurationId] = useState(0);
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
      durationId,
      pageSize,
      dateRange,
    ],
    queryFn: () =>
      slotApi.getInterviewLists({
        pageNumber: currentPage,
        pageSize,
        searchColumn,
        searchText: debouncedSearch || undefined,
        startDate: dateRange?.from || null,
        endDate: dateRange?.to || null,
        slotStatusTypeId: slotStatusTypeId,
      }),
    refetchOnWindowFocus: true,
    // refetchInterval: 30000,
  });

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
  const sorteddCandidates = sortData(screeningData, sortConfig || undefined);
  const hasPrevious = interviewListdata?.data.hasPrevious;
  const hasNext = interviewListdata?.data.hasNext;
  const totalPages = interviewListdata?.data.totalPages;
  const currentPageNumber = interviewListdata?.data.currentPage;
  const [selectedCandidate, setSelectedCandidate] =
    useState<CandidateDetailsTypes | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  useEffect(() => {
    if (slotStatusTypeId) {
      refetch();
    }
  }, [slotStatusTypeId]);

  const handleOpenSheet = (data: CandidateDetailsTypes) => {
    setSelectedCandidate(data);
    setIsSheetOpen(true);
  };

  const handleCloseSheet = () => {
    setIsSheetOpen(false);
    setSelectedCandidate(null);
  };

  const getSheetComponent = () => {
    switch (slotStatusTypeId) {
      case SLOT_STATUS.ASSIGN_SLOT:
        return (
          selectedCandidate && (
            <InterviewSheet
              isEdit={selectedCandidate?.interviewSlotId !== undefined}
              isOpen={isSheetOpen}
              onClose={handleCloseSheet}
              selectedCandidate={selectedCandidate}
            />
          )
        );
      case SLOT_STATUS.PENDING:
        return (
          selectedCandidate && (
            <ScreeningSheet
              isOpen={false}
              onClose={handleCloseSheet}
              selectedCandidate={selectedCandidate}
            />
          )
        );

      case SLOT_STATUS.DECLINED:
        return (
          selectedCandidate && (
            <InterviewSheet
              isEdit={true}
              isOpen={isSheetOpen}
              onClose={handleCloseSheet}
              selectedCandidate={selectedCandidate}
            />
          )
        );
      case SLOT_STATUS.SCHEDULED:
        return (
          selectedCandidate && (
            <InterviewSheet
              isEdit={true}
              isOpen={isSheetOpen}
              onClose={handleCloseSheet}
              selectedCandidate={selectedCandidate}
            />
          )
        );
    }
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
  const router = useRouter();
  return (
    <div className="p-2">
      <h1 className="text-xl font-semibold mb-6">
        {pageName || "Interview List"}
      </h1>

      <div className="flex items-center justify-between mb-8">
        <SearchFilter
          filterType={filterType}
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
          {/* <RoundDropdown
            defaultLabel="Today's Interview"
            options={InterviewFilterOptions}
            onSelect={(e) => setDurationId(Number(Number(e.id)))}
          /> */}

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
        ) : error ? (
          <ErrorHandler error={error} />
        ) : screeningData.length === 0 ? (
          <TableRow>
            <TableCell
              colSpan={visibleColumns.length}
              className="text-center py-4"
            >
              No data found
            </TableCell>
          </TableRow>
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
                sorteddCandidates?.map((data: any) => (
                  <TableRow key={data.candidateId}>
                    {visibleColumns?.map((column) => (
                      <TableCell
                        className={cn(
                          getTatHours(data.tatDate) > EnumType.tat &&
                             "text-black dark:text-white"
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
                        ) : column.id === "candidateCode" ? (
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
                        ) : column.id === "panelNames" ? (
                          <>
                            <SplitNames names={data?.panelNames} />
                          </>
                        ) : column.id === "time" ? (
                          <>{data?.time && <p>{data?.time}</p>}</>
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
                              variant={
                                buttonName !== "Pending"
                                  ? "hpButton"
                                  : "hpPending"
                              }
                              size="sm"
                              onClick={() => handleOpenSheet(data)}
                            >
                              {buttonName}
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
      {getSheetComponent()}
    </div>
  );
}
