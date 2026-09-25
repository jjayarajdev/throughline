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
  FileText,
  Menu,
  X,
} from "lucide-react";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import api from "@/lib/axiosInstance";
import Link from "next/link";
import { partnerApi } from "@/services/api/partner.profile.api";
import { candidateApi } from "@/services/api/candidate.api";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
} from "@/components/ui/dropdown-menu";
import { useForm } from "react-hook-form";

import SearchFilter from "@/components/common/SearchFilter";
import { FilterTypeEnum } from "@/constants/FilterTypeEnum";
import ColumnsPopover from "@/components/common/PopoverColumns";
import { ResumePreview } from "@/components/common/ResumePreview";
import Pagination from "@/components/common/Pagination";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { LoadingButton } from "@/components/form-fields/LoadingButton";
import { onboarding } from "@/services/api/onboarding.api";
import { useRouter } from "next/navigation";
import { formatDate } from "@/helpers/helper";
import { useOnboardCandidateStore } from "@/store/useCandidateOnboarding";
interface Partner {
  id: string;
  partnerName: string;
}
interface  Candidate {
    [key: string]: any;
  id:string, 
  hrqId:string,
  candidateCode:string,
  fullName:string,
  email: string,
  phoneNumber: "",
  jobTitle: string,
  relevantExperience: 0, 
  partnerComments: "", 
  resume: {
    attachmentName: "",
    attachmentURL: "",
  },
  partnerName: "",
  existingCandidateCodes: string, 
  status: "pending", 
  isDuplicate: false, 
  candidateBinId: "", 
  candidateId:string
};


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

export function OnboardApprovalTable() {
  const commentForm = useForm({
    defaultValues: {
      comments: "",
    },
  });

 const [columns,setColumns] = useState([
    { id: "hrqId", label: "HRQID", visible: true },
    { id: "candidateCode", label: "Candidate Code", visible: true },
    { id: "candidateName", label: "Candidate Name", visible: true },
    {
      id:"employeeId",
      label:"Employee ID",
      visible: true,
    },
    { id: "resourceTypeName", label: "Resource Type", visible: true },
    { id: "candidateContact", label: "Candidate Contact", visible: true },
    { id: "jobTitle", label: "Role Hired For", visible: true },
    { id: "nickName", label: "Partner", visible: true },
   {
      id:"intakeStatusName",
      label:"Candidate Status",
      visible: true,
    },
    {
      id: "dateOfJoining",
      label: "DOJ",
      visible: true,
    },
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
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(
    null
  );
  const [showCommentDialog, setShowCommentDialog] = useState(false);
  const [actionType, setActionType] = useState<"approve" | "reject" | null>(
    null
  );

   const [pageSize, setPageSize] = useState(50);

  // const { data: partnersData } = useQuery({
  //   queryKey: ["allpartners", selectedPartner],
  //   queryFn: () => partnerApi.getAllPartner(),
  // });

  const {
    data: candidatesResponse,
    isLoading,
    error,
    refetch: reFetchData,
  } = useQuery({
    queryKey: ["onboardApproval", currentPage, searchColumn, searchText,pageSize],
    queryFn: () =>
      onboarding.fetchOnboardApprovalList({
        pageNumber: currentPage,
        pageSize,
        searchColumn: searchColumn,
        searchText: searchText || undefined,
      }),
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
  const handleApprove = async (id:string,candidateId: string, comments: string) => {
    setLoader(true);
    try {
      const payload ={
          candidateId: candidateId,
          approve: true,
          comments: comments,
          candidatePersonalDetailsId:Number(id),
      }
      const res = await api.post(`/CandidateForm/candidate-onboarding-confirmation`,payload);
      if (res.status === 200) {
        toast.success("Candidate Approved");
        reFetchData();
      } else {
        toast.error("Error approving candidate");
      }
    } catch (error) {
      
      toast.error("Error approving candidate");
    }
    setLoader(false);
  };

  const handleReject = async (id: string,candidateId:string, comments: string) => {
    try {
      const res = await api.post(
        `/CandidateForm/candidate-onboarding-confirmation`,
        {
          candidateId: candidateId,
          approve:false,
          comments: comments,
          candidatePersonalDetailsId:Number(id),
        }
      );
      if (res.status === 200) {
        toast.success("Candidate Rejected");
        reFetchData();
      } else {
        toast.error("Error rejecting candidate");
      }
    } catch (error) {
     
      toast.error("Error rejecting candidate");
    }
  };

  const handleCommentSubmit = async (data: any) => {
    
    if (selectedCandidate && actionType) {
      if (actionType === "approve") {
        await handleApprove(selectedCandidate.candidatePersonalDetailsId,selectedCandidate.candidateId, data.comments,);
      } else if (actionType === "reject") {
        await handleReject(selectedCandidate.candidatePersonalDetailsId,selectedCandidate.candidateId, data.comments);
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

const handleCandidateProfile = (candidate:any) => {
    useOnboardCandidateStore.getState().setOnboardCandidate({
      candidateRateCardId: candidate?.candidateRateCardId,
    });
     router.push(
       `/home/candidate-onboarding/candidate-profile?id=${candidate?.candidatePersonalDetailsId}`
     );
  };
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <SearchFilter
                filterType={FilterTypeEnum.CandidateOnboarding_Identified}
                onFilterChange={handleFilterChange}
                onClear={handleClear}
                placeholder="Search by"
                setCurrentPage={setCurrentPage}
                 />

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
              {columns.map((column) => (
                <TableHead key={column.id}>{column.label}</TableHead>
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
              candidates.map((candidate: Candidate) => (
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
                      ):column.id === "dateOfJoining" ? (
                       <h2>
                        {formatDate(candidate?.dateOfJoining)}
                        </h2>
                       ) : column.id === "candidateCode" ? (
                        <Link
                          href={`/home/candidate-management/candidate-profile?id=${candidate.candidateCode}`}
                          className="text-blue-600 hover:text-blue-800 hover:underline"
                        >
                          {candidate.candidateCode}
                        </Link>
                      ):
                       column.id === "employeeId" ? (
                        <button
                          type="button"
                          className="text-blue-600 hover:underline hover:cursor-pointer"
                          onClick={() => handleCandidateProfile(candidate)}
                        >
                          {candidate[column.id]}
                        </button>
                      ): column.id === "actions" ? (
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
                              className="w-[200px]"
                            >
                              <DropdownMenuSub>
                                <DropdownMenuItem
                                  onClick={() => openApproveDialog(candidate)}
                                  className="text-green-600 hover:text-green-700"
                                >
                                  <Check className="mr-2 h-4 w-4" />
                                  Accept
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => openRejectDialog(candidate)}
                                  className="text-red-600 hover:text-red-700"
                                >
                                  <X className="mr-2 h-4 w-4" />
                                  Reject
                                </DropdownMenuItem>
                              </DropdownMenuSub>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      ) : (
                        candidate[column.id]
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
            totalEntry={candidatesResponse?.data?.totalCount}
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
                    loadingText={
                      actionType === "approve" ? "Approving..." : "Rejecting..."
                    }
                  />
                </DialogFooter>
              </form>
            </Form>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
