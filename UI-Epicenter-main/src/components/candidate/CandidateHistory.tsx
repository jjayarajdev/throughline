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
import { ArrowDownIcon, ArrowUpIcon, Pencil, Plus, Upload } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { StatusBadge } from "@/components/status-badge";
import { useQuery } from "@tanstack/react-query";
import { candidateApi } from "@/services/api/candidate.api";
import Link from "next/link";
import { ResumePreview } from "../common/ResumePreview";
import { ErrorHandler } from "../error/ErrorHandler";
import SearchFilter from "../common/SearchFilter";
import { FilterTypeEnum } from "@/constants/FilterTypeEnum";
import ColumnsPopover from "../common/PopoverColumns";
import { useUserStore } from "@/store/userStore";
import Pagination from "../common/Pagination";
import { dropdownApi } from "@/services/api/master";
import { MasterTypes } from "@/constants/masterTypes";
import RoundDropdown from "../form-fields/Dropdown";
import { sortData } from "@/helpers/helper";

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
  candidateStatusName?: string;
}
interface Column {
  id: keyof Candidate | "actions";
  label: string;
  visible: boolean;
  sortable?: boolean;
}

type SortConfig = {
  key: keyof Candidate;
  direction: "asc" | "desc";
} | null;

export function CandidateHistory() {
  const router = useRouter();
  const partnerId = useUserStore((state) => state.partnerId) || "";
  const [columns, setColumns] = useState<Column[]>([
    { id: "hrqId", label: "HRQID", visible: true },
    { id: "candidateCode", label: "Candidate Code", visible: true },
    { id: "fullName", label: "Candidate Name", visible: true, sortable: true },
    { id: "email", label: "Candidate Email", visible: true },
    { id: "phoneNumber", label: "Candidate Contact", visible: true },
    { id: "jobTitle", label: "Role Hired For", visible: true },
    {
      id: "relevantExperience",
      label: "Experience",
      visible: true,
      sortable: true,
    },
    { id: "resume", label: "Resume", visible: true },
    { id: "nickName", label: "Partner", visible: true },
    { id: "acknowledged", label: "Acknowledged", visible: true },
    { id: "intakeStatusName", label: "Intake Status", visible: true },
    // { id: "candidateStatusName", label: "Candidate Status", visible: true },
   
  ]);

  const [sortConfig, setSortConfig] = useState<SortConfig>(null);
  const [searchText, setSearchText] = useState("");
  const [statusId, setStatusId] = useState<number>(NaN);
  const [searchColumn, setSearchColumn] = useState<string>("HrqId");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);

  const {
    data: candidatesResponse,
    isLoading,
    error,
    refetch: reFetchData,
  } = useQuery({
    queryKey: [
      "candidatesCart",
      currentPage,
      // searchColumn,
      searchText,
      statusId,pageSize
    ],
    queryFn: () =>
      candidateApi.fetchBinCandidateHistory(
        {
          pageNumber: currentPage,
          pageSize,
          searchColumn: searchColumn,
          searchText: searchText || undefined,
        },
        statusId
      ),
    enabled: !!statusId,
    refetchOnWindowFocus: true,
  });

  const { data: CANDIDATE_INTAKE_STATUS = [] } = useQuery({
    queryKey: ["CANDIDATE_INTAKE_STATUS"],
    queryFn: () =>
      dropdownApi.fetchDropdown(MasterTypes.CANDIDATE_INTAKE_STATUS),
    enabled: true,
    select: (data) => [
      ...data.filter(item => item.id !== 15001),
      { masterTypeId: 0, name: "All", id: 1, isActive: true },
    ],
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
    if (!sortConfig || sortConfig.key !== columnId) {
      return null;
    }
     return (sortConfig?.direction === "asc"&& sortConfig?.key ===columnId) ? (
      <ArrowUpIcon className="h-4 w-4 ml-1" />
    ) : (
      <ArrowDownIcon className="h-4 w-4 ml-1" />
    );
  };

  const candidates = candidatesResponse?.data?.items || [];
  const sortedCandidates = sortData(candidates, sortConfig);
  const hasPrevious = candidatesResponse?.data.hasPrevious;
  const hasNext = candidatesResponse?.data.hasNext;
  const totalPages = candidatesResponse?.data.totalPages;
  const currentPageNumber = candidatesResponse?.data.currentPage;

  if (error) return <ErrorHandler error={error} />;

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
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <SearchFilter
          filterType={FilterTypeEnum.CandidateManagement}
             onFilterChange={handleFilterChange}
          onClear={handleClear}
          placeholder="Search by"
          setCurrentPage={setCurrentPage}
        />
        <div className="flex items-center gap-2">
          <RoundDropdown
            options={CANDIDATE_INTAKE_STATUS}
            index={0}
            onSelect={(e) => setStatusId(e?.id)}
          />
          <ColumnsPopover
            columns={columns}
            toggleColumn={toggleColumn}
            screeningData={candidates}
            buttonName="candidate-details"
          />
        </div>
      </div>

      <div className="bg-gray-50 dark:bg-gray-900 rounded-lg shadow">
        <Table className="text-xs">
          <TableHeader>
            <TableRow className="bg-teal-200 dark:bg-gray-700">
              {visibleColumns.map((column,index) => (
                <TableHead
                  key={index}
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
                  No candidates found
                </TableCell>
              </TableRow>
            ) : (
              sortedCandidates.map((candidate) => (
                <TableRow key={candidate.id}>
                  {visibleColumns.map((column) => (
                    <TableCell key={`${candidate.id}-${column.id}`}>
                      {column.id === "hrqId" ? (
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
                      ) : column.id === "resume" ? (
                        candidate.resume?.attachmentURL ? (
                          <ResumePreview
                            url={candidate.resume.attachmentURL}
                            fileName={`${candidate.fullName}'s Resume`}
                          />
                        ) : (
                          <Button variant="ghost" size="sm" className="p-0">
                            <Upload className="h-4 w-4" />
                            Upload
                          </Button>
                        )
                      )  : column.id === "acknowledged" ? (
                        candidate.isAgreedForTermsConditions ? (
                          "Yes"
                        ) : (
                          "No"
                        )
                      ) : column.id === "jobTitle" ? (
                        candidate.jobTitle
                          ?.split(",")
                          .map((title: string, index: number) => (
                            <div key={index}>{title.trim()}</div>
                          ))
                      ) : column.id === "intakeStatusName" ? (
                        <StatusBadge
                          status={candidate.intakeStatusName as any}
                        />
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
            totalEntry={candidatesResponse?.data.totalCount}
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
