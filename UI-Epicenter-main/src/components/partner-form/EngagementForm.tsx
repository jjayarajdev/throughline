"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useWatch } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Form, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { useEffect, useState } from "react";
import { InputField } from "../form-fields/InputField";
import { SelectField } from "../form-fields/SelectField";
import { MultiDocumentField } from "@/components/form-fields/MultiDocumentField";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { MasterTypes } from "@/constants/masterTypes";
import { dropdownApi } from "@/services/api/master";
import {
  empanelmentFormSchema,
  engagementFormSchema,
  partnerApi,
} from "@/services/api/partner.profile.api";
import { usePartnerStore } from "@/store/userPartnerStore";
import { toast } from "@/lib/toast";
import { useParams, usePathname, useSearchParams } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import {
  CheckCircle,
  ChevronDown,
  CircleChevronDown,
  CirclePlus,
  Clock,
  Menu,
  Pencil,
  Plus,
} from "lucide-react";
import { Label } from "@/components/ui/label";
import { useUserStore } from "@/store/userStore";
import { DatePickerField } from "../form-fields/DatePickerField";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { EvaluationSidebarOnly } from "./sow/EngagementDialog";
import Pagination from "../common/Pagination";
import { useDebounce } from "@/lib/useDebounce";
import ColumnsPopover from "../common/PopoverColumns";
import SearchFilter from "../common/SearchFilter";
import { FilterTypeEnum } from "@/constants/FilterTypeEnum";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import TableSkeletonLoader from "../skelton/TableSkelton";
import { isPartner } from "@/store/userStore";
import { set } from "date-fns";

type EngagementFormValues = z.infer<typeof engagementFormSchema>;
type EmpanelmentFormValues = z.infer<typeof empanelmentFormSchema>;

interface EngagementFormProps {
  onNext?: () => void;
  onPrevious?: () => void;
}

export default function EngagementForm({
  onNext,
  onPrevious,
}: EngagementFormProps) {
  const { isPartnerEmpanelled } = usePartnerStore();
  const [showHiringDialog, setShowHiringDialog] = useState(false);
  const [selectedHrqIds, setSelectedHrqIds] = useState<string[]>([]);
  const { partnerCode, setIsPartnerEmpanelled } = usePartnerStore();
  const [showForm, setShowForm] = useState(false);
  const [selectedEngagement, setSelectedEngagement] = useState<any>(null);
  const [isEditingEmpanelment, setIsEditingEmpanelment] = useState(false);
  const [showEmpanelmentFields, setShowEmpanelmentFields] = useState(false);
  const [actionType, setActionType] = useState<"extended" | "completed" | null>(
    null
  );
  const [open, setOpen] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const debouncedSearch = useDebounce(searchText, 300);
  const [searchColumn, setSearchColumn] = useState("HrqId");
  const [isGpApproved, setIsGpApproved] = useState(false);
  const { userName } = useUserStore();
  const searchParmas = useSearchParams();
  const partnerId = searchParmas.get("id") || "";
  const [hrqColumns, setHrqColumns] = useState([
    { id: "hrqId", label: "HRQID", visible: true },
    { id: "jobTitle", label: "Role Hired For", visible: true },
    { id: "experience", label: "Experience", visible: true },
    { id: "rmOwnerName", label: "RM Owner", visible: true },
    { id: "resourceTypeName", label: "Resource Type", visible: true },
    { id: "openPositions", label: "Open Positions", visible: true },
    { id: "domainName", label: "Domain Name", visible: true },
  ]);
  const [pageSize, setPageSize] = useState(50);

  const evaluationForm = useForm<EngagementFormValues>({
    resolver: zodResolver(engagementFormSchema),
    defaultValues: {
      isActive: true,
      engagementStatusId: "8003",
      engagementTypeId: "",
      evaluationStartDate: new Date().toISOString().split("T")[0],
      evaluationExtendedDate: "",
      evaluationEndDate: "",
      evaluationPeriod: "",
      evaluatedBy: userName,
      businessId: "",
      businessCenter: "",
      mruCode: "",
      evaluationStatusId: "11001",
      rejectionReasonId: "",
      rejectionReason: "",
      partnerId: partnerId || "",
      comments: "",
    },
  });

  const empanelmentForm = useForm<EmpanelmentFormValues>({
    resolver: zodResolver(empanelmentFormSchema),
    defaultValues: {
      isActive: true,
      partnerId: null,
      isEmpaneledPartner: false,
      empanelmentStartDate: "",
      sowSigningDate: "",
      gpApprovalDate: "",
      agreementTypeId: "",
      empanelmentComments: "",
      panid: "",
      tanid: "",
      gstid: "",
      gpId: "",
      contractId: "",
      isThisGPApproved: false,
      sowQuoteDocuments: [],
    },
  });

  const evalutaionStatus = evaluationForm.watch("evaluationStatusId");
  const selectedEngagementType = evaluationForm.watch("engagementTypeId");
  const evaluationStartDate = evaluationForm.watch("evaluationStartDate");
  const evaluationEndDate = evaluationForm.watch("evaluationEndDate");
  const evaluationStatusId = evaluationForm.watch("evaluationStatusId");
  const angreementTypeId = empanelmentForm.watch("agreementTypeId");

  // Watch the isThisGPApproved field to sync with isGpApproved state
  const isThisGPApproved = empanelmentForm.watch("isThisGPApproved");

  // Sync isGpApproved state with form field
  useEffect(() => {
    setIsGpApproved(!!isThisGPApproved);
  }, [isThisGPApproved]);

  useEffect(() => {
    if (evaluationStartDate && evaluationEndDate) {
      const start = new Date(evaluationStartDate);
      const end = new Date(evaluationEndDate);

      let months =
        (end.getFullYear() - start.getFullYear()) * 12 +
        (end.getMonth() - start.getMonth());
      if (end.getDate() < start.getDate()) {
        months -= 1;
      }

      evaluationForm.setValue("evaluationPeriod", months.toString());
    }
  }, [evaluationStartDate, evaluationEndDate, evaluationForm]);

  const evaluationToEngagementMap: Record<string, string> = {
    "11005": "8001",
    "11001": "8003",
    "11002": "8003",
    "11003": "8003",
    "11004": "8004",
  };

  const evalStatusId = useWatch({
    control: evaluationForm.control,
    name: "evaluationStatusId",
  });

  useEffect(() => {
    const derivedEngagementStatus = evaluationToEngagementMap[evalStatusId];
    if (derivedEngagementStatus) {
      evaluationForm.setValue("engagementStatusId", derivedEngagementStatus);
    }
  }, [evalStatusId]);

  const { data: hiringRequests = [], isLoading } = useQuery({
    queryKey: [
      "hiringRequests",
      partnerId,
      currentPage,
      pageSize,
      searchColumn,
      debouncedSearch,
    ],
    queryFn: () =>
      partnerApi.activeHiringReq(partnerId, {
        pageNumber: currentPage,
        pageSize,
        searchColumn,
        searchText: debouncedSearch || undefined,
      }),
    enabled: showHiringDialog,
    refetchOnWindowFocus: true,
  });

  const visibleHrqColumns = hrqColumns.filter((col) => col.visible);

  const hiringData = hiringRequests?.data?.items || [];
  const hasPrevious = hiringRequests?.data?.hasPrevious;
  const hasNext = hiringRequests?.data?.hasNext;
  const totalPages = hiringRequests?.data?.totalPages || 1;
  const toggleColumn = (columnId: string) => {
    setHrqColumns(
      hrqColumns.map((col) =>
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
  };
  const { data: engagementStatuses = [] } = useQuery({
    queryKey: ["engagementStatus"],
    queryFn: () => dropdownApi.fetchDropdown(MasterTypes.ENGAGEMENT_STATUS),
  });

  const { data: engagementTypes = [] } = useQuery({
    queryKey: ["engagementType"],
    queryFn: () => dropdownApi.fetchDropdown(MasterTypes.ENGAGEMENT_TYPE),
  });

  const { data: businessUnits = [] } = useQuery({
    queryKey: ["businessUnit"],
    queryFn: () => dropdownApi.fetchDropdown(MasterTypes.BUSINESS_UNIT),
  });

  const { data: evaluationStatuses = [] } = useQuery({
    queryKey: ["evaluationStatus"],
    queryFn: () => dropdownApi.fetchDropdown(MasterTypes.EVALUATION_STATUS),
  });

  // const { data: rejectionReasons = [] } = useQuery({
  //   queryKey: ["rejectionReason"],
  //   queryFn: () => dropdownApi.fetchDropdown(MasterTypes.REJECTION_REASON),
  // });

  const { data: agreementTypes = [] } = useQuery({
    queryKey: ["agreementType"],
    queryFn: () => dropdownApi.fetchDropdown(MasterTypes.AGREEMENT_TYPE),
  });

  const {
    data: engagementDetails = [],
    isError: engagementDetailsError,
    refetch: refetchEvalutaionDetail,
  } = useQuery({
    queryKey: ["engagementDetails", partnerId],
    queryFn: () => partnerApi.getEngagement(partnerId),
  });

  const {
    data: empanelmentDetails = [],
    isError: empanelmentDetailsError,
    refetch: refetchEmapnelmentDetail,
  } = useQuery({
    queryKey: ["empanelmentDetails", partnerId],
    queryFn: () => partnerApi.getEmpanelment(partnerId),
  });

  useEffect(() => {
    if (empanelmentDetails?.data) {
      // Set isGpApproved state from API response
      const gpApprovedFromAPI = empanelmentDetails.data.isThisGPApproved;
      setIsGpApproved(!!gpApprovedFromAPI);
      setIsPartnerEmpanelled(empanelmentDetails?.data?.isEmpaneledPartner);
      empanelmentForm.setValue(
        "empanelmentStartDate",
        empanelmentDetails.data?.empanelmentStartDate
      );
      empanelmentForm.setValue(
        "empanelmentStartDate",
        empanelmentDetails.data?.empanelmentStartDate
      );
      empanelmentForm.setValue(
        "sowSigningDate",
        empanelmentDetails.data?.sowSigningDate
      );
      empanelmentForm.setValue(
        "gpApprovalDate",
        empanelmentDetails.data?.gpApprovalDate
      );
      empanelmentForm.setValue(
        "agreementTypeId",
        empanelmentDetails.data?.agreementTypeId?.toString() || ""
      );
      empanelmentForm.setValue(
        "empanelmentComments",
        empanelmentDetails.data?.empanelmentComments || ""
      );
      empanelmentForm.setValue("panid", empanelmentDetails.data?.panid || "");
      empanelmentForm.setValue("tanid", empanelmentDetails.data?.tanid || "");
      empanelmentForm.setValue("gstid", empanelmentDetails.data?.gstid || "");
      empanelmentForm.setValue("gpId", empanelmentDetails.data?.gpId || "");
      empanelmentForm.setValue(
        "contractId",
        empanelmentDetails.data?.contractId || ""
      );
      empanelmentForm.setValue(
        "partnerId",
        empanelmentDetails.data?.partnerId || null
      );
      empanelmentForm.setValue("isThisGPApproved", !!gpApprovedFromAPI);

      // Handle multiple SOW Quote Documents
      const existingSowQuoteDocuments =
        empanelmentDetails.data?.sowQuoteDocuments?.map((doc: any) => ({
          id: doc.id || 0,
          attachmentName: doc.attachmentName,
          attachmentURL: doc.attachmentURL,
          partnerEmpanelId: doc.partnerEmpanelId || Number(partnerId),
        })) || [];

      empanelmentForm.setValue("sowQuoteDocuments", existingSowQuoteDocuments);
    }
  }, [empanelmentDetails?.data, empanelmentForm, partnerId]);

  const createEvaluationMutation = useMutation({
    mutationFn: partnerApi.createEngagement,
    onSuccess: (data) => {
      toast.success("Evaluation created successfully");
      setShowForm(false);
      evaluationForm.reset();
      refetchEvalutaionDetail();
    },
    onError: (error) => {
      toast.error("Failed to create evaluation");
    },
  });

  const updateEvaluationMutation = useMutation({
    mutationFn: (values: any) =>
      partnerApi.updatePartnerEngagement(
        Number(selectedEngagement?.id),
        values
      ),
    onSuccess: (data) => {
      toast.success("Evaluation updated successfully");
      setShowForm(false);
      setSelectedEngagement(null);
      setOpen(false);
      evaluationForm.setValue("evaluationExtendedDate", "");
      evaluationForm.setValue("extendedComments", "");
      refetchEvalutaionDetail();
    },
    onError: (error) => {
      toast.error("Failed to update evaluation");
    },
  });

  const handleEvaluationSubmit = async (values: EngagementFormValues) => {
    const formattedValues: any = {
      evaluationPeriod: Number(values.evaluationPeriod),
      engagementStatusId: Number(values.engagementStatusId),
      engagementTypeId: Number(values.engagementTypeId),
      businessId: Number(values.businessId),
      evaluationStatusId: Number(values.evaluationStatusId),
      partnerId: Number(partnerId) || Number(partnerId),
      evaluatedBy: values.evaluatedBy,
      evaluationStartDate: values.evaluationStartDate,
      evaluationEndDate: values.evaluationEndDate,
      isActive: values.isActive,

      businessCenter: values.businessCenter,
      mruCode: values.mruCode,
      comments: values.comments,
      isExtendEvaluation: values.evaluationStatusId === "11003",

      ...(values.evaluationStatusId === "11003" &&
      values.evaluationExtendedDate?.trim()
        ? { evaluationExtendedDate: values.evaluationExtendedDate }
        : {}),

      ...(values.evaluationStatusId === "11003" &&
      values.extendedComments?.trim()
        ? { extendedComments: values.extendedComments }
        : {}),

      ...(values.evaluationStatusId === "11004"
        ? {
            rejectionReasonId: values.rejectionReasonId || null,
            rejectionReason: values.rejectionReason || null,
          }
        : {}),
    };

    if (selectedEngagement) {
      updateEvaluationMutation.mutate({
        ...formattedValues,
        id: selectedEngagement.id,
      });
    } else {
      createEvaluationMutation.mutate(formattedValues);
    }
  };

  const submitEmpanelmentMutation = useMutation({
    mutationFn: partnerApi.submitEmpanelment,
    onSuccess: (data) => {
      toast.success("Empanelment created successfully");
      setIsPartnerEmpanelled(true);
      setShowEmpanelmentFields(false);
      refetchEmapnelmentDetail();
    },
    onError: (error) => {
      toast.error("Failed to create empanelment");
    },
  });

  const handleEmpanelmentSubmit = async (values: EmpanelmentFormValues) => {
    // Format SOW Quote Documents with partnerEmpanelId

    const formattedSowQuoteDocuments = values.sowQuoteDocuments.map((doc) => ({
      id: 0, // Always 0 for new empanelment creation
      attachmentName: doc.attachmentName,
      attachmentURL: doc.attachmentURL,
      partnerEmpanelId: Number(partnerId), // Use partnerId as partnerEmpanelId
    }));

    const formattedValues = {
      // ...values,
      partnerId: Number(partnerId) || Number(partnerId),
      isEmpaneledPartner: true,
      sowSigningDate: values.sowSigningDate || null,
      gpApprovalDate: values.gpApprovalDate || null,
      agreementTypeId: Number(values.agreementTypeId) || null,
      isThisGPApproved: values.isThisGPApproved || false,
      sowQuoteDocuments: formattedSowQuoteDocuments,
      isActive: values.isActive,
      empanelmentStartDate: values.empanelmentStartDate,
      empanelmentComments: values.empanelmentComments,
      panid: values.panid,
      tanid: values.tanid,
      gstid: values.gstid,
      gpId: values.gpId,
      contractId: values.contractId,
    };

    submitEmpanelmentMutation.mutate(formattedValues);
  };

  const updateEmpanelmentMutation = useMutation({
    mutationFn: (values: any) =>
      partnerApi.updateEmpanelment(empanelmentDetails.data.id, values),
    onSuccess: (data) => {
      toast.success("Empanelment updated successfully");
      setIsEditingEmpanelment(false);
      refetchEmapnelmentDetail();
    },
    onError: (error) => {
      toast.error("Failed to update empanelment");
    },
  });

  const handleEmpanelmentUpdate = async (values: EmpanelmentFormValues) => {
    // Format SOW Quote Documents for update
    const formattedSowQuoteDocuments = values.sowQuoteDocuments.map((doc) => ({
      id: doc.id || 0,
      attachmentName: doc.attachmentName,
      attachmentURL: doc.attachmentURL,
      partnerEmpanelId: empanelmentDetails.data.id, // Use partnerId as partnerEmpanelId
    }));

    const formattedValues = {
      ...values,
      id: empanelmentDetails.data.id,
      partnerId: Number(partnerId),
      isEmpaneledPartner: true,
      sowQuoteDocuments: formattedSowQuoteDocuments,
      sowSigningDate: values.sowSigningDate || null,
      gpApprovalDate: values.gpApprovalDate || null,
      agreementTypeId: Number(values.agreementTypeId) || null,
      isThisGPApproved: values.isThisGPApproved || false,
      isActive: values.isActive,
      empanelmentStartDate: values.empanelmentStartDate,
      empanelmentComments: values.empanelmentComments,
      panid: values.panid,
      tanid: values.tanid,
      gstid: values.gstid,
      gpId: values.gpId,
      contractId: values.contractId,
    };
    updateEmpanelmentMutation.mutate(formattedValues);
  };

  const handleHrqSelection = (hrqId: string) => {
    setSelectedHrqIds((prev) => {
      if (prev.includes(hrqId)) {
        return prev.filter((id) => id !== hrqId);
      }
      return [...prev, hrqId];
    });
  };

  const handleHiringSubmit = () => {
    setShowHiringDialog(false);
  };
  const populateEvaluationFormValues = (engagement: any) => {
    const evaluationStatusId = engagement?.evaluationStatusId?.toString() || "";

    // Dynamically determine engagementStatusId based on evaluationStatusId
    const engagementStatusMap: Record<string, string> = {
      "11005": "8001", // Yet to Start
      "11001": "8003", // In Progress
      "11002": "8003", // Completed
      "11003": "8003", // Extended
      "11004": "8004", // Rejected
    };

    const derivedEngagementStatusId = engagementStatusMap[evaluationStatusId];

    evaluationForm.setValue("evaluationStatusId", evaluationStatusId);
    evaluationForm.setValue("engagementStatusId", derivedEngagementStatusId);

    evaluationForm.setValue(
      "engagementTypeId",
      engagement?.engagementTypeId?.toString() || ""
    );
    evaluationForm.setValue(
      "evaluationStartDate",
      engagement?.evaluationStartDate
    );
    evaluationForm.setValue("evaluationEndDate", engagement?.evaluationEndDate);
    evaluationForm.setValue(
      "evaluatedBy",
      engagement?.evaluatedBy?.toString() || ""
    );
    evaluationForm.setValue(
      "businessId",
      engagement?.businessId?.toString() || ""
    );
    evaluationForm.setValue(
      "businessCenter",
      engagement?.businessCenter?.toString() || ""
    );
    evaluationForm.setValue("comments", engagement?.comments?.toString() || "");
    evaluationForm.setValue("mruCode", engagement?.mruCode || "");
    evaluationForm.setValue(
      "evaluationPeriod",
      engagement?.evaluationPeriod?.toString() || ""
    );
    evaluationForm.setValue(
      "partnerId",
      engagement?.partnerId?.toString() || ""
    );
  };

  const handleEdit = (engagement: any) => {
    evaluationForm.setValue("isEditMode", true);
    setSelectedEngagement(engagement);

    populateEvaluationFormValues(engagement);
    setShowForm(true);
  };

  const completedOptions = evaluationStatuses.filter(
    (item: any) => item.id === 11004 || item.id === 11005
  );
  const sidebarTriggerOptions = evaluationStatuses.filter(
    (item: any) => item.id === 11002 || item.id === 11003
  );

  const handleEvaluationClick = (id: number, engagement: any) => {
    setSelectedEngagement(engagement);
    populateEvaluationFormValues(engagement);
    if (id === 11002) {
      setActionType("completed");
      setOpen(true);
      evaluationForm.setValue("isEditMode", false);
    } else if (id === 11003) {
      evaluationForm.setValue("evaluationStatusId", id.toString());
      setActionType("extended");
      evaluationForm.setValue("isEditMode", false);
      setOpen(true);
    }
  };

  const sowSigningDate = useWatch({
    control: empanelmentForm.control,
    name: "sowSigningDate",
  });
  
  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">Engagement Form</h2>
      </div>

      <Form {...evaluationForm}>
        <form
          onSubmit={evaluationForm.handleSubmit(handleEvaluationSubmit)}
          className="space-y-6"
        >
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-semibold">Evaluation</h2>
            <div className="flex items-center gap-2 text-sm">
              <span className="text-muted-foreground">Partner ID:</span>
              <span className="font-medium">{partnerCode}</span>
            </div>
          </div>

          <div className="flex justify-end items-center mb-4">
            {!showForm && !isPartner && (
              <Button
                type="button"
                variant="default"
                size="sm"
                className="bg-[#00A76F] hover:bg-[#00A76F]/90"
                onClick={() => {
                  setSelectedEngagement(null);
                  evaluationForm.reset();
                  setShowForm(true);
                  evaluationForm.setValue("isEditMode", false);
                }}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add
              </Button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {showForm && (
              <>
                <SelectField
                  control={evaluationForm.control}
                  name="engagementStatusId"
                  label="Engagement Status"
                  placeholder="Select engagement status"
                  options={engagementStatuses}
                  required
                  disabled
                />

                <div className="flex gap-x-2 items-end">
                  <SelectField
                    control={evaluationForm.control}
                    name="engagementTypeId"
                    label="Engagement Type"
                    placeholder="Select Engagement Type"
                    options={engagementTypes}
                    required
                  />
                  {selectedEngagementType === "9001" && (
                    <Button
                      variant="ghost"
                      type="button"
                      onClick={() => setShowHiringDialog(!showHiringDialog)}
                    >
                      Open List
                    </Button>
                  )}
                </div>

                <DatePickerField
                  control={evaluationForm.control}
                  name="evaluationStartDate"
                  label="Evaluation Start Date"
                  required
                  disabledDates={[{ before: new Date() }]}
                />

                <DatePickerField
                  control={evaluationForm.control}
                  name="evaluationEndDate"
                  label="Evaluation End Date"
                  required
                  disabledDates={[{ before: new Date() }]}
                />

                <InputField
                  control={evaluationForm.control}
                  name="evaluationPeriod"
                  label="Evaluation Period(Months)"
                  placeholder="Enter Evaluation Period"
                  type="number"
                  required
                  disabled
                />

                <InputField
                  control={evaluationForm.control}
                  name="evaluatedBy"
                  label="Evaluated By"
                  placeholder="Enter Evaluator Name"
                  required
                  disabled
                />

                <SelectField
                  control={evaluationForm.control}
                  name="businessId"
                  label="Business Unit"
                  placeholder="Select Business Unit"
                  options={businessUnits}
                  required
                />

                <SelectField
                  control={evaluationForm.control}
                  name="evaluationStatusId"
                  label="Evaluation Status"
                  placeholder="Select evaluation status"
                  options={evaluationStatuses}
                  required
                  disabled
                />

                <InputField
                  control={evaluationForm.control}
                  name="businessCenter"
                  label="Business Center(Country)"
                  placeholder="Enter Business Center"
                />

                <InputField
                  control={evaluationForm.control}
                  name="mruCode"
                  label="MRU Code"
                  placeholder="Enter MRU Code"
                />
                <InputField
                  control={evaluationForm.control}
                  name="comments"
                  label="Comments"
                  placeholder="Enter Comments"
                />
              </>
            )}
          </div>
          {showForm && (
            <div className="flex justify-end pt-6 gap-x-4">
              <Button
                type="button"
                variant="outline"
                className="px-8"
                onClick={() => setShowForm(false)}
              >
                Cancel
              </Button>
              <Button type="submit" variant="hpButton" className="px-8">
                {selectedEngagement ? "Update" : "Save"}
              </Button>
            </div>
          )}
        </form>
      </Form>

      <div className="mt-6">
        {engagementDetailsError && (
          <div className="text-red-500 text-center mb-4">
            Failed to load engagement details. Please try again later.
          </div>
        )}
      </div>

      {engagementDetails?.data && (
        <div className="overflow-x-auto mt-6">
          <h3 className="text-xl font-semibold mb-4">Engagement History</h3>
          <table className="w-full border-collapse table-auto">
            <thead>
              <tr className="bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
                <th className="px-4 py-2 text-left">Engagement Status</th>
                <th className="px-4 py-2 text-left">Engagement Type</th>
                <th className="px-4 py-2 text-left">Business Unit</th>
                <th className="px-4 py-2 text-left">Evaluation Status</th>
                <th className="px-4 py-2 text-left">Evaluated By</th>
                <th className="px-4 py-2 text-left">Extended Date</th>
                <th className="px-4 py-2 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {engagementDetails?.data.map((engagement: any) => (
                <tr key={engagement.id} className="border-b">
                  <td className="px-4 py-2">
                    {engagement?.engagementStatusName}
                  </td>
                  <td className="px-4 py-2">
                    {engagement?.engagementTypeName}
                  </td>
                  <td className="px-4 py-2">{engagement?.businessUnitName}</td>
                  <td className="px-4 py-2">
                    {engagement?.evaluationStatusName}
                  </td>
                  <td className="px-4 py-2">{engagement?.evaluatedBy}</td>
                  <td className="px-4 py-2">
                    {engagement?.evaluationExtendedDate?.split("T")[0] || "-"}
                  </td>
                  <td className="px-4 py-2">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          disabled={isPartner}
                          variant="outline"
                          className="h-8 p-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                        >
                          <Menu />
                          <ChevronDown />
                        </Button>
                      </DropdownMenuTrigger>

                      <DropdownMenuContent align="end" className="w-[200px]">
                        <DropdownMenuItem
                          onClick={() => handleEdit(engagement)}
                        >
                          <Pencil className="h-3 w-3" />
                          Edit
                        </DropdownMenuItem>
                        {sidebarTriggerOptions.map((status: any) => (
                          <DropdownMenuItem
                            key={status.id}
                            onClick={() =>
                              handleEvaluationClick(status?.id, engagement)
                            }
                          >
                            {status.id === 11003 && (
                              <Clock className="h-4 w-4 mr-2 text-gray-500" />
                            )}
                            {status.id === 11002 && (
                              <CheckCircle className="h-4 w-4 mr-2 text-gray-500" />
                            )}
                            {status.name}
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <EvaluationSidebarOnly
        open={open}
        onOpenChange={setOpen}
        evaluationForm={evaluationForm}
        onSubmit={handleEvaluationSubmit}
        actionType={actionType}
        completedOptions={completedOptions}
        selectedEngagement={selectedEngagement}
      />

      {!empanelmentDetails?.data && (
        <div className="flex items-center space-x-2 mt-6 mb-6">
          <Checkbox
            id="empanel-partner"
            checked={showEmpanelmentFields}
            onCheckedChange={(checked) => {
              setShowEmpanelmentFields(checked as boolean);
            }}
          />
          <Label htmlFor="empanel-partner">
            Do you want to empanel this partner?
          </Label>
        </div>
      )}

      {showEmpanelmentFields && !empanelmentDetails?.data && (
        <Form {...empanelmentForm}>
          <form
            onSubmit={empanelmentForm.handleSubmit(handleEmpanelmentSubmit)}
            className="space-y-6 mt-8 border-t pt-8"
          >
            <h2 className="text-2xl font-semibold">Create Empanelment</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex items-end gap-4">
                <div className="flex-1">
                  <DatePickerField
                    control={empanelmentForm.control}
                    name="empanelmentStartDate"
                    label="Empanelment Start Date"
                    disabledDates={[{ before: new Date() }]}
                    required
                  />
                </div>
                <div className="flex items-center mb-2 gap-2">
                  <FormField
                    control={empanelmentForm.control}
                    name="isThisGPApproved"
                    render={({ field }) => (
                      <FormItem className="flex items-center space-x-2">
                        <Checkbox
                          id="gp-approved"
                          checked={!!field.value}
                          onCheckedChange={(checked) =>
                            field.onChange(!!checked)
                          }
                        />
                        <FormLabel
                          htmlFor="gp-approved"
                          className="text-sm font-medium text-gray-700 dark:text-gray-200 mb-0"
                        >
                          Is this GP approved?
                        </FormLabel>
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <DatePickerField
                control={empanelmentForm.control}
                name="gpApprovalDate"
                label="GP Approval Date"
                disabled={!isGpApproved}
                disabledDates={[{ before: new Date() }]}
              />

              <SelectField
                control={empanelmentForm.control}
                name="agreementTypeId"
                label="Agreement Type"
                placeholder="Select agreement type"
                options={agreementTypes}
                disabled={!isGpApproved}
              />

              {angreementTypeId === "1001" && (
                <>
                  <InputField
                    control={empanelmentForm.control}
                    name="gpId"
                    label="GP ID"
                    placeholder="Enter GP ID"
                    disabled={!isGpApproved}
                  />

                  <InputField
                    control={empanelmentForm.control}
                    name="contractId"
                    label="Contract ID"
                    placeholder="Enter Contract ID"
                    disabled={!isGpApproved}
                  />
                </>
              )}

              <InputField
                control={empanelmentForm.control}
                name="panid"
                label="PAN ID"
                placeholder="Enter PAN ID"
                disabled={!isGpApproved}
              />

              <InputField
                control={empanelmentForm.control}
                name="tanid"
                label="TAN ID"
                placeholder="Enter TAN ID"
                disabled={!isGpApproved}
              />

              <InputField
                control={empanelmentForm.control}
                name="gstid"
                label="GST ID"
                placeholder="Enter GST ID"
                disabled={!isGpApproved}
              />

              <InputField
                control={empanelmentForm.control}
                name="empanelmentComments"
                label="Empanelment Comments"
                placeholder="Enter Empanelment Comments"
                disabled={!isGpApproved}
              />
            </div>
            <DatePickerField
              control={empanelmentForm.control}
              name="sowSigningDate"
              label="SOW Signing Date"
              disabled={!isGpApproved}
              disabledDates={[{ before: new Date() }]}
              required={isGpApproved}
            />
            {/* Multi-Document SOW & Quote Upload Section */}
            {sowSigningDate && (
              <div className="space-y-4">
                <MultiDocumentField
                  control={empanelmentForm.control}
                  name="sowQuoteDocuments"
                  label="SOW & Quote Documents"
                  accept=".ppt,.pptx,.pdf,.doc,.docx"
                  required
                  maxFiles={10}
                  partnerId={partnerId}
                  isCreating={true} // Always true for new empanelment creation
                  disabled={!isGpApproved}
                  isToggle={true}
                  refetchPartner={refetchEvalutaionDetail}
                />
              </div>
            )}

            <div className="flex justify-end pt-6">
              <Button
                disabled={isPartner}
                type="submit"
                variant="default"
                className="px-8"
              >
                Submit
              </Button>
            </div>
          </form>
        </Form>
      )}

      {empanelmentDetails?.data && (
        <div className="overflow-x-auto mt-8">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-semibold">Empanelment Details</h3>
            <Button
              disabled={isPartner}
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setIsEditingEmpanelment(!isEditingEmpanelment)}
            >
              <Pencil className="h-4 w-4 mr-2" />
              {isEditingEmpanelment ? "Cancel Edit" : "Edit"}
            </Button>
          </div>
          <table className="w-full border-collapse table-auto">
            <thead>
              <tr className="bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
                <th className="px-4 py-2 text-left">Start Date</th>
                <th className="px-4 py-2 text-left">SOW Signing Date</th>
                <th className="px-4 py-2 text-left">GP Approval Date</th>
                <th className="px-4 py-2 text-left">Agreement Type</th>
                <th className="px-4 py-2 text-left">PAN ID</th>
                <th className="px-4 py-2 text-left">TAN ID</th>
                <th className="px-4 py-2 text-left">GST ID</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b">
                <td className="px-4 py-2">
                  {empanelmentDetails?.data?.empanelmentStartDate?.split(
                    "T"
                  )[0] || "-"}
                </td>
                <td className="px-4 py-2">
                  {empanelmentDetails?.data?.sowSigningDate?.split("T")[0] ||
                    "-"}
                </td>
                <td className="px-4 py-2">
                  {empanelmentDetails?.data?.gpApprovalDate?.split("T")[0] ||
                    "-"}
                </td>
                <td className="px-4 py-2">
                  {empanelmentDetails?.data?.agreementTypeName || "-"}
                </td>
                <td className="px-4 py-2">
                  {empanelmentDetails?.data?.panid || "-"}
                </td>
                <td className="px-4 py-2">
                  {empanelmentDetails?.data?.tanid || "-"}
                </td>
                <td className="px-4 py-2">
                  {empanelmentDetails?.data?.gstid || "-"}
                </td>
              </tr>
            </tbody>
          </table>

          {isEditingEmpanelment && (
            <Form {...empanelmentForm}>
              <form
                onSubmit={empanelmentForm.handleSubmit(handleEmpanelmentUpdate)}
                className="space-y-6 mt-8 border-t pt-8"
              >
                <h2 className="text-2xl font-semibold">Edit Empanelment</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="flex items-end gap-4">
                    <div className="flex-1">
                      <DatePickerField
                        control={empanelmentForm.control}
                        name="empanelmentStartDate"
                        label="Empanelment Start Date"
                        required
                        disabledDates={[{ before: new Date() }]}
                      />
                    </div>
                    <div className="flex items-center mb-2 gap-2">
                      <FormField
                        control={empanelmentForm.control}
                        name="isThisGPApproved"
                        render={({ field }) => (
                          <FormItem className="flex items-center space-x-2">
                            <Checkbox
                              id="gp-approved"
                              checked={!!field.value}
                              onCheckedChange={(checked) =>
                                field.onChange(!!checked)
                              }
                            />
                            <FormLabel
                              htmlFor="gp-approved"
                              className="text-sm font-medium text-gray-700 dark:text-gray-200 mb-0"
                            >
                              Is this GP approved?
                            </FormLabel>
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  <DatePickerField
                    control={empanelmentForm.control}
                    name="gpApprovalDate"
                    label="GP Approval Date"
                    disabled={!isGpApproved}
                  />

                  <SelectField
                    control={empanelmentForm.control}
                    name="agreementTypeId"
                    label="Agreement Type"
                    placeholder="Select agreement type"
                    disabled={!isGpApproved}
                    options={agreementTypes}
                  />

                  {angreementTypeId === "1001" && (
                    <>
                      <InputField
                        control={empanelmentForm.control}
                        name="gpId"
                        label="GP ID"
                        placeholder="Enter GP ID"
                        disabled={!isGpApproved}
                      />

                      <InputField
                        control={empanelmentForm.control}
                        name="contractId"
                        label="Contract ID"
                        placeholder="Enter Contract ID"
                        disabled={!isGpApproved}
                      />
                    </>
                  )}

                  <InputField
                    control={empanelmentForm.control}
                    name="panid"
                    label="PAN ID"
                    placeholder="Enter PAN ID"
                    disabled={!isGpApproved}
                  />

                  <InputField
                    control={empanelmentForm.control}
                    name="tanid"
                    label="TAN ID"
                    placeholder="Enter TAN ID"
                    disabled={!isGpApproved}
                  />

                  <InputField
                    control={empanelmentForm.control}
                    name="gstid"
                    label="GST ID"
                    placeholder="Enter GST ID"
                    disabled={!isGpApproved}
                  />

                  <InputField
                    control={empanelmentForm.control}
                    name="empanelmentComments"
                    label="Empanelment Comments"
                    placeholder="Enter Empanelment Comments"
                    disabled={!isGpApproved}
                  />
                  <DatePickerField
                    control={empanelmentForm.control}
                    name="sowSigningDate"
                    label="SOW Signing Date"
                    disabled={!isGpApproved}
                    required={isGpApproved}
                  />
                </div>

                {/* Multi-Document SOW & Quote Upload Section for Edit */}
                {sowSigningDate && (
                  <div className="space-y-4">
                    <MultiDocumentField
                      control={empanelmentForm.control}
                      name="sowQuoteDocuments"
                      label="SOW & Quote Documents"
                      accept=".ppt,.pptx,.pdf,.doc,.docx"
                      required
                      maxFiles={10}
                      partnerId={partnerId}
                      isCreating={false} // False for editing existing empanelment
                      disabled={!isGpApproved}
                      partnerEmpanelId={
                        empanelmentDetails?.data?.sowQuoteDocuments[0]
                          ?.partnerEmpanelId
                      }
                      isToggle={true}
                      refetchPartner={refetchEvalutaionDetail}
                    />
                  </div>
                )}

                <div className="flex justify-end gap-4 pt-6">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsEditingEmpanelment(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" variant="default">
                    Update
                  </Button>
                </div>
              </form>
            </Form>
          )}
        </div>
      )}

      <Dialog open={showHiringDialog} onOpenChange={setShowHiringDialog}>
        <DialogContent className="w-full   sm:max-w-6xl px-6 overflow-hidden">
          <DialogHeader>
            <DialogTitle>Engagement Type: Labour</DialogTitle>
          </DialogHeader>

          <div className="flex items-center justify-between">
            <SearchFilter
              filterType={FilterTypeEnum.Partner_Engagement_OpenListGrid}
              onFilterChange={handleFilterChange}
              onClear={handleClear}
              placeholder="Search by"
              setCurrentPage={setCurrentPage}
            />
            <div className="flex items-center gap-2">
              <ColumnsPopover
                columns={hrqColumns}
                toggleColumn={toggleColumn}
                screeningData={hiringData}
                buttonName="Hiring-Open-List-Details"
              />
            </div>
          </div>
          {isLoading ? (
            <TableSkeletonLoader />
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-teal-200 dark:bg-gray-700">
                  <TableHead>Select</TableHead>
                  {visibleHrqColumns.map((col) => (
                    <TableHead key={col.id}>{col.label}</TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {hiringData.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={visibleHrqColumns.length + 1}
                      className="text-center text-gray-500"
                    >
                      No Data Available
                    </TableCell>
                  </TableRow>
                ) : (
                  hiringData.map((req: any) => (
                    <TableRow key={req.id} className="border-b">
                      <TableCell>
                        <Checkbox
                          checked={selectedHrqIds.includes(req.hrqId)}
                          onCheckedChange={() => handleHrqSelection(req.hrqId)}
                        />
                      </TableCell>
                      {visibleHrqColumns.map((col) => (
                        <TableCell key={col.id}>{req[col.id]}</TableCell>
                      ))}
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
              options={[5, 10]}
              value={pageSize}
              totalEntry={hiringRequests?.data?.totalCount}
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

          <div className="flex justify-end gap-2">
            <Button
              variant="secondary"
              onClick={() => setShowHiringDialog(false)}
            >
              Previous
            </Button>
            <Button onClick={handleHiringSubmit}>Submit</Button>
          </div>
        </DialogContent>
      </Dialog>

      <div className="flex justify-between pt-6">
        <Button
          variant="secondary"
          type="button"
          className="px-8"
          onClick={onPrevious}
        >
          Previous
        </Button>
        <Button
          type="submit"
          className="px-8"
          onClick={onNext}
          disabled={!empanelmentDetails?.data || !isPartnerEmpanelled}
        >
          Next
        </Button>
      </div>
    </>
  );
}
