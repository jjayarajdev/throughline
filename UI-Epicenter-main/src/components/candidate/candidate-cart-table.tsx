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
  Download,
  Pencil,
  Plus,
  Upload,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { StatusBadge } from "@/components/status-badge";
import { useMutation, useQuery } from "@tanstack/react-query";
import { candidateApi } from "@/services/api/candidate.api";
import Link from "next/link";
import { ResumePreview } from "../common/ResumePreview";
import { ErrorHandler } from "../error/ErrorHandler";
import SearchFilter from "../common/SearchFilter";
import { FilterTypeEnum } from "@/constants/FilterTypeEnum";
import ColumnsPopover from "../common/PopoverColumns";
import { isAdmin, isPartner, isRmowner, isVendorManager, useUserStore } from "@/store/userStore";
import Pagination from "../common/Pagination";
import { dropdownApi } from "@/services/api/master";
import { MasterTypes } from "@/constants/masterTypes";
import RoundDropdown from "../form-fields/Dropdown";
import { formatDate, sortData } from "@/helpers/helper";
import MultiSelectDropdownCheckbox from "../form-fields/MultiDropdownCheckbox";
import { hiringApi } from "@/services/api/hiring.api";
import { toast } from "@/lib/toast";
import api from "@/lib/axiosInstance";
import MultiSelectDropdown from "../form-fields/MultiDropdownCheckbox";

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
  profileCreatedAt?:string
}
interface Column {
  id: keyof Candidate | "actions";
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
};

export function CandidateCartTable() {
  const router = useRouter();
  const partnerId = useUserStore((state) => state.partnerId) || "";
  const [columns, setColumns] = useState<Column[]>([
    { id: "candidateCode", label: "Candidate Code", visible: true,sortable:true },
    { id: "fullName", label: "Candidate Name", visible: true, sortable: false },
    { id: "email", label: "Candidate Email", visible: true },
    { id: "phoneNumber", label: "Candidate Contact", visible: true },
    { id: "profileCreatedAt", label: "Created Date", visible: true,sortable:true },
    { id: "jobTitle", label: "Role Hired For", visible: true },
    {
      id: "relevantExperience",
      label: "Experience",
      visible: true,
      sortable: true,
    },
    { id: "resume", label: "Resume", visible: true },
    { id: "nickname", label: "Partner", visible: true },
    { id: "acknowledged", label: "Acknowledged", visible: true },
    { id: "intakeStatusName", label: "Status", visible: true },
    // { id: "candidateStatusName", label: "Candidate Status", visible: true },
    // { id: "actions", label: "Actions", visible: true },
  ]);

  const [sortConfig, setSortConfig] = useState<SortConfig>({
    sortColumns: [{ column: "profileCreatedAt", descending: true }]
  });
  const [searchText, setSearchText] = useState("");
  const [statusId, setStatusId] = useState([15002]);
  const [searchColumn, setSearchColumn] = useState<string>("CandidateCode");
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
      searchColumn,
      searchText,
      statusId,
      pageSize,
      sortConfig // Add sortConfig to dependencies
    ],
    queryFn: () =>
      candidateApi.fetchCandidateList(
        {
          pageNumber: currentPage,
          pageSize,
          searchColumn: searchColumn,
          searchText: searchText || undefined,
          sortColumns: sortConfig.sortColumns // Add sort columns
        },
        false,
        Number(partnerId),statusId
      ),
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: true,
    enabled: !!statusId,
  });
  if (error) return <ErrorHandler error={error} />;
  
  const { data: CANDIDATE_INTAKE_STATUS = [] } = useQuery({
    queryKey: ["CANDIDATE_INTAKE_STATUS"],
    queryFn: () =>
      dropdownApi.fetchDropdown(MasterTypes.CANDIDATE_INTAKE_STATUS),
    enabled: true,
    select: (data) => [
      ...data.filter((item) => item.id !== 15001)
    ],
  });
  const handleSort = (column: string) => {
    const columnIndex = sortConfig.sortColumns.findIndex(
      (sort) => sort.column === column
    );
    
    let newSortColumns: SortColumn[] = [...sortConfig.sortColumns];
    
    if (columnIndex >= 0) {
      // Toggle direction if already sorting by this column
      newSortColumns[columnIndex] = {
        ...newSortColumns[columnIndex],
        descending: !newSortColumns[columnIndex].descending
      };
    } else {
      // Add as primary sort column
      newSortColumns = [
        { column, descending: false },
        ...newSortColumns.slice(0, 2) // Keep top 3 sorts at most
      ];
    }
    
    setSortConfig({ sortColumns: newSortColumns });
  };
  const toggleColumn = (columnId: string) => {
    setColumns(
      columns.map((col) =>
        col.id === columnId ? { ...col, visible: !col.visible } : col
      )
    );
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
      <div className="flex items-center">
        {sortColumn.descending ? (
          <ArrowDownIcon className="h-4 w-4 ml-1" />
        ) : (
          <ArrowUpIcon className="h-4 w-4 ml-1" />
        )}
        {sortConfig.sortColumns.length > 1 && (
          <span className="ml-1 text-xs font-medium bg-gray-200 rounded-full w-4 h-4 flex items-center justify-center">
            {columnIndex + 1}
          </span>
        )}
      </div>
    );
  };

  const candidates = candidatesResponse?.data?.items || [];
  const hasPrevious = candidatesResponse?.data.hasPrevious;
  const hasNext = candidatesResponse?.data.hasNext;
  const totalPages = candidatesResponse?.data.totalPages;
  const currentPageNumber = candidatesResponse?.data.currentPage;



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
  const { mutate, isPending: downloadExcelLoading } = useMutation({
    mutationFn: downloadExcel,
    onSuccess: (blob) => {
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const statusName = CANDIDATE_INTAKE_STATUS.find(
        (status) => status.id === statusId
      )?.name;

      a.download = `candidate-list.xlsx`;
      a.click();
      window.URL.revokeObjectURL(url);
    },
    onError: (error) => {
      toast.error(error?.response?.data?.message || "Download failed");
      console.error("Download failed:", error);
    },
  });
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
          <MultiSelectDropdown
            options={CANDIDATE_INTAKE_STATUS}
            defaultSelected={statusId}
            onChange={(items) => setStatusId(items)}
            placeholder="Choose status"
          />
          {/* <RoundDropdown
            options={CANDIDATE_INTAKE_STATUS}
            index={0}
            onSelect={(e) => setStatusId(e?.id)}
          /> */}
          {/* <MultiSelectDropdownCheckbox
            options={CANDIDATE_INTAKE_STATUS}
            defaultSelected={[15002]}
            onChange={(items) => console.log("Selected:", items)}
            placeholder="Choose Rounds"
          /> */}
          <ColumnsPopover
            columns={columns}
            toggleColumn={toggleColumn}
            screeningData={candidates}
            buttonName="candidate-details"
          />
       
          {(isAdmin || isRmowner || isVendorManager) &&<Button
            onClick={() =>
              mutate({
                statusId,
                partnerId: partnerId ? Number(partnerId) : undefined,sortOptions: sortConfig
              })
            }
            disabled={!candidates.length || downloadExcelLoading}
            variant="ghost"
            size="sm"
            className="h-9 text-[#0958d9] hover:text-[#0958d9] hover:bg-[#E6F4F1] dark:text-[#00cc99] dark:hover:bg-[#11332b]"
          >
            <Download className="h-4 w-4 mr-2" />
            {downloadExcelLoading ? "Exporting..." : "Export"}
          </Button>}
          <TooltipWrapper content="Create New Candidate">
            <Button
              variant="ghost"
              size="sm"
              className="h-9 text-[#0958d9] hover:text-[#0958d9] hover:bg-[#E6F4F1] dark:text-[#00cc99] dark:hover:bg-[#11332b]"
              onClick={() => {
                router.push("/home/candidate-management/create-candidate");
              }}
            >
              <Plus className="h-4 w-4 mr-2" />
              Create
            </Button>
          </TooltipWrapper>
        </div>
      </div>

      <div className="bg-gray-50 dark:bg-gray-900 rounded-lg shadow">
        <Table className="text-xs">
          <TableHeader>
            <TableRow className="bg-teal-200 dark:bg-gray-700">
              {visibleColumns.map((column, index) => (
                <TableHead
                  key={index}
                  className={`whitespace-nowrap text-[11px] ${
                   column.sortable ? "cursor-pointer select-none" : ""
  }`
                  }
                  onClick={() =>
                    column.sortable && handleSort(column.id)
                  }
                >
                  <div className="flex items-center">
                    {column.label}
                    {column.sortable &&
                      getSortIcon(column.id)}
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
              candidates.map((candidate) => (
                <TableRow className="text-[10px]" key={candidate.id}>
                  {visibleColumns.map((column) => (
                    <TableCell key={`${candidate.id}-${column.id}`}>
                      {column.id === "hrqId" ? (
                        <h2
                           className="text-[#4096ff] hover:cursor-pointer hover:underline"
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
                      ): column.id === "profileCreatedAt"? (
                         <p>
                          {formatDate(candidate.profileCreatedAt)}
    
                         </p>
 
                        ) : column.id === "candidateCode" ? (
                        <Link
                          href={`/home/candidate-management/candidate-profile?id=${candidate.candidateCode}`}
                          className="text-green-600 hover:text-green-600 underline"
                        >
                          {candidate.candidateCode}
                        </Link>
                      ) : column.id === "acknowledged" ? (
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
                      ) : column.id === "actions" ? (
                        <div className="flex items-center gap-2">
                          <TooltipWrapper content="Edit">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0"
                              onClick={() =>
                                router.push(
                                  `/home/candidate-management/edit-candidate?id=${candidate.id}`
                                )
                              }
                            >
                              <Pencil className="h-4 w-4 text-gray-500" />
                            </Button>
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

async function downloadExcel({
  isBin = false,
  statusId = [],
  partnerId,
  sortOptions
}: {
  isBin?: boolean;
  statusId?: number[];
  partnerId?: number;
  sortOptions?: any;
}) {
  const query = new URLSearchParams({
    isBin: String(isBin),
  });

  if (partnerId) {
    query.append("partnerId", String(partnerId));
  }

  if (statusId && statusId.length > 0) {
    query.append("intakeStatusId", statusId.join(","));
  }

  const url = `/CandidateForm/download-all-excel?${query.toString()}`;

  // send body if required by API

  const requestBody = {
    sortColumns: sortOptions?.sortColumns || [] 
  };
  const response = await api.post(url, requestBody, {
    responseType: "blob", // 👈 important for file download
    headers: { accept: "*/*" },
  });

  return response.data; // Blob
}

