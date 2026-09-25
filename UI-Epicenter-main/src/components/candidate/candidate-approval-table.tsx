"use client";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowDownIcon,
  ArrowUpIcon,
  Check,
  ChevronDown,
  Columns4,
  Eye,
  FileText,
  Menu,
  X,
} from "lucide-react";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "@/lib/toast";
import api from "@/lib/axiosInstance";
import Link from "next/link";
import { partnerApi } from "@/services/api/partner.profile.api";
import { candidateApi } from "@/services/api/candidate.api";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ResumePreview } from "../common/ResumePreview";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "../ui/form";
import { Textarea } from "../ui/textarea";
import { useForm } from "react-hook-form";
import Pagination from "../common/Pagination";
import SearchFilter from "../common/SearchFilter";
import ColumnsPopover from "../common/PopoverColumns";
import { FilterTypeEnum } from "@/constants/FilterTypeEnum";
import { useRouter } from "next/navigation";
import { LoadingButton } from "../form-fields/LoadingButton";



interface Partner {
  id: string;
  partnerName: string;
}

interface Candidate {
  id: string;
  hrqId: string;
  candidateCode: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  jobTitle: string;
  relevantExperience: number;
  partnerComments: string;
  resume: {
    attachmentName: string;
    attachmentURL: string;
  };
  partnerName: string;
  existingCandidateCodes: string;
  status: "pending" | "approved" | "rejected";
  isDuplicate: boolean;
  candidateBinId: string;
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

export function CandidateApprovalTable() {
  const commentForm = useForm({
    defaultValues: {
      comments: "",
    },
  });

  const [columns, setColumns] = useState<Column[]>([
    { id: "hrqId", label: "HRQID", visible: true },
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
    { id: "partnerComments", label: "Partner's Comment", visible: true },
    { id: "existingCandidateCodes", label: "ExistingCandidate", visible: true },
    { id: "actions", label: "Actions", visible: true },
  ]);

  const [selectedPartner, setSelectedPartner] = useState<string | null>(null);
    const [sortConfig, setSortConfig] = useState<SortConfig>({
    key: "",
    direction: "desc",
  });
  const [searchText, setSearchText] = useState("");
  const [searchColumn, setSearchColumn] = useState<string>("");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedCandidate, setSelectedCandidate] = useState<string>("");
  const [showCommentDialog, setShowCommentDialog] = useState(false);
  const [actionType, setActionType] = useState<"approve" | "reject" | null>(
    null
  );

   const [pageSize, setPageSize] = useState(50);

  const { data: partnersData } = useQuery({
    queryKey: ["allpartners", selectedPartner],
    queryFn: () => partnerApi.getAllPartner(),
  });

  const {
    data: candidatesResponse,
    isLoading,
    error,
    refetch: reFetchData,
  } = useQuery({
    queryKey: ["candidatesApproval", currentPage, searchColumn, searchText,selectedPartner,pageSize],
    queryFn: () =>
      candidateApi.fetchCandidateApprovalList({
        pageNumber: currentPage,
        pageSize,
        searchColumn: searchColumn,
        searchText: searchText || undefined,
      },Number(selectedPartner)),
    refetchIntervalInBackground: true,
    refetchOnWindowFocus: true,
  });

  if (error) {
    toast.error("Failed to fetch candidates");
  }

  const openApproveDialog = (candidate: Candidate) => {
    setSelectedCandidate(candidate);
    setActionType("approve");
    setShowCommentDialog(true);
  };

  const openRejectDialog = (candidate: Candidate) => {
    setSelectedCandidate(candidate);
    setActionType("reject");
    setShowCommentDialog(true);
  };
const [loader,setLoader] = useState(false);
  const handleApprove = async (candidateBinId: string, comments: string,candidateCode:string) => {
    setLoader(true);
    try {
      const payload ={
     candidateBinId: candidateBinId,
          isApproved: true,
          hmComments: comments,
          existingCandidateCode: candidateCode,
      }
      const res = await api.patch(`CandidateBin/manage-candidate-approval/${candidateBinId}`,payload);
      if (res.status === 200) {
        toast.success("Candidate Approved");
        reFetchData();
      } else {
        toast.error("Error approving candidate");
      }
    } catch (error:any) {
      toast.error(error?.response?.data?.message || "Unexpected error occurred");
    }
    setLoader(false);
  };

  const handleReject = async (candidateBinId: string, comments: string) => {
    try {
      const res = await api.patch(
        `CandidateBin/manage-candidate-approval/${candidateBinId}`,
        {
          candidateBinId: candidateBinId,
          isApproved: false,
          hmComments: comments,
        }
      );
      if (res.status === 200) {
        toast.success("Candidate Rejected");
        reFetchData();
      } else {
        toast.error("Error rejecting candidate");
      }
    } catch (error) {
     toast.error(error?.response?.data?.message || "Unexpected error occurred");
    }
  };

  const handleCommentSubmit = async (data: {
    existingCandidateCodes: any; comments: string 
}) => {
    if (selectedCandidate && actionType) {
      if (actionType === "approve") {
        await handleApprove(selectedCandidate.candidateBinId, data.comments,selectedCandidate.existingCandidateCodes);
      } else if (actionType === "reject") {
        await handleReject(selectedCandidate.candidateBinId, data.comments);
      }

      setShowCommentDialog(false);
      commentForm.reset();
      setSelectedCandidate(null);
      setActionType(null);
    }
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
      // if (!sortConfig || sortConfig.key !== columnId) {
    //   return null;
    // }
     return (sortConfig?.direction === "asc"&& sortConfig?.key ===columnId) ? (
      <ArrowUpIcon className="h-4 w-4 ml-1" />
    ) : (
      <ArrowDownIcon className="h-4 w-4 ml-1" />
    );
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
  const candidates = candidatesResponse?.data?.items || [];
  const hasPrevious = candidatesResponse?.data.hasPrevious;
  const hasNext = candidatesResponse?.data.hasNext;
  const totalPages = candidatesResponse?.data.totalPages;
  const currentPageNumber = candidatesResponse?.data.currentPage;
const router = useRouter();
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex gap-2 flex-1">
          <Select
            value={selectedPartner || ""}
            onValueChange={(value) => setSelectedPartner(value)}
          >
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Select Partner" />
            </SelectTrigger>
            <SelectContent>
              {partnersData?.data?.map((partner: Partner) => (
                <SelectItem key={partner.id} value={partner.id}>
                  {partner.partnerName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
             <SearchFilter
          filterType={FilterTypeEnum.CandidateApprovalGrid}
             onFilterChange={handleFilterChange}
          onClear={handleClear}
          placeholder="Search by"
          setCurrentPage={setCurrentPage}
        />
        </div>
     
        <ColumnsPopover
          columns={columns}
          toggleColumn={toggleColumn}
          screeningData={candidates}
          buttonName="candidates-details"
        />
      </div>

      <div className="bg-gray-50 dark:bg-gray-900 rounded-lg shadow">
        <Table>
          <TableHeader>
            <TableRow className="bg-teal-200 dark:bg-gray-700">
              {visibleColumns.map((column) => (
                <TableHead
                  key={column.id}
                  className={
                    column.sortable ? "cursor-pointer select-none" : ""
                  }
                >
                  {column.label}
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
                <TableRow key={candidate.candidateBinId}>
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
                      ) :
                      column.id === "resume" ? (
                        candidate.resume?.attachmentURL ? (
                          <ResumePreview
                            url={candidate.resume.attachmentURL}
                            fileName={`${candidate.fullName}'s Resume`}
                          />
                        ) : (
                          <span className="text-gray-400">No resume</span>
                        )
                      ) : column.id === "jobTitle" ? (
                        candidate.jobTitle
                          ?.split(",")
                          .map((title: string, index: number) => (
                            <div key={index}>{title.trim()}</div>
                          ))
                      ) : column.id === "existingCandidateCodes" ? (
                        <div className="max-h-24 flex flex-col gap-y-1 overflow-y-auto">
                     
                              <Link
                                href={`/home/candidate-management/candidate-profile?id=${candidate?.existingCandidateCode}`}
                                className="text-green-600 hover:text-green-600 hover:underline"
                              >
                                {candidate?.existingCandidateCode}
                              </Link>
                      
                        </div>
                      ) : column.id === "partnerComments" ? (
                         <Dialog>
                            <DialogTrigger asChild>
                              <Button variant="outline" className="text-[12px]" size="sm">
                                View
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-3xl rounded-2xl p-6 shadow-2xl bg-background dark:bg-zinc-900 border border-border">
                              <DialogHeader className="mb-2">
                                <DialogTitle className="text-2xl font-bold text-foreground leading-snug">
                                  💬 Partner Comments
                                </DialogTitle>
                               
                              </DialogHeader>

                              <div className="mt-4 max-h-[400px] overflow-y-auto p-5 bg-muted rounded-lg border border-muted-foreground/10">
                                <p className="text-base leading-relaxed text-foreground tracking-tight whitespace-pre-wrap">
                                  {candidate?.partnerComments ||
                                    "No comments available."}
                                </p>
                              </div>
                            </DialogContent>
                          </Dialog>
                      ) : column.id === "actions" ? (
                        <div className="flex items-center gap-2">
                          <DropdownMenu modal={false}>
                            <DropdownMenuTrigger asChild>
                              <Button variant="outline" className="h-8 p-2">
                                <Menu className="h-4 w-4" />
                                <ChevronDown className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent
                              align="end"
                              className="w-[160px]"
                            >
                              <DropdownMenuItem
                                onClick={() => openApproveDialog(candidate)}
                                className="h-8 text-green-600 hover:text-green-700"
                              >
                                <Check className="h-4 w-4 mr-2" />
                                Accept
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => openRejectDialog(candidate)}
                                className="h-8 text-red-600 hover:text-red-700"
                              >
                                <X className="h-4 w-4 mr-2" />
                                Reject
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
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

      {/* Comment Dialog */}
      <Dialog open={showCommentDialog} onOpenChange={setShowCommentDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>
              {actionType === "approve"
                ? "Approve Candidate"
                : "Reject Candidate"}
            </DialogTitle>
            <DialogDescription>
              {actionType === "approve"
                ? "Please provide a comment for approving this candidate."
                : "Please provide a reason for rejecting this candidate."}
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4">
            <Form {...commentForm}>
              <form
                onSubmit={commentForm.handleSubmit(handleCommentSubmit)}
                className="space-y-6"
              >
                <FormField
                  control={commentForm.control}
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
                      setShowCommentDialog(false);
                      commentForm.reset();
                      setSelectedCandidate(null);
                      setActionType(null);
                    }}
                  >
                    Cancel
                  </Button>
                    <LoadingButton
                    loading={loader}
                    text={actionType === "approve" ? "Approve" : "Reject"}
                    loadingText={actionType === "approve" ? "Approving..." : "Rejecting..."}
                  />
                  {/* <Button
                    type="submit"

                    className={
                      actionType === "approve"
                        ? "bg-green-600 hover:bg-green-700"
                        : "bg-red-600 hover:bg-red-700"
                    }
                  >
                    {actionType === "approve" ? "Approve" : "Reject"}
                  </Button> */}
                </DialogFooter>
              </form>
            </Form>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
