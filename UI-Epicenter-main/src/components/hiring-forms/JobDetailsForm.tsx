"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useWatch } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { InputField } from "../form-fields/InputField";
import { SelectField } from "../form-fields/SelectField";
import pdfToText from "react-pdftotext";
import mammoth from "mammoth";
import * as XLSX from "xlsx";
import { useMutation, useQuery } from "@tanstack/react-query";
import { dropdownApi } from "../../services/api/master";
import { MasterTypes } from "@/constants/masterTypes";
import { useEffect, useState, useRef } from "react";
import { TextareaField } from "../form-fields/TextAreaField";
import { useJobDetailsDropdown } from "./hooks/useJobDetailsDropdown";
import { Paperclip } from "lucide-react";
import { useParams } from "next/navigation";
import { MultiSelectField } from "../form-fields/MultiSelectField";
import { hiringApi, HiringReqPayload } from "@/services/api/hiring.api";
import { toast } from "@/lib/toast";
import { useHiringStore } from "@/store/useHiringStore";
import SubmitFormLoader from "../common/SubmitFormLoader";
import { DatePickerField } from "../form-fields/DatePickerField";
import { LoadingButton } from "../form-fields/LoadingButton";
import { AddSkillDialog } from "../dialog/AddSkillDialog";
import { useQueryClient } from "@tanstack/react-query";
const step3Schema = (jobLevels: any[]) =>
  z
    .object({
      jobDescription: z.string().min(1, "Job description is required"),
      hiringActivity: z.string().min(1, "Hiring Activity is required"),
      jobPriority: z.string().min(1, "Job Priority is required"),
      hiringDate: z.string().min(1, "Hiring Date is required"),
      resourceType: z.string().min(1, "Resource Type is required"),
      subDomain: z.string().min(1, "Sub-Domain is required"),
      domainManager: z.string().optional(),
      subDomainManager: z.string().optional(),
      primarySkills: z
        .array(
          z.object({
            id: z.number(),
            name: z.string(),
          })
        )
        .min(1, "At least one Primary skill is required"),
      secondarySkills: z
        .array(
          z.object({
            id: z.number(),
            name: z.string(),
          })
        )
        .min(1, "At least one Secondary skill is required"),
      mandatoryCertification: z.string().optional(),
      jobLevels: z.string().min(1, "Job Levels is required"),
      relevantExperience: z.string().min(1, "Relevant Experience is required"),
      totalExperience: z.string().min(1, "Total Experience is required"),
      country: z.string().min(1, "Country is required"),
      state:z.array(z.object({
          id: z.number(),
          name: z.string(),
        })).min(1, "At least one State is required"),
      city:z.array(z.object({
          id: z.number(),
          name: z.string(),
        })).min(1, "At least one primary city is required"),
      secondaryCity:z
            .array(
              z.object({
                id: z.number(),
                name: z.string(),
              })
            )
            .optional(),
      badgeRecId:z.string().optional()
    })
    .superRefine((data, ctx) => {
      const selected = jobLevels.find(
        (j) => j.id.toString() === data.jobLevels
      );
      const value = Number(data.relevantExperience);

      if (selected && !isNaN(value)) {
        const min = selected.defaultExperience - selected.experienceRange;
        const max = selected.defaultExperience;

        if (value < min || value > max) {
          ctx.addIssue({
            path: ["relevantExperience"],
            code: z.ZodIssueCode.custom,
            message: `Relevant experience must be between ${min} and ${max} years for the selected job level.`,
          });
        }
      }

       if (["40001", "40014"].includes(data.resourceType) && !data.badgeRecId) {
        ctx.addIssue({
          path: ["badgeRecId"],
          code: z.ZodIssueCode.custom,
          message: "Badge Rec Id is required for this resource type.",
        });
      }
    });

const emptySchema = step3Schema([]);
type Step3Values = z.infer<typeof emptySchema>;

interface RCMSStep3FormProps {
  onPrevious?: () => void;
  onNext?: () => void;
  domainId?: number;
}

export default function JobDetailsForm({
  onPrevious,
  onNext,
  domainId,
}: RCMSStep3FormProps) {
  const { hiring } = useParams();
  const { data: jobLevel = [] } = useQuery({
    queryKey: ["jobLevel"],
    queryFn: () => dropdownApi.fetchDropdown(MasterTypes.JOB_LEVEL),
  });
  const form = useForm<Step3Values>({
    resolver: zodResolver(step3Schema(jobLevel)),
    defaultValues: {
      jobDescription: "",
      hiringActivity: "",
      jobPriority: "",
      hiringDate: "",
      resourceType: "",
      subDomain: "",
      domainManager: "",
      subDomainManager: "",
      primarySkills: [],
      secondarySkills: [],
      mandatoryCertification: "",
      jobLevels: "",
      relevantExperience: "",
      totalExperience: "",
      country: "",
      state:[],
      city:[],
      secondaryCity:[],
      badgeRecId:""
    },
  });

  const { hiringActivity, jobPriority } = useJobDetailsDropdown();
  const selectedCountry = form.watch("country");
  const selectedState = form.watch("state");
  const selectedStates = selectedState?.map((id) => Number(id.id)) || [];
  // const { data: subdomain = [] } = useQuery({
  //   queryKey: ["subDomain", domainId],
  //   queryFn: () =>
  //     dropdownApi.fetchSubDropDown(MasterTypes.SUBDOMAIN,
  //       domainId?.toString() || ""
  //     ),
  //   enabled: !!domainId,
  // });
  
  const { data: subdomain = [] } = useQuery({
    queryKey: ["subDomain", domainId],
    queryFn: () =>
      dropdownApi.fetchSubDropDowns([Number(domainId)]),
    enabled: !!domainId,
  });


  const { data: resourceType = [] } = useQuery({
    queryKey: ["resourceType"],
    queryFn: () => dropdownApi.fetchDropdown(MasterTypes.RESOURCE_TYPE),
  });
  const { data: PrimarySkills = [],isLoading:primarySkillsLoading } = useQuery({
    queryKey: ["PrimarySkills"],
    queryFn: () => dropdownApi.fetchDropdown(MasterTypes.PRIMARY_SKILLS),
  });

  const { data: SecondarySkills = [],isLoading:secondarySkillsLoading } = useQuery({
    queryKey: ["SecondarySkills"],
    queryFn: () => dropdownApi.fetchDropdown(MasterTypes.SECONDARY_SKILLS),
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
    queryKey: ["cities", selectedStates],
    queryFn: () =>
      dropdownApi.fetchSubCitys(MasterTypes.CITY,
      selectedStates,
      ),
    enabled: !!selectedStates,
  });
  const selectedLevel = form.watch("jobLevels");

  const [maxLimit, setMaxLimit] = useState(0);

  useEffect(() => {
    const level = jobLevel.find(
      (j: { id: { toString: () => string } }) =>
        j.id.toString() === selectedLevel
    );
    if (level) {
      setMaxLimit(level.experienceRange);
      form.setValue("relevantExperience", String(level.defaultExperience));
    }
  }, [selectedLevel, form, jobLevel]);

  useEffect(() => {
    const subDomainManager = subdomain.find(
      (subdomain: { id: number }) =>
        subdomain.id === Number(form.watch("subDomain"))
    );
    if (subDomainManager) {
      form.setValue("subDomainManager", subDomainManager.subDomainManagerName);
    }
  }, [form.watch("subDomain")]);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [isAddSkillOpen, setIsAddSkillOpen] = useState(false);
  const [isPrimary, setisPrimary] = useState(true);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    try {
      let text = "";
      if (file.type === "application/pdf") {
        text = await pdfToText(file);
      } else if (
        file.type ===
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
        file.name.endsWith(".docx")
      ) {
        const arrayBuffer = await file.arrayBuffer();
        const result = await mammoth.extractRawText({ arrayBuffer });
        text = result.value;
      } else if (
        file.type === "application/msword" ||
        file.name.endsWith(".doc")
      ) {
        toast.warning(
          "Old .doc files have limited support. Consider using .docx for better results."
        );
      } else if (file.type === "text/plain" || file.name.endsWith(".txt")) {
        // Text files
        text = await file.text();
      } else if (
        file.type.includes("spreadsheetml") ||
        file.name.endsWith(".xlsx") ||
        file.name.endsWith(".xls")
      ) {
        // Excel files
        const data = await file.arrayBuffer();
        const workbook = XLSX.read(data);

        // Get first sheet
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];

        // Convert to text
        text = XLSX.utils.sheet_to_txt(sheet);
      } else {
        toast.error(
          "Unsupported file format. Please use PDF, Word, Excel or text files."
        );
        return;
      }

      form.setValue("jobDescription", text);
      toast.success(`Job description extracted from ${file.name}`);
    } catch (err) {
      console.error("File parsing failed", err);
      toast.error("Failed to extract text from the file");
    } finally {
      setLoading(false);
      e.target.value = "";
    }
  };

  const { mutate: createJobDetails, isPending: createPending } = useMutation({
    mutationKey: ["createJobDetails"],
    mutationFn: hiringApi.createJobDetails,
    onSuccess: (data) => {
      toast.success(data?.message || "Job Details Created successfully");
      form.reset();
      onNext?.();
    },
    onError: (error) => {
      toast.error( error?.message || "Failed to create job details");
      console.error("Error creating partner:", error);
    },
  });

  const { data: getJobdetails } = useQuery({
    queryKey: ["getJobdetails", hiring],
    queryFn: () => hiringApi.getJobDetails(Number(hiring)),
    enabled: !!hiring,
  });

  const { mutate: updateJobdetails, isPending: UpdateLoading } = useMutation({
    mutationFn: (values: HiringReqPayload) =>
      hiringApi.updateJobDetails(Number(getJobdetails?.id), values),
    onSuccess: (data) => {
      toast.success(data?.message || "Updated Successfully");
      onNext?.();
    },
    onError: (error) => {
      toast.error("Failed to update hiring");
      console.log("Error updating hiring:", error);
    },
  });

  const handleSubmit = (values: Step3Values) => {
    const payload = {
      hiringRequestId: Number(hiring),
      isActive: true,
      jobDescription: values.jobDescription ?? "",
      hiringActivityId: Number(values.hiringActivity),
      jobPriorityId: Number(values.jobPriority),
      hiringDate: new Date(values.hiringDate).toISOString(),
      jobLevelId: Number(values.jobLevels),
      relevantExperience: Number(values.relevantExperience),
      totalExperience: Number(values.totalExperience),
      resourceTypeId: Number(values.resourceType),
      countryId: Number(values.country),
      stateIds: values.state.map((item) => item.id),
      primaryCityIds:values.city.map((item) => item.id),
      secondaryCityIds:values.secondaryCity?values.secondaryCity.map((item) => item.id):[],
      subDomainId: Number(values.subDomain),
      primarySkills: values.primarySkills.map(
        (skill: { id: number }) => skill.id
      ),
      secondarySkills: (values.secondarySkills || []).map(
        (skill: { id: number }) => skill.id
      ),
      mandatoryCertification: values.mandatoryCertification ?? "",
      id: getJobdetails?.id || 0,
      badgeRecId:values.badgeRecId ?values.badgeRecId:null
    };
    if (!!getJobdetails) {
      updateJobdetails(payload);
    } else {
      createJobDetails(payload);
    }
  };

  useEffect(() => {
    if (!getJobdetails) return;
    setLoading(true);
    const setDataTimer = setTimeout(() => {
      if (getJobdetails) {
        const { countryId } =
          getJobdetails;

        const mapIdsToObjects = (ids: number[] = []) =>
          PrimarySkills.filter((skill: { id: number }) =>
            ids.includes(skill.id)
          );

        const mapSecondary = (ids: number[] = []) =>
          SecondarySkills.filter((skill: { id: number }) =>
            ids.includes(skill.id)
          );
        form.reset({
          jobDescription: getJobdetails.jobDescription || "",
          hiringActivity: String(getJobdetails.hiringActivityId),
          jobPriority: String(getJobdetails.jobPriorityId),
          hiringDate: getJobdetails.hiringDate?.split("T")[0] || "",
          resourceType: String(getJobdetails.resourceTypeId),
          domainManager: getJobdetails.domainManagerName || "",
          subDomainManager: getJobdetails.subDomainManagerName || "",
          primarySkills: mapIdsToObjects(getJobdetails.primarySkills),
          secondarySkills: mapSecondary(getJobdetails.secondarySkills),
          mandatoryCertification: getJobdetails.mandatoryCertification || "",
          jobLevels: String(getJobdetails.jobLevelId),
          relevantExperience: String(getJobdetails.relevantExperience),
          totalExperience: String(getJobdetails.totalExperience),
          country: String(countryId),
          badgeRecId:getJobdetails.badgeRecId?.toString()|| ""
        });
      }
    }, 500);
    const subDomainTimer = setTimeout(() => {
      form.setValue("subDomain", String(getJobdetails?.subDomainId) || "");
       setLoading(false);
    }, 1500);

    

    return () => {
      clearTimeout(setDataTimer);
      clearTimeout(subDomainTimer);
    };
  }, [getJobdetails, form,primarySkillsLoading,secondarySkillsLoading]);

  useEffect(() => {
    if (selectedCountry) {
      form.setValue("state", []);
      form.setValue("city", []);
      refetchStates();
    }
  }, [selectedCountry, form, refetchStates]);

  useEffect(() => {
    if (selectedState) {
      form.setValue("city", []);
      refetchCities();
    }
  }, [selectedState, form, refetchCities]);
 
useEffect(() => {
  const existingStateIds = getJobdetails?.stateIds || [];
  if (states.length > 0 && existingStateIds.length > 0) {
    const matchedStates = states.filter((s: any) =>
      existingStateIds.includes(s.id)
    );

    if (matchedStates.length > 0) {
      const currentState = form.getValues("state") || [];
      if (currentState.length === 0) {
        form.setValue(
          "state",
          matchedStates.map((m: any) => ({ id: m.id, name: m.name }))
        );
      }
    }
  }

  const existingPrimaryCityIds = getJobdetails?.primaryCityIds || [];
  if (cities.length > 0 && existingPrimaryCityIds.length > 0) {
    const matchedCities = cities.filter((c: any) =>
      existingPrimaryCityIds.includes(c.id)
    );

    if (matchedCities.length > 0) {
      const currentCities = form.getValues("city") || [];
      if (currentCities.length === 0) {
        form.setValue(
          "city",
          matchedCities.map((m: any) => ({ id: m.id, name: m.name }))
        );
      }
    }
  }

  const existingSecondaryCityIds = getJobdetails?.secondaryCityIds || [];
  if (cities.length > 0 && existingSecondaryCityIds.length > 0) {
    const matchedSecondary = cities.filter((c: any) =>
      existingSecondaryCityIds.includes(c.id)
    );

    if (matchedSecondary.length > 0) {
      const currentSecondary = form.getValues("secondaryCity") || [];
      if (currentSecondary.length === 0) {
        form.setValue(
          "secondaryCity",
          matchedSecondary.map((m: any) => ({ id: m.id, name: m.name }))
        );
      }
    }
  }
}, [states, cities, getJobdetails, form]);

  const resourceTypeValue = useWatch({
  control: form.control,
  name: "resourceType",
});
  return (
    <>
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(handleSubmit)}
          className="space-y-8 relative"
        >
          {(createPending || UpdateLoading || loading) && <SubmitFormLoader />}
          <h2 className="text-xl font-semibold">Job Details</h2>
          <div className="relative">
            <TextareaField
              control={form.control}
              name="jobDescription"
              label="Job Description (JD)"
              placeholder="Enter Job Description"
              required
            />

            <div className="absolute inset-y-0 right-2 flex items-center mt-8">
              <input
                type="file"
                accept=".pdf,.docx,.doc,.txt,.xlsx,.xls"
                ref={fileInputRef}
                className="hidden"
                onChange={handleFileChange}
              />

              {/* Pin icon container */}
              <div className="absolute inset-y-0 right-2 flex items-center">
                {loading ? (
                  <span className="text-sm text-gray-500 animate-pulse">
                    Extracting…
                  </span>
                ) : (
                  <Paperclip
                    className="h-6 w-6 text-gray-400 cursor-pointer"
                    onClick={() => fileInputRef.current?.click()}
                  />
                )}
              </div>
            </div>
          </div>
          {loading && <h2>Loading</h2>}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <SelectField
              control={form.control}
              name="hiringActivity"
              label="Hiring Activity"
              placeholder="Select Hiring Activity"
              options={hiringActivity}
              required
            />
            <SelectField
              control={form.control}
              name="jobPriority"
              label="Job Priority"
              placeholder="Select Job Priority"
              options={jobPriority}
              required
            />

            <DatePickerField
              control={form.control}
              name="hiringDate"
              label="Target Hiring Date"
              placeholder="Select Target Date"
              required
            />
            <SelectField
              control={form.control}
              name="resourceType"
              label="Resource Type"
              placeholder="Select Resource Type"
              options={resourceType}
              required
            />
            {[40001, 40014].includes(Number(resourceTypeValue)) && (
              <InputField
                control={form.control}
                name="badgeRecId"
                label="Badge Rec"
                placeholder="Enter Badge Rec"
                required
                type="number"
                maxLength={7}
               />
             )}
            <SelectField
              control={form.control}
              name="subDomain"
              label="Sub-Domain"
              placeholder="Select Sub-Domain"
              options={subdomain}
              required
            />

            <InputField
              control={form.control}
              name="subDomainManager"
              label="Sub-Domain Manager"
              placeholder="Sub-Domain Manager Name"
              disabled
              required
            />
            <div className="col-span-1">
              <div className="flex items-end gap-4">
                <div className="flex-1">
                  <MultiSelectField
                    control={form.control}
                    name="primarySkills"
                    label="Primary Skills"
                    placeholder="Select Primary Skills"
                    options={PrimarySkills}
                    required
                  />
                </div>
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
              </div>
            </div>
            <div className="col-span-1">
              <div className="flex items-end gap-4">
                <div className="flex-1">
                  <MultiSelectField
                    control={form.control}
                    name="secondarySkills"
                    label="Secondary Skills"
                    placeholder="Select Secondary Skills"
                    options={SecondarySkills}
                    required
                  />
                </div>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => {
                    setisPrimary(false);
                    setIsAddSkillOpen(true);
                  }}
                  className="mb-1"
                >
                  Add Skill
                </Button>
              </div>
            </div>

            <InputField
              control={form.control}
              name="mandatoryCertification"
              label="Mandatory Certification"
              placeholder="Enter Mandatory Certification"
              required
            />

            <SelectField
              control={form.control}
              name="jobLevels"
              label="Job Levels"
              placeholder="Select Job Level"
              options={jobLevel}
              required
            />
            <InputField
              control={form.control}
              name="relevantExperience"
              label="Relevant Experience"
              placeholder="Enter Relevant Experience"
              max={maxLimit}
              required
            />
            <InputField
              control={form.control}
              name="totalExperience"
              label="Total Experience"
              placeholder="Enter Total Experience"
              required
            />

            <SelectField
              control={form.control}
              name="country"
              label="Country"
              placeholder="Select Country"
              options={country}
              required
            />

            <MultiSelectField
              control={form.control}
              name="state"
              label="State"
              placeholder="Select States"
              options={states}
              required
            />

            <MultiSelectField
              control={form.control}
              name="city"
              label="City"
              placeholder="Select Primary Citys"
              options={cities}
              required
            />

            <MultiSelectField
              control={form.control}
              name="secondaryCity"
              label="Secondary City"
              placeholder="Select Secondary Citys"
              options={cities}
            />
          </div>

          {/* Buttons */}
          <div className="flex justify-between pt-6">
            <Button
              variant="secondary"
              type="button"
              onClick={onPrevious}
              className="px-8"
            >
              Previous
            </Button>
            <div className="flex space-x-4">
              <LoadingButton
                loading={UpdateLoading || createPending}
                text={!!getJobdetails ? "Update" : "Save"}
                loadingText={!!getJobdetails ? "Updating..." : "Saving..."}
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
      <AddSkillDialog
        isOpen={isAddSkillOpen}
        onClose={() => setIsAddSkillOpen(false)}
        isPrimary={isPrimary}
        masterType={MasterTypes.SKILL}
      />
    </>
  );
}
