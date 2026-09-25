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
import { StatusBadge } from "@/components/status-badge";
import TableSkeletonLoader from "@/components/skelton/TableSkelton";
import { useDebounce } from "@/lib/useDebounce";
import { slotApi } from "@/services/api/slot.api";
import { ErrorHandler } from "@/components/error/ErrorHandler";
import { ResumePreview } from "../common/ResumePreview";
import { ScreeningSheet } from "./sheets/Screeningsheet";
import { CandidateDetailsTypes, SortConfig } from "./types";
import { EnumType, InterviewFilterOptions } from "@/constants/slot-status";
import ColumnsPopover from "@/components/common/PopoverColumns";
import { cn } from "@/lib/utils";
import { getTatHours, sortData, tatFormat } from "@/helpers/helper";
import Pagination from "../common/Pagination";
import SearchFilter from "../common/SearchFilter";
import { FilterTypeEnum } from "@/constants/FilterTypeEnum";
import { useRouter } from "next/navigation";
import { useUserStore } from "@/store/userStore";
import { SplitNames } from "../common/SplitNames";
import RoundDropdown from "../form-fields/Dropdown";

export default function UnAllooatedCandidate() {
  const [columns, setColumns] = useState<any[]>([
    { id: "hrqId", label: "HRQ ID", visible: true ,sortable: true,},
    {
      id: "candidateCode",
      label: "Candidate ID",
      visible: true,
      sortable: true,
    },
     { id: "phone", label: "Contact", visible: true, sortable: false },
    { id: "noticePeriod", label: "Notice", visible: true, sortable: true },
    { id: "candidateName", label: "Candidate Name", visible: true, sortable: false },
    { id: "panelNames", label: "Panel", visible: false, sortable: false },
    {
      id: "jobTitle",
      label: "Role Hired For",
      visible: true,
      sortable: false,
    },
    // { id: "nickname", label: "Partner", visible: true, sortable: false },
    {
      id: "currentRoundName",
      label: "Current Round",
      visible: true,
      sortable: false,
    },
    {
      id: "interviewModeName",
      label: "Mode of Interview",
      visible: true,
      sortable: false,
    },

    // { id: "resume", label: "Resume", visible: true, sortable: false },
    { id: "tatDate", label: "TAT(days)", visible: true, sortable: false },
    // {
    //   id: "actions",
    //   label: "Action",
    //   visible: false,
    //   sortable: false,
    // },
  ]);

    const [sortConfig, setSortConfig] = useState<SortConfig>({
    key: "",
    direction: "desc",
  });
  const [searchText, setSearchText] = useState("");
  const { userId } = useUserStore();
  const [currentPage, setCurrentPage] = useState(1);

  const debouncedSearch = useDebounce(searchText, 300);
  const [searchColumn, setSearchColumn] = useState("HrqId");
  const [pageSize, setPageSize] = useState(50);
  const [durationId, setDurationId] = useState(0);
  const {
    data: completedData,
    isLoading,
    error,
  } = useQuery({
    queryKey: [
      "unallocatedCandidate",
      currentPage,
      debouncedSearch,
      searchColumn,
      pageSize,durationId
    ],
    queryFn: () =>
      slotApi.getUnallocatedCandidate({
        pageNumber: currentPage,
        pageSize,
        searchColumn,
        searchText: debouncedSearch || undefined,
      },durationId),
    retry: 1,
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
     return (sortConfig?.direction === "asc"&& sortConfig?.key ===columnId) ? (
      <ArrowUpIcon className="h-4 w-4 ml-1" />
    ) : (
      <ArrowDownIcon className="h-4 w-4 ml-1" />
    );
  };

  const screeningData = completedData?.data?.items || [];
  const sortedScreenData = sortData(screeningData, sortConfig || undefined);
  const hasPrevious = completedData?.data.hasPrevious;
  const hasNext = completedData?.data.hasNext;
  const totalPages = completedData?.data.totalPages;
  const currentPageNumber = completedData?.data.currentPage;
  const [selectedCandidate, setSelectedCandidate] =
    useState<CandidateDetailsTypes | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  const handleOpenSheet = (data: CandidateDetailsTypes) => {
    if (!data) return; // Add guard clause
    setSelectedCandidate(data);
    setIsSheetOpen(true);
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
    <ErrorHandler error={error} />;
  }
  const router = useRouter();
  return (
    <div className="">
      <h1 className="text-lg font-semibold mb-2">Awaiting Slot</h1>
      <div className="flex items-center justify-between mb-4">
        <SearchFilter
          filterType={FilterTypeEnum.Evaluation_Completed}
          onFilterChange={handleFilterChange}
          onClear={handleClear}
          placeholder="Search by"
          setCurrentPage={setCurrentPage}
        />
         <div className="flex">
      <RoundDropdown
            defaultLabel="Today's Interview"
            options={InterviewFilterOptions}
            onSelect={(e) =>
             setDurationId(Number(Number(e.id)))
            }
          />
        <ColumnsPopover
          columns={columns}
          toggleColumn={toggleColumn}
          screeningData={screeningData}
          buttonName="completed"
        />
        </div>
      </div>
      <div className="bg-gray-50 dark:bg-gray-900 rounded-lg shadow">
        {isLoading ? (
          <TableSkeletonLoader />
        ) : (
          <Table >
            <TableHeader>
              <TableRow className="bg-teal-200 text-sm dark:bg-gray-700">
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
                    No Candidate found
                  </TableCell>
                </TableRow>
              ) : (
                sortedScreenData?.map((data: any) => (
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
                        ) : column.id === "hiringStatusName" ? (
                          <StatusBadge status={data.hiringStatusName as any} />
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
                          <>
                            <Button
                              variant="hpButton"
                              size="sm"
                              onClick={() =>
                                router.push(
                                  `candidate-feedback-review?candidateId=${data.candidateId}`
                                )
                              }
                            >
                              Review Feedback
                            </Button>
                          </>
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
            totalEntry={completedData?.data.totalCount}
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
        <ScreeningSheet
          isOpen={isSheetOpen}
          onClose={() => {
            setIsSheetOpen(false);
            setSelectedCandidate(null); // Clear selected candidate on close
          }}
          selectedCandidate={selectedCandidate}
        />
      )}
    </div>
  );
}
