// RCMSValidationForm.tsx
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { InputField } from "../form-fields/InputField";
import { useQuery } from "@tanstack/react-query";
import { hiringApi } from "../../services/api/hiring.api";
import { Switch } from "../ui/switch";
import { toast } from "@/lib/toast";
import { Dispatch, SetStateAction } from "react";

// 1) Discriminated-union schemas
const newSchema = z.object({
  mode: z.literal("new"),
  rcMsId: z.string().min(1, "RCMS ID is required"),
  projectId: z.string().min(1, "Project ID is required"),
});

const replicaSchema = z.object({
  mode: z.literal("replica"),
  hrqid: z.string().min(1, "HRQ ID is required"),
});

const validationSchema = z.discriminatedUnion("mode", [
  newSchema,
  replicaSchema,
]);

type ValidationFormValues = z.infer<typeof validationSchema>;


interface RCMSValidationFormProps {
  onValidationSuccess: (data: any, mode: "new" | "replica") => void;
  setValidate: Dispatch<SetStateAction<boolean>>;
}

export function RCMSValidationForm({
  onValidationSuccess,setValidate
}: RCMSValidationFormProps) {
  // 2) Init form with resolver and default mode=new
  const form = useForm<ValidationFormValues>({
    resolver: zodResolver(validationSchema),
    defaultValues: {
      mode: "new",
      rcMsId: "",
      projectId: "",
      hrqid: "",
    } as ValidationFormValues,
  });

  const { watch, handleSubmit, setValue, control } = form;
  const mode = watch("mode");
  const hrqid = watch("hrqid");
  const rcMsId = watch("rcMsId");
  const projectId = watch("projectId");

  const { refetch, isFetching: isLoading,isError } = useQuery({
    queryKey: [
      "validateHiring",
      mode,
      mode === "new"
        ? [rcMsId, projectId]
        : hrqid,
    ],
    queryFn: () =>
      mode === "new"
        ? hiringApi.getHiringByID(watch("rcMsId"), watch("projectId"))
        : hiringApi.getHiringReplica(watch("hrqid")),
    enabled: false,
  });


  const handleValidate = async (values: ValidationFormValues): Promise<void> => {

   if(mode==="new"){
    setValidate(false)
   }
    try {
      const response = await refetch();
      const data = response?.data

      if(data.status ===false){
        toast.error(data?.message)
        setValidate(false)
        return
      }
   
      if (response.data) {
        onValidationSuccess(response?.data, mode);
      }
    } catch (error) {
      console.error("Validation failed:", error);
    }
  };

  return (
    <form
      onSubmit={handleSubmit(handleValidate)}
      className="grid grid-cols-1 md:grid-cols-3 gap-6 py-6 w-full"
    >
      {/* Move toggle to top as full-width */}
      <div className="md:col-span-3 flex items-center gap-2">
        <label className="text-sm">Type of Rec</label>
        <Switch
          checked={mode === "replica"}
          onCheckedChange={(val: boolean) =>
            setValue("mode", val ? "replica" : "new", {
              shouldValidate: true,
              shouldTouch: true,
            })
          }
        />
        <span className="text-sm">
          {mode === "replica" ? "Replica" : "New"}
        </span>
      </div>

      {/* Conditional fields */}
      {mode === "new" ? (
        <>
          <InputField
            control={control}
            name="rcMsId"
            label="RCMS  PROJECT ID"
            placeholder="enter rcms project id"
            required
          />
          <InputField
            control={control}
            name="projectId"
            label="RESOURCE REQUEST ID"
            placeholder="enter resource request id"
            required
          />
        </>
      ) : (
        <InputField
          control={control}
          name="hrqid"
          label="HRQ ID"
          placeholder="HRQ ID"
          required
        />
      )}

      {/* Validate button spans remaining columns */}
      <div className="md:col-span-3 flex items-end">
        <Button
          type="submit"
          variant="hpButton"
          className="px-4"
          disabled={isLoading}
        >
          {isLoading ? "Validating..." : "Validate"}
        </Button>
      </div>
    </form>
  );
}
