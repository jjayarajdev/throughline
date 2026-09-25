"use client";

import { useEffect, useState } from "react";
import * as z from "zod";
import { Controller, FormProvider, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery } from "@tanstack/react-query";

import { MasterTypes } from "@/constants/masterTypes";
import { onboarding } from "@/services/api/onboarding.api";
import { Button } from "@/components/ui/button";
import { DatePickerField } from "../form-fields/DatePickerField";
import { SelectField } from "../form-fields/SelectField";
import { FileField } from "../form-fields/FileField";
import { InputField } from "../form-fields/InputField";
import { ResumePreview } from "../common/ResumePreview";

import { RadioGroup } from "@radix-ui/react-radio-group";
import { RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@radix-ui/react-label";
import { RadioGroupYesOrNo } from "../form-fields/RadioGroupYesOrNo";
import { MultiSelectField } from "../form-fields/MultiSelectField";
import { AlertCircle, Clock } from "lucide-react";
import { differenceInCalendarDays, isValid } from "date-fns";
import { TatIndicator } from "./ITPCSetup";
// Zod Schema
const trainingOrientationSchema = z
  .object({
    trainingSharedOn: z.string().min(1, "Training Shared On is required"),
    trainingCompleted: z.string().optional(),
    orientationDate: z.string().optional(),
    orientationCompletionDate: z.string().optional(),
    orientationStatusId: z.string().optional(),
    resumeUploaded: z
      .object({
        attachmentName: z.string().optional(),
        attachmentURL: z.string().optional(),
      })
      .optional(),
    reasonForReschedule: z.string().optional(),
    rescheduleOrientationDate: z.string().optional(),
    rcmsUploadStatusId: z.string().optional(),
    isTrainingCompleted: z.boolean().optional(),
    isOrientationCompleted: z.boolean().optional(),
    orientationSharedOn: z.string().optional(),
    releaseToOperationsDate: z.string().optional(),

    trainingModuleId: z
      .array(
        z.object({
          id: z.number(),
          name: z.string(),
        })
      )
      .optional(),

    sessionTakenByManagerId: z.string().optional(),
    isMovedToManager: z.boolean().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.isTrainingCompleted) {
    
      if (!data.resumeUploaded?.attachmentURL) {
        ctx.addIssue({
          path: ["resumeUploaded", "attachmentURL"],
          code: z.ZodIssueCode.custom,
          message: "Resume upload is required",
        });
      }
      if (!data.trainingModuleId || data.trainingModuleId.length === 0) {
        ctx.addIssue({
          path: ["trainingModuleId"],
          code: z.ZodIssueCode.custom,
          message: "At least one training module must be selected",
        });
      }

      
    }
    if (
      data.isOrientationCompleted === true &&
      data.orientationStatusId !== "65002"
    ) {
      if (!data.sessionTakenByManagerId?.trim()) {
        ctx.addIssue({
          path: ["sessionTakenByManagerId"],
          code: z.ZodIssueCode.custom,
          message: "Session Taken by Managers is required",
        });
      }
     
    
    }

    if (
      data.isOrientationCompleted === false &&
      data.orientationStatusId === "65002"
    ) {
      if (!data.reasonForReschedule?.trim()) {
        ctx.addIssue({
          path: ["reasonForReschedule"],
          code: z.ZodIssueCode.custom,
          message: "Reason for Reschedule is required",
        });
      }
      if (!data.rescheduleOrientationDate) {
        ctx.addIssue({
          path: ["rescheduleOrientationDate"],
          code: z.ZodIssueCode.custom,
          message: "Reschedule Orientation Date is required",
        });
      }
    }
  });

type TrainingOrientationFormValues = z.infer<typeof trainingOrientationSchema>;
type ITPCSetupFormValuesWithId = TrainingOrientationFormValues & {
  id?: string;
};

interface IProps {
  onSave: (data: ITPCSetupFormValuesWithId) => void;
  onboardingTimeline: Partial<ITPCSetupFormValuesWithId>;
  assetDetails: any;
}

function TrainingOrientation({
  onSave,
  onboardingTimeline,
  assetDetails,
}: IProps) {
  const { data: TRAINING_MODULE = [], isFetched: istraining } = useQuery({
    queryKey: ["getOrientationStatus", MasterTypes.TRAINING_MODULE],
    queryFn: () =>
      onboarding
        .getEmployeeCategory(MasterTypes.TRAINING_MODULE)
        .then((res) => res.data),
    retry: 1,
  });
  const form = useForm<TrainingOrientationFormValues>({
    resolver: zodResolver(trainingOrientationSchema),
    shouldUnregister: true,
    defaultValues: {
      trainingSharedOn: onboardingTimeline?.trainingSharedOn
        ? onboardingTimeline?.trainingSharedOn
        : assetDetails?.pcConfigurationDate || "",
      trainingCompleted: onboardingTimeline?.trainingCompleted || "",
      orientationDate: onboardingTimeline?.orientationDate || "",
      orientationStatusId:
        onboardingTimeline?.orientationStatusId?.toString(),
      reasonForReschedule: onboardingTimeline?.reasonForReschedule || "",
      resumeUploaded: onboardingTimeline?.resumeUploaded || undefined,
      rcmsUploadStatusId:
        onboardingTimeline?.rcmsUploadStatusId?.toString() || "",
      isTrainingCompleted: !!onboardingTimeline?.trainingCompleted,
      isOrientationCompleted: onboardingTimeline?.isOrientationCompleted,

      orientationCompletionDate:
          onboardingTimeline?.orientationSharedOn
      ,
      rescheduleOrientationDate:
        onboardingTimeline?.rescheduleOrientationDate || "",
      orientationSharedOn: onboardingTimeline?.orientationSharedOn || "",
      releaseToOperationsDate: onboardingTimeline?.releaseToOperationsDate
        ? onboardingTimeline?.releaseToOperationsDate
        : assetDetails?.pcConfigurationDate || "",

      trainingModuleId: Array.isArray(onboardingTimeline?.trainingModuleIds)
        ? TRAINING_MODULE.filter((s: any) =>
            onboardingTimeline?.trainingModuleIds.includes(s.id)
          ).map((s: any) => ({
            id: s.id,
            name: s.name,
          }))
        : [],
      isMovedToManager: onboardingTimeline?.isMovedToManager,
      sessionTakenByManagerId: onboardingTimeline?.sessionTakenByManagerId?.toString() || "",
    },
  });

  useEffect(() => {
    if (onboardingTimeline?.id) {
      form.reset({
        trainingSharedOn: onboardingTimeline?.trainingSharedOn || "",
        trainingCompleted: onboardingTimeline?.trainingCompleted || "",
        orientationDate: onboardingTimeline?.orientationDate || "",
        orientationStatusId:onboardingTimeline?.orientationStatusId?.toString() || "",
        reasonForReschedule: onboardingTimeline?.reasonForReschedule || "",
        resumeUploaded: onboardingTimeline?.resumeUploaded,
        rcmsUploadStatusId:
          onboardingTimeline?.rcmsUploadStatusId?.toString() || "",
        isTrainingCompleted: !!onboardingTimeline?.trainingCompleted,
        isOrientationCompleted: onboardingTimeline?.isOrientationCompleted,
        orientationCompletionDate:
         onboardingTimeline?.orientationCompletionDate ?onboardingTimeline?.orientationCompletionDate:onboardingTimeline?.orientationSharedOn,
        rescheduleOrientationDate:
          onboardingTimeline?.rescheduleOrientationDate || "",
        orientationSharedOn: onboardingTimeline?.orientationSharedOn || "",
        releaseToOperationsDate: onboardingTimeline?.releaseToOperationsDate
          ? onboardingTimeline?.releaseToOperationsDate
          : assetDetails?.pcConfigurationDate || "",

        trainingModuleId: Array.isArray(onboardingTimeline?.trainingModuleIds)
          ? TRAINING_MODULE.filter((s: any) =>
              onboardingTimeline?.trainingModuleIds.includes(s.id)
            ).map((s: any) => ({
              id: s.id,
              name: s.name,
            }))
          : [],

        isMovedToManager: onboardingTimeline?.isMovedToManager,

        sessionTakenByManagerId:
          onboardingTimeline?.sessionTakenByManagerId?.toString() || "",
      });
    }
  }, [onboardingTimeline, form]);

  const { data: orientationStatus = [], isFetched: isOrientationFetched } =
    useQuery({
      queryKey: ["getOrientationStatus", MasterTypes.ORIENTATION_STATUS],
      queryFn: () =>
        onboarding
          .getEmployeeCategory(MasterTypes.ORIENTATION_STATUS)
          .then((res) => res.data),
      retry: 1,
    });


     const { data: HIRING_DOMAIN_MANAGERS = [], isFetched: isHIRING_DOMAIN_MANAGERS } =
    useQuery({
      queryKey: ["getOrientationStatus", MasterTypes.HIRING_DOMAIN_MANAGERS],
      queryFn: () =>
        onboarding
          .getEmployeeCategory(MasterTypes.HIRING_DOMAIN_MANAGERS, {
          roleIds: "2,9",
          isActive: true,
        })
          .then((res) => res.data),
      retry: 1,
    });

  const { data: onboardingKit = [] } = useQuery({
    queryKey: ["getonboardingKit", MasterTypes.YES_OR_NO],
    queryFn: () =>
      onboarding
        .getEmployeeCategory(MasterTypes.YES_OR_NO)
        .then((res) => res.data),
    retry: 1,
  });

  const orientationStatusId = useWatch({
    control: form.control,
    name: "orientationStatusId",
  });
  const selectedStatus = orientationStatus.find(
    (item: any) => item.id === Number(orientationStatusId)
  );
  const isRescheduled = selectedStatus?.name === "Rescheduled";
  const isTrainingCompleted = form.watch("isTrainingCompleted");
  const resumeUploaded = form.watch("resumeUploaded");

  const isOrientationCompleted = useWatch({
    control: form.control,
    name: "isOrientationCompleted",
  });

  const orientationSharedOn = useWatch({
    control: form.control,
    name: "orientationSharedOn",
  });

  const rescheduleOrientationDate = useWatch({
    control: form.control,
    name: "rescheduleOrientationDate",
  });

  useEffect(() => {
    if (isOrientationCompleted === true && !onboardingTimeline?.orientationCompletionDate) {
      form.setValue("orientationCompletionDate", orientationSharedOn);
    }
  }, [isOrientationCompleted, orientationSharedOn, form]);

  useEffect(() => {
    if (isRescheduled && rescheduleOrientationDate && !isOrientationCompleted) {
      form.setValue("orientationSharedOn", rescheduleOrientationDate);
    }
  }, [isRescheduled, rescheduleOrientationDate, isOrientationCompleted, form]);

  useEffect(() => {
    if (!orientationStatus?.length) return;

    const completed = orientationStatus.find(
      (option) => option.name === "Completed"
    );
    const rescheduled = orientationStatus.find(
      (option) => option.name === "Rescheduled"
    );

    if (isOrientationCompleted && completed?.id) {
      form.setValue("orientationStatusId", String(completed.id));
    } else if (!isOrientationCompleted && rescheduled?.id) {
      form.setValue("orientationStatusId", String(rescheduled.id));
    }else{
      form.setValue("orientationStatusId", undefined);
    }
  }, [isOrientationCompleted, orientationStatus, form]);

  
useEffect(() => {
  if (typeof isOrientationCompleted !== "boolean") {
    form.setValue("orientationStatusId", undefined);
  }
}, [isOrientationCompleted, form]);



  const previewUrl = (file: any) => {
    if (!file?.attachmentURL) return "";
    return file?.attachmentURL.startsWith("http")
      ? file?.attachmentURL
      : `${process.env.NEXT_PUBLIC_API_BASE_URL}/FileServer/${file?.attachmentURL}`;
  };

  const onSubmit = (data: TrainingOrientationFormValues) => {
    const updateData = {
      id: onboardingTimeline?.id,
      trainingSharedOn: data.trainingSharedOn ? data.trainingSharedOn : null,
      trainingCompleted: data.trainingCompleted ? data.trainingCompleted : null,
      orientationDate: data.orientationDate ? data.orientationDate : null,
      orientationStatusId: data.orientationStatusId
        ? data.orientationStatusId
        : null,
      reasonForReschedule: data.reasonForReschedule
        ? data.reasonForReschedule
        : null,
      rcmsUploadStatusId: data.rcmsUploadStatusId
        ? data.rcmsUploadStatusId
        : null,
      isTrainingCompleted: data.isTrainingCompleted
        ? data.isTrainingCompleted
        : null,
      ...(typeof data.isOrientationCompleted === "boolean" && {
        isOrientationCompleted: data.isOrientationCompleted,
      }),
      ...(typeof data.isMovedToManager === "boolean" && {
        isMovedToManager: data.isMovedToManager,
      }),

      resumeUploaded: data.resumeUploaded
        ? data.resumeUploaded
        : { attachmentName: "", attachmentURL: "" },
     orientationCompletionDate:
        data.isOrientationCompleted
    ? data.orientationCompletionDate ?? null
    : null,
      rescheduleOrientationDate: data?.rescheduleOrientationDate
        ? data?.rescheduleOrientationDate
        : null,
      orientationSharedOn: data?.orientationSharedOn
        ? data?.orientationSharedOn
        : null,
      releaseToOperationsDate: data.releaseToOperationsDate
        ? data.releaseToOperationsDate
        : null,

      trainingModuleIds: data.trainingModuleId?data.trainingModuleId.map((s) => s.id):null,

      sessionTakenByManagerId:Number(data?.sessionTakenByManagerId) || null,
    };

    onSave(updateData);
  };

  return (
    <div className="p-6 bg-white rounded-2xl shadow-md space-y-8">
  <FormProvider {...form}>
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">

      {/* Training Section */}
      <section className="space-y-6 p-6  ">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between border-b border-gray-200 pb-4">
          <h2 className="text-xl font-semibold text-gray-800">Training</h2>
          <TatIndicator
           startDate={onboardingTimeline?.doj}
           endDate={onboardingTimeline?.trainingCompleted}
           />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <DatePickerField
            control={form.control}
            name="trainingSharedOn"
            label="Training Shared On Date"
            placeholder="Training Shared On Date"
            required
          />

          <div className="flex items-center gap-2 mt-1">
            <input
              type="checkbox"
              {...form.register("isTrainingCompleted")}
              id="isTrainingCompleted"
              className="h-4 w-4 text-green-600 border-gray-300 rounded"
            />
            <label htmlFor="isTrainingCompleted" className="text-sm font-medium text-gray-700">
              Is Training Completed
            </label>
          </div>

          {isTrainingCompleted && (
            <>
              <DatePickerField
                control={form.control}
                name="trainingCompleted"
                label="Training Completed Date"
                placeholder="Training Completed Date"
                required
              />

              <MultiSelectField
                control={form.control}
                name="trainingModuleId"
                label="Training Modules"
                placeholder="Select Training Modules"
                options={TRAINING_MODULE}
              />

              <div className="flex items-end gap-3">
                <div className="flex-1">
                  <FileField
                    control={form.control}
                    name="resumeUploaded"
                    label="Upload Resume in HPE Format"
                    accept=".ppt,.pptx,.pdf,.doc,.docx"
                  />
                </div>
                <ResumePreview
                  fileName="Resume in HPE Format"
                  url={previewUrl(resumeUploaded)}
                />
              </div>
            </>
          )}
        </div>
      </section>

      {/* Release to Operations Section */}
      <section className="p-6 ">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between border-b border-gray-200 pb-4">
          <h2 className="text-xl font-semibold text-gray-800">Release to Operations</h2>
          <TatIndicator
           startDate={onboardingTimeline?.doj}
           endDate={onboardingTimeline?.releaseToOperationsDate}
           />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
          <DatePickerField
            control={form.control}
            name="releaseToOperationsDate"
            label="Release To Operations Date"
            placeholder="Release To Operations Date"
          />

          <RadioGroupYesOrNo
            control={form.control}
            name="isMovedToManager"
            label="Is Resource moved to managers?"
          />
        </div>
      </section>

      {/* Orientation Section */}
      <section className="space-y-6 p-6 ">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between border-b border-gray-200 pb-4">
          <h2 className="text-xl font-semibold text-gray-800">Orientation</h2>
          <TatIndicator
            startDate={onboardingTimeline?.doj}
            endDate={onboardingTimeline?.orientationCompletionDate}
           />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <DatePickerField
            control={form.control}
            name="orientationSharedOn"
            label="Orientation Scheduled On Date"
            placeholder="Orientation Scheduled On Date"
          />

          <div className="mt-5">
            <Label className="mb-2 block text-sm font-medium">
              Is Orientation Completed?
            </Label>
            <Controller
              control={form.control}
              name="isOrientationCompleted"
              render={({ field }) => (
                <RadioGroup
                  value={typeof field.value === "boolean" ? String(field.value) : undefined}
                  onValueChange={(val) => field.onChange(val === "true")}
                  className="flex gap-6"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="true" id="isOrientationCompleted-yes" />
                    <Label htmlFor="isOrientationCompleted-yes">Yes</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="false" id="isOrientationCompleted-no" />
                    <Label htmlFor="isOrientationCompleted-no">No</Label>
                  </div>
                </RadioGroup>
              )}
            />
          </div>

          <SelectField
            control={form.control}
            name="orientationStatusId"
            label="Orientation Status"
            placeholder="Select Orientation Status"
            options={orientationStatus}
            disabled
          />

          {typeof isOrientationCompleted === "boolean" && (
            <>
              {isRescheduled ? (
                <>
                  <InputField
                    control={form.control}
                    name="reasonForReschedule"
                    placeholder="Enter reason"
                    label="Reasons for Reschedule"
                  />
                  <DatePickerField
                    control={form.control}
                    name="rescheduleOrientationDate"
                    label="Reschedule Orientation Date"
                    placeholder="Reschedule Orientation Date"
                  />
                </>
              ) : (
                <>
                  <SelectField
                    control={form.control}
                    name="sessionTakenByManagerId"
                    label="Session Taken by Manager"
                    placeholder="Enter Manager Name"
                    options={HIRING_DOMAIN_MANAGERS}
                  />
                  <DatePickerField
                    control={form.control}
                    name="orientationCompletionDate"
                    label="Orientation Completion Date"
                    placeholder="Orientation Completion Date"
                  />
                  <SelectField
                    control={form.control}
                    name="rcmsUploadStatusId"
                    label="RCMS Upload Status"
                    placeholder="RCMS Upload Status"
                    options={onboardingKit}
                  />
                </>
              )}
            </>
          )}
        </div>
      </section>

      {/* Submit Button */}
      <div className="flex justify-end">
        <Button
          type="submit"
          size="sm"
          className="bg-[#00b388] hover:bg-[#009e79] h-10 px-6 rounded-lg"
        >
          {onboardingTimeline?.id ? "Update" : "Submit"}
        </Button>
      </div>
    </form>
  </FormProvider>
</div>

  );
}

export default TrainingOrientation;





