"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { StatusBadge } from "@/components/status-badge";
import TableSkeletonLoader from "@/components/skelton/TableSkelton";
import RoundDropdown from "@/components/form-fields/Dropdown";
import { useDebounce } from "@/lib/useDebounce";
import { slotApi } from "@/services/api/slot.api";
import { ErrorHandler } from "@/components/error/ErrorHandler";
import {
  EnumType,
  InterviewFilterOptions,
  PARTNER_SLOT_STATUS,
  PARTNER_SLOT_STATUS_CONFIG,
} from "@/constants/slot-status";
import { CandidateDetailsTypes, Column, SortConfig } from "./types";
import ColumnsPopover from "@/components/common/PopoverColumns";
import { useUserStore } from "@/store/userStore";
import { ParnterSlotsheet } from "./sheets/Parnterslotsheet";
import { PartnerConfirmsheet } from "./sheets/ParnterConfirmsheet";
import { cn } from "@/lib/utils";
import Pagination from "../common/Pagination";
import {
  formatDate,
  getTatHours,
  isAfterDateTime,
  sortData,
  tatFormat,
} from "@/helpers/helper";
import { useRouter } from "next/navigation";
import SearchFilter from "../common/SearchFilter";
import { FilterTypeEnum } from "@/constants/FilterTypeEnum";
import type { DateRange } from "@/components/form-fields/DateRangePicker";
import { DateRangePicker } from "../form-fields/DateRangePicker";

export default function PartnerSlotPagination({
  slotStatusTypeId,
}: {
  slotStatusTypeId: number;
}) {
  const [columns, setColumns] = useState<Column[]>([
    { id: "hrqId", label: "HRQ ID", visible: true, sortable: true },
    {
      id: "candidateCode",
      label: "Candidate ID",
      visible: true,
      sortable: true,
    },
    { id: "candidateName", label: "Candidate Name", visible: true },
    {
      id: "jobTitle",
      label: "Role Hired For",
      visible: true,
    },
    { id: "nickname", label: "Partner", visible: true },
    { id: "date", label: "Interview Date", visible: true },
    { id: "time", label: "Interview Time", visible: true, sortable: true },
    { id: "phone", label: "Contact", visible: true },
    { id: "status", label: "Round Name", visible: true, sortable: false },
    { id: "noticePeriod", label: "Notice", visible: true },
    { id: "tatDate", label: "TAT(days)", visible: true },
    {
      id: "actions",
      label: "Action",
      visible: true,
      sortable: false,
    },
  ]);

  const { partnerId } = useUserStore();

  const [sortConfig, setSortConfig] = useState<SortConfig>({
    key: "",
    direction: "desc",
  });
  const [searchText, setSearchText] = useState("");

  const [currentPage, setCurrentPage] = useState(1);
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const debouncedSearch = useDebounce(searchText, 300);
  const [searchColumn, setSearchColumn] = useState("HrqId");
  const ispartnerId = partnerId === null ? 0 : Number(partnerId);
  const [pageSize, setPageSize] = useState(50);
  const [durationId, setDurationId] = useState(0);
  const userId = useUserStore((state) => state.userId);
  const {
    data: partnerSlotData,
    error,
    isPending,
    refetch,
  } = useQuery({
    queryKey: [
      "partnerSlot",
      currentPage,
      searchColumn,
      debouncedSearch,
      slotStatusTypeId,
      pageSize,
      durationId,
      dateRange,
    ],
    queryFn: () =>
      slotApi.getPartnerSlot(
        slotStatusTypeId,
        ispartnerId,
        {
          pageNumber: currentPage,
          pageSize,
          searchColumn,
          searchText: debouncedSearch || undefined,
          startDate: dateRange?.from || null,
          endDate: dateRange?.to || null,
        },
        durationId
      ),
    enabled: true,
    refetchOnWindowFocus: true,
    refetchInterval: 30000,
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
  const sortedData = sortData(
    partnerSlotData?.data?.items || [],
    sortConfig || undefined
  );
  // const sortedData = partnerSlotData?.data?.items || [];
  const hasPrevious = partnerSlotData?.data.hasPrevious;
  const hasNext = partnerSlotData?.data.hasNext;
  const totalPages = partnerSlotData?.data.totalPages;
  const currentPageNumber = partnerSlotData?.data.currentPage;
  const [selectedCandidate, setSelectedCandidate] =
    useState<CandidateDetailsTypes | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  // useEffect(() => {
  //   refetch();
  //   setCurrentPage(1);
  //   setSearchText("");
  // }, [slotStatusTypeId,refetch]);

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
      case PARTNER_SLOT_STATUS.ASSIGN_SLOT:
        return (
          selectedCandidate && (
            <ParnterSlotsheet
              isOpen={isSheetOpen}
              onClose={handleCloseSheet}
              selectedCandidate={selectedCandidate}
            />
          )
        );
      case PARTNER_SLOT_STATUS.SCHEDULED:
        return (
          selectedCandidate && (
            <PartnerConfirmsheet
              isOpen={isSheetOpen}
              onClose={handleCloseSheet}
              selectedCandidate={selectedCandidate}
            />
          )
        );
    }
  };
  const buttonName =
    PARTNER_SLOT_STATUS_CONFIG[
      slotStatusTypeId as keyof typeof PARTNER_SLOT_STATUS_CONFIG
    ].actionButton;
  const handleFilterChange = (column: string, text: string) => {
    setSearchColumn(column);
    setSearchText(text);
  };
  const handleClear = () => {
    setSearchColumn("");
    setSearchText("");
    setCurrentPage(1);
  };
  if (error) return <ErrorHandler error={error} />;
  const router = useRouter();
  return (
    <div className="p-2">
      <h1 className="text-xl font-semibold mb-6">
        {
          PARTNER_SLOT_STATUS_CONFIG[
            slotStatusTypeId as keyof typeof PARTNER_SLOT_STATUS_CONFIG
          ].title
        }
      </h1>

      <div className="flex items-center justify-between mb-8">
        <SearchFilter
          filterType={FilterTypeEnum.Evaluation_Screening}
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
            onSelect={(e) =>
             setDurationId(Number(Number(e.id)))
            }
          /> */}
          <ColumnsPopover
            columns={columns}
            toggleColumn={toggleColumn}
            screeningData={sortedData}
            buttonName={buttonName}
          />
        </div>
      </div>
      <div className="bg-gray-50 dark:bg-gray-900 rounded-lg shadow">
        {isPending ? (
          <TableSkeletonLoader />
        ) : (
          <Table key={`table-${slotStatusTypeId}`}>
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
              {sortedData.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={visibleColumns.length}
                    className="text-center py-4"
                  >
                    No data found
                  </TableCell>
                </TableRow>
              ) : (
                sortedData?.map((data: any) => (
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
                                `/home/candidate-management/candidate-profile?id=${data.candidateCode}`
                              )
                            }
                          >
                            {data.candidateCode}
                          </h2>
                        ) : column.id === "status" ? (
                          <StatusBadge status={data.currentRoundName as any} />
                        ) : column.id === "date" ? (
                          <>{data?.date && <p>{formatDate(data?.date)}</p>}</>
                        ) : column.id === "time" ? (
                          <p>{data?.time}</p>
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
                                !isAfterDateTime(data?.date, data?.time) &&
                                slotStatusTypeId === 2
                              }
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
            totalEntry={partnerSlotData?.data.totalCount}
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
