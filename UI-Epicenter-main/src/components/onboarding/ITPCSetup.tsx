"use client";

import React, { useEffect, useState } from "react";
import { useForm, FormProvider, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { InputField } from "../form-fields/InputField";
import { Button } from "@/components/ui/button";
import { DatePickerField } from "../form-fields/DatePickerField";
import { SelectField } from "../form-fields/SelectField";
import { useQuery } from "@tanstack/react-query";
import { MasterTypes } from "@/constants/masterTypes";
import { onboarding } from "@/services/api/onboarding.api";
import { AlertCircle, Settings, Timer } from "lucide-react";
import { differenceInCalendarDays, differenceInHours, isValid } from "date-fns";

const itpcSetupSchema = z
  .object({
    pcRequestCreatedDate: z
      .string()
      .min(1, "PC Request created date is required"),
    pcRequestRefNo: z.string().min(1, "PC Request Ref No. is required"),
    pcSerialNo: z.string(),
    pcAllocationDate: z.string(),
    modeOfPcShipmentId: z.string(),
    pcReceivedOn: z.string(),
    pcConfigurationDate: z.string(),
    itAssetStatusID: z.string(),
    complianceFollowedId: z.string(),
    delayCategoryId: z.string().optional(),
    comments: z.string(),

    isPCAllocated: z.boolean(),
    isJoinConfirmed: z.boolean().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.isPCAllocated) {
      if (!data.pcAllocationDate.trim()) {
        ctx.addIssue({
          path: ["pcAllocationDate"],
          code: z.ZodIssueCode.custom,
          message: "Pc Allocation Date is required",
        });
      }

      if (!data.pcSerialNo.trim()) {
        ctx.addIssue({
          path: ["pcSerialNo"],
          code: z.ZodIssueCode.custom,
          message: "Pc Serial No Date is required",
        });
      }
    }
    if (data.isJoinConfirmed) {
      if (!data.modeOfPcShipmentId.trim()) {
        ctx.addIssue({
          path: ["modeOfPcShipmentId"],
          code: z.ZodIssueCode.custom,
          message: "Mode of PC shipment is required",
        });
      }
      if (!data.pcReceivedOn.trim()) {
        ctx.addIssue({
          path: ["pcReceivedOn"],
          code: z.ZodIssueCode.custom,
          message: "PC received on is required",
        });
      }

      if (!data.itAssetStatusID.trim()) {
        ctx.addIssue({
          path: ["itAssetStatusID"],
          code: z.ZodIssueCode.custom,
          message: "IT Asset Status is required",
        });
      }
      if (!data.complianceFollowedId.trim()) {
        ctx.addIssue({
          path: ["complianceFollowedId"],
          code: z.ZodIssueCode.custom,
          message: "Compliance Followed is required",
        });
      }
    }
  });

type ITPCSetupFormValues = z.infer<typeof itpcSetupSchema>;

type ITPCSetupFormValuesWithId = ITPCSetupFormValues & { id?: string };

interface IProps {
  onSave: (data: ITPCSetupFormValuesWithId) => void;
  onboardingTimeline: Partial<ITPCSetupFormValuesWithId>;
  personalDetails: any;
}

function ITPCSetup({ onSave, onboardingTimeline, personalDetails }: IProps) {
  const COMPLETED_ID = 64001;
  const UNDER_PROGRESS_ID = 64002;
  const form = useForm<ITPCSetupFormValues>({
    resolver: zodResolver(itpcSetupSchema),
    shouldUnregister: true,
    defaultValues: {
      pcRequestCreatedDate: onboardingTimeline?.pcRequestCreatedDate || "",
      pcRequestRefNo: onboardingTimeline?.pcRequestRefNo || "",
      pcSerialNo: onboardingTimeline?.pcSerialNo || "",
      pcAllocationDate: onboardingTimeline?.pcAllocationDate || "",
      modeOfPcShipmentId: onboardingTimeline?.modeOfPcShipmentId || "",
      pcReceivedOn: onboardingTimeline?.pcReceivedOn || "",
      pcConfigurationDate: onboardingTimeline?.pcConfigurationDate || "",
      itAssetStatusID: onboardingTimeline?.isPCAllocated
        ? onboardingTimeline.itAssetStatusID?.toString() ||
          UNDER_PROGRESS_ID.toString()
        : "",
      complianceFollowedId: onboardingTimeline?.complianceFollowedId?onboardingTimeline?.complianceFollowedId:"79003",
      delayCategoryId: onboardingTimeline?.delayCategoryId || "",
      comments: onboardingTimeline?.comments || "",
      isJoinConfirmed: onboardingTimeline?.isJoinConfirmed,
      isPCAllocated: onboardingTimeline?.isPCAllocated,
    },
  });

  useEffect(() => {
    if (onboardingTimeline) {
      form.reset({
        pcRequestCreatedDate: onboardingTimeline.pcRequestCreatedDate || "",
        pcRequestRefNo: onboardingTimeline.pcRequestRefNo || "",
        pcSerialNo: onboardingTimeline.pcSerialNo || "",
        pcAllocationDate: onboardingTimeline.pcAllocationDate || "",
        modeOfPcShipmentId:
          onboardingTimeline.modeOfPcShipmentId?.toString() || "",
        pcReceivedOn: onboardingTimeline.pcReceivedOn || "",
        pcConfigurationDate: onboardingTimeline.pcConfigurationDate || "",
        itAssetStatusID: onboardingTimeline?.isPCAllocated
          ? onboardingTimeline.itAssetStatusID?.toString() ||
            UNDER_PROGRESS_ID.toString()
          : "",
        complianceFollowedId:
          onboardingTimeline.complianceFollowedId?.toString() || "",
        delayCategoryId: onboardingTimeline.delayCategoryId?.toString() || "",
        comments: onboardingTimeline.comments || "",
        isJoinConfirmed: onboardingTimeline?.isJoinConfirmed,

        isPCAllocated: onboardingTimeline?.isPCAllocated,
      });
    }
  }, [onboardingTimeline, form]);

  const { data: pcshipement = [] } = useQuery({
    queryKey: ["getEmployeeCategoryData", MasterTypes.PC_SHIPMENT_MODE],
    queryFn: async () => {
      const res = await onboarding.getEmployeeCategory(
        MasterTypes.PC_SHIPMENT_MODE
      );
      return res.data;
    },
    retry: 1,
  });
  const { data: itAssetStatus = [] } = useQuery({
    queryKey: ["getEmployeeItAssetStatus", MasterTypes.IT_ASSET_STATUS],
    queryFn: async () => {
      const res = await onboarding.getEmployeeCategory(
        MasterTypes.IT_ASSET_STATUS
      );
      return res.data;
    },
    retry: 1,
  });


  const { data: DELAY_CATEGORY = [] } = useQuery({
    queryKey: ["getDELAY_CATEGORY", MasterTypes.DELAY_CATEGORY],
    queryFn: async () => {
      const res = await onboarding.getEmployeeCategory(
        MasterTypes.DELAY_CATEGORY
      );
      return res.data;
    },
    retry: 1,
  });

 

  useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      if (name === "pcConfigurationDate") {
        const statusId = value.pcConfigurationDate
          ? COMPLETED_ID
          : UNDER_PROGRESS_ID;
        form.setValue("itAssetStatusID", String(statusId));
      }
    });

    return () => subscription.unsubscribe();
  }, [form]);


  useEffect(() => {
  const received = form.getValues("pcReceivedOn");
  const configured = form.getValues("pcConfigurationDate");

  if (received && configured) {
    const receivedDate = new Date(received);
    const configuredDate = new Date(configured);

    if (isValid(receivedDate) && isValid(configuredDate)) {
      const days = differenceInCalendarDays(configuredDate, receivedDate);

      if (days <= 3) {
        form.setValue("complianceFollowedId", "79001"); // On-Time
      } else {
        form.setValue("complianceFollowedId", "79002"); // Delayed
      }
    }
  } else {
    // If no dates, default to "Yet to Join"
    form.setValue("complianceFollowedId", "79003");
  }
}, [
  form.watch("pcReceivedOn"),
  form.watch("pcConfigurationDate"),
  form
]);


  const { data: COMPLAINCE_FOLLOWED = [], isFetched: isComplaince } = useQuery({
    queryKey: ["getComplianceFollowedData", MasterTypes.COMPLAINCE_FOLLOWED],
    queryFn: () =>
      onboarding
        .getEmployeeCategory(MasterTypes.COMPLAINCE_FOLLOWED)
        .then((res) => res.data),
    retry: 1,
  });

  const joiningConformedId = form.watch("isJoinConfirmed");
  const IsPCAllocatedId = form.watch("isPCAllocated");
  const complianceFollowedId = useWatch({
    control: form.control,
    name: "complianceFollowedId",
  });

  useEffect(() => {
    const currentDelay = form.getValues("delayCategoryId");
    if (complianceFollowedId === "79001" && currentDelay !== "69001") {
      form.setValue("delayCategoryId", "69001");
    }else if (complianceFollowedId === "79004" && currentDelay !== "69008") {
      form.setValue("delayCategoryId", "69008");
    }
  }, [complianceFollowedId, form]);

  const onSubmit = (data: ITPCSetupFormValues) => {
    let updateData = {
      delayCategoryId: data.delayCategoryId ? data.delayCategoryId : null,
      pcAllocationDate: data.pcAllocationDate ? data.pcAllocationDate : null,
      modeOfPcShipmentId: data.modeOfPcShipmentId
        ? data.modeOfPcShipmentId
        : null,
      pcReceivedOn: data.pcReceivedOn ? data.pcReceivedOn : null,
      pcConfigurationDate: data.pcConfigurationDate
        ? data.pcConfigurationDate
        : null,
      itAssetStatusID: data.isPCAllocated
        ? data.itAssetStatusID
          ? data.itAssetStatusID
          : null
        : null,
      complianceFollowedId: data.complianceFollowedId
        ? data.complianceFollowedId
        : null,
      pcSerialNo: data.pcSerialNo ? data.pcSerialNo : null,

      id: onboardingTimeline?.id,
      ...(data.isPCAllocated && { isPCAllocated: data.isPCAllocated }),
      ...(data.isJoinConfirmed && { isJoinConfirmed: data.isJoinConfirmed }),
      pcRequestCreatedDate: data.pcRequestCreatedDate
        ? data.pcRequestCreatedDate
        : null,
      pcRequestRefNo: data.pcRequestRefNo ? data.pcRequestRefNo : null,
      comments: data.comments ? data.comments : null,
    };

    onSave(updateData);
  };

  return (
    <div>
  <FormProvider {...form}>
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-10">

      {/* === Section 1: PC Request === */}
      <section className="p-5">
        <h2 className="text-lg font-semibold mb-4">PC Request</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <DatePickerField
            control={form.control}
            name="pcRequestCreatedDate"
            label="PC Request Created Date"
            required
          />
          <InputField
            control={form.control}
            name="pcRequestRefNo"
            label="PC Request Ref No."
            placeholder="Enter reference number"
            required
          />
        </div>
      </section>

      {/* === Section 2: PC Allocation === */}
      <section className="p-5 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between border-b border-gray-200 pb-4">
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              {...form.register("isPCAllocated")}
              id="isPCAllocated"
              className="h-4 w-4 accent-blue-600"
            />
            <label htmlFor="isPCAllocated" className="text-sm font-medium">
              Is PC Allocated?
            </label>
          </div>
          <TatIndicator
            startDate={personalDetails?.dateOfJoining}
            endDate={onboardingTimeline?.pcAllocationDate}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <DatePickerField
            control={form.control}
            name="pcAllocationDate"
            label="PC Allocation Date"
            required={IsPCAllocatedId}
            disabled={!IsPCAllocatedId}
            disabledDates={[]}
          />
          <InputField
            control={form.control}
            name="pcSerialNo"
            label="PC Serial No."
            placeholder="Enter PC serial number"
            required={IsPCAllocatedId}
            disabled={!IsPCAllocatedId}
          />
        </div>
      </section>

      {/* === Section 3: PC Configuration === */}
      <section className="p-5  space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between border-b border-gray-200 pb-4">
          <h6 className="font-medium">Confirm Joining prior allocating PC</h6>
          <TatIndicator
            startDate={personalDetails?.dateOfJoining}
            endDate={onboardingTimeline?.pcConfigurationDate}
          />
        </div>

       

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
           <div className="flex items-center">
          <input
            type="checkbox"
            {...form.register("isJoinConfirmed")}
            id="isJoinConfirmed"
            className="h-4 w-4 accent-blue-600"
            disabled
          />
          <label htmlFor="isJoinConfirmed" className="ml-2 text-sm font-medium">
            Joining Confirmed
          </label>
        </div>
          <SelectField
            control={form.control}
            name="modeOfPcShipmentId"
            label="Mode of PC Shipment"
            placeholder="Select Mode of PC Shipment"
            options={pcshipement}
            required={joiningConformedId}
            disabled={!joiningConformedId}
          />
          <DatePickerField
            control={form.control}
            name="pcReceivedOn"
            label="PC Received On"
            required={joiningConformedId}
            disabled={!joiningConformedId}
          />
          <DatePickerField
            control={form.control}
            name="pcConfigurationDate"
            label="PC Configuration Date"
            disabled={!joiningConformedId}
          />
          
          <SelectField
            control={form.control}
            name="itAssetStatusID"
            label="IT Asset Status"
            placeholder="Select IT Asset Status"
            options={itAssetStatus}
            required={joiningConformedId}
            disabled
          />
           <PcTatSection form={form} />
        </div>

       
      </section>

      <section className="p-5  space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <SelectField
            control={form.control}
            name="complianceFollowedId"
            label="Compliance Followed"
            placeholder="Select Followed"
            options={COMPLAINCE_FOLLOWED}
            required={joiningConformedId}
            disabled={!joiningConformedId}
          />
          <SelectField
            control={form.control}
            name="delayCategoryId"
            label="Delay Category"
            placeholder="Select Delay Category"
            options={DELAY_CATEGORY}
            disabled={!joiningConformedId}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Comments</label>
          <textarea
            disabled={!joiningConformedId}
            {...form.register("comments")}
            className="w-full border rounded px-3 py-2 min-h-[100px]"
            placeholder="Enter any remarks or comments"
          ></textarea>
        </div>
      </section>

      {/* === Submit Button === */}
      <div className="flex justify-end">
        <Button
          type="submit"
          size="sm"
          className="bg-[#00b388] hover:bg-[#009e79] h-9"
        >
          {onboardingTimeline?.id ? "Update" : "Submit"}
        </Button>
      </div>
    </form>
  </FormProvider>
</div>

  );
}

export default ITPCSetup;



export function PcTatSection({ form }: { form: any }) {
  const pcReceivedOn = useWatch({ control: form.control, name: "pcReceivedOn" });
  const pcConfigurationDate = useWatch({ control: form.control, name: "pcConfigurationDate" });

  const [tatDays, setTatDays] = useState<number | null>(null);
  const [showRedAlert, setShowRedAlert] = useState(false);

  useEffect(() => {
    if (pcReceivedOn) {
      const received = new Date(pcReceivedOn);
      const configured = pcConfigurationDate ? new Date(pcConfigurationDate) : new Date();

      if (isValid(received) && isValid(configured)) {
        const days = differenceInCalendarDays(configured, received);
        setTatDays(days);
        setShowRedAlert(days > 3); // more than 3 days = red
      } else {
        setTatDays(null);
        setShowRedAlert(false);
      }
    } else {
      setTatDays(null);
      setShowRedAlert(false);
    }
  }, [pcReceivedOn, pcConfigurationDate]);

  return (
    <div className="space-y-2 mt-8">
      {tatDays !== null && (
        <div
          className={`text-sm font-semibold flex items-center gap-2 transition-opacity duration-500 animate-fade-in ${
            showRedAlert
              ? "text-red-600 animate-pulse-alert"
              : "text-green-600"
          }`}
        >
          {showRedAlert && <AlertCircle className="w-4 h-4" />}
          TAT: {tatDays} day{tatDays !== 1 ? "s" : ""}
          {showRedAlert && <span>(Exceeded 3 days!)</span>}
        </div>
      )}
    </div>
  );
}

export function TatIndicator({
  startDate,
  endDate,
  limitDays = 3,
}: {
  startDate?: Date | string | null;
  endDate?: Date | string | null;
  limitDays?: number;
}) {
  const [tatDays, setTatDays] = useState<number | null>(null);
  const [showRedAlert, setShowRedAlert] = useState(false);

  useEffect(() => {
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);

      if (isValid(start) && isValid(end)) {
        const days = differenceInCalendarDays(end, start);
        setTatDays(days);
        setShowRedAlert(days > limitDays);
      } else {
        setTatDays(null);
        setShowRedAlert(false);
      }
    } else {
      setTatDays(null);
      setShowRedAlert(false);
    }
  }, [startDate, endDate, limitDays]);

  return (
    <div
      className={`text-sm font-semibold flex items-center gap-2 transition-opacity duration-500 animate-fade-in ${
        showRedAlert ? "text-red-600 animate-pulse-alert" : "text-green-600"
      }`}
    >
      TAT
      {tatDays !== null && (
        <>
          : {tatDays} day{tatDays !== 1 ? "s" : ""}
          {showRedAlert && <span>(Exceeded {limitDays} days!)</span>}
        </>
      )}
    </div>
  );
}
