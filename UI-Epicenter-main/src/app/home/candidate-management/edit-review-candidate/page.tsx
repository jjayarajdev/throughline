"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
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

import { Input } from "@/components/ui/input";
import api from "@/lib/axiosInstance";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { DatePickerField } from "@/components/form-fields/DatePickerField";
import { SearchableDropdown } from "@/components/form-fields/searchable-dropdown";
import { useUserStore } from "@/store/userStore";
import { Breadcrumbs } from "@/components/common/Breadcrumbs";
import SubmitFormLoader from "@/components/common/SubmitFormLoader";

const candidateFormSchema = z.object({
    fullName: z.string().min(1, "Full Name is required"),
    phoneNumber: z.string().min(1, "Phone Number is required"),
    email: z.string().email("Invalid email address").min(1, "Email is required"),
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
    PreferredWorkLocationId:  z
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
    noticePeriod: z.string().optional(),
    relevantExperience: z.string().optional(),
    currentlyWorking: z.string().optional(),
    currentOrganisation: z.string().optional(),
    lastWorkingDay: z.string().optional(),
    resume: z.object({
        attachmentName: z.string().min(1, "Resume is required"),
        attachmentURL: z.string().min(1, "Resume is required")
    }),
    isReferred: z.string().optional(),
    referredBy: z.string().optional(),
    hrqId: z.string().min(1, "HRQ ID is required"),
    partnerId: z.string().min(1, "Partner is required"),
    jobTitle: z.string().min(1, "Role Hired For is required"),
    hrqStatusName: z.string().min(1, "HRQ Status is required"),
    intakeStatusId: z.string().min(1, "Intake Status is required"),
    resourceTypeId: z.string().min(1, "Resource Type is required"),
    isAgreedForTermsConditions: z.boolean().refine((val) => val === true, {
        message: "You must accept the terms and conditions",
    }),
    hiringRequestId: z.string()
});

type FormValues = z.infer<typeof candidateFormSchema>;

const EditReviewCandidate = () => {
    const [showTermsDialog, setShowTermsDialog] = useState(false);
    const [selectedHrqID, setSelectedHrqID] = useState<string | null>(null);
    const [loader, setLoader] = useState(false);
    const [jobLocations, setJobLocations] = useState<{ id: number; name: string }[]>([]);
    const { partnerId } = useUserStore();
    const searchParams = useSearchParams()
    const candidateId = searchParams.get("id")
    const router = useRouter();

    const form = useForm<FormValues>({
        resolver: zodResolver(candidateFormSchema),
        defaultValues: {
            fullName: "",
            phoneNumber: "",
            email: "",
            hiringRequestId: "",
            countryId: "",
            stateId: "",
            cityId: "",
            diversity: "",
            noticePeriod: "",
            relevantExperience: "",
            currentlyWorking: "",
            currentOrganisation: "",
            lastWorkingDay: "",
            isReferred: "",
            referredBy: "",
            resume: {
                attachmentName: "",
                attachmentURL: ""
            },
            hrqId: "",
            partnerId: "",
            jobTitle: "",
            hrqStatusName: "",
            intakeStatusId: "",
            resourceTypeId: "",
            isAgreedForTermsConditions: false,
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


    const UpdateCandidateMutation = useMutation({
        mutationFn: (data: FormValues) => candidateApi.updateReviewCandidate(Number(candidateId), data),
        onSuccess: (data) => {
            toast.success(data.message);
            router.back();
        },
        onError: (error) => {
            toast.error((error as any)?.response?.data?.message || "An error occurred");
        }
    });

    const { data: country = [] } = useQuery({
        queryKey: ["country"],
        queryFn: () => dropdownApi.fetchDropdown(MasterTypes.COUNTRY),
    });

    const { data: states = [], refetch: refetchStates } = useQuery({
        queryKey: ["states", selectedCountry],
        queryFn: () => dropdownApi.fetchDropdown(MasterTypes.STATE, {
            countryId: parseInt(selectedCountry)
        }),
        enabled: !!selectedCountry,
    });

    const { data: cities = [], refetch: refetchCities } = useQuery({
        queryKey: ["cities", selectedState],
        queryFn: () => dropdownApi.fetchDropdown(MasterTypes.CITY, {
            stateId: parseInt(selectedState)
        }),
        enabled: !!selectedState,
    });

    const { data: skills = [] } = useQuery({
        queryKey: ["skills"],
        queryFn: () => dropdownApi.fetchDropdown(MasterTypes.SKILL),
    });

    const { data:PRIMARY_SKILLS = [] } = useQuery({
    queryKey: ["PRIMARY_SKILLS"],
    queryFn: () => dropdownApi.fetchDropdown(MasterTypes.PRIMARY_SKILLS),
  });
   const { data: SECONDARY_SKILLS = [] } = useQuery({
    queryKey: ["SECONDARY_SKILLS"],
    queryFn: () => dropdownApi.fetchDropdown(MasterTypes.SECONDARY_SKILLS),
  });

    const { data: IntakeStatus = [] } = useQuery({
        queryKey: ["instakeStatus"],
        queryFn: () => dropdownApi.fetchDropdown(MasterTypes.CANDIDATE_INTAKE_STATUS),
    });

    const { data: ResourceType = [] } = useQuery({
        queryKey: ["resourceType"],
        queryFn: () => dropdownApi.fetchDropdown(MasterTypes.RESOURCE_TYPE),
    });

    const { data: hrqPartnersList = [] } = useQuery({
        queryKey: ["hrqPartnersList", selectedHrqID],
        queryFn: () => dropdownApi.fetchSpecificpartner(MasterTypes.HRQ_SPECIFIC_PARTNERS, selectedHrqID),
        enabled: !!selectedHrqID,
    });

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

    const { data: candidateData, isLoading: isLoadingCandidate, isFetched } = useQuery({
        queryKey: ["candidate", candidateId],
        queryFn: () => candidateApi.fetchCandidateReviewDetails(Number(candidateId)),
        enabled: !!candidateId
    });

    useEffect(() => {
        if (candidateData) {
            setLoader(true);
            const candidate = candidateData;

            const setvalues = setTimeout(() => {
                form.setValue("fullName", candidate?.fullName || "");
                form.setValue("phoneNumber", candidate?.phoneNumber || "");
                form.setValue("email", candidate?.email || "");
                form.setValue(
          "primarySkills",
          Array.isArray(candidate.primarySkillIds )
          ? PRIMARY_SKILLS.filter((s: any) =>
              candidate.primarySkillIds.includes(s.id)
            ).map((s: any) => ({
              id: s.id,
              name: s.name,
            }))
          : []);
        form.setValue(
          "secondarySkills",
           Array.isArray(candidate.secondarySkillIds)
          ? SECONDARY_SKILLS.filter((s: any) =>
              candidate.secondarySkillIds.includes(s.id)
            ).map((s: any) => ({
              id: s.id,
              name: s.name,
            }))
          : []);
        form.setValue(
          "PreferredWorkLocationId",
          Array.isArray(candidate.preferredWorkLocationIds)
          ? candidate?.preferredWorkLocations.filter((s: any) =>
              candidate.preferredWorkLocationIds.includes(s.id)
            ).map((s: any) => ({
              id: s.id,
              name: s.name,
            }))
          : []);
                form.setValue("countryId", candidate?.countryId?.toString() || "");
                form.setValue("intakeStatusId", String(candidateData?.intakeStatusId));
                form.setValue("diversity", candidate?.diversity?.toLowerCase() === "yes" ? "yes" : "no");
                form.setValue("noticePeriod", candidate?.noticePeriod?.toString() || "");
                form.setValue("relevantExperience", candidate?.relevantExperience?.toString() || "");
                form.setValue("currentlyWorking", candidate?.currentlyWorking?.toLowerCase() === "yes" ? "yes" : "no");
                form.setValue("currentOrganisation", candidate?.currentOrganisation || "");
                form.setValue("lastWorkingDay", candidate?.lastWorkingDay || "");
                form.setValue("resume", candidate?.resume || { attachmentName: "", attachmentURL: "" });
                form.setValue("isReferred", candidate?.isReferred);
                form.setValue("referredBy", candidate?.referredBy || "");
                form.setValue("hrqId", candidate?.hrqId || "");
                form.setValue("partnerId", candidate?.partnerId?.toString() || "");
                form.setValue("jobTitle", candidate?.jobTitle || "");
                form.setValue("hrqStatusName", candidate?.hiringStatusName || "WIP");
                form.setValue("resourceTypeId", candidate?.resourceTypeId?.toString() || "");
                form.setValue("hiringRequestId", candidate?.hiringRequestId?.toString() || "");
                form.setValue("isAgreedForTermsConditions", true);
                // Set jobLocations if present in candidateData
                if (Array.isArray(candidate.jobLocations)) {
                    setJobLocations(
                        candidate.jobLocations.map((loc: any) => ({
                            id: loc.id,
                            name: loc.value,
                        }))
                    );
                }
            }, 2000);

            // Set state and city with a delay to ensure dropdowns are populated
            const stateTimer = setTimeout(() => {
                form.setValue("stateId", candidate.stateId?.toString() || "");
            }, 3000);

            const cityTimer = setTimeout(() => {
                form.setValue("cityId", candidate.cityId?.toString() || "");
                setLoader(false); // Set loader to false after all data is loaded
            }, 4000);

            setSelectedHrqID(candidate?.hiringRequestId || null);

            return () => {
                clearTimeout(stateTimer);
                clearTimeout(cityTimer);
                clearTimeout(setvalues);
            };
        }

    }, [candidateData, form, skills, IntakeStatus]);
    const handleTermsAccept = () => {
        form.setValue("isAgreedForTermsConditions", true, {
            shouldValidate: true,
            shouldDirty: true,
            shouldTouch: true
        });
        setShowTermsDialog(false);
    };

    async function onSubmit(values: FormValues) {
        const primarySkillIds = values.primarySkills.map((skill: any) => skill.id);
        const secondarySkillIds = values.secondarySkills?.map((skill: any) => skill.id) || [];
        const { PreferredWorkLocationId,lastWorkingDay, ...rest } = values;
        try {
            const payload = {
                ...rest,
                primarySkillIds: primarySkillIds,
                secondarySkillIds: secondarySkillIds,
                preferredWorkLocationIds:  values.PreferredWorkLocationId
                ? values.PreferredWorkLocationId.map((item: any) => item.id)
                : [], 
                CandidateBinId: candidateData?.candidateBinId,
                noticePeriod: values.noticePeriod,
                isBin: candidateData.isBin,
                partnerId: values.partnerId,
                lastWorkingDay:values.lastWorkingDay?values.lastWorkingDay:null
            };
            await UpdateCandidateMutation.mutateAsync(payload);
        } catch (error) {
            console.error("Form submission error:", error);
        }
    }

    const fillRandomData = async () => {
        const hrqId = form.getValues("hrqId");
        if (!hrqId) {
            toast.error("Please enter HRQ ID");
            return;
        }

        try {
            const response = await api.get(`/HiringRequest/hiring/${hrqId}`);
            const data = response.data.data;
            form.setValue("hiringRequestId", data.id)
            form.setValue("jobTitle", data.jobTitle);
            form.setValue("hrqStatusName", data.hiringStatusName);
            form.setValue("resourceTypeId", String(data.resourceTypeId))
            form.setValue("intakeStatusId", "15001")
            // Fetch jobLocations from API response if available
            if (Array.isArray(data.jobLocations)) {
                setJobLocations(
                    data.jobLocations.map((loc: any) => ({
                        id: String(loc.id),
                        name: loc.value,
                    }))
                );
            } else {
                setJobLocations([]);
            }
            toast.success("HRQ details loaded successfully");
            setSelectedHrqID(data.id)
        } catch (error) {
            toast.error("Failed to fetch HRQ details");
            console.error("Error fetching HRQ details:", error);
        }
    };

    if (!isFetched || loader) {
        return <SubmitFormLoader />;
    }

    return (<>
        <Breadcrumbs />
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                        control={form.control}
                        name="hrqId"
                        render={({ field }) => (
                            <FormItem className="flex-1">
                                <FormLabel>HRQ ID*</FormLabel>
                                <FormControl>
                                    <div className="flex gap-2">
                                        <SearchableDropdown
                                            options={hrqids?.map((option: any) => ({
                                                value: option.hrqId,
                                                label: option.hrqId
                                            }))}
                                            value={field.value}
                                            onChange={field.onChange}
                                            placeholder="Select or search HRQ ID"
                                            searchPlaceholder="Search HRQ ID..."
                                            className="flex-1"
                                            disabled
                                        />
                                       
                                    </div>
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">

                    <SelectField
                        control={form.control}
                        name="partnerId"
                        label="Partner"
                        placeholder="Select intake status"
                        options={hrqPartnersList}
                        required
                    />

                    <FormField
                        control={form.control}
                        name="jobTitle"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Role Hired For*</FormLabel>
                                <FormControl>
                                    <Input {...field} readOnly />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="hrqStatusName"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>HRQ Status*</FormLabel>
                                <FormControl>
                                    <Input {...field} readOnly />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <SelectField
                        control={form.control}
                        name="intakeStatusId"
                        label="Intake Status"
                        placeholder="Select intake status"
                        options={IntakeStatus}
                        required
                        disabled
                    />

                    <SelectField
                        control={form.control}
                        name="resourceTypeId"
                        label="Resource type"
                        placeholder="Select resource type"
                        options={ResourceType}
                        required
                    />
                </div>
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
                        placeholder="Phone Number"
                        required
                    />
                    <InputField
                        control={form.control}
                        name="email"
                        label="Email"
                        placeholder="Email"
                        required
                    />
                    {/* Primary Skills */}
                    <MultiSelectField
                        control={form.control}
                        name="primarySkills"
                        label="Primary Skills"
                        placeholder="Select primary skills"
                        options={PRIMARY_SKILLS}
                        required
                    />
                    {/* Secondary Skills */}
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
                        label="Notice Period"
                        placeholder="Notice Period"
                        required
                        type="number"
                    />
                    <InputField
                        control={form.control}
                        name="relevantExperience"
                        label="Relevant Experience"
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
                        label="Current Organisation"
                        placeholder="Current Organisation"
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
                        label="Referred By"
                        placeholder="Referred By"
                    />
                </div>
                {/* PreferredWorkLocationId MultiSelect */}
                <div className="grid grid-cols-2 gap-4">
                    <MultiSelectField
                        control={form.control}
                        name="PreferredWorkLocationId"
                        label="Preferred Work Location"
                        placeholder="Select preferred work locations"
                        options={jobLocations}
                        
                        disabled={jobLocations.length === 0}
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
                        <Button type="submit" className="px-8">
                            Submit
                        </Button>
                    </div>
                </div>
                <Dialog open={showTermsDialog} onOpenChange={setShowTermsDialog}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Terms and Conditions</DialogTitle>
                            <DialogDescription className="max-h-[60vh] overflow-y-auto mt-4">
                                <div className="space-y-4">
                                    <h3 className="font-semibold">1. Introduction</h3>
                                    <p>
                                        These Terms and Conditions govern your use of our candidate intake system. By using this system, you agree to these terms in full.
                                    </p>

                                    <h3 className="font-semibold">2. Data Privacy</h3>
                                    <p>
                                        We are committed to protecting candidate data and comply with all relevant data protection laws. All information submitted will be handled confidentially.
                                    </p>

                                    <h3 className="font-semibold">3. Responsibilities</h3>
                                    <p>
                                        You agree to:
                                    </p>
                                    <ul className="list-disc pl-6">
                                        <li>Provide accurate and complete information</li>
                                        <li>Maintain the confidentiality of candidate data</li>
                                        <li>Use the system only for its intended purpose</li>
                                        <li>Comply with all applicable laws and regulations</li>
                                    </ul>

                                    <h3 className="font-semibold">4. Usage Guidelines</h3>
                                    <p>
                                        The system must be used in accordance with our usage guidelines, which prohibit any unauthorized or malicious activities.
                                    </p>
                                </div>
                            </DialogDescription>
                        </DialogHeader>
                        <DialogFooter className="mt-6">
                            <Button variant="outline" onClick={() => setShowTermsDialog(false)}>
                                Cancel
                            </Button>
                            <Button onClick={handleTermsAccept} className="bg-[#4096ff] hover:bg-[#009e79]">
                                Accept
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </form>
        </Form>
    </>)
}

export default EditReviewCandidate