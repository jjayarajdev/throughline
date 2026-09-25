"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { RefreshCw, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { InputField } from "../form-fields/InputField";
import { SelectField } from "../form-fields/SelectField";
import { MultiDocumentField } from "@/components/form-fields/MultiDocumentField";
import { MultiSelectField } from "../form-fields/MultiSelectField";
import { useMutation, useQuery } from "@tanstack/react-query";
import { dropdownApi } from "@/services/api/master";
import { MasterTypes } from "@/constants/masterTypes";
import { partnerApi, PartnerPayload } from "@/services/api/partner.profile.api";
import { toast } from "@/lib/toast";
import { usePartnerStore } from "@/store/userPartnerStore";
import { useSearchParams } from "next/navigation";
import SubmitFormLoader from "../common/SubmitFormLoader";
import { DatePickerField } from "../form-fields/DatePickerField";
import { AddSkillDialog } from "../dialog/AddSkillDialog";
import api from "@/lib/axiosInstance";
import { useDebounce } from "@/lib/useDebounce";
import { useUserStore } from "@/store/userStore";// Updated schema to handle capability deck documents array
interface doc {
  id: number;
  attachmentName: string;
  attachmentURL: string;
  createdDate: string;
  createdTime: string;
  partnerId: number;
}
const profileFormSchema = z.object({
  partnerId: z.string().optional(),
  partnerName: z.string().min(1, "Partner name is required"),
  nickname: z.string().optional(),
  startDate: z.string().min(1, "Start date is required"),
  country: z.string().min(1, "Country is required"),
  state: z.string().min(1, "State is required"),
  city: z.string().min(1, "City is required"),
  address: z.string().min(1, "Address is required"),
  domain: z.array(z.object({
    id: z.number(),
    name: z.string(),
  })).min(1, "At least one domain is required"),
  subDomain: z.array(z.object({
    id: z.number(),
    name: z.string(),
  })).min(1, "At least one Sub-domain is required"),
  //  z.string().min(1, "Sub-domain is required"),
  skills: z.array(z.object({
    id: z.number(),
    name: z.string(),
  })).min(1, "At least one skill is required"),
  capabilitiesDeckDocuments: z.array(z.object({
    id: z.number().optional(),
    attachmentName: z.string(),
    attachmentURL: z.string(),
    partnerId: z.number().optional(),
  })).min(1, "At least one capability deck document is required"),
    pincode: z
      .string()
      .regex(/^\d{6}$/, {
        message: "Pincode must be exactly 6 digits and numeric only",
      }),
      partnerCategoryId:z.string().min(1,"Partner Category is required"),
      servicingCountryId:z.string().min(1,"Servicing Country is required")
});

type FormValues = z.infer<typeof profileFormSchema>;

interface ProfileFormProps {
  onNext?: () => void;
  onPrevious?: () => void;
}

export default function ProfileForm({ onNext, onPrevious }: ProfileFormProps) {
  const {
    partnerCode,
    setPartnerCode,
    setPartnerId,
    partnerStatus: partnerStatusName,
    setPartnerStatus,
  } = usePartnerStore();
  const [loader, setLoader] = useState(false);
  const [partnerStatusNameFromAPI, setPartnerStatusNameFromAPI] = useState("");
  const searchParams = useSearchParams();
  const partnerId = searchParams.get("id") || "";
  const roles = useUserStore((state) => state.roles);
  const isPartner = roles.some((role) => role.name === "PARTNER");

  const { data: partner, isLoading: isLoadingPartner, refetch: refetchPartner, } = useQuery({
    queryKey: ["partner", partnerId],
    queryFn: () => partnerApi.getPartnerProfileForm(Number(partnerId)),
    enabled: !!partnerId,
  });
 
   const { data: domain = [], isLoading: isDomainLoading } = useQuery({
    queryKey: ["domain"],
    queryFn: () => dropdownApi.fetchDropdown(MasterTypes.DOMAIN),
  });
  const { data: skills = [], isLoading: isSkillsLoading } = useQuery({
    queryKey: ["skills"],
    queryFn: () => dropdownApi.fetchDropdown(MasterTypes.SKILL),
  });

 const p = partner?.data;
  const existingCapabilityDeck =
  p?.capabilitiesDeckDocuments?.map((doc: any) => ({
    id: doc.id || 0,
    attachmentName: doc.attachmentName,
    attachmentURL: doc.attachmentURL,
    partnerId: doc.partnerId || Number(p.id),
  })) || [];

const form = useForm<FormValues>({
  resolver: zodResolver(profileFormSchema),
  defaultValues: {
    partnerId: p?.partnerCode?.toString() || "",
    partnerName: p?.partnerName || "",
    nickname: p?.nickname || "",
    startDate: p?.startDate || "",
    country:p?.countryId? String(p?.countryId) : "",
    state: p?.stateId ? String(p?.stateId): "",
    city: p?.cityId ? String(p?.cityId) : "",
    address: p?.address || "",
    pincode: p?.pincode || "",
    partnerCategoryId:p?.partnerCategoryId? String(p?.partnerCategoryId): "",
    servicingCountryId:p?.servicingCountryId? String(p?.servicingCountryId) : "",
    domain:
      domain
        ?.filter((s: { id: number }) => p?.domainIds?.includes(s.id))
        .map((s: { id: number; name: string }) => ({
          id: s.id,
          name: s.name,
        })) || [],
    skills:
      skills
        ?.filter((s: { id: number }) => p?.skillIds?.includes(s.id))
        .map((s: { id: number; name: string }) => ({
          id: s.id,
          name: s.name,
        })) || [],
    subDomain: [],
    capabilitiesDeckDocuments: existingCapabilityDeck,
  },
});


  const selectedCountry = form.watch("country");
  const selectedState = form.watch("state");
  const selectedDomains = form.watch("domain");



  const { data: partnerStatus = [] } = useQuery({
    queryKey: ["partnerStatus"],
    queryFn: () => dropdownApi.fetchDropdown(MasterTypes.PARTNER_STATUS),
  });

 

  const { data: country = [], isLoading: isCountryLoading } = useQuery({
    queryKey: ["country"],
    queryFn: () => dropdownApi.fetchDropdown(MasterTypes.COUNTRY),
  });

  const { data: states = [], refetch: refetchStates } = useQuery({
    queryKey: ["states", selectedCountry],
    queryFn: () =>
      dropdownApi.fetchDropdown(MasterTypes.STATE, {
        countryId: parseInt(selectedCountry),
      }),
    enabled: !!selectedCountry,
  });

  const { data: cities = [], refetch: refetchCities } = useQuery({
    queryKey: ["cities", selectedState],
    queryFn: () =>
      dropdownApi.fetchDropdown(MasterTypes.CITY, {
        stateId: parseInt(selectedState),
      }),
    enabled: !!selectedState,
  });

  

  const { data: PARTNER_CATEGORY = [], isLoading:isPARTNER_CATEGORY } = useQuery({
    queryKey: ["PARTNER_CATEGORY"],
    queryFn: () => dropdownApi.fetchDropdown(MasterTypes.PARTNER_CATEGORY),
  });
  const domainIds = selectedDomains?.map((id) => Number(id.id)) || [];
  const { data: subDomain = [], refetch: refetchSubDomains, isFetched } = useQuery({
    queryKey: ["subDomain", [domainIds]],
    queryFn: () =>
      dropdownApi.fetchSubDropDowns(domainIds),
    enabled: domainIds.length > 0,
  });

  useEffect(() => {
  if (!partner?.data) return;

  // Wait until the required master dropdown data are available
  if (isDomainLoading || isCountryLoading || isSkillsLoading || isPARTNER_CATEGORY) {
    return;
  }

  const p = partner.data;

  const existingCapabilityDeck = p.capabilitiesDeckDocuments?.map((doc: any) => ({
    id: doc.id || 0,
    attachmentName: doc.attachmentName,
    attachmentURL: doc.attachmentURL,
    partnerId: doc.partnerId || Number(partnerId),
  })) || [];
   setLoader(true)
  form.reset({
    partnerId: p.partnerCode?.toString() || "",
    partnerName: p.partnerName || "",
    nickname: p.nickname || "",
    startDate: p.startDate || "",
    country:p.countryId? String(p.countryId): "",
    servicingCountryId: p.servicingCountryId
      ? String(p.servicingCountryId)
      : "",
    partnerCategoryId: p.partnerCategoryId ? String(p.partnerCategoryId) : "",
    address: p.address || "",
    pincode: p.pincode || "",
    domain: domain
      ?.filter((s: any) => p.domainIds?.includes(s.id))
      .map((s: any) => ({ id: s.id, name: s.name })) || [],
    skills: skills
      ?.filter((s: any) => p.skillIds?.includes(s.id))
      .map((s: any) => ({ id: s.id, name: s.name })) || [],
    subDomain: [],
    capabilitiesDeckDocuments: existingCapabilityDeck,
  });

  setPartnerCode(p.partnerCode);
  setPartnerId(p.id);
  setPartnerStatusNameFromAPI(p.partnerStatusName || "");
  const STATE_DELAY_MS = 300;  
  const CITY_DELAY_MS  = 1200;

  const stateTimer = window.setTimeout(() => {
    form.setValue("state", p.stateId ? String(p.stateId) : "");
  }, STATE_DELAY_MS);

  const cityTimer = window.setTimeout(() => {
    
    form.setValue("city", p.cityId ? String(p.cityId) : "");
    setLoader(false)
  }, CITY_DELAY_MS);

  return () => {
    clearTimeout(stateTimer);
    clearTimeout(cityTimer);
  };
}, [
  partner?.data,
  partnerId,
  domain,
  skills,
  isDomainLoading,
  isCountryLoading,
  isSkillsLoading,
  isPARTNER_CATEGORY,
  form,
]);








  useEffect(() => {
    if (selectedCountry) {
      form.setValue("state", "");
      form.setValue("city", "");
      refetchStates();
    }
  }, [selectedCountry, form, refetchStates]);

  useEffect(() => {
    if (selectedState) {
      form.setValue("city", "");
      refetchCities();
    }
  }, [selectedState, form, refetchCities]);

  useEffect(() => {
    if (selectedDomains?.length > 0) {
      form.setValue("subDomain", []);

      refetchSubDomains();
    }
  }, [selectedDomains, form, refetchSubDomains]);

  useEffect(() => {
    const existingSubDomainIds = partner?.data?.subDomainIds;

    if (subDomain.length > 0 && domainIds?.length > 0) {
      const matched = subDomain.filter((s: any) =>
        existingSubDomainIds.includes(s.id)
      );

      if (matched.length > 0) {
        form.setValue(
          "subDomain",
          matched.map((m: any) => ({
            id: m.id,
            name: m.name,
          }))
        );
      }
    }
  }, [subDomain, domainIds, partner?.data?.subDomainIds]);



  function formatFormData(values: FormValues): PartnerPayload {
    // Format capability deck documents with proper partnerId for updates
    const formattedCapabilityDeck = values.capabilitiesDeckDocuments.map(doc => ({
      id: doc.id || 0,
      attachmentName: doc.attachmentName,
      attachmentURL: doc.attachmentURL,
      partnerId: Number(partnerId), // Always use actual partnerId for updates
    }));

    return {
      id: partner.data.id,
      isActive: true,
      partnerCode: partnerCode || null,
      partnerName: values.partnerName,
      nickname: values.nickname || "",
      startDate: values.startDate,
      countryId: parseInt(values.country),
      stateId: parseInt(values.state),
      cityId: parseInt(values.city),
      address: values.address,
      domainIds: values.domain.map((item) => item.id),
      subDomainIds: values.subDomain.map((item) => item.id),
      skillIds: values.skills.map((s) => s.id),
      capabilitiesDeckDocuments: formattedCapabilityDeck, // Use the new array format
      partnerCategoryId:values.partnerCategoryId,
      servicingCountryId:values.servicingCountryId,
      pincode:values.pincode,
    };
  }

  const updatePartnerMutation = useMutation({
    mutationFn: (values: PartnerPayload) =>
      partnerApi.updatePartnerProfile(Number(partnerId), values),
    onSuccess: async (data) => {
      form.setValue("partnerId", data.data.partnerCode);
      setPartnerCode(data.data.partnerCode);
      setPartnerId(data.data.id);
      await refetchPartner();
      toast.success("Partner updated successfully");
    },
    onError: (error) => {
      toast.error("Failed to update partner");
      console.error("Error updating partner:", error);
    },
  });

  const reinitiateMutation = useMutation({
    mutationFn: async () => {
      return await api.patch(`Partner/toggle?partnerId=${partnerId}&partnerStatusId=19001`);
    },
    onSuccess: () => {
      toast.success("Partner reinitiated successfully");
      // Refresh the partner data
      setPartnerStatus(false)
      refetchPartner();
    },
    onError: (error) => {
      toast.error("Failed to reinitiate partner");
      console.error("Error reinitiating partner:", error);
    },
  });

  function onSubmit(values: FormValues) {
    const formattedData = formatFormData(values);
    const payload = {
      ...formattedData,
      id: partnerId,
      approvedBy: partner.data.approvedBy,
      approverName: partner.data.approverName,
      approverEmail: partner.data.approverEmail,
      approvedStatus: true,
    };
    updatePartnerMutation.mutate(payload);
  }

  const handleReinitiate = () => {
    reinitiateMutation.mutate();
  };

  const [isPrimary, setIsPrimary] = useState(true);
  const [isAddSkillOpen, setIsAddSkillOpen] = useState(false);


if (loader) return <SubmitFormLoader />;

  return (
    <>
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="relative space-y-6"
        >
          <div className="flex items-center mb-6 justify-between w-full">
            {partnerStatusNameFromAPI === "Inactive" && (
              <Button
                type="button"
                onClick={handleReinitiate}
                variant="default"
                size="sm"
                className="bg-[#00A76F] hover:bg-[#00A76F]/90"
              >
                <RefreshCw className="h-4 w-4" />
                Reinitiate
              </Button>
            )}
          </div>

          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-semibold">Profile</h2>
            <div className="flex items-center gap-2 text-sm">
              <span className="text-muted-foreground">Partner ID:</span>
              <span className="font-medium">{partnerCode}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span className="text-muted-foreground">Partner Status:</span>
              <span className="font-medium">{partnerStatusNameFromAPI}</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <InputField
              control={form.control}
              name="partnerName"
              label="Partner Name"
              placeholder="Please enter the company full name"
              required
              disabled={partnerStatusNameFromAPI === "Inactive" || isPartner}
            />

            <InputField
              control={form.control}
              name="nickname"
              label="Alias"
              placeholder="Partner NickName"
              disabled={partnerStatusNameFromAPI === "Inactive" || isPartner}

            />


            <DatePickerField
              control={form.control}
              name="startDate"
              label="Start Date"
              required
              disabledDates={[{ before: new Date() }]}
              disabled={partnerStatusNameFromAPI === "Inactive" || isPartner}
            />

            <SelectField
              control={form.control}
              name="country"
              label="Origin Country"
              placeholder="select origin country"
              options={country}
              required
              disabled={partnerStatusNameFromAPI === "Inactive" || isPartner}
            />

            <SelectField
              control={form.control}
              name="state"
              label="Origin State"
              placeholder="select origin state"
              options={states}
              required
              disabled={partnerStatusNameFromAPI === "Inactive" || isPartner}
            />

            <SelectField
              control={form.control}
              name="city"
              label="Origin City"
              placeholder="select origin city"
              options={cities}
              required
              disabled={partnerStatusNameFromAPI === "Inactive" || isPartner}
            />
              <SelectField
              control={form.control}
              name="servicingCountryId"
              label="Servicing Country"
              placeholder="select servicing country"
              options={country}
              required
            />
            <SelectField
            control={form.control}
            name="partnerCategoryId"
            label="Partner Category"
            placeholder="Select Partner Category"
            required
            options={PARTNER_CATEGORY}
            />
            <InputField
              control={form.control}
              name="address"
              label="Registered Address"
              placeholder="Registered Address"
              required
              disabled={partnerStatusNameFromAPI === "Inactive" || isPartner}
            />

             <InputField
              control={form.control}
              name="pincode"
              label="Pincode"
              placeholder="Enter Pincode"
              maxLength={6}
              required
             
            />

            <MultiSelectField
              control={form.control}
              name="domain"
              label="Domain"
              placeholder="Select domains"
              options={domain}
              required
              disabled={partnerStatusNameFromAPI === "Inactive"}
            />

            <MultiSelectField
              control={form.control}
              name="subDomain"
              label="Sub-Domain"
              placeholder="Select sub-domain"
              options={subDomain}
              required
              disabled={partnerStatusNameFromAPI === "Inactive"}
            />

            <div className="flex items-end gap-4">
              <div className="flex-1">
                <MultiSelectField
                  control={form.control}
                  name="skills"
                  label="Skills"
                  placeholder="Select skills"
                  options={skills}
                  required
                  disabled={partnerStatusNameFromAPI === "Inactive"}
                />
              </div>
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  setIsPrimary(true);
                  setIsAddSkillOpen(true);
                }}
                className="mb-1"
                disabled={partnerStatusNameFromAPI === "Inactive"}
              >
                Add Skill
              </Button>
            </div>
          </div>

          {/* Multi-Document Capability Deck Section */}
          <div className="space-y-4">
            <MultiDocumentField
              control={form.control}
              name="capabilitiesDeckDocuments"
              label="Company Profile"
              accept=".ppt,.pptx,.pdf,.doc,.docx"
              required
              maxFiles={10}
              partnerId={partnerId}
              isCreating={false} // Always false for profile form (editing existing)
              disabled={partnerStatusNameFromAPI === "Inactive" || isPartner}
              isToggle={false}
              refetchPartner={refetchPartner}
            />
          </div>
          <div className="flex justify-end pt-6">
            <Button
              type="submit"
              variant="hpButton"
              className="px-8"
              disabled={updatePartnerMutation.isPending || partnerStatusNameFromAPI === "Inactive"}
            >
              {updatePartnerMutation.isPending ? "Updating.." : "Update"}
            </Button>
          </div>
        </form>
      </Form>

      <div className="flex justify-between pt-6">
        <Button
          variant="secondary"
          type="button"
          className="px-8"
          onClick={onPrevious}
        >
          Previous
        </Button>
        <Button type="submit" className="px-8" onClick={onNext}>
          Next
        </Button>
      </div>

      <AddSkillDialog
        isOpen={isAddSkillOpen}
        onClose={() => setIsAddSkillOpen(false)}
        isPrimary={isPrimary}
        masterType={MasterTypes.SKILL}
      />
    </>
  );
}