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
  Plus,
  Pencil,
  Menu,
  CircleChevronDown,
  CirclePlus,
  CloudCog,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ScrollArea } from "@/components/ui/scroll-area";
import { format } from "date-fns";
import { useForm } from "react-hook-form";
import { Form } from "@/components/ui/form";
import { AddSowForm } from "./AddSowForm";
import { AddPoForm } from "./AddPoForm";
import { useParams, useSearchParams } from "next/navigation";
import { partnerApi } from "@/services/api/partner.profile.api";
import { useQuery } from "@tanstack/react-query";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
} from "@/components/ui/dropdown-menu";
import TooltipWrapper from "@/components/tooltio-wrapper";
import { MasterTypes } from "@/constants/masterTypes";
import { useDebounce } from "@/lib/useDebounce";
import Pagination from "@/components/common/Pagination";
interface PODetails {
  poNumber: string;
  startDate: string;
  value: number;
  status: "Active" | "Inactive";
}

interface FormValues {
  sowNumber: string;
  startDate: string;
  endDate: string;
  tcvValue: number;
  status: "Active" | "Inactive";
}

interface SOWDetails {
  sowNumber: string;
  startDate: string;
  endDate: string;
  tcValue: number;
  status: boolean;
  poDetails: PODetails[];
  partnerId: number;
  id: number;
  isActive: boolean;
}

interface EditSowData extends SOWDetails {
  isEditing?: boolean;
  isRateChange?: boolean;
}
type CRType = "rate-change" | "validity-extension" | "value-change" | "others";

export default function SowPoManagement() {
  const [expandedRows, setExpandedRows] = useState<string[]>([]);
  const [crType, setCrType] = useState<
    string | "validity-extension" | "value-change" | "others"
  >("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [showPoForm, setShowPoForm] = useState(false);
  const [selectedSow, setSelectedSow] = useState<EditSowData | null>(null);
  const [selectedPo, setSelectedPo] = useState<PODetails | null>(null);
  const [activeSowNumber, setActiveSowNumber] = useState<string>("");
  const [activeSow, setActiveSow] = useState<SOWDetails | null>(null);
  const [selectedCrType, setSelectedCrType] = useState<number>(0);
  const searchParams = useSearchParams();
  const parnterId = searchParams.get("id") || "";
  const [pageSize, setPageSize] = useState(50);

  const [addPo, setAddPo] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchText, setSearchText] = useState("");
  const debouncedSearch = useDebounce(searchText, 300);

  const [crFlags, setCrFlags] = useState({
    isRateChange: false,
    isValidityExtension: false,
    isValueChange: false,
    isOthers: false,
  });
  const [selectedCRType, setSelectedCRType] = useState<number | null>(null);
  const form = useForm<FormValues>({
    defaultValues: {
      sowNumber: "",
      startDate: "",
      endDate: "",
      tcvValue: 0,
      status: "Active",
    },
  });

  const toggleRow = (sowNumber: string) => {
    setExpandedRows((prev) =>
      prev.includes(sowNumber)
        ? prev.filter((row) => row !== sowNumber)
        : [...prev, sowNumber]
    );
  };

  const handleEdit = (sow: SOWDetails) => {
    setSelectedSow({ ...sow, isEditing: true });
    setShowAddForm(true);
    setCrFlags({
      isRateChange: false,
      isValidityExtension: false,
      isValueChange: false,
      isOthers: false,
    });
  };
  const handleCRSelect = (sow: SOWDetails, type: CRType, crId: number) => {
    setSelectedSow(sow);
    setSelectedCRType(crId);
    setCrFlags({
      isRateChange: type === "rate-change",
      isValidityExtension: type === "validity-extension",
      isValueChange: type === "value-change",
      isOthers: type === "others",
    });
    setCrType(type);
    setShowAddForm(true);
  };

  const handleEditPo = (sow: SOWDetails, po: PODetails) => {
    setSelectedPo(po);
    setActiveSowNumber(sow.sowNumber);
    setShowPoForm(true);
    setCrType("");
  };
  const handleCrValueChange = (
    sow: SOWDetails,
    po: PODetails,
    type: CRType,
    crId: number
  ) => {
    setSelectedPo(po);
    setActiveSowNumber(sow.sowNumber);
    setCrType(type);
    setShowPoForm(true);
    setSelectedCrType(crId);
  };

  const handleOpenAddForm = () => {
    setCrFlags({
      isRateChange: false,
      isValidityExtension: false,
      isValueChange: false,
      isOthers: false,
    });
    setShowAddForm(true);
  };
  const handleCloseAddForm = () => {
    setShowAddForm(false);
    setSelectedSow(null);
  };

  const handleOpenPoForm = (sow: SOWDetails) => {
    setActiveSowNumber(sow.sowNumber);
    setActiveSow(sow);
    setShowPoForm(true);
    setAddPo(true);
    setCrType("");
  };

  const {
    data: getsowDetails,
    refetch: reFetchData,
    isPending,
  } = useQuery({
    queryKey: ["getsowData", parnterId, currentPage, debouncedSearch, pageSize],
    queryFn: () =>
      partnerApi.getSow(parnterId, {
        pageNumber: currentPage,
        pageSize,

        searchText: debouncedSearch || undefined,
      }),
    enabled: !!parnterId,
    refetchOnWindowFocus: true,
  });

  const getsowData = getsowDetails?.items || [];
  const hasPrevious = getsowDetails?.hasPrevious;
  const hasNext = getsowDetails?.hasNext;
  const totalPages = getsowDetails?.totalPages || 1;
  const { data: masterData = [], isPending: isLoading } = useQuery({
    queryKey: ["getMasterData", MasterTypes.MASTERTYPEIDSOW],
    queryFn: () => partnerApi.getMasterData(MasterTypes.MASTERTYPEIDSOW),
    retry: 1,
  });

  const { data: masterDataPO = [], isPending: isPoLoading } = useQuery({
    queryKey: ["getMasterData", MasterTypes.MASTERTYPEIDPO],
    queryFn: () => partnerApi.getPoMasterData(MasterTypes.MASTERTYPEIDPO),
    retry: 1,
  });
  if (isPending)
    return (
      <div className="flex items-center justify-center h-full">Loading...</div>
    );

  return (
    <>
      {showAddForm ? (
        <AddSowForm
          onCancel={handleCloseAddForm}
          initialData={selectedSow || undefined}
          isEditing={!!selectedSow}
          crTypes={crType}
          crFlags={crFlags}
          selectedCRType={selectedCRType}
        />
      ) : showPoForm ? (
        <AddPoForm
           onCancel={() => {
            setShowPoForm(false);
            setSelectedPo(null);
            setActiveSow(null);
          }}
          sowData={activeSow!} // Pass the complete SOW data
          initialData={selectedPo || undefined}
          isEditing={!!selectedPo}
          crType={crType}
          selectedCrType={selectedCrType}
          addPo={addPo}
          sowNumber={activeSowNumber}
        />
      ) : (
        <Form {...form}>
          <Card className="shadow-md bg-white dark:bg-gray-900 text-gray-900 dark:text-white">
            <CardHeader className="border-b bg-gray-50/40 dark:bg-gray-800">
              <div className="flex items-center justify-between">
                <CardTitle className="text-2xl font-semibold text-gray-900 dark:text-white">
                  SOW Management
                </CardTitle>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="default"
                        className="gap-2 bg-[#007E61] hover:bg-[#006D54]"
                        onClick={handleOpenAddForm}
                      >
                        <Plus className="h-4 w-4" /> Add New SOW
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Create a new SOW</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <ScrollArea className="rounded-md">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-teal-200 hover:bg-gray-100 dark:bg-gray-800 dark:hover:bg-gray-700">
                      <TableHead className="w-[50px]"></TableHead>
                      <TableHead className="font-semibold">
                        SOW Number
                      </TableHead>
                      <TableHead className="font-semibold">
                        Start Date
                      </TableHead>
                      <TableHead className="font-semibold">End Date</TableHead>
                      <TableHead className="font-semibold">TC Value</TableHead>
                      <TableHead className="font-semibold">Approval Status</TableHead>
                      <TableHead className="font-semibold">Status</TableHead>
                      <TableHead className="font-semibold">
                        Actions
                      </TableHead>
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
                          <TableCell>
                            {format(new Date(sow.startDate), "yyyy-MM-dd")}
                          </TableCell>
                          <TableCell>
                            {format(new Date(sow.endDate), "yyyy-MM-dd")}
                          </TableCell>
                          <TableCell className="font-medium">
                            {sow?.tcValue.toLocaleString("en-IN")}
                          </TableCell>
                          <TableCell className="px-4 py-2">
                                            {sow.approvalStatusId === 1 && (
                                           <span className="text-red-500 font-medium">Pending</span>
                                            )}
                                          {sow.approvalStatusId === 2 && (
                                            <span className="text-green-600 font-medium">Approved</span>
                                             )}
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
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <TooltipWrapper content="Edit">
                                    <DropdownMenu>
                                      <DropdownMenuTrigger asChild>
                                        <Button
                                          disabled={!sow.status}
                                          variant="outline"
                                          className="h-8 p-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                                        >
                                          <Menu />
                                          <ChevronDown />
                                        </Button>
                                      </DropdownMenuTrigger>

                                      <DropdownMenuContent
                                        align="end"
                                        className="w-[200px]"
                                      >
                                        <DropdownMenuItem
                                          onClick={() => handleEdit(sow)}
                                        >
                                          <Pencil className="h-3 w-3" />
                                          Edit
                                        </DropdownMenuItem>

                                        <DropdownMenuSub>
                                          <DropdownMenuSubTrigger className="pr-0 after:content-none after:w-0 after:h-0 after:m-0 after:p-0 after:border-0">
                                            <CircleChevronDown className="h-4 w-4 text-gray-500 mr-2" />
                                            CR
                                          </DropdownMenuSubTrigger>

                                          <DropdownMenuSubContent className="w-[220px]">
                                            {masterData.map((item: any) => (
                                              <DropdownMenuItem
                                                key={item.id}
                                                onClick={() =>
                                                  handleCRSelect(
                                                    sow,
                                                    item.name
                                                      .toLowerCase()
                                                      .replace(/\s+/g, "-"),
                                                    item.id
                                                  )
                                                }
                                              >
                                                {item.name}
                                              </DropdownMenuItem>
                                            ))}
                                          </DropdownMenuSubContent>
                                        </DropdownMenuSub>

                                        <DropdownMenuItem
                                          onClick={() => handleOpenPoForm(sow)}
                                        >
                                          <CirclePlus className="h-3 w-3" />
                                          New PO
                                        </DropdownMenuItem>
                                      </DropdownMenuContent>
                                    </DropdownMenu>
                                  </TooltipWrapper>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Edit SOW details</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </TableCell>
                        </TableRow>

                        {/* PO Details Expandable Section */}
                        {expandedRows.includes(sow.sowNumber) && (
                          <TableRow>
                            <TableCell colSpan={8} className="p-0">
                              <div className="p-4 bg-gray-50/30 dark:bg-gray-800 border-l-2 border-[#007E61]">
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
                                  <Table className="w-full">
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
                                        <TableHead className="font-medium">
                                          Actions
                                        </TableHead>
                                      </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                      {sow.poDetails.map((po) => (
                                        <TableRow
                                          key={po.poNumber}
                                          className="hover:bg-gray-50/30"
                                        >
                                          <TableCell>{po.poNumber}</TableCell>
                                          <TableCell>
                                            {format(
                                              new Date(po.startDate),
                                              "yyyy-MM-dd"
                                            )}
                                          </TableCell>
                                          <TableCell>
                                            {format(
                                              new Date(po.endDate),
                                              "yyyy-MM-dd"
                                            )}
                                          </TableCell>
                                          <TableCell className="font-medium">
                                            {po.poValue?.toLocaleString(
                                              "en-IN"
                                            )}
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
                                              {po.status
                                                ? "Active"
                                                : "Inactive"}
                                            </Badge>
                                          </TableCell>
                                          <TableCell>
                                            <TooltipProvider>
                                              <Tooltip>
                                                <TooltipTrigger asChild>
                                                  <DropdownMenu>
                                                    <DropdownMenuTrigger
                                                      asChild
                                                    >
                                                      <Button
                                                        disabled={!po.status}
                                                        variant="outline"
                                                        className="h-8 p-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                                                      >
                                                        <Menu />
                                                        <ChevronDown />
                                                      </Button>
                                                    </DropdownMenuTrigger>

                                                    <DropdownMenuContent
                                                      align="end"
                                                      className="w-[200px]"
                                                    >
                                                      {/* Edit Option */}
                                                      <DropdownMenuItem
                                                        onClick={() =>
                                                          handleEditPo(sow, po)
                                                        }
                                                      >
                                                        <Pencil className="h-3 w-3" />
                                                        Edit
                                                      </DropdownMenuItem>

                                                      {/* CR Submenu */}
                                                      <DropdownMenuSub>
                                                        <DropdownMenuSubTrigger className="pr-0 after:content-none after:w-0 after:h-0 after:m-0 after:p-0 after:border-0">
                                                          <CircleChevronDown className="h-4 w-4 text-gray-500 mr-2" />
                                                          CR
                                                        </DropdownMenuSubTrigger>

                                                        <DropdownMenuSubContent className="w-[220px]">
                                                          {masterDataPO.map(
                                                            (item: any) => (
                                                              <DropdownMenuItem
                                                                key={item.id}
                                                                onClick={() =>
                                                                  handleCrValueChange(
                                                                    sow,
                                                                    po,
                                                                    item.name
                                                                      .toLowerCase()
                                                                      .replace(
                                                                        /\s+/g,
                                                                        "-"
                                                                      ),
                                                                    item.id
                                                                  )
                                                                }
                                                              >
                                                                {item.name}
                                                              </DropdownMenuItem>
                                                            )
                                                          )}
                                                        </DropdownMenuSubContent>
                                                      </DropdownMenuSub>
                                                    </DropdownMenuContent>
                                                  </DropdownMenu>
                                                </TooltipTrigger>
                                                <TooltipContent>
                                                  <p>Edit PO details</p>
                                                </TooltipContent>
                                              </Tooltip>
                                            </TooltipProvider>
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
                totalEntry={getsowDetails?.totalCount}
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
        </Form>
      )}
    </>
  );
}
