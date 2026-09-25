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
  Download,
  FilePlus,
  Filter,
  Menu,
  PencilIcon,
  Plus,
  View,
} from "lucide-react";
import { useRouter } from "next/navigation";
import React, { useState } from "react";
import { StatusBadge } from "@/components/status-badge";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Partner } from "@/services/api/partner.profile.api";
import { toast } from "sonner";
import {
  Hiring,
  hiringApi,
  HiringPageRequest,
} from "@/services/api/hiring.api";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import TableSkeletonLoader from "../skelton/TableSkelton";
import { useDebounce } from "@/lib/useDebounce";
import {
  isAdmin,
  isDomainManager,
  isHiringAccept,
  isHiringCreate,
  isHiringEdit,
  isHiringManager,
  isPanel,
  isRmowner,
  isVendorManager,
  useUserStore,
} from "@/store/userStore";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  formatDate,
  fyears,
  getTatColor,
  getTatHours,
  tatBetween,
} from "@/helpers/helper";
import SearchFilter from "../common/SearchFilter";
import { FilterTypeEnum } from "@/constants/FilterTypeEnum";
import ColumnsPopover from "../common/PopoverColumns";
import { ErrorHandler } from "../error/ErrorHandler";
import Pagination from "../common/Pagination";
import RoundDropdown from "../form-fields/Dropdown";
import { dropdownApi } from "@/services/api/master";
import { MasterTypes } from "@/constants/masterTypes";
import { AddPositionSheet } from "./SheetDrawer/AddPositionSheet";
import { DateRange } from "react-day-picker";

import api from "@/lib/axiosInstance";
import MultiSelectDropdown from "../form-fields/MultiDropdownCheckbox";
import ToggleButton from "../form-fields/ToggleButton";
interface Column {
  id: keyof Hiring | any;
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

const TatFilterOptions = [
  { id: 0, name: "All", color: "green" }, // green
  { id: 1, name: "0-30 days", color: "green" }, // green
  { id: 2, name: "30-60 days", color: "yellow" }, // yellow
  { id: 3, name: "60-90 days", color: "orange" }, // orange
  { id: 4, name: "90-120 days", color: "red" }, // red
  { id: 5, name: "120+ days", color: "purple" }, // purple
];
const quarterOptions = [
  { id: 5, name: "All" },
  { id: 1, name: "Q1 (Nov-Jan)" },
  { id: 2, name: "Q2 (Feb-Apr)" },
  { id: 3, name: "Q3 (May-Jul)" },
  { id: 4, name: "Q4 (Aug-Oct)" },
];
export default function CartPage() {
  const router = useRouter();
  const { userId } = useUserStore();
  const showHeadCountColumns =
    isPanel ||
    isDomainManager ||
    isHiringManager ||
    isAdmin ||
    isRmowner ||
    isVendorManager;
  const [columns, setColumns] = useState<Column[]>([
    { id: "hrqId", label: "HRQ ID", visible: true, sortable: true },
    { id: "businessName", label: "Business", visible: true, sortable: false },
    { id: "rcMsProjectId", label: "RCMS ID", visible: false },
    { id: "projectName", label: "Project", visible: false },
    { id: "jobTitle", label: "Role Hired For", visible: true },
    {
      id: "requestStartDate",
      label: "Request Start Date",
      visible: true,
      sortable: true,
    },
    ...(isAdmin || isRmowner
      ? [{ id: "parentHrqId", label: "Parent HRQID", visible: false }]
      : []),
    ...(showHeadCountColumns
      ? [
          { id: "totalHeadCount", label: "Total HeadCount", visible: true },
          { id: "openHeadCount", label: "Open HeadCount", visible: true },
          {
            id: "identifiedHeadCount",
            label: "Identified HeadCount",
            visible: false,
          },
          { id: "onholdHeadCount", label: "OnHold HeadCount", visible: false },
          { id: "closedHeadCount", label: "Closed HeadCount", visible: false },
        ]
      : []),

    { id: "hiringStatusName", label: "Status", visible: true },
    { id: "rmOwner", label: "RM Owner", visible: true },
    { id: "tatDate", label: "TAT (Hours/Days)", visible: true },
    { id: "actions", label: "Actions", visible: true },
  ]);
  const [searchText, setSearchText] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const [financialYear, setFinancialYear] = useState<number>(
    new Date().getFullYear()
  );
  const [pageSize, setPageSize] = useState(50);
  const [statusId, setStatusId] = useState([12002]);
  const debouncedSearch = useDebounce(searchText, 300);
  const [searchColumn, setSearchColumn] = useState("HrqId");
  const [sortConfig, setSortConfig] = useState<SortConfig>({
    sortColumns: [{ column: "hrqId", descending: true }], // Default sort
  });
  const [showAssigned, setShowAssigned] = useState<boolean>(true);
  const [parentHrq, setParentHrq] = useState<boolean>(true);
  const [durationId, setDurationId] = useState<number>(0);
  const [quarterId, setQuarterId] = useState<number>(5);
  const [hiringRec, setSelectedHiring] = useState<HiringPageRequest | null>(
    null
  );
  const handleOpenSheet = (data: HiringPageRequest) => {
    if (!data) return; // Add guard clause
    setSelectedHiring(data);
    setIsSheetOpen(true);
  };
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const { data: HiringStatus = [] } = useQuery({
    queryKey: ["HiringStatus"],
    queryFn: () => dropdownApi.fetchDropdown(MasterTypes.HIRING_STATUS),
    enabled: true,
    select: (data) => [...data.filter((item: any) => item.id !== 12001)],
  });
  const {
    data: hiringCartData,
    isLoading,
    error,
    refetch: reFetchData,
  } = useQuery({
    queryKey: [
      "hiringCart",
      currentPage,
      debouncedSearch,
      searchColumn,
      showAssigned,
      statusId,
      pageSize,
      durationId,
      financialYear,
      quarterId,
      sortConfig,parentHrq 
    ],
    queryFn: () =>
      hiringApi.getHiringCart(
        {
          pageNumber: currentPage,
          pageSize,
          searchColumn,
          searchText: debouncedSearch || undefined,
          sortColumns: sortConfig.sortColumns,
          hiringStatusIds: statusId,
          isBin: false,
          isAssigned: showAssigned,
          isParent: parentHrq,
          tatDurationId: durationId,
          financialYear: financialYear,
          quarterId: quarterId,
          startDate: null,
          endDate: null,
        }
      ),
    enabled: !!financialYear,
    refetchOnWindowFocus: true,
  });
  if (error) return <ErrorHandler error={error} />;

  const { mutate, isPending: downloadExcelLoading } = useMutation({
    mutationFn: downloadExcel,
    onSuccess: (blob) => {
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `hiring-requests.xlsx`;
      a.click();
      window.URL.revokeObjectURL(url);
    },
    onError: (error) => {
      console.error("Download failed:", error);
    },
  });

  const statusLabelMap: Record<number, string> = {
    12002: "Open HeadCount",
    12007: "Closed HeadCount",
    12005: "On Hold HeadCount",
    12004: "Identified HeadCount",
  };
  const getDynamicLabel = (columnId: string, defaultLabel: string) => {
    if (columnId === "currentStatusHeadCount") {
      return statusLabelMap[statusId] || defaultLabel;
    }
    return defaultLabel;
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

  const getSortIcon = (columnId: keyof Partner) => {
    // if (!sortConfig || sortConfig.key !== columnId) {
    //   return null;
    // }
    return sortConfig?.sortColumns[0]?.descending === false &&
      sortConfig?.sortColumns[0]?.column === columnId ? (
      <ArrowUpIcon className="h-4 w-4 ml-1" />
    ) : (
      <ArrowDownIcon className="h-4 w-4 ml-1" />
    );
  };

  const queryClient = useQueryClient();
  const hiringData = hiringCartData?.data?.items || [];
  const hasPrevious = hiringCartData?.data.hasPrevious;
  const hasNext = hiringCartData?.data.hasNext;
  const totalPages = hiringCartData?.data.totalPages;
  const currentPageNumber = hiringCartData?.data.currentPage;

  const [acceptingIds, setAcceptingIds] = useState<Set<number>>(new Set());

  const { mutate: acceptHiring } = useMutation({
    mutationFn: ({ id, userId }: { id: number; userId: number }) =>
      hiringApi.hiringAcceptrmOwner(id, userId),
    onMutate: ({ id }) => {
      setAcceptingIds((prev) => new Set(prev).add(id));
    },
    onSuccess: (data, variables) => {
      toast.success(data?.message || "Accepted successfully");
      queryClient.invalidateQueries({ queryKey: ["hiringCart"] });
    },
    onError: (err, variables) => {
      toast.error(err?.response?.data?.message || "Failed to accept hiring");
    },
    onSettled: (_data, _error, { id }) => {
      // remove loading mark
      setAcceptingIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    },
  });

  // 3. Your handler calls mutate with an object
  const handleAccept = (hiring: Hiring) => {
    if (!userId || !hiring.id) return;
    acceptHiring({ id: hiring.id, userId: userId });
  };

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

  const [dateRange, setDateRange] = React.useState<DateRange | undefined>();
  // if (isLoading) return <TableSkeletonLoader />;
  return (
    <div className="p-2">
      <h1 className="text-xl font-semibold mb-6">Hiring Management</h1>
      <div className="flex items-center justify-between mb-8">
        <SearchFilter
          filterType={FilterTypeEnum.HiringManagement}
          onFilterChange={handleFilterChange}
          onClear={handleClear}
          placeholder="Search by"
          setCurrentPage={setCurrentPage}
          
        />

        <div className="flex items-center gap-2">
          <MultiSelectDropdown
            options={
              showAssigned
                ? HiringStatus
                : HiringStatus.filter((item) =>
                    [12002, 12008].includes(item.id)
                  )
            }
            defaultSelected={statusId}
            onChange={(items) => setStatusId(items)}
            placeholder="Choose status"
          />
          {/* <DateRangePicker
            value={dateRange}
            onChange={setDateRange}
            disabled={false}
            maxDate={new Date()}
            minDate={new Date(2023, 0, 1)}
            placeholder="Select date range"
          /> */}
          <RoundDropdown
            options={fyears}
            index={0}
            onSelect={(e) => setFinancialYear(e?.id)}
          />
          {financialYear !== 1 && (
            <RoundDropdown
              options={quarterOptions}
              index={0}
              onSelect={(e) => setQuarterId(e?.id)}
            />
          )}

          {(isAdmin || isRmowner || isVendorManager) && (
            <ToggleButton
              checked={parentHrq}
              onCheckedChange={setParentHrq}
              checkedLabel="Parent HRQ"
              uncheckedLabel="Parent HRQ"
            />
          )}
          {isHiringAccept && (
            <ToggleButton
              checked={showAssigned}
              onCheckedChange={setShowAssigned}
              checkedLabel="Assigned"
              uncheckedLabel="Unassigned"
            />
          )}

          <ColumnsPopover
            columns={columns}
            toggleColumn={toggleColumn}
            screeningData={[]}
            buttonName="hiringData-details"
          />
          {(isAdmin || isRmowner || isVendorManager) && (
            <Button
              onClick={() =>
                mutate({
                  statusId,
                  userId,
                  durationId,
                  fyears: financialYear,
                  quarterId,
                  showAssigned,
                  sortOptions: sortConfig,parentHrq
                })
              }
              disabled={!hiringData.length || downloadExcelLoading}
              variant="ghost"
              size="sm"
              className="h-9 text-[#007E61] hover:text-[#007E61] hover:bg-[#E6F4F1] dark:text-[#00cc99] dark:hover:bg-[#11332b]"
            >
              <Download className="h-4 w-4 mr-2" />
              {downloadExcelLoading ? "Exporting..." : "Export"}
            </Button>
          )}
          {isHiringCreate && (
            <TooltipWrapper content="New Request">
              <Button
                variant="ghost"
                size="sm"
                className="h-9 text-[#007E61] hover:text-[#007E61] hover:bg-[#E6F4F1] dark:text-[#00cc99] dark:hover:bg-[#11332b]"
                onClick={() =>
                  router.push("/home/hiring-management/create-hiring")
                }
              >
                <Plus className="h-4 w-4 mr-2" />
                Create
              </Button>
            </TooltipWrapper>
          )}
        </div>
      </div>

      <div className="border bg-gray-50 dark:bg-gray-900 rounded-lg shadow">
        {isLoading ? (
          <TableSkeletonLoader />
        ) : (
          <div className="overflow-x-auto">
            <Table className="min-w-full text-xs  leading-tight">
              <TableHeader>
                <TableRow className="bg-teal-200 text-white dark:bg-gray-700">
                  {visibleColumns.map((column, index) => (
                    <TableHead
                      key={index}
                      className={`whitespace-nowrap px-2 py-1 text-xs ${
                        column.sortable ? "cursor-pointer select-none" : ""
                      }`}
                      onClick={() => column.sortable && handleSort(column.id)}
                    >
                      <div className="flex items-center">
                        {getDynamicLabel(column.id, column.label)}
                        {column.label === "TAT (Hours/Days)" && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant={"ghost"}
                                className="w-auto justify-between bg-transparent *:hover:bg-transparent"
                              >
                                <Filter className=" h-4 w-4 text-green-700" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className="w-auto">
                              {TatFilterOptions.map((item, index) => (
                                <DropdownMenuItem
                                  className={
                                    durationId === item.id ? "bg-gray-200" : ""
                                  }
                                  key={index}
                                  onClick={() => setDurationId(item.id)}
                                >
                                  {item.name}
                                </DropdownMenuItem>
                              ))}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                        {column.sortable &&
                          getSortIcon(column.id as keyof Partner)}
                      </div>
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>

              <TableBody>
                {hiringData.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={visibleColumns.length}
                      className="text-center py-4 whitespace-nowrap"
                    >
                      No Hiring found
                    </TableCell>
                  </TableRow>
                ) : (
                  hiringData.map((hiring) => {
                    const isAccepting = hiring.id
                      ? acceptingIds.has(hiring.id)
                      : false;

                    return (
                      <TableRow key={hiring.id}>
                        {visibleColumns.map((column, index) => (
                          <TableCell
                            key={index}
                            className="whitespace-nowrap px-2 py-1"
                          >
                            {column.id === "hrqId" ? (
                              <div
                                onClick={
                                  !isPanel
                                    ? () =>
                                        router.push(
                                          `/home/hiring-management/hiring-profile?id=${hiring.hrqId}`
                                        )
                                    : () => {}
                                }
                                className="text-[#00b388] hover:cursor-pointer hover:underline"
                              >
                                {hiring.hrqId}
                              </div>
                            ) : column.id === "hiringStatusName" ? (
                              <StatusBadge
                                status={hiring.hiringStatusName as any}
                              />
                            ) : column.id === "requestStartDate" ? (
                              hiring?.requestStartDate ? (
                                formatDate(hiring?.requestStartDate)
                              ) : (
                                ""
                              )
                            ) : column.id === "rmOwner" ? (
                              <>
                                {hiring?.isRMOwnerAccepted ? (
                                  <div>{hiring.rmOwnerName}</div>
                                ) : hiring.hiringStatusName ===
                                  "Cancelled" ? null : (
                                  <Button
                                    className="hover:cursor-pointer"
                                    onClick={() => handleAccept(hiring)}
                                    variant="hpButton"
                                    disabled={isAccepting}
                                  >
                                    {isAccepting ? "Accept..." : "Accept"}
                                  </Button>
                                )}
                              </>
                            ) : column.id === "tatDate" ? (
                              <StatusBadge
                                color={getTatColor(
                                  hiring?.tatDate,
                                  hiring?.tatEndDate
                                )}
                                status={tatBetween(
                                  hiring?.tatDate,
                                  hiring?.tatEndDate
                                )}
                              />
                            ) : column.id === "actions" ? (
                              <div className="flex items-center gap-2 hover:cursor-pointer">
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button
                                      variant="outline"
                                      className="h-8  p-2"
                                      disabled={!hiring?.isRMOwnerAccepted}
                                    >
                                      <Menu />
                                      <ChevronDown />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent
                                    align="end"
                                    className="w-[160px] hover:cursor-pointer"
                                  >
                                    {isHiringEdit && (
                                      <DropdownMenuItem
                                        onClick={() =>
                                          router.push(
                                            `/home/hiring-management/${hiring.id}`
                                          )
                                        }
                                      >
                                        <PencilIcon className="h-4 w-4 text-green-700" />
                                        Edit
                                      </DropdownMenuItem>
                                    )}

                                    {hiring.parentHrqId == undefined &&
                                      hiring.hiringStatusName === "Open-WIP" &&
                                      isHiringEdit && (
                                        <DropdownMenuItem
                                          onClick={() =>
                                            handleOpenSheet(hiring)
                                          }
                                        >
                                          <FilePlus className="h-4 w-4 text-green-700" />
                                          Add position
                                        </DropdownMenuItem>
                                      )}

                                    <DropdownMenuItem
                                      onClick={() =>
                                        router.push(
                                          `/home/hiring-details?hrqid=${hiring.hrqId}`
                                        )
                                      }
                                    >
                                      <View className="h-4 w-4 text-green-700" />
                                      View Hiring Details
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>
                            ) : (
                              hiring[column.id as keyof Hiring]
                            )}
                          </TableCell>
                        ))}
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        )}

        <div className="flex items-center justify-between p-4">
          <div className="text-sm text-gray-500">
            Page {currentPageNumber} of {totalPages}
          </div>

          <Pagination
            value={pageSize}
            totalEntry={hiringCartData?.data.totalCount}
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
      {hiringRec && (
        <AddPositionSheet
          isOpen={isSheetOpen}
          onClose={() => {
            setIsSheetOpen(false);
            setSelectedHiring(null);
          }}
          selectedCandidate={hiringRec}
        />
      )}
    </div>
  );
}

async function downloadExcel({
  isAssigned = true,
  statusId,
  durationId,
  fyears,
  quarterId,
  userId,
  sortOptions,parentHrq
}: {
  isBin?: boolean;
  isAssigned?: boolean;
  statusId: number[];
  durationId: number;
  fyears: number;
  quarterId: number;
  userId: number;
  sortOptions?: any;
  parentHrq?: boolean;
}) {
  const query = new URLSearchParams({
    isBin: String(false),
    isAssigned: String(isAssigned),
    financialYearStart: String(fyears),
    quarterId: String(quarterId),
    userId: String(userId),
    isParent: String(parentHrq),
  });
  if (durationId !== 0) {
    query.append("durationId", String(durationId));
  }

  if (statusId && statusId.length > 0) {
    query.append("hiringStatusId", statusId.join(","));
  }
  const url = `/HiringRequest/download-all-excel?${query.toString()}`;

  const requestBody = {
    sortColumns: sortOptions?.sortColumns || [],
  };
  const response = await api.post(url, requestBody, {
    responseType: "blob",
    headers: { accept: "*/*" },
  });

  return response.data; // this is the Blob
}
