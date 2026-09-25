"use client";

import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { onboarding } from "@/services/api/onboarding.api";
import { FormProvider, useForm, useWatch } from "react-hook-form";
import { SelectField } from "@/components/form-fields/SelectField";
import { InputField } from "@/components/form-fields/InputField";
import { DatePickerField } from "@/components/form-fields/DatePickerField";
import { isPartner, useUserStore } from "@/store/userStore";
import { dropdownApi } from "@/services/api/master";
import { toast } from "sonner";
import { MasterTypes } from "@/constants/masterTypes";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CommentsDialog } from "./CommentsDialog";
import { formatDate } from "@/helpers/helper";
interface MoveSidebarProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  candidate: any;
  partnerName?: string;
  actionType: string;
}

export const MoveSidebar = ({
  open,
  onOpenChange,
  candidate,
  actionType,
}: MoveSidebarProps) => {
  const form = useForm({
    defaultValues: {
      hrqid: "",
      partnerRate: "",
      hourlyRate: "",
      category: "",
      doj: "",
      offerStatus:"",
      comments: "",
      candidateId: "",
      caid: "", 
      partnerName: "",
      coreEmerging:"",
      joiningStatus:"",
      finalOnboaridngDate:""
    },
  });
  const { userId } = useUserStore();
  const selectedHrqid = form.watch("hrqid");
  const queryClient = useQueryClient();
  const [showCustomRateConfirm, setShowCustomRateConfirm] = useState(false);
  const [pendingPayload, setPendingPayload] = useState<any>(null);
  const [hrqColumns, setHrqColumns] = useState([
    { id: "modifiedbyUsername", label: "Rescheduled By", visible: true },
    { id: "modifiedOn", label: "Rescheduled On", visible: true },
    { id: "finalOnboardingDate", label: "Rescheduled Date", visible: true },
    { id: "comments", label: "Comments", visible: true },

 
  ]);
  const { data: getVacantHrqid = [] } = useQuery({
    queryKey: ["getVacantHrqid", candidate?.hiringRequestId],
    queryFn: () => dropdownApi.getVacantHrqid(candidate?.hiringRequestId),
    enabled: !!candidate?.hiringRequestId,
  });

  useEffect(() => {
    if (actionType === "onboarding" && candidate) {
      form.setValue("hrqid", candidate?.hrqId || "");
      form.setValue("caid", candidate?.candidateCode || "");
      form.setValue("partnerName", candidate?.partnerName || "");
    }
  }, [actionType, candidate]);
function clearOfferStatusFields(form:any) {
  form.setValue("offerStatus", "");
  form.setValue("comments", "");
  form.setValue("partnerRate", "");
  form.setValue("hourlyRate", "");
  form.setValue("category", "");
  form.setValue("coreEmerging","");
  form.setValue("finalOnboaridngDate", "");
}
const offerAcceptance = useMutation({
  mutationFn: onboarding.offerAcceptance,
  onSuccess: async (res) => {
    toast.success(res?.message);
    clearOfferStatusFields(form)
    onOpenChange(false);
    await queryClient.invalidateQueries({ queryKey: ["getOnboardingDetails"] });
  },onError: (err) => {
      console.error(err);
      toast.error("Failed to transfer candidate details.");
    },
});
  const moveToRecCandidate = useMutation({
    mutationFn: onboarding.moveToRec,
    onSuccess: async (res) => {
      toast.success(res?.message || "Created successfully.");
      onOpenChange(false);
       clearOfferStatusFields(form)
      await queryClient.invalidateQueries({ queryKey: ["getOnboardingDetails"] });
    },
    onError: (err:any) => {
      
      const errorMessage =
      err?.response?.data?.message || "Failed to transfer candidate details.";
    toast.error(errorMessage);
    },
  });

  const moveToOnboarding = useMutation({
    mutationFn: onboarding.moveToOnboarding,
    onSuccess: async(res) => {
      toast.success(res?.message || "Candidate moved to onboarding.");
      onOpenChange(false);
      clearOfferStatusFields(form)
      await queryClient.invalidateQueries({ queryKey: ["getOnboardingDetails"] });
    },
    onError: (err) => {
      console.error(err);
      toast.error("Failed to move candidate to onboarding.");
    },
  });

  const joiningConfirmation = useMutation({
    mutationFn: onboarding.joiningConfirmation,
    onSuccess: async(res) => {
      toast.success(res?.message || "Candidate Joined");
      onOpenChange(false);
      clearOfferStatusFields(form)
      await queryClient.invalidateQueries({ queryKey: ["getOnboardingDetails"] });
      refetch();
    },
    onError: (err) => {
      console.error(err);
      toast.error("Failed to move candidate to onboarding.");
    },
  });

const { data:JOINING_STATUS = [] } = useQuery({
    queryKey: ["getJOINING_STATUS", MasterTypes.JOINING_STATUS],
    queryFn: async () => {
      const res = await onboarding.getEmployeeCategory(MasterTypes.JOINING_STATUS);
      return res.data;
    },
    retry: 1,
  });


  const { data: hourlyRate = [] } = useQuery({
    queryKey: ["gethourlyRate", MasterTypes.HOURLY_RATE],
    queryFn: async () => {
      const res = await onboarding.getEmployeeCategory(MasterTypes.HOURLY_RATE);
      return res.data;
    },
    retry: 1,
  });

  const { data: CANDIDATE_CATEGORY = [] } = useQuery({
    queryKey: ["getCANDIDATE_CATEGORY", MasterTypes.CANDIDATE_CATEGORY],
    queryFn: async () => {
      const res = await onboarding.getEmployeeCategory(MasterTypes.CANDIDATE_CATEGORY);
      return res.data;
    },
    retry: 1,
  });

   const selectedCategoryId = useWatch({
    control: form.control,
    name: 'category',
  });
   const selectedCoreEmergingId = useWatch({
    control: form.control,
    name: 'coreEmerging',
  });
   
 useEffect(() => {
  if (!selectedCategoryId || !selectedCoreEmergingId) return;

  const categoryId = Number(selectedCategoryId);
  const isCore = Number(selectedCoreEmergingId) === 78001;

  const matchedRate = hourlyRate.find(rate => rate.id === categoryId);
  if (matchedRate) {
    form.setValue("hourlyRate", isCore ? matchedRate.standardRate : matchedRate.etRate);
    form.setValue("partnerRate", isCore ? matchedRate.inrStandardRate : matchedRate.inretRate)
 }
}, [selectedCategoryId, selectedCoreEmergingId, hourlyRate]);
 

const { data: joiningRescheduleHistory = [], isLoading,refetch } = useQuery({
  queryKey: ["joiningRescheduleHistory", candidate?.candidatePersonalDetailsId],
  queryFn: async () => {
    const res = await onboarding.getJoiningRescheduleHistory(candidate?.candidatePersonalDetailsId);
    return res.data;
  },
  enabled: !!candidate?.candidatePersonalDetailsId,
  retry: 1,
});


  const onSubmit = (values: any) => {
    if (actionType === "offer-status") {
        const payload = {
        offerStatus:values.offerStatus === "true",
        candidateId: candidate?.id,
        comments:values.comments,
      };
      

      offerAcceptance.mutate(payload);
    }else if (actionType === "Joined") {
      let hasError = false;
       if (!values.joiningStatus) {
         form.setError("joiningStatus", {
        type: "manual",
          message: "joiningStatus is required",
         });
          hasError = true;
   }
      if(joiningStatusValue === "80003"){
        if (!values.finalOnboaridngDate) {
         form.setError("finalOnboaridngDate", {
        type: "manual",
          message: "Final Onboaridng Date is required",
         });
          hasError = true;
   }

  if (!values.comments) {
    form.setError("comments", {
      type: "manual",
      message: "comments is required",
    });
    hasError = true;
  }
      }
   if (hasError) return;
        const payload = {
        joiningStatusId:values.joiningStatus,
        candidateId: candidate?.id,
        comments:values.comments,
        candidatePersonalDetailsId:candidate?.candidatePersonalDetailsId,
        finalOnboaridngDate:values.finalOnboaridngDate?values.finalOnboaridngDate:null
      };
      
     joiningConfirmation.mutate(payload);
    }else if (actionType === "rec") {
      const payload = {
        hiringRequestId: selectedHrqid,
        candidateId: candidate?.id,
        transferredBy: userId,
      };

      moveToRecCandidate.mutate(payload);
      
    } else if (actionType === "onboarding") {
      const isCore = values.coreEmerging === "78001";
      const matchedRate = hourlyRate.find(rate => rate.id === Number(values.category));
      const expectedHourly = isCore ?matchedRate?.standardRate:matchedRate?.etRate;
      const expectedPartner = isCore ?matchedRate?.inrStandardRate:matchedRate?.inretRate;
      const isCustomRate =
      values.hourlyRate !== expectedHourly || values.partnerRate !== expectedPartner;
      let hasError = false;
   if (!values.category) {
    form.setError("category", {
      type: "manual",
      message: "Category is required",
    });
    hasError = true;
  }

  if (!values.doj) {
    form.setError("doj", {
      type: "manual",
      message: "Date of Joining is required",
    });
    hasError = true;
  }

  if (!values.coreEmerging) {
    form.setError("coreEmerging", {
      type: "manual",
      message: "Candidate Category is required",
    });
    hasError = true;
  }

  if (hasError) return;
     const payload = {
        candidateId: candidate?.id,
        partnerRate: values.partnerRate,
        hourlyRate: values.hourlyRate,
        categoryId: Number(values.category),
        doj: values.doj,
        CandidateCategotyId:values.coreEmerging
       };

     if (isCustomRate) {
      setPendingPayload(payload);
      setShowCustomRateConfirm(true);
     } else {
      moveToOnboarding.mutate({...payload,IsCustomisedRateCard:false});
    }
  }
  };

  function getActionLabel(actionType: string): string {
  switch (actionType) {
    case "rec":
      return "Parent ID";
    case "onboarding":
      return "Add Rate Card";
    case "offer-status":
      return "Offer Status";
    case "Joined":
      return "Joining Status";
    default:
      return "";
  }
}

const joiningStatusValue = form.watch("joiningStatus");

useEffect(() => {
  
  if (joiningStatusValue === "80003") {
    
    form.setValue("comments", "");
  } else if (joiningStatusValue) {
    
    form.setValue("finalOnboaridngDate", "");
  } else {
    
    form.setValue("finalOnboaridngDate", "");
  }
}, [joiningStatusValue, form]);
 




  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/30 z-40" />
        <Dialog.Content className="fixed top-0 right-0 w-[30%] h-full bg-white dark:bg-gray-900 text-black dark:text-white shadow-lg z-50 p-6">
          <FormProvider {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
              <div className="mb-4 flex items-center gap-4">
                <label className="font-semibold min-w-[100px]">
                  {getActionLabel(actionType)}
                </label>
                <div className="flex-1  px-2 py-1 text-center font-bold">
                  <p className="m-0">
                    {actionType === "rec" && candidate?.hrqId}
                  </p>
                </div>
              </div>

              {actionType === "offer-status" && (
                <div className="space-y-4">
                  <SelectField
                    name="offerStatus"
                    label="Candidate Offer Status"
                    placeholder="Select Status"
                    options={[
                      { id: "true", name: "Accept" },
                      { id: "false", name: "Reject" },
                    ]}
                    required
                    control={form.control}
                  />

                  <InputField
                    name="comments"
                    label="Comments"
                    placeholder="Add any comments"
                    control={form.control}
                  />
                </div>
              )}

              {actionType === "rec" && (
                <div className="mb-4">
                  <SelectField
                    name="hrqid"
                    label="Move To"
                    placeholder="Select HRQID"
                    options={getVacantHrqid.map(
                      (hrq: { id: number; hrqId: string }) => ({
                        id: hrq?.id,
                        name: hrq?.hrqId,
                      })
                    )}
                    required
                    control={form.control}
                  />
                </div>
              )}

              {actionType === "onboarding" && (
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <InputField
                    name="hrqid"
                    label="HRQID"
                    control={form.control}
                    disabled
                  />
                  <InputField
                    name="caid"
                    label="CAID"
                    disabled
                    control={form.control}
                  />
                  <InputField
                    name="partnerName"
                    label="Partner Name"
                    control={form.control}
                    disabled
                  />
                  <SelectField
                    name="category"
                    label="Category"
                    placeholder="Select Category"
                    options={hourlyRate}
                    control={form.control}
                    required
                  />
                  <SelectField
                    name="coreEmerging"
                    label="Candidate Category"
                    placeholder="Enter Candidate Category"
                    options={CANDIDATE_CATEGORY}
                    control={form.control}
                    required
                  />
                  <InputField
                    name="hourlyRate"
                    label="Hourly Rate ($)"
                    type="number"
                    placeholder="Enter Hourly Rate ($)"
                    control={form.control}
                    required
                  />
                  <InputField
                    name="partnerRate"
                    label="Partner Monthly Rate (₹)"
                    type="number"
                    placeholder="Enter monthly rate"
                    control={form.control}
                    required
                  />

                  <DatePickerField
                    name="doj"
                    label="Date of Joining"
                    control={form.control}
                    required
                  />
                </div>
              )}
              {actionType === "Joined" && (
                <div className="space-y-4">
                  <SelectField
                    name="joiningStatus"
                    label="Candidate Joining Status"
                    placeholder="Select Status"
                    options={JOINING_STATUS}
                    required
                    control={form.control}
                  />

                  {joiningStatusValue === "80003" ? (
                    <>
                      <DatePickerField
                        name="finalOnboaridngDate"
                        label="Final Onboarding Date"
                        required
                        control={form.control}
                      />
                      <InputField
                        name="comments"
                        label="Comments"
                        placeholder="Add any comments"
                        control={form.control}
                      />
                    </>
                  ) : (
                    <InputField
                      name="comments"
                      label="Comments"
                      placeholder="Add any comments"
                      control={form.control}
                    />
                  )}
                </div>
              )}

              <div className="flex justify-between mt-6">
                <Dialog.Close asChild>
                  <Button
                    variant="outline"
                    onClick={() => clearOfferStatusFields(form)}
                  >
                    Cancel
                  </Button>
                </Dialog.Close>
                <Button
                  type="submit"
                  size="sm"
                  className="bg-[#00b388] hover:bg-[#009e79] h-9"
                >
                  Move
                </Button>
              </div>
            </form>
          </FormProvider>

          {actionType === "Joined" && (
            <>
              <h3 className="mt-8 text-xl font-semibold">
                {" "}
                Reschedule History
              </h3>
              <Table className="mt-4">
                <TableHeader>
                  <TableRow className="bg-teal-200 dark:bg-gray-700">
                    {hrqColumns.map((col) => (
                      <TableHead key={col.id}>{col.label}</TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {joiningRescheduleHistory.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={hrqColumns.length + 1}
                        className="text-center text-gray-500"
                      >
                        No Data Available
                      </TableCell>
                    </TableRow>
                  ) : (
                    joiningRescheduleHistory.map((req: any) => (
                      <TableRow key={req.id} className="border-b">
                        {hrqColumns.map((col) => (
                          <TableCell key={col.id}>
                            {col.id === "modifiedOn" ? (
                              <h2>{formatDate(req?.modifiedOn)}</h2>
                            ):col.id === "finalOnboardingDate" ? (
                              <h2>{formatDate(req?.finalOnboardingDate)}</h2>
                            ) : col.id === "comments" ? (
                              <CommentsDialog comments={req?.comments} />
                            ) : (
                              req[col.id]
                            )}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </>
          )}
          {showCustomRateConfirm && (
            <div className="fixed inset-0 z-50  bg-opacity-50 flex items-center justify-center">
              <div className="bg-white p-6 rounded shadow-md w-[500px] text-center">
                <h2 className="text-lg font-semibold mb-4">
                  Customised Rate Card
                </h2>
                <p className="mb-6 text-sm text-gray-700">
                  You are creating a customised rate card deviating from the
                  current rates. <br />
                  Please agree to continue and proceed.
                </p>
                <div className="flex justify-end gap-4">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowCustomRateConfirm(false);
                      setPendingPayload(null);
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    className="bg-[#00b388] hover:bg-[#009e79]"
                    onClick={() => {
                      moveToOnboarding.mutate({
                        ...pendingPayload,
                        IsCustomisedRateCard: true,
                      });
                      setShowCustomRateConfirm(false);
                      setPendingPayload(null);
                      onOpenChange(false);
                      clearOfferStatusFields(form);
                    }}
                  >
                    Proceed
                  </Button>
                </div>
              </div>
            </div>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};