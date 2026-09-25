"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { InputField } from "../form-fields/InputField";
import { FileField } from "../form-fields/FileField";
import { useHiringStore } from "@/store/useHiringStore";
import { TextareaField } from "../form-fields/TextAreaField";
import { useParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "@/lib/toast";
import { createCalibrationPayload, hiringApi } from "@/services/api/hiring.api";
import {  PencilIcon } from "lucide-react";
import { HiringSummaryProps } from "./types";
import SubmitFormLoader from "../common/SubmitFormLoader";
import { DatePickerField } from "../form-fields/DatePickerField";
import { LoadingButton } from "../form-fields/LoadingButton";
import { ResumePreview } from "../common/ResumePreview";

const calibrationSchema = z.object({
  hrqId: z.string().min(1, "HRQ ID is required"),
  jobTitle: z.string().optional(),
  attendees: z.string().min(1, "attendees is required"),
  calibrationDate: z.string().min(1, "Date is required"),
  primaryChanges: z.string().min(1, "primary skills is Required"),
  secondaryChanges: z.string().min(1, "secondary skills is Required"),
  certifications: z.string().min(1, "certifications is Required"),
  comments: z.string().optional(),
  documents: z.object({
    attachmentName: z.string().optional(),
    attachmentURL: z.string().optional(),
  }).optional().nullable(),
});

// Wrap in object key 'calibrations'
const schema = z.object({ calibrations: calibrationSchema });

type FormValues = z.infer<typeof schema>;

interface SkillsCalibrationFormProps {
  onPrevious?: () => void;
  onNext?: () => void;
  hiringData: HiringSummaryProps;
}

export default function SkillsCalibrationForm({
  onPrevious,
  onNext,
  hiringData,
}: SkillsCalibrationFormProps) {
  const [showForm, setShowForm] = useState(false);
  const [editCalibrationId, setCalibrationId] = useState<number | null>(null);
  const { hrqid, jobtitle } = useHiringStore();
  const [editMode, setEditmode] = useState(false);
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      calibrations: {
        hrqId: hiringData?.hrqid || "",
        jobTitle: hiringData?.jobDetail || "",
        attendees: "",
        calibrationDate: "",
        primaryChanges: "",
        secondaryChanges: "",
        certifications: "",
        comments: "",
        documents: undefined,
      },
    },
  });
  const { hiring } = useParams();
  const queryClient = useQueryClient();
  const { data: getCalibrations, isLoading } = useQuery({
    queryKey: ["getCalibrations", hiring],
    queryFn: () => hiringApi.getCalibrations(Number(hiring)),
    enabled: !!hiring,
  });
  const { mutate: createCalibration, isPending } = useMutation({
    mutationKey: ["createCalibration"],
    mutationFn: hiringApi.createCalibration,
    onSuccess: (data) => {
      toast.success(data?.message || "calibration created");
      queryClient.invalidateQueries({ queryKey: ["getCalibrations"] });
      form.reset({
        calibrations: {
          hrqId: hiringData?.hrqid,
          jobTitle: hiringData?.jobDetail,
          attendees: "",
          calibrationDate: "",
          primaryChanges: "",
          secondaryChanges: "",
          certifications: "",
          documents: "",
          comments: "",
        },
      });
      setShowForm(false);
    },
    onError: (error) => {
      toast.error("Failed to create partner");
      console.error("Error creating partner:", error);
    },
  });
  const { mutate: updateCalibration, isPending: UpdateLoading } = useMutation({
    mutationFn: (values: createCalibrationPayload) =>
      hiringApi.updateCalibration(Number(editCalibrationId), values),
    onSuccess: (data) => {
      form.reset({
        calibrations: {
          hrqId: hiringData?.hrqid || "",
          jobTitle: hiringData?.jobDetail || "",
          attendees: "",
          calibrationDate: "",
          primaryChanges: "",
          secondaryChanges: "",
          certifications: "",
          comments: "",
          documents: "",
        },
      });
      toast.success(data?.message || "Calibration updated successfully");
      setShowForm(false);
      setEditmode(false);
      queryClient.invalidateQueries({ queryKey: ["getCalibrations"] });
    },
    onError: (error) => {
      toast.error("Failed to update hiring");
      console.log("Error updating hiring:", error);
    },
  });
  const handleFormSubmit = (data: FormValues) => {
    const values = data.calibrations;


    const transformedPayload = {
      id: editMode ? editCalibrationId : 0,
      hrqId: values.hrqId,
      jobTitle: values.jobTitle,
      attendees: values.attendees,
      calibrationDate: new Date(values.calibrationDate).toISOString(),
      primarySkills: values.primaryChanges,
      secondarySkills: values.secondaryChanges,
      certifications: values.certifications,
      comments: values.comments,
      hiringRequestId: Number(hiring),
      documents: values.documents || {
        attachmentName: "",
        attachmentURL: "",
      },
    };

    if (editMode) {
      updateCalibration(transformedPayload);
    } else {
      createCalibration(transformedPayload);
    }
  };

  useEffect(() => {
    form.setValue("calibrations.hrqId", hrqid);
    form.setValue("calibrations.jobTitle", jobtitle);
  }, [hrqid, jobtitle]);

  const onEdit = (value: any[]) => {
    setCalibrationId(value.id);
    setShowForm(true);
    setEditmode(true);
    form.reset({
      calibrations: {
        hrqId: value?.hrqId || "",
        jobTitle: value?.jobTitle || "",
        attendees: value.attendees,
        calibrationDate: new Date(value?.calibrationDate)
          .toISOString()
          .split("T")[0],
        primaryChanges: value.primarySkills,
        secondaryChanges: value.secondarySkills,
        certifications: value.certifications,
        comments: value.comments,
        documents: value?.documents || {
          attachmentName: "",
          attachmentURL: "",
        },
      },
    });
  };

  return (
    <>
      <Form {...form}>
        <div className="space-y-6 relative ">
          {(isPending || UpdateLoading) && <SubmitFormLoader />}

          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-semibold">Skills Calibration</h2>
            {!showForm && (
              <>
                <div className="space-x-2.5">
                  <Button
                    type="button"
                    variant="default"
                    size="sm"
                    className="bg-[#00A76F] hover:bg-[#00A76F]/90"
                    onClick={() => setShowForm(true)}
                  >
                    Add
                  </Button>
                </div>
              </>
            )}
          </div>

          {showForm && (
            <form
              onSubmit={form.handleSubmit(handleFormSubmit)}
              className="space-y-6"
            >
              <div className="border rounded-lg p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
                  <InputField
                    control={form.control}
                    name="calibrations.hrqId"
                    label="HRQID"
                    placeholder=""
                    disabled
                  />
                  <InputField
                    control={form.control}
                    name="calibrations.jobTitle"
                    label="Role Hired For"
                    placeholder=""
                    disabled
                  />

                  <InputField
                    control={form.control}
                    name="calibrations.attendees"
                    label="Attendees"
                    placeholder="Enter attendees"
                    required
                  />
                  <DatePickerField
                    control={form.control}
                    name="calibrations.calibrationDate"
                    label="Calibration Date"
                    required
                  />
                  <InputField
                    control={form.control}
                    name="calibrations.primaryChanges"
                    label="Primary skills"
                    placeholder="Enter primary skill"
                    required
                  />
                  <InputField
                    control={form.control}
                    name="calibrations.secondaryChanges"
                    label="Secondary skills"
                    placeholder="Enter secondary skill"
                    required
                  />
                  <InputField
                    control={form.control}
                    name="calibrations.certifications"
                    label="Certifications"
                    placeholder="Enter certifications"
                    required
                  />

                  <FileField
                    control={form.control}
                    name="calibrations.documents"
                    label="documents"
                    accept=".ppt,.pptx,.pdf,.doc,.docx"
                  />
                </div>
                <TextareaField
                  control={form.control}
                  name="calibrations.comments"
                  label="Comments"
                />
              </div>

              <div className="flex justify-between pt-6">
                <Button
                  variant="secondary"
                  type="button"
                  onClick={onPrevious}
                  className="px-8"
                >
                  Previous
                </Button>
                <div className="flex gap-4">
                  <LoadingButton
                    loading={isPending || UpdateLoading}
                    text={editMode ? "Update" : "Save"}
                    loadingText={editMode ? "Updating..." : "Saving..."}
                  />
                  <Button onClick={() => setShowForm(false)} variant="outline">
                    Cancel
                  </Button>
                </div>
              </div>
            </form>
          )}
        </div>
      </Form>
      <div className="overflow-x-auto mt-10">
        <table className="w-full table-auto border-collapse">
          <thead>
            <tr className="bg-gray-100 text-gray-700">
              <th className="px-4 py-2 text-left">HRQ ID</th>
              <th className="px-4 py-2 text-left">Role Hired For</th>
              <th className="px-4 py-2 text-left">Attendees</th>
              <th className="px-4 py-2 text-left">Calibration Date</th>
              <th className="px-4 py-2 text-left">Certifications</th>
              <th className="px-4 py-2 text-left">Comments</th>
              <th className="px-4 py-2 text-left">Document</th>
              <th className="px-4 py-2 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {getCalibrations &&
              getCalibrations.map((calibration: any) => (
                <tr key={calibration.id}  className="border-b transition-colors duration-150 hover:bg-gray-50 dark:hover:bg-gray-800">
                  <td className="px-4 py-2">{calibration.hrqId}</td>
                  <td className="px-4 py-2">{calibration.jobTitle}</td>
                  <td className="px-4 py-2">{calibration.attendees}</td>
                  <td className="px-4 py-2">
                    {new Date(calibration.calibrationDate).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-2">{calibration.certifications}</td>
                  <td className="px-4 py-2">{calibration.comments}</td>
                  <td className="px-4 py-2">
                    <ResumePreview
                      url={calibration.documents.attachmentURL}
                      fileName={calibration.documents.attachmentName}
                    />
                  </td>
                  <td className="px-4 py-2 space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onEdit(calibration)}
                    >
                      <PencilIcon />
                      Edit
                    </Button>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
