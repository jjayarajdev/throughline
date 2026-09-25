import { useForm, FormProvider, Controller, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { SelectField } from "@/components/form-fields/SelectField";
import { DatePickerField } from "@/components/form-fields/DatePickerField";
import { InputField } from "@/components/form-fields/InputField";
import { FileField } from "@/components/form-fields/FileField";
import { dropdownApi } from "@/services/api/master";
import { MasterTypes } from "@/constants/masterTypes";
import { RadioGroup } from "@radix-ui/react-radio-group";
import { RadioGroupItem } from "@/components/ui/radio-group";
import { AlertCircle, Download, Eye } from "lucide-react";
import { ResumePreview } from "@/components/common/ResumePreview";
import { MultiDocumentField } from "@/components/form-fields/MultiDocumentField";
import { isPartner } from "@/store/userStore";
import SubmitFormLoader from "@/components/common/SubmitFormLoader";
import { differenceInCalendarDays, isValid } from "date-fns";
import { TatIndicator } from "../ITPCSetup";

const formSchema = z.object({
  startDate: z.string().min(1, "Start Date is required"),
  vendor: z.string().min(1, "Vendor is required"),
  pguId: z.string().min(1, "PGU is required"),
  ndaAvailability: z.boolean(),
  cdaAvailability: z.boolean(),
  ndaAvailabilityDoc: z.object({
    attachmentName: z.string().optional(),
    attachmentURL: z.string().optional(),
    
  }),
   
  cdaAvailabilityDoc:  z.object({
    attachmentName: z.string().optional(),
    attachmentURL: z.string().optional(),
    
  }),
  additionalDocs:z.array(
    z.object({
      id: z.number().optional(),
      attachmentName: z.string().optional(),
      attachmentURL: z.string().optional(),
      additionalDocId: z.number().optional(),
    })
  ),
uploadBGVDocs:z.array(
    z.object({
      id: z.number().optional(),
      attachmentName: z.string().optional(),
      attachmentURL: z.string().optional(),
      uploadBGVDocId: z.number().optional(),
    })
  ),
  isBGVAvailableWithPartner: z.boolean(),
  bgvStatusId: z.string(),
 
  bgvCompletionDate: z.string(),
  
  bgvCategoryId: z.string().optional(),
}) .superRefine((data, ctx) => {
    if (data.isBGVAvailableWithPartner && !data.bgvStatusId) {
      ctx.addIssue({
        path: ["bgvStatusId"],
        code: z.ZodIssueCode.custom,
        message: "BGV Status is required when BGV is available with partner",
      });
    }
    if (data.bgvStatusId === "77001") {
      if (!data.bgvCompletionDate) {
        ctx.addIssue({
          path: ["bgvCompletionDate"],
          code: z.ZodIssueCode.custom,
          message: "BGV Completion Date is required when status is Completed",
        });
      }

      if (!data.bgvCategoryId) {
        ctx.addIssue({
          path: ["bgvCategoryId"],
          code: z.ZodIssueCode.custom,
          message: "BGV Category is required when status is Completed",
        });
      }

      // const upload = data.uploadBGVDocs || [];
      // if (upload.length === 0) {
      //   ctx.addIssue({
      //     path: ["uploadBGVDocs"],
      //     code: z.ZodIssueCode.custom,
      //     message: "BGV Document is required when status is Completed",
      //   });
      // }
    }

     if (data.ndaAvailability || data.cdaAvailability) {
    const isNdaMissing =
    !data.ndaAvailabilityDoc?.attachmentName ||
    !data.ndaAvailabilityDoc?.attachmentURL;

  const isCdaMissing =
    !data.cdaAvailabilityDoc?.attachmentName ||
    !data.cdaAvailabilityDoc?.attachmentURL;

  if (isNdaMissing && isCdaMissing) {
    ctx.addIssue({
    path: ["ndaAvailabilityDoc"],
    code: z.ZodIssueCode.custom,
    message: "Both NDA and CDA documents are required",
  });
  ctx.addIssue({
    path: ["cdaAvailabilityDoc"],
    code: z.ZodIssueCode.custom,
    message: "Both NDA and CDA documents are required",
  });
  } else {
    if (isNdaMissing) {
      ctx.addIssue({
        path: ["ndaAvailabilityDoc"],
        code: z.ZodIssueCode.custom,
        message: "Please upload NDA document",
      });
    }
    if (isCdaMissing) {
      ctx.addIssue({
        path: ["cdaAvailabilityDoc"],
        code: z.ZodIssueCode.custom,
        message: "Please upload CDA document",
      });
    }
  }
}


  });


type FormValues = z.infer<typeof formSchema>;

export default function CombinedInformationForm({
  onboardingTimeline,
  personalDetails,
  onSave,
}: any) {
  const [modalData, setModalData] = useState(null);
  const [loader,setLoader]=useState(false)
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      startDate: personalDetails?.dateOfJoining || "",
      vendor: personalDetails?.sourceName || "",
      pguId: personalDetails?.pguName || "",
      ndaAvailability: onboardingTimeline?.ndaAvailability || false,
      cdaAvailability: onboardingTimeline?.cdaAvailability || false,
     ndaAvailabilityDoc: onboardingTimeline?.ndaAvailabilityDoc ||{},
      cdaAvailabilityDoc: onboardingTimeline?.cdaAvailabilityDoc || {},
      additionalDocs: onboardingTimeline?.additionalDocs || [],
     
      isBGVAvailableWithPartner:
        onboardingTimeline?.isBGVAvailableWithPartner || false,
      bgvStatusId:onboardingTimeline?.bgvStatusId? onboardingTimeline?.bgvStatusId?.toString():"77003",
      bgvCategoryId: onboardingTimeline?.bgvCategoryId?.toString() || "",
      bgvCompletionDate: onboardingTimeline?.bgvCompletionDate || "",
      uploadBGVDocs: onboardingTimeline?.uploadBGVDocs || [],
    },
  });

  useEffect(() => {
    if (onboardingTimeline || personalDetails) {
      form.reset({
        startDate: personalDetails?.dateOfJoining || "",
        vendor: personalDetails?.sourceName || "",
        pguId:personalDetails?.pguName || "",
        ndaAvailability: onboardingTimeline?.ndaAvailability || false,
        cdaAvailability: onboardingTimeline?.cdaAvailability || false,
        ndaAvailabilityDoc: onboardingTimeline?.ndaAvailabilityDoc || {},
        cdaAvailabilityDoc: onboardingTimeline?.cdaAvailabilityDoc || {},
        additionalDocs: onboardingTimeline?.additionalDocs || [],
        uploadBGVDocs:onboardingTimeline?.uploadBGVDocs || [],
        isBGVAvailableWithPartner:
          onboardingTimeline?.isBGVAvailableWithPartner || false,
         bgvStatusId:onboardingTimeline?.bgvStatusId? onboardingTimeline?.bgvStatusId?.toString():"77003",
        bgvCategoryId: onboardingTimeline?.bgvCategoryId?.toString() || "",
        bgvCompletionDate: onboardingTimeline?.bgvCompletionDate || "",
        
      });
    }
  }, [onboardingTimeline, personalDetails]);
 

  const { data: bgvCategory = [] } = useQuery({
    queryKey: ["bgvCategory"],
    queryFn: () => dropdownApi.fetchDropdown(MasterTypes.BGV_CATEGORY),
  });

  const { data: bgvStatusTypes = [] } = useQuery({
    queryKey: ["bgvStatus"],
    queryFn: () => dropdownApi.fetchDropdown(MasterTypes.BGV_STATUS_TYPES),
  });
  

  

  const ndaAvailability = useWatch({
    control: form.control,
    name: "ndaAvailability",
  });
  const cdaAvailability = useWatch({
    control: form.control,
    name: "cdaAvailability",
  });
  const isBGVAvailable = useWatch({
    control: form.control,
    name: "isBGVAvailableWithPartner",
  });

  const IsbgvStatusTypes=useWatch({
    control: form.control,
    name: "bgvStatusId",
  })
  

  const onSubmit =async(data: FormValues) => {
    setLoader(true)
  const additionalDoc=data.additionalDocs.map((doc) => ({
      id: doc.id || 0,
      attachmentName: doc.attachmentName,
      attachmentURL: doc.attachmentURL,
      docType: 1,
       additionalDocId:
        typeof onboardingTimeline?.id === "number" ? onboardingTimeline.id : 0,
    }));

  const uploadBGVDoc=data.uploadBGVDocs.map((doc) => ({
      id: doc.id || 0,
      attachmentName: doc.attachmentName,
      attachmentURL: doc.attachmentURL,
      docType: 1,
      uploadBGVDocId:
        typeof onboardingTimeline?.id === "number" ? onboardingTimeline.id : 0,
    }));

    const payload = {
      id:
        typeof onboardingTimeline?.id === "number"
          ? onboardingTimeline.id
          : undefined,
      vendorId: personalDetails?.sourceId
        ? Number(personalDetails.sourceId)
        : null,
      ...(data?.ndaAvailabilityDoc && data?.ndaAvailabilityDoc?.attachmentName && data?.ndaAvailabilityDoc?.attachmentURL && {
    ndaAvailabilityDoc: data.ndaAvailabilityDoc
  }),
  ...(data?.cdaAvailabilityDoc && data?.cdaAvailabilityDoc?.attachmentName && data?.cdaAvailabilityDoc?.attachmentURL && {
    cdaAvailabilityDoc: data.cdaAvailabilityDoc
  }),
      additionalDocs:additionalDoc??null,
      startDate: personalDetails?.dateOfJoining
        ? personalDetails?.dateOfJoining
        : null,
      vendor: personalDetails?.sourceName ? personalDetails?.sourceName : null,
      pguId: personalDetails?.pguId ?personalDetails?.pguId : onboardingTimeline?.pguId,
      ndaAvailability: data?.ndaAvailability ? data.ndaAvailability : null,
      cdaAvailability: data?.cdaAvailability ? data.cdaAvailability : null,
      isBGVAvailableWithPartner: data?.isBGVAvailableWithPartner
        ? data.isBGVAvailableWithPartner
        : null,
      bgvStatusId: data?.bgvStatusId ? data?.bgvStatusId : null,
      bgvCategoryId: data?.bgvCategoryId ? data?.bgvCategoryId : null,
      bgvCompletionDate: data?.bgvCompletionDate
        ? data?.bgvCompletionDate
        : null,
      uploadBGVDocs: uploadBGVDoc??null
      
    };

   await onSave(payload);
     setTimeout(() => {
    setLoader(false);
  }, 200);
  };

if (loader) return <SubmitFormLoader />;

  return (
    <FormProvider {...form}>
      <section className="space-y-6 p-6 ">
      <div className="flex flex-col md:flex-row mt-2 md:items-center md:justify-between border-b pb-4">
          <h2 className="text-xl font-semibold text-gray-800">Background Verification</h2>
         {!isPartner && (
            <TatIndicator
              startDate={personalDetails?.dateOfJoining}
              endDate={onboardingTimeline?.bgvCompletionDate}
           />
         )}
        </div>
        </section>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="mt-3 space-y-6 px-4 md:px-6"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <InputField
            control={form.control}
            name="pguId"
            label="PGU"
            placeholder="Select PGU"
            // options={categoryPguData}
            required
            disabled
          />
          <DatePickerField
            control={form.control}
            name="startDate"
            label="Start Date"
            required
            disabled
          />
          <InputField
            control={form.control}
            name="vendor"
            label="Vendor"
            required
            disabled
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {/* NDA Section */}
          <div className="p-4 border rounded-md space-y-4">
            <h3 className="text-sm font-semibold text-gray-700">NDA Section</h3>
            <div className="p-4 border rounded-md space-y-4">
              <Label className="mb-2 block">NDA Availability</Label>
              <Controller
                control={form.control}
                name="ndaAvailability"
                render={({ field }) => (
                  <RadioGroup
                    value={String(field.value)}
                    onValueChange={(val) => field.onChange(val === "true")}
                    className="flex flex-wrap gap-4"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="true" id="nda-yes" />
                      <Label htmlFor="nda-yes">Yes</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="false" id="nda-no" />
                      <Label htmlFor="nda-no">No</Label>
                    </div>
                  </RadioGroup>
                )}
              />

              <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-6 items-start">
                <div className="flex gap-4">
                  <div
                    onClick={() =>
                      setModalData({
                        title: "NDA",
                        fileUrl: `/docs/SampleNDA.pdf`,
                      })
                    }
                    className="w-fit min-w-[100px] flex items-center justify-center gap-1 text-xs text-blue-600 cursor-pointer bg-blue-50 px-2 py-1 rounded hover:bg-blue-100"
                  >
                    <Eye className="w-3.5 h-3.5" /> Sample NDA template
                  </div>
                  <a
                    href={`/docs/NDAfill.pdf`}
                    download
                    className="w-fit min-w-[100px] flex items-center justify-center gap-1 bg-green-100 text-green-600 px-2 py-1 rounded text-xs hover:bg-green-200"
                  >
                    <Download className="w-3.5 h-3.5" /> Download NDA template
                  </a>
                </div>

                <div className="flex items-end col-span-full sm:col-span-2">
                  <div className="flex-1">
                    <FileField
                      control={form.control}
                      name="ndaAvailabilityDoc"
                      label="Upload NDA Doc"
                      accept=".ppt,.pptx,.pdf,.doc,.docx"
                      required
                      disabled={onboardingTimeline?.candidateBGVCompleted?ndaAvailability:!ndaAvailability}
                      />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* CDA Section */}
          <div className="p-4 border rounded-md space-y-4">
            <h3 className="text-sm font-semibold text-gray-700">CDA Section</h3>
            <div className="p-4 border rounded-md space-y-4">
             
              <Label className="mb-2 block">CDA Availability</Label>
              <Controller
                control={form.control}
                name="cdaAvailability"
                render={({ field }) => (
                  <RadioGroup
                    value={String(field.value)}
                    onValueChange={(val) => field.onChange(val === "true")}
                    className="flex flex-wrap gap-4"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="true" id="cda-yes" />
                      <Label htmlFor="cda-yes">Yes</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="false" id="cda-no" />
                      <Label htmlFor="cda-no">No</Label>
                    </div>
                  </RadioGroup>
                )}
              />

              <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-6 items-start">
                <div className="flex gap-4">
                  <div
                    onClick={() =>
                      setModalData({
                        title: "CDA",
                        fileUrl: `/docs/SampleCDA.pdf`,
                      })
                    }
                    className="w-fit min-w-[100px] flex items-center justify-center gap-1 text-xs text-blue-600 cursor-pointer bg-blue-50 px-2 py-1 rounded hover:bg-blue-100"
                  >
                    <Eye className="w-3.5 h-3.5" /> Sample CDA template
                  </div>
                  <a
                    href={`/docs/CDAfill.pdf`}
                    download
                    className="w-fit min-w-[100px] flex items-center justify-center gap-1 bg-green-100 text-green-600 px-2 py-1 rounded text-xs hover:bg-green-200"
                  >
                    <Download className="w-3.5 h-3.5" /> Download CDA template
                  </a>
                </div>

                <div className="flex items-end col-span-full sm:col-span-2">
                  <div className="flex-1">
                     <FileField
                      control={form.control}
                      name="cdaAvailabilityDoc"
                      label="Upload CDA Doc"
                      accept=".ppt,.pptx,.pdf,.doc,.docx"
                      required
                      disabled={onboardingTimeline?.candidateBGVCompleted?cdaAvailability:!cdaAvailability}
                      />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
       {!isPartner&& <div className="flex-1">
          <MultiDocumentField
            control={form.control}
            name="additionalDocs"
            label="Upload Additional Document"
            accept=".ppt,.pptx,.pdf,.doc,.docx"
            // required
            maxFiles={10}
            candiadateBGVId={
              typeof onboardingTimeline?.id === "number"
                ? onboardingTimeline.id
                : 0
            }
            isCreating={onboardingTimeline?.id ? false : true}
            isToggle={typeof onboardingTimeline?.id === "number" ? false : true}
            docType={2}
            additionalDocId={
              Array.isArray(onboardingTimeline?.additionalDocs) &&
              onboardingTimeline?.additionalDocs.length > 0
                ? onboardingTimeline?.additionalDocs[0]
                    ?.additionalDocId
                : undefined
            }
          />
        </div>}

        <div className="flex items-center space-x-2 mt-10">
          <Controller
            control={form.control}
            name="isBGVAvailableWithPartner"
            render={({ field }) => (
              <input
                type="checkbox"
                checked={field.value}
                onChange={(e) => field.onChange(e.target.checked)}
                className="w-4 h-4 accent-green-600"
                disabled={!onboardingTimeline?.candidateBGVCompleted}              />
            )}
          />
          <Label className="text-sm">Is BGV Available with Partner</Label>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <SelectField
            control={form.control}
            name="bgvStatusId"
            label="BGV Status"
            placeholder="Select Status"
            options={bgvStatusTypes}
            required
            disabled={!isBGVAvailable}
          />
          {IsbgvStatusTypes === "77001" && (
            <>
              <SelectField
                control={form.control}
                name="bgvCategoryId"
                label="BGV Category"
                placeholder="Select Category"
                options={bgvCategory}
                required
                disabled={!isBGVAvailable}
              />
              <DatePickerField
                control={form.control}
                name="bgvCompletionDate"
                label="BGV Completion Date"
                required
                disabled={!isBGVAvailable}
              />
            

             {!isPartner&& <div className="md:col-span-2  flex-1">
                <MultiDocumentField
                  control={form.control}
                  name="uploadBGVDocs"
                  label="Upload Bgv Document"
                  accept=".ppt,.pptx,.pdf,.doc,.docx"
                  // required
                  maxFiles={10}
                  candiadateBGVId={
                    typeof onboardingTimeline?.id === "number"
                      ? onboardingTimeline.id
                      : 0
                  }
                  isCreating={onboardingTimeline?.id ? false : true}
                  isToggle={
                    typeof onboardingTimeline?.id === "number" ? false : true
                  }
                  docType={1}
                  uploadBGVDocId={
                    Array.isArray(onboardingTimeline?.uploadBGVDocs) &&
                    onboardingTimeline?.uploadBGVDocs.length > 0
                      ? onboardingTimeline?.uploadBGVDocs[0]
                          ?.uploadBGVDocId
                      : undefined
                  }
                />
              </div>}
            </>
          )}
        </div>

        <div className="flex justify-end pt-4">
          <Button type="submit" className="bg-[#00b388] hover:bg-[#009e79]">
            {onboardingTimeline?.id ? "Update" : "Submit"}
          </Button>
        </div>

        {modalData && (
          <PdfViewerModal
            open={true}
            onClose={() => setModalData(null)}
            title={modalData.title}
            fileUrl={modalData.fileUrl}
          />
        )}
      </form>
    </FormProvider>
  );
}



type PdfViewerModalProps = {
  open: boolean;
  onClose: () => void;
  title: any;
  fileUrl: string;
};

function PdfViewerModal({
  open,
  onClose,
  title,
  fileUrl,
}: PdfViewerModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-lg shadow-lg max-w-4xl w-full h-[90%] flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-4 py-2 border-b">
          <h2 className="text-lg font-semibold">{title}</h2>
          <div className="flex items-center gap-3">
            <a
              href={fileUrl}
              download
              className="text-blue-600 hover:text-blue-800"
              title="Download PDF"
            >
              <Download className="w-5 h-5" />
            </a>
            <button
              onClick={onClose}
              className="text-gray-600 hover:text-gray-800 text-xl"
            >
              ✕
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-auto">
          <iframe src={fileUrl} title={title} className="w-full h-full" />
        </div>
      </div>
    </div>
  );
}

