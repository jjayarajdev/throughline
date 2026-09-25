"use client";

import * as z from "zod";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { InputField } from "@/components/form-fields/InputField";
import { DatePickerField } from "@/components/form-fields/DatePickerField";
import { SelectField } from "@/components/form-fields/SelectField";
import { ArrowLeft } from "lucide-react";
import { partnerApi, SowPayload } from "@/services/api/partner.profile.api";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {  useSearchParams } from "next/navigation";
import CrHistoryDetails, { SowCR } from "./CRHistoryDetails";
import { useEffect, useState } from "react";
import { TextareaField } from "@/components/form-fields/TextAreaField";
import { onboarding } from "@/services/api/onboarding.api";
import { ConfirmationDialog } from "../ContactMatrixform";
import { isAdmin, isPartner, isVendorManager } from "@/store/userStore";

let crFlagsGlobal: {
  isRateChange?: boolean;
  isValidityExtension?: boolean;
  isValueChange?: boolean;
  isOthers?: boolean;
} = {};

export const formSchema = z
  .object({
    sowNumber: z.string().min(1, "SOW number is required"),
    startDate: z.string().min(1, "Start Date is required"),
    endDate: z.string().min(1, "End Date is required"),
    tcValue: z
      .string()
      .min(1, "TCV value is required")
      .refine((val) => parseFloat(val) > 0, {
        message: "TC value must be greater than 0",
      }),
   status: z.enum(["Active", "Inactive"], {
    required_error: "Status is required",
    }),
    extendedDate: z.string().optional(),
    crComments: z.string().optional(),
    isRateChanged: z.boolean().optional(),
    crNumber: z.string().optional(),
    crRequestDate: z.string().optional(),
    crValue:z.string().optional()
  })
  .refine((data) => {
    
    const start = new Date(data.startDate);
    const end = new Date(data.endDate);
    return !isNaN(start.getTime()) && !isNaN(end.getTime()) && end > start;
  }, {
    message: "End date must be after start date",
    path: ["endDate"],
  })
  .superRefine((data, ctx) => {
    const flags = crFlagsGlobal;

    if (flags.isRateChange && data.isRateChanged !== true) {
      ctx.addIssue({
        path: ["isRateChanged"],
        message: "Rate Changed must be checked",
        code: z.ZodIssueCode.custom,
      });
    }

    if (flags.isValidityExtension && !data.extendedDate) {
      ctx.addIssue({
        path: ["extendedDate"],
        message: "Extended End Date is required",
        code: z.ZodIssueCode.custom,
      });
    }

    if (flags.isOthers && !data.crComments?.trim()) {
      ctx.addIssue({
        path: ["crComments"],
        message: "Comments are required",
        code: z.ZodIssueCode.custom,
      });
      
    }
    if (flags.isValueChange && !data.crValue?.trim()) {
      ctx.addIssue({
        path: ["crValue"],
        message: "CR Value are required",
        code: z.ZodIssueCode.custom,
      });
      
    }

    if (
      flags.isRateChange ||
      flags.isValueChange ||
      flags.isValidityExtension ||
      flags.isOthers
    ) {
      if (!data.crNumber?.trim()) {
        ctx.addIssue({
          path: ["crNumber"],
          message: "CR Number is required",
          code: z.ZodIssueCode.custom,
        });
      }

      if (!data.crRequestDate) {
        ctx.addIssue({
          path: ["crRequestDate"],
          message: "CR Request Date is required",
          code: z.ZodIssueCode.custom,
        });
      }
    }
  });

type FormValues = z.infer<typeof formSchema>;

interface SOWDetails {
  sowNumber: string;
  startDate: string;
  endDate: string;
  tcValue: number;
  status: "Active" | "Inactive";
  isRateChange?: boolean;
  isValidityExtension?: boolean;
  isValueChange?: boolean;
  isOthers?: boolean;
  id?: number;
  selectedCRType: number
}

interface AddSowFormProps {

  onCancel: () => void;
  initialData?: any;
  isEditing?: boolean;
  crTypes: any,
  crFlags: {
    isRateChange: boolean;
    isValidityExtension: boolean;
    isValueChange: boolean;
    isOthers: boolean;
  };
  selectedCRType: number | null;
}

export function AddSowForm({
 
  onCancel,
  initialData,
  isEditing,
  crTypes,
  crFlags,
  selectedCRType,
}: AddSowFormProps) {
  const queryClient = useQueryClient();
  crFlagsGlobal = crFlags;

  const [showDetails, setShowDetails] = useState(false);
  const [selectedCrData, setSelectedCrData] = useState<SowCR | null>(null);
  const [pendingAction, setPendingAction] = useState<null | (() => void)>(null);
const [openModal, setOpenModal] = useState(false);
const [modalMessage, setModalMessage] = useState("");
const [isChanged, setIsChanged] = useState(false);
  const selectedCategory = crFlags?.isRateChange
    ? "Rate Change"
    : crFlags?.isValidityExtension
    ? "Validity Extension"
    : crFlags?.isValueChange
    ? "Value Change"
    : crFlags?.isOthers
    ? "Others"
    : "";
  const handleViewDetails = () => {
    setShowDetails(!showDetails);
  };

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      sowNumber: initialData?.sowNumber || "",
      startDate:
        initialData?.startDate,
      endDate: initialData?.endDate || "",
      tcValue: initialData?.tcValue.toString() || "",
      status:isPartner?"Inactive":typeof initialData?.status === "boolean"
        ? initialData.status ? "Active" : "Inactive"
        : "Active",
      isRateChanged: crFlags?.isRateChange ? true : initialData?.isRateChanged ?? false,
      crNumber: initialData?.crNumber,
      crRequestDate: initialData?.crRequestDate,
      extendedDate: initialData?.extendedDate,
    },
  });

  const searchParams = useSearchParams();
  const parnterId =  searchParams.get("id")|| ""
const {
  data: getCRdata,
  refetch: reFetchData,
  isPending,
} = useQuery({
  queryKey: ["getCRdata", initialData?.id],
  queryFn: () => onboarding.getSow(initialData?.id),
  enabled: !!initialData?.id,
});


useEffect(() => {
  if (getCRdata?.tcValue) {
    form.reset({
      ...form.getValues(),
      tcValue: getCRdata.tcValue.toString(),
    });
  }
}, [getCRdata?.tcValue]);

function clearCrFields(form:any) {
  form.setValue("extendedDate", "");
  form.setValue("crComments", "");
  form.setValue("isRateChanged", false);
  form.setValue("crNumber", "");
  form.setValue("crRequestDate", "");
  form.setValue("crValue", "");
}


  const createSow = useMutation({
    mutationFn: partnerApi.createSow,
    onSuccess: (newSow) => {

      queryClient.invalidateQueries({
      queryKey: ["getsowData", parnterId], 
    });
    reFetchData()
    toast.success(newSow?.message || "SOW created successfully");
    form.reset();
       onCancel();
    },
    onError: (error:any) => {
       const message =
    error?.response?.data?.message ||
    error?.message ||                 
    "Failed to create sow";

     toast.error(message);
    },
  });

  const { mutate: upDateSow, isPending: updateLoading } =
    useMutation({
      mutationFn: (values: SowPayload) =>
        partnerApi.updateSow(Number(initialData?.id), values),
      onSuccess: (data) => {
       queryClient.invalidateQueries({ queryKey: ["getsowData", parnterId] });
        reFetchData()
    if (selectedCrData) {
      toast.success("CR updated successfully");
      clearCrFields(form)
    } else if (crFlags?.isRateChange || crFlags?.isValueChange || crFlags?.isValidityExtension || crFlags?.isOthers) {
      toast.success("CR created successfully");
       clearCrFields(form)
        
    } else {
      toast.success(data?.message || "SOW created successfully");
      form.reset();
      onCancel(); 
    }
      },
      onError: (error) => {
        toast.error("Failed to update SOW");

      },
    });





const handleEditCR = (cr: SowCR) => {
   const actualCategory = cr?.comments
    ? "Others"
    : cr?.extendedDate
    ? "Validity Extension"
    : cr?.isRateChanged
    ? "Rate Change"
    : "Value Change";

  

  if (selectedCategory !== actualCategory) {
    toast.warning(
      `This CR belongs to "${actualCategory}". You can only edit "${selectedCategory}" CRs.`
    );
    return;
  }
  setSelectedCrData(cr);

  form.setValue("crNumber", cr.crNumber || "");
  form.setValue("crRequestDate", cr.crRequestDate || "");

  if (cr.isRateChanged !== undefined) {
    form.setValue("isRateChanged", cr.isRateChanged);
  }

  if (cr.extendedDate) {
    form.setValue("extendedDate", cr.extendedDate);
  }

  if (cr.comments) {
    form.setValue("crComments", cr.comments);
  }  if (cr.crValue) {
    form.setValue("crValue", cr.crValue?.toString());
  }
};

function hasChanges(oldData: any, newData: any) {
     return JSON.stringify(oldData) !== JSON.stringify(newData);
    }
  const handleSubmit = (data: FormValues) => {
    let finalTcValue = Number(data.tcValue || 0);

if (selectedCrData && data.crValue) {
  const previousCrValue = Number(selectedCrData.crValue || 0);
  const newCrValue = Number(data.crValue || 0);
  const delta = newCrValue - previousCrValue;
  finalTcValue += delta;
} else if (!selectedCrData && data.crValue) {
  
  finalTcValue += Number(data.crValue);
}

    const isRateChanged =
      data.isRateChanged !== initialData?.isRateChanged
        ? data.isRateChanged
        : initialData?.isRateChanged;

    const sowCRPayload =
      crFlags?.isRateChange || crFlags?.isValueChange || crFlags?.isValidityExtension || crFlags?.isOthers
        ? [
          {
            ...(selectedCrData?.id ? { id: selectedCrData.id } : {}),
            crTypeId: selectedCRType,
            crNumber: data.crNumber,
            crRequestDate: data.crRequestDate,
            ...(crFlags?.isRateChange ? { isRateChanged: data.isRateChanged } : {}),
            ...(crFlags?.isValidityExtension ? { extendedDate: data.extendedDate } : {}),
            ...(crFlags?.isOthers ? { comments: data.crComments } : {}),
            ...(crFlags?.isValueChange ?{crValue:Number(data.crValue)}:{}),
            sowId: initialData?.id,
          },
        ]
        : [];

 
    const commonPayload: SowPayload = {
      sowNumber: data.sowNumber,
      startDate: data.startDate,
      endDate: data.endDate,
      tcValue:finalTcValue,
      status: data.status === "Active",
      partnerId: Number(parnterId),
      id: initialData?.id,
      crTypeId: selectedCRType,
      crNumber: data.crNumber,
      crRequestDate: data.crRequestDate,
      soW_CRs: sowCRPayload,
    };


    const isPrivilegedUser = isAdmin || isVendorManager;

  if (isPrivilegedUser) {
   
    if (isEditing || sowCRPayload.length) {
      upDateSow(commonPayload);
    } else {
      createSow.mutate(commonPayload);
    }
    return;
  }


  if (isEditing || sowCRPayload.length) {
    if (hasChanges(initialData, commonPayload)) {
      setModalMessage(
        "You are updating a SOW. Please check carefully. This update will go for approval. Do you want to continue?"
      );
      setPendingAction(() => () => upDateSow(commonPayload));
      setOpenModal(true);
    } else {
      upDateSow(commonPayload);
    }
  } else {
    setModalMessage(
      "You are creating a new SOW. This will go for approval. Do you want to continue?"
    );
    setPendingAction(() => () => createSow.mutate(commonPayload));
    setOpenModal(true);
  }
  };

const computedFlags = selectedCrData
  ? {
      isRateChange: !!selectedCrData.isRateChanged,
      isValidityExtension: !!selectedCrData.extendedDate,
      isOthers: !!selectedCrData.comments,
      isValueChange: !selectedCrData.isRateChanged && !selectedCrData.extendedDate && !selectedCrData.comments,
    }
  : crFlags;

 
  const isFieldDisabled = (field: string) => {
    if (isEditing) {
      if (crFlags?.isRateChange || crFlags.isValidityExtension || crFlags.isValueChange||crFlags.isOthers) return true;
      if (crFlags?.isValueChange) return field !== "tcValue";

      return false;
    }

    if (crFlags?.isRateChange) return true;
    if (crFlags?.isValueChange) return field !== "tcValue";

    return false;
  };


  const submitLabel =
  selectedCrData
    ? `Update ${selectedCategory || "CR"}`
    : selectedCategory
    ? `Create ${selectedCategory || "CR"}`
    : isEditing
    ? "Update SOW"
    : "Create SOW";




  return (
    <Card>
      <CardHeader className="border-b">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={onCancel}
            className="hover:bg-transparent p-0"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <CardTitle className="text-xl font-semibold">
            {crFlags?.isRateChange
              ? "Rate Change"
              : crFlags?.isValidityExtension
              ? "Validity Extension"
              : crFlags?.isValueChange
              ? "Value Change"
              : crFlags?.isOthers
              ? "Others"
              : isEditing
              ? "Edit SOW"
              : !initialData?.id
              ? "Add New SOW"
              : "SOW Details"}
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent className="p-6">
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-6"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <InputField
                control={form.control}
                name="sowNumber"
                label="SOW Number"
                placeholder="Enter SOW number"
                required
                disabled={isFieldDisabled("sowNumber")}
              />
              <DatePickerField
                control={form.control}
                name="startDate"
                label="Start Date"
                required
                disabled={isFieldDisabled("startDate")}
              />
              <DatePickerField
                control={form.control}
                name="endDate"
                label="End Date"
                required
                disabled={isFieldDisabled("endDate")}
              />
              <InputField
                control={form.control}
                name="tcValue"
                label="TC Value"
                placeholder="Enter TC value"
                type="number"
                required
                disabled={isFieldDisabled("tcValue")}
              />

              <SelectField
                control={form.control}
                name="status"
                label="Status"
                placeholder="Select status"
                options={[
                  { id: "Active", name: "Active" },
                  { id: "Inactive", name: "Inactive" },
                ]}
                required
                disabled={isFieldDisabled("status")}
              />
              {computedFlags?.isRateChange && (
                <Controller
                  control={form.control}
                  name="isRateChanged"
                  render={({ field }) => (
                    <div className="flex items-center gap-2 mt-2">
                      <input
                        type="checkbox"
                        className="h-4 w-4"
                        checked={field.value || false}
                        onChange={(e) => field.onChange(e.target.checked)}
                        onBlur={field.onBlur}
                        ref={field.ref}
                        required
                      />
                      <label className="text-sm text-muted-foreground font-medium">
                        Rate Changed
                      </label>
                    </div>
                  )}
                />
              )}

              {computedFlags?.isValidityExtension && (
                <DatePickerField
                  control={form.control}
                  name="extendedDate"
                  label="Extended End Date"
                  required
                />
              )}

              {computedFlags?.isOthers && (
                <TextareaField
                  control={form.control}
                  name="crComments"
                  label="Comments"
                  placeholder="Describe what has changed"
                  required
                />
              )}

              {computedFlags?.isValueChange && (
                <InputField
                  control={form.control}
                  name="crValue"
                  label="CR Value"
                  placeholder="Enter CR value"
                  type="number"
                  required
                />
              )}
              {(crFlags?.isRateChange ||
                crFlags?.isValueChange ||
                crFlags?.isValidityExtension ||
                crFlags?.isOthers) && (
                <InputField
                  control={form.control}
                  name="crNumber"
                  label="CR Number"
                  placeholder="Enter CR Number"
                  required
                />
              )}

              {(crFlags?.isRateChange ||
                crFlags?.isValueChange ||
                crFlags?.isValidityExtension ||
                crFlags?.isOthers) && (
                <DatePickerField
                  control={form.control}
                  name="crRequestDate"
                  label="CR Request Date"
                  required
                />
              )}
            </div>

            <div className="flex justify-end gap-4 pt-6">
              {(crFlags?.isRateChange ||
                crFlags?.isValueChange ||
                crFlags?.isValidityExtension ||
                crFlags?.isOthers) && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleViewDetails}
                  disabled={createSow.isPending}
                >
                  View CR
                </Button>
              )}
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={form.formState.isSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createSow.isPending || updateLoading}
                className="bg-[#0958d9] hover:bg-[#006D54]"
              >
                {createSow.isPending || updateLoading
                  ? submitLabel.replace(/^(Create|Update)/, (m) =>
                      m === "Create" ? "Creating" : "Updating"
                    ) + "..."
                  : submitLabel}
              </Button>
            </div>
          </form>
        </Form>
         <ConfirmationDialog
                     open={openModal}
                     onOpenChange={setOpenModal}
                     message={modalMessage}
                     onConfirm={() => {
                       if (pendingAction) pendingAction();
                      }}
                     />
        {showDetails && (
          <div className="mt-6">
            <CrHistoryDetails
              crData={getCRdata?.soW_CRs}
              onEditCR={handleEditCR}
              isToggle={true}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}