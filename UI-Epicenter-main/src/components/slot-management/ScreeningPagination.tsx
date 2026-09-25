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
import { ArrowDownIcon, ArrowUpIcon, Dot } from "lucide-react";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Hiring } from "@/services/api/hiring.api";
import TableSkeletonLoader from "@/components/skelton/TableSkelton";
import { useDebounce } from "@/lib/useDebounce";
import { slotApi } from "@/services/api/slot.api";
import { ErrorHandler } from "@/components/error/ErrorHandler";
import { ResumePreview } from "../common/ResumePreview";
import { ScreeningSheet } from "./sheets/Screeningsheet";
import { CandidateDetailsTypes, Column, SortConfig } from "./types";
import { EnumType, InterviewFilterOptions } from "@/constants/slot-status";
import ColumnsPopover from "@/components/common/PopoverColumns";
import { cn } from "@/lib/utils";
import { getTatHours, sortData, tatFormat } from "@/helpers/helper";
import { InterviewSheet } from "./sheets/InterviewSheet";
import Pagination from "../common/Pagination";
import {
  isDomainManager,
  isHiringManager,
  isPartner,
  useUserStore,
} from "@/store/userStore";
import SearchFilter from "../common/SearchFilter";
import { FilterTypeEnum } from "@/constants/FilterTypeEnum";
import { useRouter } from "next/navigation";
import { Switch } from "../ui/switch";
import { Label } from "../ui/label";
import { SplitNames } from "../common/SplitNames";
import RoundDropdown from "../form-fields/Dropdown";
import type { DateRange } from "@/components/form-fields/DateRangePicker";
import { DateRangePicker } from "../form-fields/DateRangePicker";

export default function ScreeningPagination() {
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
    },
    {
      id: "jobTitle",
      label: "Role Hired For",
      visible: true,
    },
    ...(isPartner
      ? []
      : [
          {
            id: "nickname" as const,
            label: "Partner",
            visible: true,
          },
        ]),

    {
      id: "currentRoundName",
      label: "Round Name",
      visible: true,
    },
    { id: "panelNames", label: "Panel", visible: false },
    { id: "noticePeriod", label: "Notice", visible: true },
    { id: "phone", label: "Contact", visible: true },
    {
      id: "interviewModeName",
      label: "Mode of Interview",
      visible: true,
    },
    { id: "resume", label: "Resume", visible: true },
    { id: "tatDate", label: "TAT(days)", visible: true },
    ...(isPartner
      ? []
      : [
          {
            id: "actions" as const,
            label: "Action",
            visible: true,
          },
        ]),
  ]);

  const [sortConfig, setSortConfig] = useState<SortConfig>({
    key: "",
    direction: "desc",
  });
  const [searchText, setSearchText] = useState("");

  const [currentPage, setCurrentPage] = useState(1);
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const debouncedSearch = useDebounce(searchText, 300);
  const [searchColumn, setSearchColumn] = useState("HrqId");
  const [isScreening, setIsScreening] = useState(true);
  const [durationId, setDurationId] = useState(0);
  const [pageSize, setPageSize] = useState(50);
  const { userId } = useUserStore();
  const [isSelf, setIsSelf] = useState(true);
  const {
    data: screeningdata,
    isLoading,
    error,
  } = useQuery({
    queryKey: [
      "screeningData",
      currentPage,
      searchColumn,
      debouncedSearch,
      isScreening,
      pageSize,
      isSelf,
      durationId,
      dateRange,
    ],
    queryFn: () =>
      slotApi.getScreeningList({
        pageNumber: currentPage,
        pageSize,
        searchColumn,
        searchText: debouncedSearch || undefined,
        startDate: dateRange?.from || null,
        endDate: dateRange?.to || null,
        isSelf: isSelf,
        isScreening: isScreening,
      }),
    retry: 1,
    enabled: !!userId,
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

  const screeningData = screeningdata?.data?.items || [];
  const hasPrevious = screeningdata?.data?.hasPrevious;
  const hasNext = screeningdata?.data?.hasNext;
  const totalPages = screeningdata?.data?.totalPages;
  const currentPageNumber = screeningdata?.data?.currentPage;
  const [selectedCandidate, setSelectedCandidate] =
    useState<CandidateDetailsTypes | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  const handleOpenSheet = (data: CandidateDetailsTypes) => {
    if (!data) return; // Add guard clause
    setSelectedCandidate(data);
    setIsSheetOpen(true);
  };

  const handleCloseSheet = () => {
    setIsSheetOpen(false);
    setSelectedCandidate(null);
  };
  const sortedData = sortData(screeningData, sortConfig || undefined);

  const getSheetComponent = () => {
    if (!selectedCandidate) return null;
    const interviewMode = selectedCandidate.interviewModeName?.toLowerCase();

    switch (interviewMode) {
      case "profile review":
      case "phone call":
      case "online link":
      case "online exercise":
      case "coding exercise":
        return (
          <ScreeningSheet
            isOpen={isSheetOpen}
            onClose={handleCloseSheet}
            selectedCandidate={selectedCandidate}
          />
        );
      case "in-person":
      case "virtual":
        return (
          <InterviewSheet
            isEdit={false}
            isOpen={isSheetOpen}
            onClose={handleCloseSheet}
            selectedCandidate={selectedCandidate}
          />
        );
    }
  };
  const handleFilterChange = (column: string, text: string) => {
    setSearchColumn(column);
    setSearchText(text);
  };
  const handleClear = () => {
    setSearchColumn("");
    setSearchText("");
    setCurrentPage(1);
  };
  if (error) {
    <ErrorHandler error={error} />;
  }
  const router = useRouter();
  return (
    <div className="p-2">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold">Screening/Assessment</h1>
        {(isHiringManager || isDomainManager) && (
          <div className="flex items-center space-x-2">
            <Switch
              id="assigned-mode"
              checked={isSelf}
              onCheckedChange={setIsSelf}
              className="data-[state=checked]:bg-[#0958d9] data-[state=checked]:border-[#0958d9] dark:data-[state=checked]:bg-[#00cc99] dark:data-[state=checked]:border-[#00cc99]"
            />
            <Label
              htmlFor="assigned-mode"
              className="text-sm font-medium text-[#0958d9] dark:text-[#00cc99]"
            >
              {isSelf ? "Self" : "Team"}
            </Label>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between mb-8">
        <SearchFilter
          filterType={FilterTypeEnum.Evaluation_Screening}
          onFilterChange={handleFilterChange}
          onClear={handleClear}
          placeholder="Search by"
          setCurrentPage={setCurrentPage}
        />
        <div className="flex items-center gap-2">
          {/* {(isHiringManager || isDomainManager) && (
            <div className="flex items-center space-x-2">
              <Switch
                id="assigned-mode"
                checked={isSelf}
                onCheckedChange={setIsSelf}
                className="data-[state=checked]:bg-[#0958d9] data-[state=checked]:border-[#0958d9] dark:data-[state=checked]:bg-[#00cc99] dark:data-[state=checked]:border-[#00cc99]"
              />
              <Label
                htmlFor="assigned-mode"
                className="text-sm font-medium text-[#0958d9] dark:text-[#00cc99]"
              >
                {isSelf ? "Self" : "Team"}
              </Label>
            </div>
          )} */}
          <div className="flex items-center space-x-2">
            <Switch
              id="assigned-mode"
              checked={isScreening}
              onCheckedChange={setIsScreening}
              className="data-[state=checked]:bg-[#0958d9] data-[state=checked]:border-[#0958d9] dark:data-[state=checked]:bg-[#00cc99] dark:data-[state=checked]:border-[#00cc99]"
            />
            <Label
              htmlFor="assigned-mode"
              className="text-sm font-medium text-[#0958d9] dark:text-[#00cc99] flex items-center gap-1"
            >
              <span>{isScreening ? "Screening" : "Assessment"}</span>
              <span className="inline-flex items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800 px-2 py-0.5 text-xs">
                {screeningdata?.data?.totalCount || 0}
              </span>
            </Label>
          </div>
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
            buttonName="screening"
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
                    No candidate found
                  </TableCell>
                </TableRow>
              ) : (
                sortedData?.map((data: any) => (
                  <TableRow key={data?.candidateId}>
                    {visibleColumns?.map((column) => (
                      <TableCell key={`${data?.candidateId}-${column.id}`}>
                        {column.id === "hrqId" ? (
                          <h2
                            className="text-green-600 hover:cursor-pointer"
                            onClick={() =>
                              router.push(
                                `/home/hiring-details?hrqid=${data?.hrqId}`
                              )
                            }
                          >
                            {data?.hrqId}
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
                        ) : column.id === "panelNames" ? (
                          <>
                            <SplitNames names={data?.panelNames} />
                          </>
                        ) : column.id === "resume" ? (
                          <>
                            {data?.resume?.attachmentURL && (
                              <ResumePreview
                                url={data?.resume?.attachmentURL}
                                fileName={`${data?.candidateName}'s Resume`}
                              />
                            )}
                          </>
                        ) : column.id === "tatDate" ? (
                          <>
                            {data?.tatDate && (
                              <div
                                className={cn(
                                  getTatHours(data?.tatDate) > EnumType.tat &&
                                    "text-red-500"
                                )}
                              >
                                {tatFormat(data?.tatDate)}
                              </div>
                            )}
                          </>
                        ) : column.id === "actions" ? (
                          <div className="flex items-center gap-2">
                            <Button
                              disabled={data?.isSlotAssigned}
                              variant={
                                data?.isSlotAssigned ? "hpPending" : "hpButton"
                              }
                              size="sm"
                              onClick={() => handleOpenSheet(data)}
                            >
                              {data?.isSlotAssigned ? "Pending" : "Manage"}
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
            totalEntry={screeningdata?.data.totalCount}
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
