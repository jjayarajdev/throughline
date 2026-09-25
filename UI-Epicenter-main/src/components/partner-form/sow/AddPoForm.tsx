"use client";

import * as z from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { InputField } from "@/components/form-fields/InputField";
import { DatePickerField } from "@/components/form-fields/DatePickerField";
import { SelectField } from "@/components/form-fields/SelectField";
import { ArrowLeft, CloudCog } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { partnerApi } from "@/services/api/partner.profile.api";
import { ErrorHandler } from "@/components/error/ErrorHandler";
import { useEffect, useState } from "react";
import CrHistoryDetails, { SowCR } from "./CRHistoryDetails";
import { onboarding } from "@/services/api/onboarding.api";

interface PODetails {
  poNumber: string;
  startDate: string;
  value: number;
  status: boolean;
  id: number;
  endDate: string;
  poValue: number;
  sowId: number;
  extendedDate: string
  comments: string
  crNumber?:string;
  crRequestDate?:string
}


export interface PoPayload {
  id: number;
  poNumber: string;
  startDate: string;
  endDate: string;
  poValue: number;
  status: boolean;
  sowId: number;
  extendedDate?: string;
  comments?: string;
  crTypeId: number;
  crNumber:number;
  crRequestDate:string
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

let crFlagsGlobalForPO: {
  isRateChange?: boolean;
  isValidityExtension?: boolean;
  isValueChange?: boolean;
  isOthers?: boolean;
} = {};

export const poFormSchema = z
  .object({
    poNumber: z.string().min(1, "PO number is required"),
    startDate: z.string().min(1, "Start Date is required"),
    endDate: z.string().min(1, "End Date is required"),
    poValue: z
      .string()
      .min(1, "PO value is required")
      .refine((val) => parseFloat(val) > 0, {
        message: "PO value must be greater than 0",
      }),
    status: z.enum(["Active", "Inactive"], {
      required_error: "Status is required",
    }),
    extendedDate: z.string().optional(),
    crComments: z.string().optional(),
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
    const flags = crFlagsGlobalForPO;

    if (flags.isValidityExtension && !data.extendedDate) {
      ctx.addIssue({
        path: ["extendedDate"],
        message: "Extended End Date is required",
        code: z.ZodIssueCode.custom,
      });
    }
    if (flags.isValueChange && !data.crValue) {
      ctx.addIssue({
        path: ["crValue"],
        message: "CR Value is required",
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


type FormValues = z.infer<typeof poFormSchema>;

interface AddPoFormProps {
  
  onCancel: () => void;
  sowData: SOWDetails;
  initialData?: PODetails;
  isEditing?: boolean;
  crType?: "validity-extension" | "value-change" | "others" | string;
  addPo: boolean
  selectedCrType: number
  sowNumber:number
}

interface POFormData {
  poNumber: string;
  startDate: string;
  endDate: string;
  value: string;
  status: "Active" | "Inactive";
}

export function AddPoForm({
 
  onCancel,
  sowData,
  initialData,
  isEditing,
  crType,
  addPo,
  selectedCrType,
  sowNumber
}: AddPoFormProps) {
  const queryClient = useQueryClient();
 const [showDetails, setShowDetails] = useState(false);
const [selectedCrData, setSelectedCrData] = useState<SowCR | null>(null);
const selectedCategory = crType === "validity-extension"
    ? "Validity Extension"
    : crType === "value-change" 
    ? "Value Change"
    : crType === "others"
    ? "Others"
    : "";
  const handleViewDetails = () => {
    setShowDetails(!showDetails);
  };
  const form = useForm<FormValues>({
    resolver: zodResolver(poFormSchema),
    defaultValues: {
      poNumber: initialData?.poNumber || "",
      startDate:
        initialData?.startDate,
      endDate:
        initialData?.endDate,
      poValue: initialData?.poValue?.toString() || "",
      status: initialData?.status !== undefined ? (initialData.status ? "Active" : "Inactive") : "Active",
      crNumber:initialData?.crNumber,
      crRequestDate:initialData?.crRequestDate,
      extendedDate:initialData?.extendedDate,
    },
  });

  const {
  data: getCRdata,
  refetch: reFetchData,
  isPending,
} = useQuery({
  queryKey: ["getCRdata", initialData?.id],
  queryFn: () => onboarding.getPo(initialData?.id),
  enabled: !!initialData?.id,
});

useEffect(() => {
  if (getCRdata?.poValue) {
    form.reset({
      ...form.getValues(),
      poValue: getCRdata.poValue.toString(),
    });
  }
}, [getCRdata?.poValue]);
 
  const createpo = useMutation({
    mutationFn: partnerApi.createPo,
    onSuccess: (newPo) => {
      reFetchData()
      toast.success(newPo?.message || "PO created successfully");
      queryClient.invalidateQueries({ queryKey: ["getsowData"] });
      form.reset();
      onCancel();
    },
    onError: (error: any) => {
      const message =
      error?.response?.data?.message ||
      error?.message ||                 
      "Failed to create PO";
      
      toast.error(message);
      console.error("Error creating PO:", error);
    },
  });

  const computedFlags = selectedCrData
  ? {
      isValidityExtension: !!selectedCrData.extendedDate,
      isOthers: !!selectedCrData.comments,
      isValueChange:
        !selectedCrData.extendedDate && !selectedCrData.comments,
    }
  : {
      isValidityExtension: crType === "validity-extension",
      isOthers: crType === "others",
      isValueChange: crType === "value-change",
    };

function clearCrFields(form:any) {
  form.setValue("extendedDate", "");
  form.setValue("crComments", "");
  form.setValue("isRateChanged", false);
  form.setValue("crNumber", "");
  form.setValue("crRequestDate", "");
  form.setValue("crValue", "");
}
  const { mutate: updatePo, isPending: updateLoading, isError, error } = useMutation({
    mutationFn: (values: PoPayload) =>
      partnerApi.updatePo(Number(initialData?.id), values),
    onSuccess: (data) => {
      reFetchData()
      queryClient.invalidateQueries({ queryKey: ["getsowData"] });
      if (selectedCrData) {
      toast.success("CR updated successfully");
      clearCrFields(form)
    } else if (computedFlags?.isValueChange || computedFlags?.isValidityExtension || computedFlags?.isOthers) {
      toast.success("CR created successfully");
      clearCrFields(form)
    } else {
      toast.success(data?.message || "PO created successfully");
      clearCrFields(form)
      onCancel(); 
    }
    },
    onError: (error) => {
      toast.error("Failed to update PO");
     
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

  

  if (cr.extendedDate) {
    form.setValue("extendedDate", cr.extendedDate);
  }

  if (cr.comments) {
    form.setValue("crComments", cr.comments);
  }
  if (cr.crValue) {
    form.setValue("crValue", cr.crValue?.toString());
  }
};

  const handleSubmit = (data: FormValues) => {

    let finalTcValue = Number(data.poValue || 0);

if (selectedCrData && data.crValue) {
  const previousCrValue = Number(selectedCrData.crValue || 0);
  const newCrValue = Number(data.crValue || 0);
  const delta = newCrValue - previousCrValue;
  finalTcValue += delta;
} else if (!selectedCrData && data.crValue) {
  
  finalTcValue += Number(data.crValue);
}
    const isCR =
        crType === "validity-extension" ||
        crType === "value-change" ||
        crType === "others" ||
        crType === "rate-change";
        const poCRPayload = isCR
        ? [
            { 
              ...(selectedCrData?.id ? { id: selectedCrData.id } : {}),
              crTypeId: selectedCrType,
              crNumber: data.crNumber,
              crRequestDate: data.crRequestDate,
              ...(crType === "validity-extension" && data.extendedDate
                ? { extendedDate: data.extendedDate }
                : {}),
              ...(crType === "others" && data.crComments
                ? { comments: data.crComments }
                : {}),
              ...(crType === "value-change" && data.crValue
                ? { crValue:Number(data.crValue) }
                : {}),
              poId: initialData?.id ?? 0,
            },
          ]
        : [];
    const commonPayload: PoPayload = {
      poNumber: data.poNumber,
      startDate: data.startDate,
      endDate: data.endDate,
      poValue:finalTcValue,
      status: data.status === "Active",
      sowId: initialData?.sowId ? initialData?.sowId : sowData?.id,
      id: initialData?.id ?? 0,
      pO_CRs:poCRPayload
    };
   
    
    if (isEditing || poCRPayload.length) {


      updatePo(commonPayload);

    } else {

      createpo.mutate(commonPayload);
    }

  };



  

crFlagsGlobalForPO = computedFlags;

 const isFieldDisabled = (field: string): boolean => {
  const isCR =
    crType === "validity-extension" ||
    crType === "value-change" ||
    crType === "others";

  
  if (isEditing) {
    return  crType === "validity-extension" ||
    crType === "value-change" ||
    crType === "others" ? true : false;
  }

  
  if (addPo) return false;

 
  if (isCR) {
    return  true;
  }

  
  return true;
};

  const submitLabel =
  selectedCrData
    ? `Update ${selectedCategory || "CR"}`
    : selectedCategory
    ? `Create ${selectedCategory || "CR"}`
    : isEditing
    ? "Update PO"
    : "Create PO";

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
            {crType === "validity-extension"
              ? "Validity Extension"
              : crType === "value-change"
              ? "Value Change"
              : crType === "others"
              ? "Others"
              : isEditing
              ? "Edit PO"
              : !initialData?.id
              ? "Add New PO"
              : "PO Details"}
          </CardTitle>
        </div>
        <p className="text-sm text-muted-foreground mt-2">
          SOW Number: {sowNumber}
        </p>
      </CardHeader>
      <CardContent className="p-6">
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-6"
          >

            {isError && (
              <ErrorHandler
                error={error}

              />
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <InputField
                control={form.control}
                name="poNumber"
                label="PO Number"
                placeholder="Enter PO number"
                required
                disabled={isFieldDisabled("poNumber")}
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
                name="poValue"
                label="PO Value"
                placeholder="Enter PO value"
                type="number"
                required
                disabled={isFieldDisabled("poValue")}
              />
              <SelectField
                control={form.control}
                name="status"
                label="Status"
                options={[
                  { id: "Active", name: "Active" },
                  { id: "Inactive", name: "Inactive" },
                ]}
                required
                disabled={isFieldDisabled("status")}
              />
              
               {(addPo && computedFlags.isValidityExtension) || (!addPo && computedFlags.isValidityExtension) ? (
                <DatePickerField
                  control={form.control}
                  name="extendedDate"
                  label="Extended Validity Date"
                 required
                />
              ) : null}
              {(addPo && computedFlags.isOthers) || (!addPo && computedFlags.isOthers) ? (
                <InputField
                  control={form.control}
                  name="crComments"
                  label="Change Request Comments"
                  placeholder="Enter reason for CR"
                  required
                />
              ) : null}
               {(addPo && computedFlags.isValueChange) || (!addPo && computedFlags.isValueChange) ? (
                 <InputField
                control={form.control}
                name="crValue"
                label="PO CR Value"
                placeholder="PO CR value"
                type="number"
                required
                
              />
              ) : null}

              {crType && (
                <InputField
                  control={form.control}
                  name="crNumber"
                  label="CR Number"
                  placeholder="Enter CR Number"
                  required
                />
              )}
              {crType && (
               <DatePickerField
                  control={form.control}
                  name="crRequestDate"
                  label="CR RequestDate"
                 required
                />
              )}
             
            </div>

            <div className="flex justify-end gap-4 pt-6">
              {crType && <Button
                type="button"
                variant="outline"
                onClick={handleViewDetails} 
                disabled={createpo.isPending}
              >
                View CR
              </Button>}
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={createpo.isPending}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createpo.isPending || updateLoading}
                className="bg-[#0958d9] hover:bg-[#006D54]"
              >
                {createpo.isPending || updateLoading
                  ? submitLabel.replace(/^(Create|Update)/, (m) =>
                      m === "Create" ? "Creating" : "Updating"
                    ) + "..."
                  : submitLabel}
              </Button>
            </div>
          </form>
        </Form>
         {showDetails && (
        <div className="mt-6">
          <CrHistoryDetails crData={getCRdata?.pO_CRs} onEditCR={handleEditCR} isToggle={false}/>
        </div>)}
      </CardContent>
    </Card>
  );
}
