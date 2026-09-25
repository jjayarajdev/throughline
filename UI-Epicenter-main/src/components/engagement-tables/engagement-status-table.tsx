"use client";

import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { ChevronDown, Loader2, Menu, PencilIcon } from "lucide-react";
import { partnerApi } from "@/services/api/partner.profile.api";
import { EngagementResponse, statusTableProps } from "./types";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "../ui/button";
import { useRouter } from "next/navigation";
import SearchFilter from "../common/SearchFilter";
import ColumnsPopover from "../common/PopoverColumns";
import { FilterTypeEnum } from "@/constants/FilterTypeEnum";
import { formatDate, sortData } from "@/helpers/helper";
import Pagination from "../common/Pagination";

const EngagementStatusTable = ({ statusId }: statusTableProps) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [partnerId, setPartnerId] = useState<string>("");
  const [searchText, setSearchText] = useState("");
  const [searchColumn, setSearchColumn] = useState("partnerName");
  // const [searchColumn, setSearchColumn] = useState(null);
  const [columns, setColumns] = useState<any[]>([
    { id: "partnerCode", label: "Partner ID", visible: true,sortable:true },
   
    { id: "nickname", label: "Partner", visible: true },
    { id: "businessCenter", label: "Business Center", visible: true },
    { id: "tenuareInDays", label: "Tenure", visible: true },
    { id: "evaluationPeriod", label: "Evaluation Period", visible: true },
    { id: "evaluationStatusName", label: "Status", visible: true },
    { id: "engagementTypeName", label: "Type", visible: true },
    { id: "businessUnitName", label: "Business Unit", visible: true },
    { id: "actions", label: "Action", visible: true },
  ]);

  const visibleColumns = columns.filter((col) => col.visible);
  const handleFilterChange = (column: string, text: string) => {
    setSearchColumn(column);
    setSearchText(text);
  };
  const handleClear = () => {
    setSearchColumn("");
    setSearchText("");
    setCurrentPage(1);
  };
  const toggleColumn = (columnId: string) => {
    setColumns(
      columns.map((col) =>
        col.id === columnId ? { ...col, visible: !col.visible } : col
      )
    );
  };
  const router = useRouter();
  const [pageSize, setPageSize] = useState(50);

  const {
    data: partnersResponse,
    isLoading,
    error,
  } = useQuery<EngagementResponse>({
    queryKey: [
      "partnersStatusPaged",
      currentPage,
      statusId,
      partnerId,
      searchText,
      pageSize,
    ],
    queryFn: () =>
      partnerApi.getEngagementListByEvaluationStatus(
        {
          pageNumber: currentPage,
          pageSize,
          searchColumn: searchColumn,
          searchText: searchText || undefined,
        },
        statusId,
        partnerId
      ),
      refetchOnWindowFocus: true,
  });

  const handlePartnerIdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPartnerId(e.target.value);
    setCurrentPage(1); // Reset to first page when search changes
  };

  // Filter candidates to show only duplicates
  const partnerData = partnersResponse?.data?.items || [];
  const hasPrevious = partnersResponse?.data.hasPrevious;
  const hasNext = partnersResponse?.data.hasNext;
  const totalPages = partnersResponse?.data.totalPages;
  const currentPageNumber = partnersResponse?.data.currentPage;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between mb-8">
        <SearchFilter
          filterType={FilterTypeEnum.Engagement_Management}
          onFilterChange={handleFilterChange}
          onClear={handleClear}
          placeholder="Search by"
        />

        <div className="flex items-center gap-2">
          <ColumnsPopover
            columns={columns}
            toggleColumn={toggleColumn}
            screeningData={partnerData}
            buttonName="partnerData-details"
          />
        </div>
      </div>

      {error && <div className="text-red-500">Error loading data</div>}

      {isLoading ? (
        <div className="flex justify-center items-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow className="bg-teal-200 dark:bg-gray-700">
                {visibleColumns.map((col) => (
                  <TableHead key={col.id}>{col.label}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {partnerData?.map((item) => (
                <TableRow key={item.id}>
                  {visibleColumns.map((col) => (
                    <TableCell key={`${item.id}-${col.id}`}>
                      {col.id === "evaluationPeriod" ? (
                        `${formatDate(item.evaluationStartDate)} - ${formatDate(
                          item.evaluationEndDate
                        )}`
                      ) : col.id === "actions" ? (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="outline" className="h-8 p-2">
                              <Menu />
                              <ChevronDown />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent
                            align="end"
                            className="w-[160px]"
                          >
                            <DropdownMenuItem
                              onClick={() =>
                                router.push(
                                  `/home/partner-onboarding/edit-partner?id=${item.partnerId}&tab=engagement`
                                )
                              }
                            >
                              <PencilIcon className="h-4 w-4 text-green-600 mr-2" />
                              Edit
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      ) : (
                        item[col.id] ?? "-"
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
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
  );
};

export default EngagementStatusTable;
