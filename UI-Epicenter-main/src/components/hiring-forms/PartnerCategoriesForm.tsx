"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { InputField } from "../form-fields/InputField";
import { Switch } from "@/components/ui/switch";

import { dropdownApi } from "@/services/api/master";
import { MasterTypes } from "@/constants/masterTypes";
import { useMutation, useQuery } from "@tanstack/react-query";
import { MultiSelectField } from "../form-fields/MultiSelectField";
import { TextareaField } from "../form-fields/TextAreaField";
import { hiringApi, PartnerCategoriesPayload } from "@/services/api/hiring.api";
import { toast } from "@/lib/toast";
import { useParams } from "next/navigation";
import axios from "axios";
import { useEffect } from "react";
import SubmitFormLoader from "../common/SubmitFormLoader";
import { LoadingButton } from "../form-fields/LoadingButton";

const PartnerCategoriesSchema = z.object({
  isSpecificPartner: z.boolean(),
  isProxyPartner: z.boolean(),
  isRecommendThePartner: z.boolean(),
  selectedPartners: z
    .array(
      z.object({
        id: z.number(),
        name: z.string(),
      })
    )
    .optional(),
  profileCAP: z.coerce
    .number()
    .min(1, "At least one position required")
    .max(10, "Maximum 10 profiles allowed per day"),
  comments: z.string().optional(),
});

type PartnerCategory = z.infer<typeof PartnerCategoriesSchema>;

interface RCMSStep2FormProps {
  onPrevious?: () => void;
  onNext?: () => void;
}

export default function PartnerCategories({
  onPrevious,
  onNext,
}: RCMSStep2FormProps) {
  const form = useForm<PartnerCategory>({
    resolver: zodResolver(PartnerCategoriesSchema),
    defaultValues: {
      isSpecificPartner: false,
      isProxyPartner: false,
      isRecommendThePartner: false,
      selectedPartners: [],
      profileCAP: Number("10"),
      comments: "",
    },
  });

  const { hiring } = useParams();

  const { data: ActivePartner = [],refetch:refetchPartner } = useQuery({
    queryKey: ["ActivePartner", hiring],
    queryFn: () =>
      dropdownApi.fetchSpecificpartner(
        MasterTypes.DOMAIN_SPECIFIC_PARTNERS,
        String(hiring)
      ),
    enabled: true,
  });

  const { mutate: addPartnerCategories, isPending: createPending } =
    useMutation({
      mutationKey: ["addPartnerCategories"],
      mutationFn: hiringApi.CreatePartnerCategories,
      onSuccess: (data) => {
        form.reset();
        toast.success(data?.message || "Partner categories created successfully");
        onNext?.();
      },
      onError: (error) => {
        if (axios.isAxiosError(error)) {
          if (error.response?.status === 400) {
            const serverMessage = error.response.data?.message || "Bad Request";
            toast.error(serverMessage);
          } else {
            toast.error("baD request");
          }
        } else {
          alert("Something went wrong.");
        }
      },
    });

  const { data: getPartnerCategories, isLoading: getPartnerLoading } = useQuery(
    {
      queryKey: ["getPartnerCategories", hiring],
      queryFn: () => hiringApi.getPartnerCategory(Number(hiring)),
      enabled: !!hiring,
      retry: false,
    }
  );
  const { mutate: updatePartnerCategories, isPending: UpdateLoading } =
    useMutation({
      mutationFn: (values: PartnerCategoriesPayload) =>
        hiringApi.updatePartnerCategories(
          Number(getPartnerCategories?.id),
          values
        ),
      onSuccess: (data) => {
        toast.success(data?.message || "updated Successfully");
        onNext?.();
      },
      onError: (error) => {
        toast.error("Failed to update hiring");
        console.log("Error updating hiring:", error);
      },
    });

  const handleSubmit = (values: PartnerCategory) => {
    const payload = {
      hiringRequestId: Number(hiring),
      isSpecificPartner: values.isSpecificPartner,
      isProxyPartner: values.isProxyPartner,
      isRecommendThePartner: values.isRecommendThePartner,
      selectedPartners: values?.selectedPartners?.map(
        (partner: { id: number }) => ({
          partnerId: partner.id,
          assignedOn: new Date().toISOString(),
          partnerCategoryId: getPartnerCategories?.id || 0,
        })
      ),
      profileCAP: Number(values.profileCAP),
      comments: values.comments,
      id: getPartnerCategories?.id || 0,
    };
    if (!!getPartnerCategories) {
      updatePartnerCategories(payload);
    } else {
      addPartnerCategories(payload);
    }
  };


  const getPartnerCategoriesData = async ()=>{
    if (!getPartnerCategories) return;
    if (getPartnerCategories) {
          form.reset({
          isSpecificPartner: Boolean(getPartnerCategories.isSpecificPartner),
          isProxyPartner: Boolean(getPartnerCategories.isProxyPartner),
          isRecommendThePartner: Boolean(
            getPartnerCategories.isRecommendThePartner
          ),
          profileCAP: getPartnerCategories.profileCAP ?? 1,
          comments: getPartnerCategories.comments ?? "",
        });
        await refetchPartner().then((data)=>{
          const result = data.data.filter((partner: { id: any }) =>
            getPartnerCategories.selectedPartners.some(
              (p: { partnerId: any }) => p.partnerId === partner.id
            )
          );
          form.setValue("selectedPartners", result);
        });
    }else{
      form.reset()
    }
  }
  useEffect(() => {
getPartnerCategoriesData();
  }, [getPartnerCategories, form]);

  return (
    <>
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(handleSubmit)}
          className="space-y-8 relative"
        >
          {/* Position Category */}
          {(createPending || UpdateLoading || getPartnerLoading) && (
            <SubmitFormLoader />
          )}
          <div className="border rounded-md p-4">
            <label className="block text-sm mb-2">Partner Category</label>
            <div className="flex items-center space-x-6">
              {/* Single */}
              <div className="flex items-center space-x-2">
                <Switch
                  checked={form.watch("isSpecificPartner")}
                  onCheckedChange={(val: boolean) =>
                    form.setValue("isSpecificPartner", val)
                  }
                />
                <span className="text-sm">Specific Partner</span>
              </div>
              {/* Multiple */}
              <div className="flex items-center space-x-2">
                <Switch
                  checked={form.watch("isProxyPartner")}
                  onCheckedChange={(val: boolean) =>
                    form.setValue("isProxyPartner", val)
                  }
                  className="bg-[#00A76F]"
                />
                <span className="text-sm">Proxy</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {form.watch("isSpecificPartner") && (
              <MultiSelectField
                control={form.control}
                name="selectedPartners"
                label="Select Partners"
                placeholder="Select Partners"
                options={ActivePartner}
              />
            )}

            <InputField
              control={form.control}
              type="number"
              name="profileCAP"
              label="Profile Cap"
              placeholder="Maximum number of profile allowed (only 10 per day)"
              required
            />
          </div>
          <TextareaField
            control={form.control}
            name="comments"
            label="Comment"
            placeholder="Enter commnets here"
          />

          {/* Navigation Buttons */}
          <div className="flex justify-between pt-6">
            <Button
              variant="secondary"
              onClick={() => onPrevious?.()}
              className="hover:cursor-pointer px-8"
            >
              Previous
            </Button>

            <div className="flex space-x-4">
              <LoadingButton
                loading={UpdateLoading || createPending}
                text={!!getPartnerCategories ? "Update" : "Save"}
                loadingText={
                  !!getPartnerCategories ? "Updating..." : "Saving..."
                }
              />

              <Button
                variant="secondary"
                type="button"
                onClick={onNext}
                className="px-8"
              >
                Next
              </Button>
            </div>
          </div>
        </form>
      </Form>
    </>
  );
}
