"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { ArrowLeft } from "lucide-react";
import { useEffect, useState } from "react";
import { InputField } from "../../form-fields/InputField";
import { SelectField } from "../../form-fields/SelectField";
import { MultiDocumentField } from "@/components/form-fields/MultiDocumentField";
import { MultiSelectField } from "../../form-fields/MultiSelectField";
import Link from "next/link";
import { useMutation, useQuery } from "@tanstack/react-query";
import { dropdownApi } from "@/services/api/master";
import { MasterTypes } from "@/constants/masterTypes";
import { partnerApi, PartnerPayload } from "@/services/api/partner.profile.api";
import { toast } from "@/lib/toast";
import { usePartnerStore } from "@/store/userPartnerStore";
import { DatePickerField } from "@/components/form-fields/DatePickerField";
import SubmitFormLoader from "@/components/common/SubmitFormLoader";
import { AddSkillDialog } from "@/components/dialog/AddSkillDialog";

// Updated schema to handle array of documents
export const candidateProfileSchema = z.object({
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
  subDomain:z.array(z.object({
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

type FormValues = z.infer<typeof candidateProfileSchema>;

interface CandidateProfileFormProps {
  onNext?: () => void;
  onPrevious?: () => void;
}

export default function CandidateProfileForm({
  onNext,
  onPrevious,
}: CandidateProfileFormProps) {
  const { partnerCode, setPartnerCode, setPartnerId, partnerId } = usePartnerStore();
  const [afterSave, setAfterSave] = useState<boolean>(false);
  const [loader, setLoader] = useState(false);
  const [isPrimary, setIsPrimary] = useState(true);
  const [isAddSkillOpen, setIsAddSkillOpen] = useState(false);
  const [partnerStatusNameFromAPI, setPartnerStatusNameFromAPI] = useState("");


  // Determine if we're creating a new candidate or updating existing one
  const isCreating = partnerCode === "PID***" || !partnerId;

  const form = useForm<FormValues>({
    resolver: zodResolver(candidateProfileSchema),
    defaultValues: {
      partnerId: "",
      partnerName: "",
      nickname: "",
      startDate: new Date().toISOString().split("T")[0],
      country: "",
      state: "",
      city: "",
      address: "",
      domain: [],
      subDomain: [],
      skills: [],
      capabilitiesDeckDocuments: [],
      pincode:"",
      partnerCategoryId:"",
      servicingCountryId:""
    },
  });

  const selectedCountry = form.watch("country");
  const selectedState = form.watch("state");
  const selectedDomains = form.watch("domain");

  const { data: partnerStatus = [] } = useQuery({
    queryKey: ["partnerStatus"],
    queryFn: () => dropdownApi.fetchDropdown(MasterTypes.PARTNER_STATUS),
  });

  const { data: partner, isLoading: isLoadingPartner,refetch:refetchPartner } = useQuery({
    queryKey: ["partner", partnerId],
    queryFn: () => partnerApi.getPartnerProfileForm(Number(partnerId)),
    enabled: !!partnerId,
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

  const { data: domain = [], isLoading: isDomainLoading } = useQuery({
    queryKey: ["domain"],
    queryFn: () => dropdownApi.fetchDropdown(MasterTypes.DOMAIN),
  });

  const domainIds = selectedDomains?.map((id) => Number(id.id)) || [];

  const { data: subDomain = [], refetch: refetchSubDomains,isFetched } = useQuery({
    queryKey: ["subDomain", [domainIds]],
    queryFn: () => dropdownApi.fetchSubDropDowns(domainIds),
    enabled: !!selectedDomains,
  });

  const { data: skills = [], isLoading: isSkillsLoading } = useQuery({
    queryKey: ["skills"],
    queryFn: () => dropdownApi.fetchDropdown(MasterTypes.SKILL),
  });

  const { data: PARTNER_CATEGORY = [], isLoading:isPARTNER_CATEGORY } = useQuery({
    queryKey: ["PARTNER_CATEGORY"],
    queryFn: () => dropdownApi.fetchDropdown(MasterTypes.PARTNER_CATEGORY),
  });
 

  function formatFormData(values: FormValues): PartnerPayload {
    // Format capability deck documents based on create/update mode
    const formattedCapabilityDeck = values.capabilitiesDeckDocuments.map(doc => ({
      id: doc.id || 0,
      attachmentName: doc.attachmentName,
      attachmentURL: doc.attachmentURL,
      partnerId: isCreating ? 0 : Number(partnerId), // 0 for creating, actual partnerId for updating
    }));

    return {
      id: 0,
      isActive: true,
      partnerCode: values.partnerId || null,
      partnerName: values.partnerName,
      nickname: values.nickname || "",
      startDate: values.startDate,
      countryId: parseInt(values.country),
      stateId: parseInt(values.state),
      cityId: parseInt(values.city),
      address: values.address,
      domainIds: values.domain.map((d) => Number(d.id)),
      subDomainIds:values.subDomain.map((d) => Number(d.id)),
      //  [Number(values.subDomain)],
      skillIds: values.skills.map((s) => s.id),
      capabilitiesDeckDocuments: formattedCapabilityDeck,
      pincode:values.pincode,
      partnerCategoryId:parseInt(values.partnerCategoryId),
      servicingCountryId:values.servicingCountryId
    };
  }

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
  const existingSubDomainIds = partner?.data?.subDomainIds ?? [];

  if (isFetched && subDomain.length > 0 && domainIds?.length > 0) {
    const matched = subDomain.filter((s) =>
      existingSubDomainIds.includes(s.id)
    );

    if (matched.length > 0) {
      form.setValue(
        "subDomain",
        matched.map((m) => ({
          id: m.id,
          name: m.name,
        }))
      );
    }
  }
}, [isFetched, subDomain, domainIds, partner?.data?.subDomainIds]);

  useEffect(() => {
    if (!partner?.data) return;
    // Check if all required master data is loaded
    setLoader(true);
    if (isDomainLoading || isCountryLoading || isSkillsLoading) {
      return;
    }
    const p = partner.data;

    // Format existing capability deck documents with proper partnerId
    const existingCapabilityDeck = p.capabilitiesDeckDocuments?.map((doc: any) => ({
      id: doc.id || 0,
      attachmentName: doc.attachmentName,
      attachmentURL: doc.attachmentURL,
      partnerId: Number(partnerId), // Use actual partnerId for existing documents
    })) || [];

    // Set initial values that don't depend on master data
    setPartnerStatusNameFromAPI(p.partnerStatusName || "Unknown Status");
    form.reset({
      partnerId: p.partnerCode?.toString(),
      partnerName: p.partnerName,
      nickname: p.nickname,
      startDate: new Date(p.startDate).toISOString().split("T")[0],
      address: p.address,
      pincode:p.pincode,
      capabilitiesDeckDocuments: existingCapabilityDeck,
      partnerCategoryId:p.partnerCategoryId?.toString()|| "",
      servicingCountryId:p.servicingCountryId?.toString()|| ""
    });
    setPartnerCode(p.partnerCode);

    const sequence = async () => {
      // Set country first
      form.setValue("country", p.countryId?.toString() || "");
      await refetchStates();
      // Wait briefly for states to load
      await new Promise((resolve) => setTimeout(resolve, 500));
      form.setValue("state", p.stateId?.toString() || "");
      await refetchCities();
      // Wait briefly for cities to load
      await new Promise((resolve) => setTimeout(resolve, 500));
      form.setValue("city", p.cityId?.toString() || "");
      // Set domains
      form.setValue(
        "domain",
        domain
          ?.filter((s: { id: number; name: string }) =>
            p.domainIds.includes(s.id)
          )
          .map((s: { id: number; name: string }) => ({
            id: s.id,
            name: s.name,
          })) || []
      );
      // Set skills
      form.setValue(
        "skills",
        skills
          ?.filter((s: { id: number; name: string }) =>
            p.skillIds.includes(s.id)
          )
          .map((s: { id: number; name: string }) => ({
            id: s.id,
            name: s.name,
          })) || []
      );
      setLoader(false);
    };

    sequence();
  }, [
    partner?.data,
    domain,
    country,
    skills,
    isDomainLoading,
    isCountryLoading,
    isSkillsLoading,
    partnerId,
  ]);

  const updatePartnerMutation = useMutation({
    mutationFn: (values: PartnerPayload) =>
      partnerApi.updatePartnerProfile(Number(partnerId), values),
    onSuccess: (data) => {
      toast.success("Partner updated successfully");
    },
    onError: (error) => {
      toast.error("Failed to update partner");
      console.error("Error updating partner:", error);
    },
  });

  const createPartnerMutation = useMutation({
    mutationFn: partnerApi.createPartner,
    onSuccess: (data) => {
      form.setValue("partnerId", data.data.partnerCode);
      setPartnerCode(data.data.partnerCode);
      setPartnerId(data.data.id);
      toast.success("Partner created successfully");
      setAfterSave(true);
    },
    onError: (error:any) => {
      const message = error?.response?.data?.message || "";

    if (message.includes("UQ_Partners_PartnerName") || message.includes("duplicate key")) {
      toast.error("Duplicate partner name not allowed");
    } else {
      toast.error("Failed to create partner");
    }
      console.error("Error creating partner:", error);
    },
  });

  function onSubmit(values: FormValues) {
    const formattedData = formatFormData(values);

    if (partnerCode !== "PID***") {
      const payload = {
        ...formattedData,
        id: partnerId,
        approvedBy: partner.data.approvedBy,
        approverName: partner.data.approverName,
        approverEmail: partner.data.approverEmail,
        approvedStatus: true,
      };
      updatePartnerMutation.mutate(payload);
    } else {
      createPartnerMutation.mutate(formattedData);
    }
  }

  const handleSave = async () => {
    const result = await form.trigger();
    if (result) {
      const values = form.getValues();
      onSubmit(values);
    } else {
      console.log("Form validation errors:", form.formState.errors);
    }
  };

  if (loader || isLoadingPartner) {
    return <SubmitFormLoader />;
  }

  return (
    <>
      <div className="flex items-center gap-4 mb-6">
        {/* <Link href="/home/partner-onboarding">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </Link> */}
        <h1 className="text-2xl font-bold">Partner Profile</h1>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-semibold">Profile</h2>
            <div className="flex items-center gap-2 text-sm">
              <span className="text-muted-foreground">Partner ID:</span>
              <span className="font-medium">{partnerCode}</span>
              <span className="text-xs text-muted-foreground ml-2">
                ({isCreating ? "Creating New" : "Updating Existing"})
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span className="text-muted-foreground">Partner Status:</span>
              <span className="font-medium">{partnerStatusNameFromAPI || "*****"}</span>
              <span className="text-xs text-muted-foreground ml-2">
                ({isCreating ? "Creating New" : "Updating Existing"})
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <InputField
              control={form.control}
              name="partnerName"
              label="Partner Name"
              placeholder="Please enter the company full name"
              required
            />

            <InputField
              control={form.control}
              name="nickname"
              label="Alias"
              placeholder="Partner NickName"
            />

            <DatePickerField
              control={form.control}
              name="startDate"
              label="Start Date"
              required
              disabledDates={[{ before: new Date() }]}
            />

            <SelectField
              control={form.control}
              name="country"
              label="Origin Country"
              placeholder="select origin country"
              options={country}
              required
            />

            <SelectField
              control={form.control}
              name="state"
              label="Origin State"
              placeholder="select origin state"
              options={states}
              required
            />

            <SelectField
              control={form.control}
              name="city"
              label="Origin City"
              placeholder="select origin city"
              options={cities}
              required
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
            />

            <MultiSelectField
              control={form.control}
              name="subDomain"
              label="Sub-Domain"
              placeholder="Select sub-domain"
              options={subDomain}
              required
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
              isCreating={isCreating}
              isToggle={false}
              refetchPartner={refetchPartner}
            />
          </div>

          <div className="flex justify-end pt-6">
            <Button
              type="button"
              variant="hpButton"
              onClick={handleSave}
              disabled={loader || updatePartnerMutation.isPending}
              className="px-8"
            >
              {partnerId ? "Update" : "Save"}
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
        <Button type="submit" className="px-8" onClick={onNext} disabled={isCreating}>
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