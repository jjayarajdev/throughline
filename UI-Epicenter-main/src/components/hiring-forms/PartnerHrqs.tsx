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
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import Link from "next/link";
import React, { useState } from "react";
import { StatusBadge } from "@/components/status-badge";
import { useQuery } from "@tanstack/react-query";
import { Partner, partnerApi } from "@/services/api/partner.profile.api";
import { toast } from "sonner";
import TableSkeletonLoader from "@/components/skelton/TableSkelton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SowTable } from "@/components/sow-management/Sow-manament-table";
import Pagination from "../common/Pagination";
import SearchFilter from "../common/SearchFilter";
import ColumnsPopover from "../common/PopoverColumns";
import { FilterTypeEnum } from "@/constants/FilterTypeEnum";
import { dropdownApi } from "@/services/api/master";
import { MasterTypes } from "@/constants/masterTypes";
import RoundDropdown from "../form-fields/Dropdown";
import MultiSelectDropdown from "../form-fields/MultiDropdownCheckbox";
import { CandidateHiringRequests } from "../candidate/Hiring-Table";

interface Column {
  id: keyof Partner | "actions" | "expand";
  label: string;
  visible: boolean;
  sortable?: boolean;
}

type SortConfig = {
  key: keyof Partner;
  direction: "asc" | "desc";
} | null;

type SearchColumn = string | "PartnerCode" | "PartnerName" | undefined;

export default function PartnerHrqs() {
  const [expandedPartnerId, setExpandedPartnerId] = useState<string | null>(
    null
  );
  const [columns, setColumns] = useState<Column[]>([
    { id: "expand", label: "Actions", visible: true },
    { id: "partnerCode", label: "Partner ID", visible: true },
    { id: "nickname", label: "Partner", visible: true, sortable: false },
    {
      id: "engagementTypeName",
      label: "Engagement Type",
      visible: true,
      sortable: false,
    },
    { id: "startDate", label: "Start Date", visible: true, sortable: false },
    { id: "partnerStatusName", label: "Empanelled Status", visible: true },
    { id: "approverName", label: "Approved By", visible: true },
    { id: "approvedStatus", label: "VM Approval", visible: true },
  ]);

  const [sortConfig, setSortConfig] = useState<SortConfig>({
    key: "",
    direction: "desc",
  });
  const [searchText, setSearchText] = useState("");
  const [searchColumn, setSearchColumn] = useState<SearchColumn>();
  const [currentPage, setCurrentPage] = useState(1);
  const [statusId, setStatusId] = useState([19001]);
  const [pageSize, setPageSize] = useState(50);

  // Get partners
  const {
    data: partnersResponse,
    isLoading,
    error,
    refetch: reFetchData,
  } = useQuery({
    queryKey: [
      "partners",
      currentPage,
      searchColumn,
      searchText,
      statusId,
      pageSize,
    ],
    queryFn: () =>
      partnerApi.getPartners({
        pageNumber: currentPage,
        pageSize,
        searchColumn: searchColumn,
        searchText: searchText || undefined,
      },statusId,true),
    enabled: !!statusId,
    refetchOnWindowFocus: true,
  });

  // Get active SOWs
  const { data: PARTNER_STATUS = [] } = useQuery({
    queryKey: ["PARTNER_STATUS"],
    queryFn: () => dropdownApi.fetchDropdown(MasterTypes.PARTNER_STATUS),
    enabled: true,
    select: (data) => [...data.filter((item) => item.id !== 19004)],
  });



  if (error) {
    toast.error("Failed to fetch partners");
  }

  const toggleColumn = (columnId: string) => {
    setColumns(
      columns.map((col) =>
        col.id === columnId ? { ...col, visible: !col.visible } : col
      )
    );
  };

  const handleSort = (key: keyof Partner) => {
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

  const getSortIcon = (columnId: keyof Partner) => {
    // if (!sortConfig || sortConfig.key !== columnId) {
    //   return null;
    // }
    return sortConfig?.direction === "asc" && sortConfig?.key === columnId ? (
      <ArrowUpIcon className="h-4 w-4 ml-1" />
    ) : (
      <ArrowDownIcon className="h-4 w-4 ml-1" />
    );
  };

  const handleClear = () => {
    setSearchColumn(undefined);
    setSearchText("");
    setCurrentPage(1);
    reFetchData();
  };
  const handleFilterChange = (column: string, text: string) => {
    setSearchColumn(column);
    setSearchText(text);
  };
  const partners = (partnersResponse?.data?.items || []).map(
    ({
      stateId,
      countryId,
      cityId,
      contactMatrices,
      engagements,
      capabilitiesDeckDocuments,
      ...rest
    }: any) => rest
  );
  const hasPrevious = partnersResponse?.data.hasPrevious;
  const hasNext = partnersResponse?.data.hasNext;
  const totalPages = partnersResponse?.data.totalPages;
  const currentPageNumber = partnersResponse?.data.currentPage;
  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-8">
        <SearchFilter
          filterType={FilterTypeEnum.SOWManagement_PartnerSOWDetails}
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
          <ColumnsPopover
            columns={columns}
            toggleColumn={toggleColumn}
            screeningData={partners}
            buttonName="partner-details"
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
                      column.sortable && handleSort(column.id as keyof Partner)
                    }
                  >
                    <div className="flex items-center">
                      {column.label}
                      {column.sortable &&
                        getSortIcon(column.id as keyof Partner)}
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
                partners.map((partner) => (
                  <React.Fragment key={partner.id}>
                    <TableRow key={partner.id}>
                      {visibleColumns.map((column) => (
                        <TableCell key={`${partner.id}-${column.id}`}>
                          {column.id === "expand" ? (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="p-0 h-auto"
                              onClick={() =>
                                setExpandedPartnerId(
                                  expandedPartnerId === partner.id.toString()
                                    ? null
                                    : partner.id.toString()
                                )
                              }
                            >
                              {expandedPartnerId === partner.id.toString() ? (
                                <ChevronDown className="h-6 w-6" />
                              ) : (
                                <ChevronRight className="h-6 w-6" />
                              )}
                            </Button>
                          ) : column.id === "partnerCode" ? (
                            <Link
                              href={`/home/partner-onboarding/partner-profile/${partner.partnerCode}`}
                              className="text-[#00b388] hover:underline"
                            >
                              {partner.partnerCode}
                            </Link>
                          ) : column.id === "partnerStatusName" ? (
                            <StatusBadge
                              status={partner.partnerStatusName as any}
                            />
                          ) : column.id === "engagementTypeName" ? (
                            <ul className="list-disc pl-4">
                              {[
                                ...new Set(
                                  (partner?.engagementTypeName || "")
                                    .split(",")
                                    .map((item: string) => item.trim())
                                ),
                              ].map((item: any, idx) => (
                                <li key={idx} className="whitespace-pre-line">
                                  {item || "N/A"}
                                </li>
                              ))}
                            </ul>
                          ) : column.id === "approverName" ? (
                            partner.approverName || "N/A"
                          ) : column.id === "startDate" ? (
                            new Date(partner.startDate).toLocaleDateString()
                          ) : column.id === "approvedStatus" ? (
                            <span
                              className={`
                                                                        font-medium 
                                                                        ${
                                                                          partner.approvedStatus ==
                                                                          null
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
                          ) : (
                            partner[column.id as keyof Partner]
                          )}
                        </TableCell>
                      ))}
                    </TableRow>
                    {expandedPartnerId === partner.id.toString() && (
                      <TableRow>
                        <TableCell
                          colSpan={visibleColumns.length}
                          className="p-0 border-t-0"
                        >
                          <div className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow-inner">
                            <CandidateHiringRequests
                              filterType={FilterTypeEnum.All_HRQID}
                              id={partner.id}
                            />
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </React.Fragment>
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
