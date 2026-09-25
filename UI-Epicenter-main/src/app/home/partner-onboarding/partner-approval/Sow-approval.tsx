"use client";

import * as React from "react";
import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  ChevronDown,
  ChevronRight,
  Menu,
  Check,
  X,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
} from "@/components/ui/tooltip";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useForm } from "react-hook-form";
import { Form } from "@/components/ui/form";
import { useQuery } from "@tanstack/react-query";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Pagination from "@/components/common/Pagination";
import { onboarding } from "@/services/api/onboarding.api";
import api from "@/lib/axiosInstance";
import { toast } from "sonner";
import { formatDate } from "@/helpers/helper";
import SearchFilter from "@/components/common/SearchFilter";
import { FilterTypeEnum } from "@/constants/FilterTypeEnum";


interface FormValues {
  sowNumber: string;
  startDate: string;
  endDate: string;
  tcvValue: number;
  status: "Active" | "Inactive";
}






export default function SowApproval() {
  const [expandedRows, setExpandedRows] = useState<string[]>([]);

  const [pageSize, setPageSize] = useState(50);

  const [currentPage, setCurrentPage] = useState(1);
  const [searchText, setSearchText] = useState("");

  const [searchColumn, setSearchColumn] = useState<string>("");

  const toggleRow = (sowNumber: string) => {
    setExpandedRows((prev) =>
      prev.includes(sowNumber)
        ? prev.filter((row) => row !== sowNumber)
        : [...prev, sowNumber]
    );
  };

  const {
    data: candidatesResponse,
    isLoading: candidatesResponseLoading,
    error,
    refetch: reFetchData,
  } = useQuery({
    queryKey: [
      "ContactMatrixformApproval",
      currentPage,
      pageSize,
      searchColumn,
      searchText,
    ],
    queryFn: () =>
      onboarding.fetchSowformApprovalList({
        pageNumber: currentPage,
        pageSize,
        searchColumn: searchColumn,
        searchText: searchText || undefined,
      }),
    refetchIntervalInBackground: true,
  });

  const getsowData = candidatesResponse?.data?.items || [];
  const hasPrevious = candidatesResponse?.data?.hasPrevious;
  const hasNext = candidatesResponse?.data?.hasNext;
  const totalPages = candidatesResponse?.data?.totalPages;

  const [loader, setLoader] = useState(false);
  const handleClear = () => {
    setSearchColumn("");
    setSearchText("");
    setCurrentPage(1);
  };
  const handleFilterChange = (column: string, text: string) => {
    setSearchColumn(column);
    setSearchText(text);
  };
  const handleApprove = async (candidate: any, status: number) => {
    setLoader(true);
    try {
      const payload = {
        id: candidate?.id,
        newStatus: status,
        type: candidate?.type,
      };
      const res = await api.post(`/Partner/approve-SOW-matrix`, payload);
      if (res.status === 200) {
        toast.success(res.data?.message || "Candidate Approved");
        reFetchData();
      } else {
        toast.error("Error approving candidate");
      }
    } catch (error) {
      toast.error("Error approving candidate");
    }
    setLoader(false);
  };

  return (
    <>

        <Card className="shadow-md bg-white dark:bg-gray-900 text-gray-900 dark:text-white">
          <CardHeader className="border-b bg-gray-50/40 dark:bg-gray-800">
            <div className="flex items-center justify-between">
              <SearchFilter
                filterType={FilterTypeEnum.SOW}
                onFilterChange={handleFilterChange}
                onClear={handleClear}
                placeholder="Search by"
                setCurrentPage={setCurrentPage}
              />
            </div>
          </CardHeader>

          <CardContent className="p-6">
            <ScrollArea className="rounded-md">
              <Table>
                <TableHeader>
                  <TableRow className="bg-teal-200 hover:bg-gray-100 dark:bg-gray-800 dark:hover:bg-gray-700">
                    <TableHead className="w-[50px]"></TableHead>
                    <TableHead className="font-semibold">SOW Number</TableHead>
                    <TableHead className="font-semibold">Start Date</TableHead>
                    <TableHead className="font-semibold">End Date</TableHead>
                    <TableHead className="font-semibold">TC Value</TableHead>
                    <TableHead className="font-semibold">Status</TableHead>
                    <TableHead className="font-semibold">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {getsowData?.map((sow) => (
                    <React.Fragment key={sow.sowNumber}>
                      <TableRow className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleRow(sow.sowNumber)}
                            className="hover:bg-gray-100"
                          >
                            {expandedRows.includes(sow.sowNumber) ? (
                              <ChevronDown className="h-4 w-4 text-gray-500" />
                            ) : (
                              <ChevronRight className="h-4 w-4 text-gray-500" />
                            )}
                          </Button>
                        </TableCell>
                        <TableCell className="font-medium">
                          {sow.sowNumber}
                        </TableCell>
                        <TableCell>{formatDate(sow.startDate)}</TableCell>
                        <TableCell>{formatDate(sow.endDate)}</TableCell>
                        <TableCell className="font-medium">
                          {sow?.tcValue?.toLocaleString("en-IN")}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={sow.status ? "default" : "secondary"}
                            className={`${
                              sow.status
                                ? "bg-green-100 text-green-600 dark:bg-green-900/20 dark:text-green-300"
                                : "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300"
                            }`}
                          >
                            {sow.status ? "Active" : "Inactive"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="outline" className="h-8 p-2">
                                <Menu className="h-4 w-4" />
                                <ChevronDown className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>

                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() => handleApprove(sow, 2)}
                                className="text-green-600 hover:text-green-700"
                              >
                                <Check className="mr-2 h-4 w-4" />
                                Accept
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleApprove(sow, 3)}
                                className="text-red-600 hover:text-red-700"
                              >
                                <X className="mr-2 h-4 w-4" />
                                Reject
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>

                      {/* PO Details Expandable Section */}
                      {expandedRows.includes(sow.sowNumber) && (
                        <TableRow>
                          <TableCell colSpan={7} className="p-0">
                            <div className="p-4 bg-gray-50/30 dark:bg-gray-800 border-l-2 border-[#0958d9]">
                              <div className="flex justify-between items-center mb-4">
                                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-100">
                                  PO Details
                                </h3>
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipContent>
                                      <p>Add new PO to this SOW</p>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              </div>
                              <div className="rounded-md border">
                                <Table>
                                  <TableHeader>
                                    <TableRow className="bg-gray-50 hover:bg-gray-100 dark:bg-gray-800 dark:hover:bg-gray-700">
                                      <TableHead className="font-medium">
                                        PO Number
                                      </TableHead>
                                      <TableHead className="font-medium">
                                        Start Date
                                      </TableHead>
                                      <TableHead className="font-medium">
                                        End Date
                                      </TableHead>
                                      <TableHead className="font-medium">
                                        Value
                                      </TableHead>
                                      <TableHead className="font-medium">
                                        Status
                                      </TableHead>
                                    </TableRow>
                                  </TableHeader>
                                  <TableBody>
                                    {sow?.poDetails?.map((po) => (
                                      <TableRow
                                        key={po.poNumber}
                                        className="hover:bg-gray-50/30"
                                      >
                                        <TableCell>{po.poNumber}</TableCell>
                                        <TableCell>
                                          {formatDate(po.startDate)}
                                        </TableCell>
                                        <TableCell>
                                          {formatDate(po.endDate)}
                                        </TableCell>
                                        <TableCell className="font-medium">
                                          {po?.poValue?.toLocaleString("en-IN")}
                                        </TableCell>
                                        <TableCell>
                                          <Badge
                                            variant={
                                              po.status
                                                ? "default"
                                                : "secondary"
                                            }
                                            className={`${
                                              po.status
                                                ? "bg-green-100 text-green-600"
                                                : "bg-red-100 text-red-800"
                                            }`}
                                          >
                                            {po.status ? "Active" : "Inactive"}
                                          </Badge>
                                        </TableCell>
                                      </TableRow>
                                    ))}
                                  </TableBody>
                                </Table>
                              </div>
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </React.Fragment>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          </CardContent>
          <div className="flex items-center justify-between p-4">
            <div className="text-sm text-gray-500">
              Page {currentPage} of {totalPages}
            </div>
            <Pagination
              value={pageSize}
              totalEntry={candidatesResponse?.data?.totalCount}
              onChange={(newSize) => {
                setPageSize(newSize);
              }}
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
              hasNext={hasNext}
              hasPrevious={hasPrevious}
            />
          </div>
        </Card>
    </>
  );
}
