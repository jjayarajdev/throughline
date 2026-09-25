"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useWatch } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { InputField } from "@/components/form-fields/InputField";
import { SelectField } from "@/components/form-fields/SelectField";
import { FileField } from "@/components/form-fields/FileField";
import { useMutation, useQuery } from "@tanstack/react-query";
import { MasterTypes } from "@/constants/masterTypes";
import { dropdownApi } from "@/services/api/master";
import { useEffect, useState } from "react";
import { MultiSelectField } from "@/components/form-fields/MultiSelectField";
import { toast } from "sonner";
import { candidateApi } from "@/services/api/candidate.api";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import UploadMultipleCandidate from "./uploadMultipleCandidate";
import { useCandidateStore } from "@/store/useCandidateStore";
import { Input } from "@/components/ui/input";
import api from "@/lib/axiosInstance";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { useRouter, useSearchParams } from "next/navigation";
import { isPartner, useUserStore } from "@/store/userStore";
import { DatePickerField } from "@/components/form-fields/DatePickerField";
import { SearchableDropdown } from "@/components/form-fields/searchable-dropdown";
import { Breadcrumbs } from "@/components/common/Breadcrumbs";
import { AddSkillDialog } from "@/components/dialog/AddSkillDialog";
import { FieldView } from "@/components/form-fields/FieldView";
import SubmitFormLoader from "@/components/common/SubmitFormLoader";

const candidateFormSchema = z.object({
  fullName: z.string().min(1, "Full Name is required"),
  phoneNumber: z
    .string()
    .min(10, "Contact number must be 10 digits")
    .max(10, "Contact number must be 10 digits")
    .refine((value) => /^\d+$/.test(value), {
      message: "Only numbers are allowed",
    }),
  email: z.string().email("Invalid email address").min(1, "Email is required"),
  // RoleHiredFor: z.string().min(1, "Role Hired For is required"),
  PreferredWorkLocationId: z
    .array(
      z.object({
        id: z.number(),
        name: z.string(),
      })
    )
    .optional(),
  primarySkills: z
    .array(
      z.object({
        id: z.number(),
        name: z.string(),
      })
    )
    .optional(),
  secondarySkills: z
    .array(
      z.object({
        id: z.number(),
        name: z.string(),
      })
    )
    .optional(),
  countryId: z.string().min(1, "Country is required"),
  stateId: z.string().min(1, "State is required"),
  cityId: z.string().min(1, "City is required"),
  diversity: z.string().optional(),
  noticePeriod: z.string().min(1, "NoticePeriod is required"),
  relevantExperience: z.string().min(1, "Relevant Experience is required"),
  currentlyWorking: z.string().min(1, "Currently Working is required"),
  currentOrganisation: z
    .string()
    .min(1, "Current/Last Organisation is required"),
  lastWorkingDay: z.string().optional().nullable(),
  resume: z.object({
    attachmentName: z.string().min(1, "Resume is required"),
    attachmentURL: z.string().min(1, "Resume is required"),
  }),
  isReferred: z.string().optional(),
  referredBy: z.string().optional(),
  hrqId: z.string().min(1, "HRQ ID is required"),
  partner: z.string().min(1, "Partner is required"),
  jobTitle: z.string().min(1, "Role Hired For is required"),
  hrqStatusName: z.string().min(1, "HRQ Status is required"),
  resourceTypeName: z.string().optional(),
  isAgreedForTermsConditions: z.boolean().refine((val) => val === true, {
    message: "You must accept the terms and conditions",
  }),
  hiringRequestId: z.number().optional(),
});

type FormValues = z.infer<typeof candidateFormSchema>;

const CandidateForm = () => {
  const [registrationType, setRegistrationType] = useState<
    "single" | "multiple"
  >("single");
  const searchParams = useSearchParams();
  const hrqid = searchParams.get("hrqid");
  const [showTermsDialog, setShowTermsDialog] = useState(false);
  const [selectedHrqID, setSelectedHrqID] = useState<string | null>(null);
  const router = useRouter();
  const { intakeId } = useCandidateStore();
  const { partnerId, partnerName, userId, roles } = useUserStore();

  const [jobLocations, setJobLocations] = useState<
    { id: number; name: string }[]
  >([]);

  const form = useForm<FormValues>({
    resolver: zodResolver(candidateFormSchema),
    defaultValues: {
      fullName: "",
      phoneNumber: "",
      email: "",
      hiringRequestId: NaN,
      countryId: "",
      stateId: "",
      cityId: "",
      diversity: "",
      noticePeriod: "",
      relevantExperience: "",
      currentlyWorking: "",
      currentOrganisation: "",
      lastWorkingDay: null,
      isReferred: "",
      referredBy: "",
      resume: {
        attachmentName: "",
        attachmentURL: "",
      },
      hrqId: "",
      partner: partnerName,
      jobTitle: "",
      hrqStatusName: "",
   
      resourceTypeName: "",
      isAgreedForTermsConditions: false,
      // RoleHiredFor: "",
      PreferredWorkLocationId: [],
      primarySkills: [],
      secondarySkills: [],
    },
  });

  const selectedCountry = form.watch("countryId");
  const selectedState = form.watch("stateId");

  const { data: hrqids = [] } = useQuery({
    queryKey: ["hrqids"],
    queryFn: () => candidateApi.getHrqid(partnerId ? Number(partnerId) : null),
    enabled: true,
  });

  const { data: country = [] } = useQuery({
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


  const { data: PRIMARY_SKILLS = [] } = useQuery({
    queryKey: ["PRIMARY_SKILLS"],
    queryFn: () => dropdownApi.fetchDropdown(MasterTypes.PRIMARY_SKILLS),
  });
  const { data: SECONDARY_SKILLS = [] } = useQuery({
    queryKey: ["SECONDARY_SKILLS"],
    queryFn: () => dropdownApi.fetchDropdown(MasterTypes.SECONDARY_SKILLS),
  });



  const { data: hrqPartnersList = [] } = useQuery({
    queryKey: ["hrqPartnersList", selectedHrqID],
    queryFn: () =>
      dropdownApi.fetchSpecificpartner(
        MasterTypes.HRQ_SPECIFIC_PARTNERS,
        selectedHrqID
      ),
    enabled: !!selectedHrqID,
  });

  useEffect(() => {
    if (hrqPartnersList && hrqPartnersList.length > 0 && partnerId) {
      form.setValue("partner", partnerId?.toString() || "");
    }
  }, [hrqPartnersList]);

  useEffect(() => {
    if (selectedCountry) {
      form.setValue("stateId", "");
      form.setValue("cityId", "");
      refetchStates();
    }
  }, [selectedCountry, form, refetchStates]);

  useEffect(() => {
    if (selectedState) {
      form.setValue("cityId", "");
      refetchCities();
    }
  }, [selectedState, form, refetchCities]);

  const createCandidateMutation = useMutation({
    mutationFn: async (values: any) => {
      try {
        await candidateApi.createCandidateUserIdBased(values, userId);
      } catch (error: any) {
        if (
          error.response?.data?.message ===
          "The candidate you are trying to upload is a duplicate. Are you sure you want to send this candidate for approval?"
        ) {
          // If duplicate, make another API call with isRequestException: true
          return await candidateApi.createCandidateUserIdBased(
            { ...values, isRequestException: true },
            userId
          );
        }
        throw error;
      }
    },
    onSuccess: () => {
      toast.success("Candidate details created successfully");
      form.reset();
      router.push("/home/candidate-management");
    },
    onError: (error: any) => {
      toast.error(
        error.response?.data?.message || "Failed to create candidate details"
      );
      console.error("Error creating candidate details:", error);
    },
  });
  async function onSubmit(values: FormValues) {
    try {
      const primarySkillIds = values.primarySkills.map((skill) => skill.id);
      const secondarySkillIds =
        values.secondarySkills?.map((skill) => skill.id) || [];
      const { PreferredWorkLocationId, ...rest } = values;
      const payload = {
        ...rest,
        PrimarySkillIds: primarySkillIds,
        SecondarySkillIds: secondarySkillIds,
        // RoleHiredFor: values.RoleHiredFor,
        preferredWorkLocationIds: values.PreferredWorkLocationId
          ? values.PreferredWorkLocationId.map((item: any) => item.id)
          : [], // now array
        noticePeriod: Number(values.noticePeriod),
        isReferred: values.isReferred,
        isBin: true,       
        partnerId: values.partner,
        isActive: true,
      };
      await createCandidateMutation.mutateAsync(payload);
      router.push("/home/candidate-management");
    } catch (error) {
      console.error("Form submission error:", error);
    }
  }
  const [loader, setLoader] = useState(false);
  const fillRandomData = async () => {
    const hrqId = form.getValues("hrqId");
    if (!hrqId) {
      toast.error("Please enter HRQ ID");
      return;
    }
    try {
      setLoader(true);
      const response = await api.get(`/HiringRequest/hiring/validate/${hrqId}`);
      const data = response.data.data;
      form.setValue("hiringRequestId", data.hiringRequestId);
      form.setValue("jobTitle", data.jobTitle);
      form.setValue("hrqStatusName", data.hiringStatusName);
      form.setValue("resourceTypeName", String(data.resourceTypeName));
      // Fetch jobLocations from API response if available
      if (Array.isArray(data.jobLocations)) {
        setJobLocations(
          data.jobLocations.map((loc: any) => ({
            id: loc.id,
            name: loc.name,
          }))
        );
      } else {
        setJobLocations([]);
      }
      toast.success("HRQ details loaded successfully");
      setSelectedHrqID(data.hiringRequestId);
    } catch (error) {
      toast.error(
        error?.response?.data?.message || "Failed to fetch HRQ details"
      );
    } finally {
      setLoader(false);
    }
  };

  const handleTermsAccept = () => {
    form.setValue("isAgreedForTermsConditions", true, {
      shouldValidate: true,
      shouldDirty: true,
      shouldTouch: true,
    });
    setShowTermsDialog(false);
  };
  useEffect(() => {
    if (hrqid) {
      form.setValue("hrqId", hrqid);
      fillRandomData();
    }
  }, [hrqid]);

  const [isPrimary, setisPrimary] = useState(true);
  const [isAddSkillOpen, setIsAddSkillOpen] = useState(false);

  return (
    <div className="space-y-6">
      <Breadcrumbs />
      {loader ? (
        <SubmitFormLoader />
      ) : (
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Candidate Registration</h2>
          </div>
          <div className="flex items-center gap-4">
            <Label>Registration Type</Label>
            <RadioGroup
              defaultValue="single"
              onValueChange={(value) =>
                setRegistrationType(value as "single" | "multiple")
              }
              className="flex items-center gap-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="single" id="single" />
                <Label htmlFor="single">Single</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="multiple" id="multiple" />
                <Label htmlFor="multiple">Multiple</Label>
              </div>
            </RadioGroup>
          </div>
        </div>
      )}

      {registrationType === "single" ? (
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {!hrqid ? (
                <FormField
                  control={form.control}
                  name="hrqId"
                  render={({ field }) => (
                    <FormItem className="flex-1">
                      <FormLabel>HRQ ID*</FormLabel>
                      <FormControl>
                        <div className="flex gap-2 items-center">
                          <SearchableDropdown
                            options={hrqids?.map((option: any) => ({
                              value: option.hrqId,
                              label: option.hrqId,
                            }))}
                            disabled={hrqid ? true : false}
                            value={field.value}
                            onChange={field.onChange}
                            placeholder="Select or search HRQ ID"
                            searchPlaceholder="Search HRQ ID..."
                            className="flex-1"
                          />
                          {!hrqid && (
                            <Button
                              type="button"
                              className="text-white dark:text-black"
                              variant="hpButton"
                              disabled={loader}
                              onClick={fillRandomData}
                            >
                              {loader ? "Validating..." : "Validate"}
                            </Button>
                          )}
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              ) : (
                <div>
                  <Label>
                    HRQ ID: <span className="font-medium">{hrqid} </span>
                  </Label>
                </div>
              )}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <SelectField
                control={form.control}
                name="partner"
                label="Partner"
                placeholder="Select Partner"
                options={hrqPartnersList}
                required
                disabled={!!partnerId}
              />
              <FieldView
                label="Role Hired For"
                value={form.watch("jobTitle")}
              />
              <FieldView
                label="HRQ Status"
                value={form.watch("hrqStatusName")}
              />
              <FieldView label="Intake Status" value="New" />
              <FieldView
                label="Resource Type"
                value={form.watch("resourceTypeName")}
              />
              <MultiSelectField
                control={form.control}
                name="PreferredWorkLocationId"
                label="Preferred Work Location"
                placeholder="Select preferred work locations"
                options={jobLocations}
                // required
                disabled={jobLocations.length === 0}
              />
            </div>
            {/* Add new fields below the HRQ section */}
            <Separator className="w-full my-4 bg-gray-200 border border-gray-200 dark:bg-green-800 dark:border-green-100" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <InputField
                control={form.control}
                name="fullName"
                label="Full Name"
                placeholder="Full Name"
                required
              />
              <InputField
                control={form.control}
                name="phoneNumber"
                label="Phone Number"
                placeholder="Enter 10 digit contact number"
                required
                type="tel"
                maxLength={10}
                pattern="[0-9]{10}"
              />
              <InputField
                control={form.control}
                name="email"
                label="Email"
                placeholder="Email"
                required
              />
              <div className="flex items-end gap-4">
                <div className="flex-1">
                  <MultiSelectField
                    control={form.control}
                    name="primarySkills"
                    label="Primary Skills"
                    placeholder="Select primary skills"
                    options={PRIMARY_SKILLS}
                    // required
                  />
                </div>
                {!isPartner && (
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => {
                      setisPrimary(true);
                      setIsAddSkillOpen(true);
                    }}
                    className="mb-1"
                  >
                    Add Skill
                  </Button>
                )}
              </div>
              <MultiSelectField
                control={form.control}
                name="secondarySkills"
                label="Secondary Skills"
                placeholder="Select secondary skills"
                options={SECONDARY_SKILLS}
              />
              <SelectField
                control={form.control}
                name="countryId"
                label="Country"
                placeholder="Select country"
                options={country}
                required
              />
              <SelectField
                control={form.control}
                name="stateId"
                label="State"
                placeholder="Select state"
                options={states}
                required
              />
              <SelectField
                control={form.control}
                name="cityId"
                label="City"
                placeholder="Select city"
                options={cities}
                required
              />
              <SelectField
                control={form.control}
                name="diversity"
                label="Diversity"
                placeholder="Diversity"
                options={[
                  { id: "yes", name: "Yes" },
                  { id: "no", name: "No" },
                ]}
              />
              <InputField
                control={form.control}
                name="noticePeriod"
                label="Notice Period(Days)"
                placeholder="Notice Period"
                required
                type="number"
              />
              <InputField
                control={form.control}
                name="relevantExperience"
                label="Relevant Experience(In Years)"
                placeholder="Relevant Experience"
                required
              />
              <SelectField
                control={form.control}
                name="currentlyWorking"
                label="Currently Working"
                placeholder="Currently Working"
                required
                options={[
                  { id: "yes", name: "Yes" },
                  { id: "no", name: "No" },
                ]}
              />
              <InputField
                control={form.control}
                name="currentOrganisation"
                label="Current/Last Organisation"
                placeholder="Current/Last Organisation"
                required
              />

              <DatePickerField
                control={form.control}
                name="lastWorkingDay"
                label="Last Working Date"
                disabledDates={[]}
              />
              <FileField
                control={form.control}
                name="resume"
                label="Resume"
                accept=".ppt,.pptx,.pdf,.doc,.docx"
                required
              />
              <SelectField
                control={form.control}
                name="isReferred"
                label="Is Referred"
                placeholder="Select..."
                options={[
                  { id: 1, name: "External" },
                  { id: 2, name: "Internal" },
                  { id: 3, name: "Others" },
                ]}
              />
              <InputField
                control={form.control}
                name="referredBy"
                label="Referred By(Email)"
                placeholder="Enter email"
              />
            </div>
            <div className="space-y-1 leading-none ml-2">
              <FormField
                control={form.control}
                name="isAgreedForTermsConditions"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        disabled
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>
                        I read and agree to{" "}
                        <Button
                          variant="link"
                          type="button"
                          className="p-0 text-[#4096ff] hover:underline h-auto font-normal"
                          onClick={() => setShowTermsDialog(true)}
                        >
                          terms and conditions
                        </Button>
                      </FormLabel>
                      <FormMessage />
                    </div>
                  </FormItem>
                )}
              />
            </div>
            <div className="flex justify-between pt-6">
              <div className="flex gap-4">
                <Button
                  disabled={createCandidateMutation.isPending}
                  type="submit"
                  variant="hpButton"
                  className="px-8"
                >
                  {createCandidateMutation.isPending
                    ? "Submitting..."
                    : "Submit"}
                </Button>
              </div>
            </div>
            <Dialog open={showTermsDialog} onOpenChange={setShowTermsDialog}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Terms and Conditions</DialogTitle>
                  <div className="space-y-4 max-h-[60vh] overflow-y-auto mt-4">
                    <h3 className="font-semibold">1. Introduction</h3>
                    <p>
                      These Terms and Conditions govern your use of our
                      candidate intake system. By using this system, you agree
                      to these terms in full.
                    </p>

                    <h3 className="font-semibold">2. Data Privacy</h3>
                    <p>
                      We are committed to protecting candidate data and comply
                      with all relevant data protection laws. All information
                      submitted will be handled confidentially.
                    </p>

                    <h3 className="font-semibold">3. Responsibilities</h3>
                    <p>You agree to:</p>
                    <ul className="list-disc pl-6">
                      <li>Provide accurate and complete information</li>
                      <li>Maintain the confidentiality of candidate data</li>
                      <li>Use the system only for its intended purpose</li>
                      <li>Comply with all applicable laws and regulations</li>
                    </ul>

                    <h3 className="font-semibold">4. Usage Guidelines</h3>
                    <p>
                      The system must be used in accordance with our usage
                      guidelines, which prohibit any unauthorized or malicious
                      activities.
                    </p>
                  </div>
                </DialogHeader>
                <DialogFooter className="mt-6">
                  <Button
                    variant="outline"
                    onClick={() => setShowTermsDialog(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleTermsAccept}
                    className="bg-[#4096ff] hover:bg-[#009e79]"
                  >
                    Accept
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </form>
        </Form>
      ) : (
        <UploadMultipleCandidate />
      )}
      <AddSkillDialog
        isOpen={isAddSkillOpen}
        onClose={() => setIsAddSkillOpen(false)}
        isPrimary={isPrimary}
        masterType={MasterTypes.SKILL}
      />
    </div>
  );
};

export default CandidateForm;
