"use client";

import TooltipWrapper from "@/components/tooltio-wrapper";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  ArrowDownIcon,
  ArrowUpIcon,
  ChevronDown,
  Columns4,
  Download,
  Eye,
  FileText,
  Menu,
  Pencil,
  PencilIcon,
  Plus,
  Send,
  ShoppingCart,
  Upload,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { candidateApi } from "@/services/api/candidate.api";
import { toast } from "sonner";
import api from "@/lib/axiosInstance";
import { FileField } from "../form-fields/FileField";
import { useForm } from "react-hook-form";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { useUserStore } from "@/store/userStore";
import { ResumePreview } from "../common/ResumePreview";
import { Textarea } from "@/components/ui/textarea";
import ColumnsPopover from "../common/PopoverColumns";
import SearchFilter from "../common/SearchFilter";
import { FilterTypeEnum } from "@/constants/FilterTypeEnum";
import { AxiosError } from "axios";
import Pagination from "../common/Pagination";
import { sortData } from "@/helpers/helper";

export const searchList = [
  {
    id: "HrqId",
    name: "HRQID",
  },
];

interface Candidate {
  id: string;
  hrqId: string;
  candidateCode: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  jobTitle: string;
  relevantExperience: number;
  resume: {
    attachmentName: string;
    attachmentURL: string;
  };
  partnerName: string;
  acknowledged: boolean;
  intakeStatus: string;
  termsAccepted: boolean;
  isDuplicate: boolean;
  isAgreedForTermsConditions: boolean;
}

interface Column {
  id: keyof Candidate | "actions" | "addToCart" | "termsAndConditions";
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
} | null;

export function CandidateBinTable() {
  const router = useRouter();
  const form = useForm({
    defaultValues: {
      resume: {
        attachmentName: "",
        attachmentURL: "",
      },
    },
  });

  const exceptionForm = useForm({
    defaultValues: {
      comments: "",
    },
  });

  const [columns, setColumns] = useState<Column[]>([
    { id: "hrqId", label: "HRQID", visible: true, sortable: true },
    { id: "fullName", label: "Candidate Name", visible: true, sortable: false },
    { id: "email", label: "Candidate Email", visible: true, sortable: false },
    { id: "phoneNumber", label: "Candidate Contact", visible: true },
    { id: "jobTitle", label: "Role Hired For", visible: true, sortable: false },
    {
      id: "relevantExperience",
      label: "Experience",
      visible: true,
      sortable: false,
    },
    { id: "resume", label: "Resume", visible: true },
    { id: "nickName", label: "Partner", visible: true },
    { id: "termsAndConditions", label: "Terms & Conditions", visible: true },
    { id: "actions", label: "Actions", visible: true },
  ]);

  const [sortConfig, setSortConfig] = useState<SortConfig>({
    sortColumns: [],
  });
  const [searchText, setSearchText] = useState("");
  const [searchColumn, setSearchColumn] = useState("");
  const { userId } = useUserStore();
  const [currentPage, setCurrentPage] = useState(1);
  const [showTermsDialog, setShowTermsDialog] = useState(false);
  const [showResumeDialog, setShowResumeDialog] = useState(false);
  const [showExceptionDialog, setShowExceptionDialog] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState<any>(null);
  const queryClient = useQueryClient();
  const [pageSize, setPageSize] = useState(50);

  const {
    data: candidatesResponse,
    isLoading,
    error,
    refetch: reFetchData,
  } = useQuery({
    queryKey: ["candidatesBin", currentPage, searchColumn, searchText, pageSize, sortConfig],
    queryFn: () =>
      candidateApi.fetchBinCandidateList(
        {
          pageNumber: currentPage,
          pageSize,
          searchColumn: searchColumn,
          searchText: searchText || undefined,
          sortColumns: sortConfig.sortColumns
        },
        userId
      ),
    enabled: !!searchColumn,
    refetchOnWindowFocus: true,
  });

  if (error) {
    toast.error( error?.response?.data?.message || "Failed to fetch candidates");
  }

  const handleSort = (column: string) => {
    const columnIndex = sortConfig.sortColumns.findIndex(
      (sort) => sort.column === column
    );
    
    let newSortColumns: SortColumn[] = [...sortConfig.sortColumns];
    
    if (columnIndex >= 0) {
      newSortColumns[columnIndex] = {
        ...newSortColumns[columnIndex],
        descending: !newSortColumns[columnIndex].descending
      };
    } else {
      newSortColumns = [
        { column, descending: true },
        ...newSortColumns.slice(0, 2)
      ];
    }
    
    setSortConfig({ sortColumns: newSortColumns });
  };

  const handleTermsClick = (candidate: any) => {
    if (!candidate.resume?.attachmentURL) {
      toast.error("Please upload resume first");
      return;
    }
    if (candidate.isDuplicate) {
      toast.error("Duplicate candidate needs approval first");
      return;
    }
    setSelectedCandidate(candidate);
    setShowTermsDialog(true);
  };

  const handleResumeUpload = (candidate: any) => {
    setSelectedCandidate(candidate);
    setShowResumeDialog(true);
    form.reset();
  };

  const handleResumeSubmit = async (data: any) => {
    if (selectedCandidate && data.resume) {
      try {
        const res = await api.put(`/CandidateBin/${selectedCandidate.candidateBinId}`, {
          ...selectedCandidate,
          resume: {
            attachmentName: data.resume.attachmentName,
            attachmentURL: data.resume.attachmentURL,
          },
        });
        toast.success("Resume uploaded successfully");
        setShowResumeDialog(false);
        form.reset();
        reFetchData();
      } catch (error) {
        console.error(error);
        toast.error("Error uploading resume");
      }
    }
  };

  const handleTermsAccept = async () => {
    if (selectedCandidate) {
      try {
        await api.patch(
          `/CandidateBin/Acknowledge/${selectedCandidate.candidateBinId}?isAgreedTerms=true`
        );
        reFetchData();
        setShowTermsDialog(false);
      } catch (error) {
        if (error instanceof AxiosError && error.response?.data?.message) {
          toast.error(error.response.data?.message || "Error accepting terms");
        } else {
          toast.error("An unexpected error occurred");
        }
      }
    }
  };

  const toggleColumn = (columnId: string) => {
    setColumns(
      columns.map((col) =>
        col.id === columnId ? { ...col, visible: !col.visible } : col
      )
    );
  };

  const handleRequestException = async (candidateId: string) => {
    setSelectedCandidate({ candidateBinId: candidateId });
    setShowExceptionDialog(true);
  };

  const handleExceptionSubmit = async (data: { comments: string }) => {
    if (selectedCandidate) {
      try {
        await api.patch(
          `/CandidateBin/request-for-exception/${selectedCandidate.candidateBinId}`,
          {
            candidateBinId: selectedCandidate.candidateBinId,
            partnerComments: data.comments,
          }
        );
        toast.success("Approval sent successfully");
        setShowExceptionDialog(false);
        exceptionForm.reset();
        setSelectedCandidate(null);
        reFetchData();
      } catch (error) {
        console.error(error);
        const axiosError = error as AxiosError<{ message: string }>;
        toast.error(
          axiosError?.response?.data?.message ||
          "Error sending approval request"
        );
      }
    }
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
        {sortConfig.sortColumns.length > 1 && columnIndex > 0 && (
          <span className="ml-1 text-xs font-medium bg-gray-200 dark:bg-gray-700 rounded-full w-4 h-4 flex items-center justify-center">
            {columnIndex + 1}
          </span>
        )}
      </div>
    );
  };

  const candidates = candidatesResponse?.data?.items || [];
  // No client-side sorting
  const sortedCandidates = candidates;
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
          <ColumnsPopover
            columns={columns}
            toggleColumn={toggleColumn}
            screeningData={candidates}
            buttonName="candidate-details"
          />
          <TooltipWrapper content="Create New candidate">
            <Button
              variant="ghost"
              size="sm"
              className="h-9 text-[#007E61] hover:text-[#007E61] hover:bg-[#E6F4F1] dark:text-[#00cc99] dark:hover:bg-[#11332b]"
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
        <Table>
          <TableHeader>
            <TableRow className="bg-teal-200 dark:bg-gray-700">
              {visibleColumns.map((column) => (
                <TableHead
                  key={column.id}
                  className={`whitespace-nowrap text-[11px] ${
                   column.sortable ? "cursor-pointer select-none" : ""
                   }`
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
                <TableRow
                  key={candidate.candidateBinId}
                  className={
                    candidate.isDuplicate
                      ? "bg-red-100 hover:bg-red-200 text-[11px]  dark:bg-red-900"
                      : "text-[11px]" 
                  }
                >
                  {visibleColumns.map((column) => (
                    <TableCell key={`${candidate.id}-${column.id}`}>
                      {column.id === "hrqId" ? (
                        <h2
                          className="text-[#00b388] font-medium hover:cursor-pointer underline"
                          onClick={() =>
                            router.push(
                              `/home/hiring-details?hrqid=${candidate.hrqId}`
                            )
                          }
                        >
                          {candidate.hrqId}
                        </h2>
                      ) :
                        column.id === "resume" ? (
                          candidate.resume?.attachmentURL ? (
                            <ResumePreview
                              url={candidate.resume.attachmentURL}
                              fileName={`${candidate.fullName}'s Resume`}
                            />
                          ) : (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="p-0"
                              onClick={() => handleResumeUpload(candidate)}
                            >
                              <Upload className="h-4 w-4" />
                              Upload
                            </Button>
                          )
                        ) : column.id === "jobTitle" ? (
                          candidate.jobTitle
                            ?.split(",")
                            .map((title: string, index: number) => (
                              <div key={index}>{title.trim()}</div>
                            ))
                        ) : column.id === "termsAndConditions" ? (
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id={`terms-${candidate.id}`}
                              checked={candidate.isAgreedForTermsConditions}
                              disabled
                            />
                            {candidate.isDuplicate ? (
                              <span className="text-[11px] text-red-600">
                                {candidate.resume?.attachmentURL
                                  ? "Send for approval"
                                  : "Upload resume first"}
                              </span>
                            ) : (
                              <label
                                htmlFor={`terms-${candidate.id}`}
                                className={`text-[11px] ${candidate.resume?.attachmentURL
                                  ? "text-blue-600 cursor-pointer hover:underline"
                                  : "text-gray-400"
                                  }`}
                                onClick={() => handleTermsClick(candidate)}
                              >
                                {candidate.isAgreedForTermsConditions
                                  ? "Agreed"
                                  : "Click to agree"}
                              </label>
                            )}
                          </div>
                        ) : column.id === "actions" ? (
                          <div className="flex items-center gap-2">
                            <TooltipWrapper content="Edit">
                              <DropdownMenu modal={false}>
                                <DropdownMenuTrigger className="w-12 h-6 rounded-sm" asChild>
                                  <Button  disabled={!candidate.isDuplicate} variant="outline">
                                    <Menu className="size-3" />
                                    <ChevronDown className="size-3" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent
                                  align="end"
                                  // className="w-[160px]"
                                >
                                  {/* <DropdownMenuItem
                                    onClick={() =>
                                      router.push(
                                        `/home/candidate-management/edit-review-candidate?id=${candidate.candidateBinId}`
                                      )
                                    }
                                  >
                                    <PencilIcon className="h-4 w-4 text-green-600" />
                                    Edit
                                  </DropdownMenuItem> */}
                                  {candidate.isDuplicate && (
                                    <DropdownMenuItem
                                      disabled={!candidate.resume?.attachmentURL || candidate.isRequestException}
                                      onClick={() =>
                                        handleRequestException(
                                          candidate.candidateBinId
                                        )
                                      }
                                      className="text-[11px]"
                                    >
                                      <Send className="size-3 text-green-600" />
                                      Request Exception
                                    </DropdownMenuItem>
                                  )}
                                </DropdownMenuContent>
                              </DropdownMenu>
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

      <Dialog open={showTermsDialog} onOpenChange={setShowTermsDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Terms and Conditions</DialogTitle>
            <div className="max-h-[60vh] overflow-y-auto mt-4">
              <div className="space-y-4">
                <h3 className="font-semibold">1. Introduction</h3>
                <p>
                  These Terms and Conditions govern your use of our candidate
                  intake system. By using this system, you agree to these terms
                  in full.
                </p>

                <h3 className="font-semibold">2. Data Privacy</h3>
                <p>
                  We are committed to protecting candidate data and comply with
                  all relevant data protection laws. All information submitted
                  will be handled confidentially.
                </p>

                <h3 className="font-semibold">3. Responsibilities</h3>
                <p>You agree to:</p>
                <ul className="list-disc pl-6">
                  <li>Provide accurate and complete information</li>
                  <li>Maintain the confidentiality of candidate data</li>
                  <li>Use the system only for its intended purpose</li>
                  <li>Comply with all applicable laws and regulations</li>
                </ul>

                <h3 className="font-semibold">4. Usage Guidelines</h3>
                <p>
                  The system must be used in accordance with our usage
                  guidelines, which prohibit any unauthorized or malicious
                  activities.
                </p>
              </div>
            </div>
          </DialogHeader>
          <DialogFooter className="mt-6">
            <Button type="button" variant="outline" onClick={() => setShowTermsDialog(false)}>
              Cancel
            </Button>
            <Button
            type="submit"
              onClick={handleTermsAccept}
              className="bg-[#00b388] hover:bg-[#009e79]"
            >
              Accept
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showResumeDialog} onOpenChange={setShowResumeDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upload Resume</DialogTitle>
            <DialogDescription>
              Please upload the candidate's resume in PDF, DOC, or DOCX format.
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4">
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(handleResumeSubmit)}
                className="space-y-6"
              >
                <FileField
                  control={form.control}
                  name="resume"
                  label="Resume"
                  accept=".ppt,.pptx,.pdf,.doc,.docx"
                  required
                />
                <DialogFooter>
                  <Button
                  type="button"
                    variant="outline"
                    onClick={() => setShowResumeDialog(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                  disabled={!form.watch("resume").attachmentURL}
                    type="submit"
                    className="bg-[#00b388] hover:bg-[#009e79]"
                  >
                    Upload
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog
        open={showExceptionDialog}
        onOpenChange={(open) => {
          if (!open) {
            exceptionForm.reset();
            setSelectedCandidate(null);
          }
          setShowExceptionDialog(open);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Request Exception</DialogTitle>
            <DialogDescription>
              Please provide a reason for requesting an exception for this
              candidate.
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4">
            <Form {...exceptionForm}>
              <form
                onSubmit={exceptionForm.handleSubmit(handleExceptionSubmit)}
                className="space-y-6"
              >
                <FormField
                  control={exceptionForm.control}
                  name="comments"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Comments</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Enter your comments here..."
                          className="min-h-[100px]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowExceptionDialog(false);
                      exceptionForm.reset();
                      setSelectedCandidate(null);
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    className="bg-[#00b388] hover:bg-[#009e79]"
                  >
                    Submit Request
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
