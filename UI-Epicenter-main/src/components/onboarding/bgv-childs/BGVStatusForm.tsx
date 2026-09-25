'use client';

import React, { useEffect } from 'react';
import { useForm, FormProvider, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { FileCheck } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { SelectField } from '@/components/form-fields/SelectField';
import { DatePickerField } from '@/components/form-fields/DatePickerField';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import * as z from 'zod';
import { FileField } from '@/components/form-fields/FileField';
import { ResumePreview } from '@/components/common/ResumePreview';
import { useQuery } from '@tanstack/react-query';
import { MasterTypes } from '@/constants/masterTypes';
import { dropdownApi } from '@/services/api/master';

export const bgvStatusSchema = z.object({
  bgvStatusId: z.string().min(1, 'BGV Status is required'),
  bgvCompletionDate: z.string().min(1, 'Completion Date is required'),
  isBGVAvailableWithPartner: z.boolean({
    required_error: 'This field is required',
  }),
  bgvCategoryId: z.string({
    required_error: 'BGV Category selection is required',
  }),
  bgvAcknowledged: z.boolean().optional(),
  uploadBGVDoc: z.object({
    attachmentName: z.string({ required_error: "Attachment name is required" }).min(1, "Attachment name is required"),
    attachmentURL: z.string({ required_error: "Attachment URL is required" }).min(1, "Attachment URL is required"),
  }),
});

export type BGVStatusFormValues = z.infer<typeof bgvStatusSchema>;
interface Iprops{
  onSave:(data:any)=>void;
  onboardingTimeline:any;
}
const BGVStatusForm = ({onSave,onboardingTimeline}:Iprops) => {
  const form = useForm<BGVStatusFormValues>({
    resolver: zodResolver(bgvStatusSchema),
    defaultValues: {
       isBGVAvailableWithPartner:onboardingTimeline?.isBGVAvailableWithPartner,
       bgvCompletionDate:onboardingTimeline?.bgvCompletionDate,
       bgvCategoryId:onboardingTimeline?.bgvCategoryId?.toString()||"",
       bgvStatusId:onboardingTimeline?.bgvStatusId?.toString()||"",
        uploadBGVDoc: {
          attachmentName: onboardingTimeline?.uploadBGVDoc?.attachmentName || "",
          attachmentURL: onboardingTimeline?.uploadBGVDoc?.attachmentURL || "",
        },
    },
  });

  useEffect(() => {
    if (onboardingTimeline) {
      form.reset({
       isBGVAvailableWithPartner:onboardingTimeline?.isBGVAvailableWithPartner,
       bgvCompletionDate:onboardingTimeline?.bgvCompletionDate,
       bgvCategoryId:onboardingTimeline?.bgvCategoryId?.toString() || "",
       bgvStatusId:onboardingTimeline?.bgvStatusId?.toString()||"",
        uploadBGVDoc: {
          attachmentName: onboardingTimeline?.uploadBGVDoc?.attachmentName || "",
          attachmentURL: onboardingTimeline?.uploadBGVDoc?.attachmentURL || "",
        },
      });
    }
  }, [onboardingTimeline]);

  const isAcknowledged = form.watch('isBGVAvailableWithPartner');

  const onSubmit = (data: BGVStatusFormValues) => {
    const payload = {
      ...data,
      startDate: onboardingTimeline?.startDate,
      vendor: onboardingTimeline?.vendor,
      pguId: onboardingTimeline?.pguId?.toString() || null,
      ndaAvailability: onboardingTimeline?.ndaAvailability,
      cdaAvailability: onboardingTimeline?.cdaAvailability,
      ndaAvailabilityDoc: {
        attachmentName: onboardingTimeline?.ndaAvailabilityDoc?.attachmentName||null,
        attachmentURL: onboardingTimeline?.ndaAvailabilityDoc?.attachmentURL||null,
      },
      cdaAvailabilityDoc: {
        attachmentName: onboardingTimeline?.cdaAvailabilityDoc?.attachmentName || null,
        attachmentURL: onboardingTimeline?.cdaAvailabilityDoc?.attachmentURL || null,
      },
      id:onboardingTimeline?.id
    
    };

    onSave(payload);
  };
  
   const { data: bgvCategory = [] } = useQuery({
    queryKey: ["categoryPguData", MasterTypes.BGV_CATEGORY],
    queryFn: async () => {
      const res = await dropdownApi.fetchDropdown(MasterTypes.BGV_CATEGORY);
      return res;
    },
    retry: 1,
  });

  const { data: bgvStatusTypes = [] } = useQuery({
    queryKey: ["categoryPguData", MasterTypes.BGV_STATUS_TYPES],
    queryFn: async () => {
      const res = await dropdownApi.fetchDropdown(MasterTypes.BGV_STATUS_TYPES);
      return res;
    },
    retry: 1,
  });

  const uploadBGVDoc=form.watch("uploadBGVDoc")
  const previewUrl = (file: any) => {
  if (!file?.attachmentURL) return '';

  if (file.attachmentURL.startsWith('http')) {
    return file.attachmentURL;
  }

  return `${process.env.NEXT_PUBLIC_API_BASE_URL}/FileServer/${file?.attachmentURL}`;
};
 

  return (
    <FormProvider {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="space-y-6 px-4 md:px-6 mt-8"
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileCheck className="h-5 w-5" />
              BGV Status
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-6">
            <div className="flex items-center space-x-2">
              <Controller
                control={form.control}
                name="isBGVAvailableWithPartner"
                render={({ field }) => (
                  <input
                    type="checkbox"
                    id="isBGVAvailableWithPartner"
                    checked={field.value}
                    onChange={(e) => field.onChange(e.target.checked)}
                    className="w-4 h-4 accent-green-600"
                  />
                )}
              />
              <Label htmlFor="isBGVAvailableWithPartner" className="text-sm">
                Is BGV Available with Partner
              </Label>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <SelectField
                control={form.control}
                name="bgvStatusId"
                label="BGV Status"
                placeholder="Select Status"
                options={bgvStatusTypes}
                required
                disabled={!isAcknowledged}
              />
              <SelectField
                control={form.control}
                name="bgvCategoryId"
                label="BGV Category"
                placeholder="Select BGV Category"
                options={bgvCategory}
                required
                disabled={!isAcknowledged}
              />
              <DatePickerField
                control={form.control}
                name="bgvCompletionDate"
                label="BGV Completion Date"
                required
                disabled={!isAcknowledged}
              />
              <div className="flex items-end">
                <div className="flex-1">
                  <FileField
                    control={form.control}
                    name="uploadBGVDoc"
                    label="Upload BGV"
                    accept=".ppt,.pptx,.pdf,.doc,.docx"
                    required
                    disabled={!isAcknowledged}
                  />
                </div>
                <div className="w-9">
                  <ResumePreview
                    fileName="NDA File"
                    url={previewUrl(uploadBGVDoc)}
                  />
                </div>
              </div>
            </div>

            {/* <div className="mt-4">
              <a
                href="/downloads/activeBgvs.zip"
                download
                className="inline-flex items-center gap-2 text-blue-600 text-sm underline hover:text-blue-800"
              >
                <Download className="w-4 h-4" /> Download Active BGVs
              </a>
            </div> */}

            <div className="flex justify-end gap-4 pt-4">
              <Button type="submit" disabled={!isAcknowledged} className="bg-[#00b388] hover:bg-[#009e79]">
                {onboardingTimeline?.isBGVAvailableWithPartner?"Update":"Submit"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </FormProvider>
  );
};

export default BGVStatusForm;
