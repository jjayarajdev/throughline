"use client";

import TooltipWrapper from "@/components/tooltio-wrapper";
import { Button } from "@/components/ui/button";
import SearchFilter from "@/components/common/SearchFilter"; // Add this import

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
  Download,
  Menu,
  Pencil,
  Plus,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { StatusBadge } from "@/components/status-badge";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Partner, partnerApi } from "@/services/api/partner.profile.api";
import { toast } from "sonner";
import { usePartnerStore } from "@/store/userPartnerStore";
import TableSkeletonLoader from "@/components/skelton/TableSkelton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { FilterTypeEnum } from "@/constants/FilterTypeEnum";
import ColumnsPopover from "@/components/common/PopoverColumns";
import Pagination from "@/components/common/Pagination";
import { dropdownApi } from "@/services/api/master";
import { MasterTypes } from "@/constants/masterTypes";
import RoundDropdown from "@/components/form-fields/Dropdown";
import { SplitNames } from "@/components/common/SplitNames";
import { sortData } from "@/helpers/helper";
import api from "@/lib/axiosInstance";
import { isPartner } from "@/store/userStore";
import MultiSelectDropdown from "@/components/form-fields/MultiDropdownCheckbox";
import { formatDate } from "@/helpers/helper";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
interface Column {
  id: keyof Partner | "actions";
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

export default function PartnerPage() {
  const router = useRouter();
  const {
    setPartnerStatus,
    setPartnerCode,
    setPartnerId,
    partnerStatus,
    setIsPartnerEmpanelled,
    setContactMatriId,
  } = usePartnerStore();

  const [columns, setColumns] = useState<Column[]>([
    { id: "partnerCode", label: "Partner ID", visible: true, sortable: true },
    { id: "nickname", label: "Partner", visible: true, sortable: false },
    {
      id: "engagementTypeName",
      label: "Engagement Type",
      visible: true,
      sortable: false,
    },
    { id: "startDate", label: "Start Date", visible: true, sortable: true },
    { id: "partnerStatusName", label: "Partner Status", visible: true },
    { id: "approverName", label: "Approved By", visible: true },
    { id: "approvedStatus", label: "VM Approval", visible: true },
    { id: "actions", label: "Actions", visible: true },
  ]);

  const [sortConfig, setSortConfig] = useState<SortConfig>({
    sortColumns: [{ column: "partnerCode", descending: true }], // Default sort
  });
  const [searchText, setSearchText] = useState("");
  const [statusId, setStatusId] = useState([19001]);
  const [searchColumn, setSearchColumn] = useState<string>("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [isVMApproved, setIsvmapproved] = useState<boolean>(true);
  const {
    data: partnersResponse,
    isLoading,
    error,
    refetch: reFetchData,
  } = useQuery({
    queryKey: [
      "partners",
      currentPage,
      searchText,
      searchColumn,
      statusId,
      pageSize,
      sortConfig, isVMApproved// Add sortConfig to query key
    ],
    queryFn: () =>
      partnerApi.getPartners(
        {
          pageNumber: currentPage,
          pageSize,
          searchColumn: searchColumn,
          searchText: searchText || undefined,
          sortColumns: sortConfig.sortColumns, // Add sort columns parameter
        },
        statusId,isVMApproved
      ),
    enabled: !!statusId,
    refetchOnWindowFocus: true,
  });

  const { data: PARTNER_STATUS = [] } = useQuery({
    queryKey: ["PARTNER_STATUS"],
    queryFn: () => dropdownApi.fetchDropdown(MasterTypes.PARTNER_STATUS),
    enabled: true,
    select: (data) => [...data.filter((item) => item.id !== 19004)],
  });
  if (error) {
    toast.error("Failed to fetch partners");
  }

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
  const toggleColumn = (columnId: string) => {
    setColumns(
      columns.map((col) =>
        col.id === columnId ? { ...col, visible: !col.visible } : col
      )
    );
  };

  const handleSort = (column: string) => {
    // Find if column is already in sort config
    const columnIndex = sortConfig.sortColumns.findIndex(
      (sort) => sort.column === column
    );

    // Create a new sort columns array
    let newSortColumns: SortColumn[] = [...sortConfig.sortColumns];

    if (columnIndex >= 0) {
      // If already sorting by this column, toggle direction
      newSortColumns[columnIndex] = {
        ...newSortColumns[columnIndex],
        descending: !newSortColumns[columnIndex].descending,
      };
    } else {
      // Add as the first sort column (makes it primary sort)
      newSortColumns = [
        { column, descending: true }, // Start with descending
        ...newSortColumns.slice(0, 2), // Keep only top 3 sorts
      ];
    }

    // Update sort config
    setSortConfig({ sortColumns: newSortColumns });
  };

  const visibleColumns = columns.filter((col) => col.visible);

  const getSortIcon = (columnId: string) => {
    // Find column index in sort config
    const columnIndex = sortConfig.sortColumns.findIndex(
      (sort) => sort.column === columnId
    );

    if (columnIndex === -1) {
      return null; // Not being sorted
    }

    const sortColumn = sortConfig.sortColumns[columnIndex];

    return (
      <div className="flex items-center">
        {sortColumn.descending ? (
          <ArrowDownIcon className="h-4 w-4 ml-1" />
        ) : (
          <ArrowUpIcon className="h-4 w-4 ml-1" />
        )}
        {sortConfig.sortColumns.length > 1 && columnIndex > 0 && (
          <span className="ml-1 text-xs font-medium bg-gray-200 dark:bg-gray-700 rounded-full w-4 h-4 flex items-center justify-center">
            {columnIndex + 1}
          </span>
        )}
      </div>
    );
  };

  const partners = partnersResponse?.data?.items || [];
  // No client-side sorting needed as API handles it
  const sortedData = partners;
  const hasPrevious = partnersResponse?.data.hasPrevious;
  const hasNext = partnersResponse?.data.hasNext;
  const totalPages = partnersResponse?.data.totalPages;
  const currentPageNumber = partnersResponse?.data.currentPage;

  const { mutate, isPending: downloadExcelLoading } = useMutation({
    mutationFn: downloadExcel,
    onSuccess: (blob) => {
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const statusName = PARTNER_STATUS.find(
        (status) => status.id === statusId
      )?.name;

      a.download = `partner-list.xlsx`;
      a.click();
      window.URL.revokeObjectURL(url);
    },
    onError: (error) => {
      toast.error(error?.response?.data?.message || "Download failed");
      console.error("Download failed:", error);
    },
  });
  return (
    <div className="p-6">
      <h1 className="text-xl font-semibold mb-6">Partner Management</h1>

      <div className="flex items-center justify-between mb-8">
        <SearchFilter
          filterType={FilterTypeEnum.PartnerManagement}
          onFilterChange={handleFilterChange}
          onClear={handleClear}
          placeholder="Search by"
          setCurrentPage={setCurrentPage}
        />
        <div className="flex items-center gap-2">
          <MultiSelectDropdown
            options={PARTNER_STATUS}
            defaultSelected={statusId}
            onChange={(items) => setStatusId(items)}
            placeholder="Choose Rounds"
          />
          {/* <RoundDropdown
            options={PARTNER_STATUS}
            index={0}
            onSelect={(e) => setStatusId(e?.id)}
          /> */}
              <div className="flex items-center space-x-2">
              <Switch
                id="assigned-mode"
                checked={isVMApproved}
                onCheckedChange={setIsvmapproved}
                className="data-[state=checked]:bg-[#007E61] data-[state=checked]:border-[#007E61] dark:data-[state=checked]:bg-[#00cc99] dark:data-[state=checked]:border-[#00cc99]"
              />
              <Label
                htmlFor="assigned-mode"
                className="text-sm font-medium text-[#007E61] dark:text-[#00cc99]"
              >
               {isVMApproved ? "Approved" : "Unapproved"}

              </Label>
            </div>
          <ColumnsPopover
            columns={columns}
            toggleColumn={toggleColumn}
            screeningData={partners}
            buttonName="partner-details"
          />
          {!isPartner && (
            <Button
              onClick={() =>
                mutate({
                  statusId, sortOptions: sortConfig
                })
              }
              disabled={!partners.length || downloadExcelLoading}
              variant="ghost"
              size="sm"
              className="h-9 text-[#007E61] hover:text-[#007E61] hover:bg-[#E6F4F1] dark:text-[#00cc99] dark:hover:bg-[#11332b]"
            >
              <Download className="h-4 w-4 mr-2" />
              {downloadExcelLoading ? "Exporting..." : "Export"}
            </Button>
          )}

          <TooltipWrapper content="Create New Partner">
            <Button
              variant="ghost"
              size="sm"
              className="h-9 text-[#007E61] hover:text-[#007E61] hover:bg-[#E6F4F1] dark:text-[#00cc99] dark:hover:bg-[#11332b]"
              onClick={() => {
                setPartnerCode("PID***");
                setPartnerId("");
                setContactMatriId("");
                router.push("/home/partner-onboarding/add-partner");
              }}
            >
              <Plus className="h-4 w-4 mr-2" />
              Create
            </Button>
          </TooltipWrapper>
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
                    className={column.sortable ? "cursor-pointer select-none" : ""}
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
              {partners.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={visibleColumns.length}
                    className="text-center py-4"
                  >
                    No partners found
                  </TableCell>
                </TableRow>
              ) : (
                sortedData.map((partner) => (
                  <TableRow key={partner.id}>
                    {visibleColumns.map((column) => (
                      <TableCell key={`${partner.id}-${column.id}`}>
                        {column.id === "partnerCode" ? (
                          <Link
                            href={`/home/partner-onboarding/partner-profile/${partner.partnerCode}`}
                            className="text-[#00b388] hover:underline"
                          >
                            {partner.partnerCode}
                          </Link>
                        ) : column.id === "partnerStatusName" ? (
                          <div
                            className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${(() => {
                              switch (partner.partnerStatusName) {
                                case "Active":
                                  return "text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/30";
                                case "Under Evaluation":
                                  return "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30";
                                case "Rejected":
                                  return "text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/30";
                                case "Inactive":
                                  return "text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-900/30";
                                default:
                                  return "text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-900/30";
                              }
                            })()}`}
                          >
                            {partner.partnerStatusName}
                          </div>
                        ) : column.id === "engagementTypeName" ? (
                          <div className="list-disc pl-4">
                            <SplitNames
                              names={[
                                ...new Set(
                                  (partner?.engagementTypeName || "")
                                    .split(",")
                                    .map((n) => n.trim())
                                ),
                              ].join(", ")}
                            />
                          </div>
                        ) : column.id === "approverName" ? (
                          partner.approverName
                        ) : column.id === "startDate" ? (
                          <>{formatDate(partner.startDate)}</>
                        ) : 
                        column.id === "approvedStatus" ? (
                          <span
                            className={`
                        font-medium 
                        ${
                          partner.approvedStatus == null
                            ? "text-yellow-600"
                            : partner.approvedStatus
                            ? "text-green-600"
                            : "text-red-600"
                        }
                        `}
                          >
                            {partner.approvedStatus == null
                              ? "Pending"
                              : partner.approvedStatus
                              ? "Approved"
                              : "Rejected"}
                          </span>
                        ) : column.id === "actions" ? (
                          <div className="flex items-center gap-2">
                            <TooltipWrapper content="Edit">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button
                                    variant="outline"
                                    className="h-8  p-2"
                                  >
                                    <Menu />
                                    <ChevronDown />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent
                                  align="end"
                                  // className="w-[160px]"
                                >
                                  <DropdownMenuItem
                                    disabled={partner.approvedStatus == null}
                                    onClick={() => {
                                      setPartnerStatus(
                                        partner.partnerStatusName === "Inactive"
                                      );
                                      setPartnerId(partner.id.toString());
                                      setPartnerCode(partner.partnerCode);
                                      setIsPartnerEmpanelled(
                                        partner.isEmpaneled
                                      );
                                      router.push(
                                        `/home/partner-onboarding/edit-partner?id=${partner.id}&tab=profile`
                                      );
                                    }}
                                  >
                                    <Pencil className="h-4 w-4 text-gray-500" />
                                    Edit
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TooltipWrapper>
                          </div>
                        ) : (
                          partner[column.id as keyof Partner]
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
            totalEntry={partnersResponse?.data.totalCount}
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

async function downloadExcel({ statusId, sortOptions }: { statusId: number[], sortOptions?: any }) {
  const query = new URLSearchParams();
  let url = `Partner/download-all-excel`;
  
  if (statusId && statusId.length > 0) {
    query.append("statusId", statusId.join(","));
  }

  const queryString = query.toString();
  if (queryString) {
    url += `?${queryString}`; 
  }

  // Send sort columns in the request body
  const requestBody = {
    sortColumns: sortOptions?.sortColumns || [] // Using sortOptions parameter
  };

  const response = await api.post(url, requestBody, {
    responseType: "blob",
    headers: { accept: "*/*" },
  });

  return response.data;
}
