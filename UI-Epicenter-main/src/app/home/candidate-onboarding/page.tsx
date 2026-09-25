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
import { ArrowDownIcon, ArrowUpIcon, Check, ChevronDown, Eye, Filter, Menu, PauseCircle, Pencil, X } from "lucide-react";
import { FolderCode, UserPlus } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import Pagination from "@/components/common/Pagination";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery } from "@tanstack/react-query";
import { onboarding } from "@/services/api/onboarding.api";
import { useDebounce } from "@/lib/useDebounce";
import SearchFilter from "@/components/common/SearchFilter";
import { FilterTypeEnum } from "@/constants/FilterTypeEnum";
import { isPartner, isVendorManager, useUserStore } from "@/store/userStore";
import ColumnsPopover from "@/components/common/PopoverColumns";
import { useOnboardCandidateStore } from "@/store/useCandidateOnboarding";
import { formatDate, sortData } from "@/helpers/helper";
import Link from "next/link";
import TableSkeletonLoader from "@/components/skelton/TableSkelton";
import { MoveSidebar } from "./candidate-sidebar/MoveSidebar";
import { isToday } from "date-fns";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
export interface Resume {
  id: number;
  attachmentName: string;
  attachmentURL: string;
}

type SortConfig = {
  key:any;
  direction: "asc" | "desc";
} | null;
export interface CandidateItem {
  [key: string]: any; 
  partnerId: number;
  partnerName: string;
  hiringStatusId: number;
  hiringStatusName: string;
  jobTitle: string;
  candidateCode: string;
  isSingleEntry: boolean;
  hiringRequestId: number;
  hrqId: string;
  fullName: string;
  phoneNumber: string;
  email: string;
  skills: number[]; 
  resourceTypeId: number;
  countryId: number;
  stateId: number;
  cityId: number;
  diversity: string;
  noticePeriod: number;
  relevantExperience: number;
  currentlyWorking: string;
  currentCTC: number;
  resume: Resume;
  requestedMicrosoftAccount: boolean;
  consideredForFutureRequirements: boolean;
  intakeStatusId: number;
  intakeStatusName: string;
  isAgreedForTermsConditions: boolean;
  enableCandidateHrqTransfer: boolean;
  isParentHrq: boolean;
  id: number;
  isActive: boolean;
}
type TabKey = "candidate_identified" | "candidates_offered" | "candidates_declined" | "view_Joiners";


const CANDIDATE_IDENTIFIED = 12004;    
const OPEN_WIP           = 12002;    
const INTAKE_IDENTIFIED  = 15009;
const OFFERED_ACCEPTED = 15011;
const On_Hold=12005
export default function CandidateOnboardingPage() {
  const router = useRouter();
  const [columns,setColumns] = useState([
    { id: "hrqId", label: "HRQID", visible: true,sortable:true },
    { id: "candidateCode", label: "Candidate Code", visible: true,sortable:true },
    { id: "fullName", label: "Candidate Name", visible: true,sortable:true },
    {
      id:"employeeId",
      label:"Employee ID",
      visible: true,
     
    },
    { id: "resourceTypeName", label: "Resource Type", visible: true },
    { id: "phoneNumber", label: "Candidate Contact", visible: true },
    { id: "jobTitle", label: "Role Hired For", visible: true },
    { id: "nickName", label: "Partner", visible: true},
    // { id: "pcIssueTat", label: "PC Issue TAT", visible: true },
    // {
    //   id: "releaseToOpsTat",
    //   label: "Release to Operations TAT",
    //   visible: true,
    // },
    // {
    //   id: "finalConfigTat",
    //   label: "TAT on Final Configuration",
    //   visible: true,
    // },
    {
      id:"intakeStatusName",
      label:"Candidate Status",
      visible: true,
    },
    {
      id: "doj",
      label: "DOJ",
      visible: true,
      
    },
     {
      id: "joiningConfirmationComments",
      label: "Comments",
      visible: true,
    }
  ]);


  const [showMoveToRec, setShowMoveToRec] = useState(false);
  const [selectedCandidateId, setSelectedCandidateId] = useState<CandidateItem | null>(null);
  const [searchText, setSearchText] = useState("");
  const [moveAction, setMoveAction] = useState("rec");
  const [currentPage, setCurrentPage] = useState(1);
  const debouncedSearch = useDebounce(searchText, 300);
  const [searchColumn, setSearchColumn] = useState("HrqId");
  const [status, setStatus] = useState<number>(NaN);
  const [pageSize, setPageSize] = useState(50);
   const [selected, setSelected] = useState<any>(null);
   const [currentDaySelected, setCurrentDaySelected] = useState<any>(null);
  const params = useSearchParams();
  const DEFAULT_TAB =isPartner?"candidates_offered" :"candidate_identified";
  const { partnerId } = useUserStore();
  const tabFromUrl = params.get("tab");
  const [tab, setTab] = useState(tabFromUrl ?? DEFAULT_TAB);
 const [sortConfig,setSortConfig]=useState<SortConfig>({
    key: "",
    direction: "desc",
  })
  useEffect(() => {
    if (tabFromUrl && tabFromUrl !== tab) {
      setTab(tabFromUrl);
    }
  }, [tabFromUrl]);

  
  const handleTabChange = (value: string) => {
    setTab(value);
    setCurrentPage(1)
    router.replace(`?tab=${encodeURIComponent(value)}`);
  };

  

const statusIdMap: Record<TabKey, number> = {
  "candidate_identified": 1,
  "candidates_offered": 2,
  "candidates_declined": 3,
  "view_Joiners": 4,
};


const statusId = statusIdMap[tab as TabKey];
const baseUrl = "/CandidateForm/paged/final-list";

const queryParams = new URLSearchParams();


queryParams.append("intakeStatusCategoryId",  statusId.toString());
if (selected?.id) {
  queryParams.append("intakeStatusId", selected.id.toString());
}

if (currentDaySelected?.id) {
  queryParams.append("durationId", currentDaySelected.id.toString());
}
if (isPartner) {
  queryParams.append("partnerId", partnerId?.toString()); 
}
const url = `${baseUrl}?${queryParams.toString()}`;
 const {
  data: getOnboarding,
  refetch: reFetchData,
  isLoading,
} = useQuery({
  queryKey: [
    "getOnboardingDetails",
    statusId,
    selected?.id,
    currentDaySelected?.id,
    currentPage,
    debouncedSearch,
    searchColumn,pageSize
  ],
  queryFn: () =>
    onboarding.getAllTypeCandidates(url, {
      pageNumber: currentPage,
      pageSize,
      searchColumn,
      searchText: debouncedSearch || undefined,
    }),
  enabled: !!statusId, 
  refetchOnWindowFocus: true,
});

useEffect(() => {
  if (statusId) {
    reFetchData();
  }
}, [statusId, currentPage, debouncedSearch, searchColumn]);

  const hiringData = getOnboarding?.data?.items || [];
  const sorteddCandidates = sortData(hiringData, sortConfig);
  const hasPrevious = getOnboarding?.data?.hasPrevious;
  const hasNext = getOnboarding?.data?.hasNext;
  const totalPages = getOnboarding?.data?.totalPages || 1;

  const visibleColumns = columns.filter((col) => col.visible);

 

 



 const handleAddCandidate = (candidate: CandidateItem) => {
    if (candidate?.candidatePersonalDetailsId) {
    router.push(`/home/candidate-onboarding/${candidate?.candidatePersonalDetailsId}`);
    } else {
    useOnboardCandidateStore.getState().setOnboardCandidate({
    hiringRequestId: candidate?.hiringRequestId,
    candidateId: candidate?.id,
  });
    router.push("/home/candidate-onboarding/new");
  }
};


const filteredColumns = visibleColumns.filter(({ id }) => {
  const hideTATColumns = ["pcIssueTat", "releaseToOpsTat", "finalConfigTat"];
  const hideExtraColumns = ["employeeId", "doj","joiningConfirmationComments"];
  if (tab === "candidates_declined") {
    return ![...hideTATColumns, "employeeId", "doj"].includes(id);
  }
  if (tab === "candidates_offered" || tab === "view_Joiners") {
    if (!isPartner) {
       return !["joiningConfirmationComments"].includes(id);;
    } else {
     return ![...hideTATColumns,"joiningConfirmationComments"].includes(id);
    }
  } else {
      return ![...hideTATColumns,...hideExtraColumns].includes(id);
 }
});

const handleSort = (key:any) => {
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


  const getSortIcon = (columnId:any) => {

//     if (!sortConfig || sortConfig.key !== columnId) {
//       return null;
//     }
     return (sortConfig?.direction === "asc"&& sortConfig?.key ===columnId) ? (
      <ArrowUpIcon className="h-4 w-4 ml-1" />
    ) : (
      <ArrowDownIcon className="h-4 w-4 ml-1" />
    );
  };

        
 const toggleColumn = (columnId: string) => {
    setColumns(
      columns.map((col) =>
        col.id === columnId ? { ...col, visible: !col.visible } : col
      )
    );
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
   const handleCandidateProfile = (candidate: CandidateItem) => {
    useOnboardCandidateStore.getState().setOnboardCandidate({
      candidateRateCardId: candidate?.candidateRateCardId,
    });
     router.push(
       `/home/candidate-onboarding/candidate-profile?id=${candidate?.candidatePersonalDetailsId}`
     );
  };
   const handleSelect = (item:any) => {
    setSelected(item);

  };

  const handleCurrentDaySelect = (item: any) => {
  setCurrentDaySelected(item);
};
  const statusOptions = [
  { id: 15007, name: 'Offer Rolled Out' },
  { id: 15011, name: 'Offer Accepted' },
];

const currentDayOptions = [
  { id: 0, name: "All" },
  { id: 1, name: "Today" },
  { id: 2, name: "Week" },
  { id: 3, name: "Month" },
];


  return (
    <div className="p-4">
      <div className="mb-6 flex justify-between items-center">
        <h1 className="text-xl font-bold">Candidate Onboarding</h1>
        <Tabs value={tab} onValueChange={handleTabChange}>
          <TabsList>
            {!isPartner && (
              <TabsTrigger value="candidate_identified">
                Candidate Identified
              </TabsTrigger>
            )}
            {!isVendorManager && (
              <TabsTrigger value="candidates_offered">
                Candidates Offered
              </TabsTrigger>
            )}

            <TabsTrigger value="candidates_declined">
              Candidates Declined
            </TabsTrigger>
            <TabsTrigger value="view_Joiners">View Joiners</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className="flex items-center justify-between mb-8">
        <SearchFilter
          filterType={FilterTypeEnum.CandidateOnboarding_Identified}
          onFilterChange={handleFilterChange}
          onClear={handleClear}
          placeholder="Search by"
          setCurrentPage={setCurrentPage}
        />
        <div className="flex items-center gap-2">
          <TabDropdown
            tab={tab}
            isPartner={isPartner}
            visibleTab="candidates_offered"
            selected={selected}
            options={statusOptions}
            onSelect={handleSelect}
          />

          <TabDropdown
            tab={tab}
            isPartner={isPartner}
            visibleTab="view_Joiners"
            selected={currentDaySelected}
            options={currentDayOptions}
            onSelect={handleCurrentDaySelect}
          />

          <ColumnsPopover
            columns={columns}
            toggleColumn={toggleColumn}
            screeningData={hiringData}
            buttonName="Candidate-details"
          />
        </div>
      </div>

      <div className="bg-gray-50 dark:bg-gray-900 rounded-lg shadow mt-4">
        {isLoading ? (
          <TableSkeletonLoader />
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="bg-teal-200 dark:bg-gray-700">
                {filteredColumns.map((column) => (
                  <TableHead
                    className={
                      column.sortable ? "cursor-pointer select-none" : ""
                    }
                    onClick={() => column.sortable && handleSort(column.id)}
                    key={column.id}
                  >
                    <div className="flex items-center">
                      {column.label}
                      {column.sortable && getSortIcon(column.id)}
                    </div>
                  </TableHead>
                ))}
                {!(tab === "candidates_declined") && (
                  <TableHead className="text-sm">Action</TableHead>
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {hiringData.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={filteredColumns.length + 1}
                    className="text-center text-gray-500"
                  >
                    No Data Available
                  </TableCell>
                </TableRow>
              ) : (
                sorteddCandidates.map((candidate: any) => (
                  <TableRow
                    key={candidate.id}
                    className={
                      tab !== "candidates_declined" &&
                      !candidate?.isJoinConfirmed &&
                      ["candidates_offered", "view_Joiners"].includes(tab) &&
                      isToday(new Date(candidate?.doj))
                        ? " text-black"
                        : ""
                    }
                  >
                    {filteredColumns.map((column) => (
                      <TableCell key={`${candidate.id}-${column.id}`}>
                        {column.id === "doj" ? (
                          formatDate(candidate?.doj)
                        ) : column.id === "joiningConfirmationComments" ? (
                          <Dialog>
                            <DialogTrigger asChild>
                              <button
                                className="hover:text-primary"
                                title="View Comments"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                            </DialogTrigger>
                            <DialogContent className="max-w-3xl rounded-2xl p-6 shadow-2xl bg-background dark:bg-zinc-900 border border-border">
                              <DialogHeader className="mb-2">
                                <DialogTitle className="text-2xl font-bold text-foreground leading-snug">
                                  💬 Reason for Decline
                                </DialogTitle>
                                <DialogDescription className="text-lg font-bold text-muted-foreground mt-1">
                                  Detailed explanation of why the candidate was
                                  declined.
                                </DialogDescription>
                              </DialogHeader>

                              <div className="mt-4 max-h-[400px] overflow-y-auto p-5 bg-muted rounded-lg border border-muted-foreground/10">
                                <p className="text-base leading-relaxed text-foreground tracking-tight whitespace-pre-wrap">
                                  {candidate?.joiningConfirmationComments ||
                                    "No comments available."}
                                </p>
                              </div>
                            </DialogContent>
                          </Dialog>
                        ) : column.id === "hrqId" ? (
                          <h2
                            className="text-green-600 hover:underline hover:cursor-pointer"
                            onClick={() =>
                              router.push(
                                `/home/hiring-details?hrqid=${candidate.hrqId}`
                              )
                            }
                          >
                            {candidate.hrqId}
                          </h2>
                        ) : column.id === "candidateCode" ? (
                          <Link
                            href={`/home/candidate-management/candidate-profile?id=${candidate.candidateCode}`}
                            className="text-blue-600 hover:text-blue-800 hover:underline"
                          >
                            {candidate.candidateCode}
                          </Link>
                        ) : column.id === "jobTitle" ? (
                          <div className="list-disc ">
                            {candidate?.jobTitle
                              ?.split(",")
                              .map((item, idx) => (
                                <p key={idx} className="whitespace-pre-line">
                                  {item.trim() || ""}
                                </p>
                              ))}
                          </div>
                        ) : column.id === "employeeId" ? (
                          <button
                            type="button"
                            className="text-blue-600 hover:underline hover:cursor-pointer"
                            onClick={() => handleCandidateProfile(candidate)}
                          >
                            {candidate[column.id]}
                          </button>
                        ) : (
                          candidate[column.id]
                        )}
                      </TableCell>
                    ))}
                    {!(tab === "candidates_declined") && (
                      <TableCell>
                        <TooltipProvider>
                          <Tooltip>
                            <DropdownMenu>
                              <TooltipTrigger asChild>
                                <DropdownMenuTrigger asChild>
                                  <Button
                                    variant="outline"
                                    className="h-8 px-2 py-1 flex items-center gap-1"
                                    disabled={candidate?.candidateBGVCompleted}
                                  >
                                    <Menu className="w-4 h-4" />
                                    <ChevronDown className="w-4 h-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                              </TooltipTrigger>
                              <DropdownMenuContent
                                align="end"
                                // className="w-[200px]"
                              >
                                {tab === "candidates_offered" ||
                                tab === "view_Joiners" ||
                                isPartner ? (
                                  <>
                                    {candidate?.candidatePersonalDetailsId &&
                                    !candidate?.isJoinConfirmed ? (
                                      <>
                                        <DropdownMenuItem
                                          className="font-medium"
                                          onClick={() => {
                                            setSelectedCandidateId(candidate);
                                            setShowMoveToRec(true);
                                            setMoveAction("Joined");
                                          }}
                                        >
                                          Confirm Joining
                                        </DropdownMenuItem>
                                      </>
                                    ) : (
                                      <>
                                        {" "}
                                        {candidate.intakeStatusId !==
                                          OFFERED_ACCEPTED && (
                                          <DropdownMenuItem
                                            onClick={() => {
                                              setSelectedCandidateId(candidate);
                                              setShowMoveToRec(true);
                                              setMoveAction("offer-status");
                                            }}
                                          >
                                            <Pencil className="h-4 w-4" />
                                            Accept Offer
                                          </DropdownMenuItem>
                                        )}
                                        {!candidate?.candidateBGVCompleted ? (
                                          candidate?.intakeStatusId ===
                                            OFFERED_ACCEPTED && (
                                            <DropdownMenuItem
                                              className={
                                                candidate?.candidatePersonalDetailsId
                                                  ? "text-red-600"
                                                  : ""
                                              }
                                              onClick={() =>
                                                handleAddCandidate(candidate)
                                              }
                                            >
                                              <UserPlus
                                                className={`h-4 w-4 ${
                                                  candidate?.candidatePersonalDetailsId
                                                    ? "text-red-600"
                                                    : ""
                                                }`}
                                              />
                                              {candidate?.candidatePersonalDetailsId
                                                ? "Resume Onboarding"
                                                : "Onboard Candidate"}
                                            </DropdownMenuItem>
                                          )
                                        ) : (
                                          <DropdownMenuItem
                                            onClick={() =>
                                              handleAddCandidate(candidate)
                                            }
                                          >
                                            <Pencil className="h-4 w-1" />
                                            Edit
                                          </DropdownMenuItem>
                                        )}
                                      </>
                                    )}
                                  </>
                                ) : (
                                  <>
                                    <DropdownMenuItem
                                      onClick={() => {
                                        setSelectedCandidateId(candidate);
                                        setShowMoveToRec(true);
                                        setMoveAction("rec");
                                      }}
                                      disabled={
                                        !(
                                          candidate?.intakeStatusId ===
                                            INTAKE_IDENTIFIED &&
                                          candidate?.hiringStatusId === OPEN_WIP
                                        )
                                      }
                                    >
                                      <FolderCode className="h-4 w-4" />
                                      Move To Rec
                                    </DropdownMenuItem>

                                    <DropdownMenuItem
                                      onClick={() => {
                                        setSelectedCandidateId(candidate);
                                        setShowMoveToRec(true);
                                        setMoveAction("onboarding");
                                      }}
                                      disabled={
                                        !(
                                          candidate.intakeStatusId ===
                                            INTAKE_IDENTIFIED &&
                                          candidate.hiringStatusId ===
                                            CANDIDATE_IDENTIFIED
                                        )
                                      }
                                    >
                                      <UserPlus className="h-4 w-4" />
                                      Move To Onboarding
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      disabled={
                                        !(
                                          candidate.intakeStatusId ===
                                            INTAKE_IDENTIFIED &&
                                          candidate.hiringStatusId === On_Hold
                                        )
                                      }
                                    >
                                      <Link
                                        href={`/home/hiring-management/hiring-profile?id=${candidate?.hrqId}`}
                                        className="flex items-center gap-2   hover:underline px-2 py-1 rounded"
                                      >
                                        <PauseCircle className="h-4 w-4" />
                                        On Hold
                                      </Link>
                                    </DropdownMenuItem>
                                  </>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </Tooltip>
                        </TooltipProvider>
                      </TableCell>
                    )}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        )}

        <div className="flex items-center justify-between p-4">
          <div className="text-sm text-gray-500">
            Page {currentPage} of {totalPages}
          </div>
          <Pagination
            value={pageSize}
            totalEntry={getOnboarding?.data.totalCount}
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
      </div>

      <MoveSidebar
        open={showMoveToRec}
        onOpenChange={setShowMoveToRec}
        candidate={selectedCandidateId}
        actionType={moveAction}
      />
    </div>
  );
}




interface TabDropdownProps {
  tab: string;
  isPartner: boolean;
  visibleTab: string;
  selected: { id: number; name: string } | null;
  options: { id: number; name: string }[];
  onSelect: (item: { id: number; name: string }) => void;
}

export function TabDropdown({
  tab,
  isPartner,
  visibleTab,
  selected,
  options,
  onSelect,
}: TabDropdownProps) {
  const shouldRender =
    (isPartner && tab === visibleTab) || (!isPartner && tab === visibleTab);

  if (!shouldRender) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="w-[200px] justify-between">
          {selected ? selected.name : "Select..."}
          <Filter className="ml-2 h-4 w-4 text-green-700" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-[200px]">
        {options.map((item) => (
          <DropdownMenuItem key={item.id} onClick={() => onSelect(item)}>
            {item.name}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
