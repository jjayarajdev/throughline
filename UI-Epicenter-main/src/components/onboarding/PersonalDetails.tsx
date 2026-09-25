"use client";

import { useEffect, useState} from "react";
import * as z from "zod";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { InputField } from "../form-fields/InputField";
import { Button } from "@/components/ui/button";
import { DatePickerField } from "../form-fields/DatePickerField";
import { onboarding } from "@/services/api/onboarding.api";
import { MasterTypes } from "@/constants/masterTypes";
import { useQuery } from "@tanstack/react-query";
import { SelectField } from "../form-fields/SelectField";
import { dropdownApi } from "@/services/api/master";
import { DayMonthPickerField } from "../form-fields/DayMonthPickerField";
import { isPartner, useUserStore } from "@/store/userStore";
import SubmitFormLoader from "../common/SubmitFormLoader";

const personalDetailsSchema = z.object({
  candidateCode: z.string().optional(),

  hrqId: z.string(),
  hiringManagerName: z.string(),
  hiringManagerId: z.string().optional(),
  sourceId: z.string().optional(),
  sourceName: z.string().optional(),
  roleHiredFor: z.string(),

  dateOfJoining: z.string().optional(),
  finalOnboaridngDate: z.string().min(1, "Date of Onboarding is required"),
  dob: z.string().min(1, "DOB is required"),

  countryId: z.string(),
  stateId: z.string(),
  cityId: z.string(),
  categoryId: z.string().optional(),

  currentAddress: z.string().min(1, "Current Address is required"),
  personalMailId: z
    .string(),

  onboardingManagerId: z.string(),


  jobLocation: z.string().min(1, "Job Location is required"),
  phone: z
    .string(),

 aadharLast4Digits: z
  .string()
  .min(4, "Aadhar must be exactly 4 digits")
  .max(4, "Aadhar must be exactly 4 digits")
  .refine((val) => /^\d{4}$/.test(val), {
    message: "Only numeric digits are allowed. No letters or special characters.",
  }),

  genderId: z.string().min(1, "Gender is required"),
  transportRequirementId: z.string().min(1, "Transport Requirement is required"),

  domainId: z.string(),
  subDomainId: z.string(),
  candidateName: z.string(),
  nameAsPerAadhar: z.string().min(1, "Name as per Aadhar is required"),
pincode: z
  .string()
  .regex(/^\d{6}$/, {
    message: "Pincode must be exactly 6 digits and numeric only",
  }),

});


type PersonalDetailsFormValues = z.infer<typeof personalDetailsSchema>;
type ITPCSetupFormValuesWithId = PersonalDetailsFormValues & { id?: string; candidateId:number;hiringRequestId:number };
interface IProps {
  onSave: (data: ITPCSetupFormValuesWithId) => void;
  onboardingTimeline: ITPCSetupFormValuesWithId;
  
}

function PersonalDetails({ onSave, onboardingTimeline, }: IProps) {
  const { userId,userName} = useUserStore();
  const [isLoadingFormData, setIsLoadingFormData] = useState(false);

  const form = useForm<PersonalDetailsFormValues>({
    resolver: zodResolver(personalDetailsSchema),
    defaultValues: {
      candidateCode: onboardingTimeline?.candidateCode || "",
      hrqId: onboardingTimeline?.hrqId || "",
      hiringManagerName: onboardingTimeline?.hiringManagerName || "",
      categoryId:onboardingTimeline?.resourceTypeName || "",
      sourceName: onboardingTimeline?.sourceName || "",
      roleHiredFor: onboardingTimeline?.roleHiredFor || "",
      dateOfJoining: onboardingTimeline?.dateOfJoining || "",
      countryId: onboardingTimeline?.countryId || "",
      stateId: onboardingTimeline?.stateId || "",
      cityId: onboardingTimeline?.cityId || "",
      personalMailId:onboardingTimeline?.personalMailId || "",
      pincode:onboardingTimeline?.pincode|| "",
      finalOnboaridngDate: onboardingTimeline?.finalOnboaridngDate || "",
       onboardingManagerId:onboardingTimeline?.onboardingManagerName?onboardingTimeline?.onboardingManagerName:userName,
      
      genderId: onboardingTimeline?.genderId?.toString() || "",
      transportRequirementId:
        onboardingTimeline?.transportRequirementId?.toString() || "",
      jobLocation: onboardingTimeline?.jobLocation || "",
      dob: onboardingTimeline?.dob ||"",
      phone: onboardingTimeline?.phone|| "",
      aadharLast4Digits:
        onboardingTimeline?.aadharLast4Digits || "",
          domainId: onboardingTimeline?.domainId?.toString() || "",
       candidateName:onboardingTimeline?.candidateName,
       nameAsPerAadhar:onboardingTimeline?.nameAsPerAadhar,
    },
  });
  useEffect(() => {
     onboardingTimeline;

    if (onboardingTimeline) {
      setIsLoadingFormData(true)
      form.reset({
        candidateCode: onboardingTimeline?.candidateCode || "",
        hrqId: onboardingTimeline?.hrqId || "",
        hiringManagerName: onboardingTimeline?.hiringManagerName || "",
        categoryId:onboardingTimeline?.resourceTypeName || "",
        sourceName: onboardingTimeline?.sourceName || "",
        roleHiredFor: onboardingTimeline?.roleHiredFor || "",
        dateOfJoining: onboardingTimeline?.dateOfJoining || "",
        countryId: onboardingTimeline?.countryId?.toString() || "",
        personalMailId:onboardingTimeline?.personalMailId || "",
        currentAddress:onboardingTimeline?.currentAddress || "",
        finalOnboaridngDate: onboardingTimeline?.finalOnboaridngDate || "",
        onboardingManagerId:onboardingTimeline?.onboardingManagerName?onboardingTimeline?.onboardingManagerName:userName,
        // onboardingManagerId:onboardingTimeline?.onboardingManagerId || "",
        genderId: onboardingTimeline?.genderId?.toString() || "",
        transportRequirementId:
          onboardingTimeline?.transportRequirementId?.toString() || "",
        jobLocation: onboardingTimeline?.jobLocation ||"",
        dob: onboardingTimeline?.dob || "",
        phone: onboardingTimeline?.phone || "",
        aadharLast4Digits:
          onboardingTimeline?.aadharLast4Digits ||"",
            domainId: onboardingTimeline?.domainId?.toString() || "",
         candidateName:onboardingTimeline?.candidateName,
         nameAsPerAadhar:onboardingTimeline?.nameAsPerAadhar,
         pincode:onboardingTimeline?.pincode || "",
      });

      const stateTimer = setTimeout(() => {
        form.setValue("stateId", onboardingTimeline?.stateId?.toString() || "");
      }, 1000);
     const subDomainTimer = setTimeout(() => {
        form.setValue("subDomainId", onboardingTimeline?.subDomainId?.toString() || "");
      }, 1000);
      const cityTimer = setTimeout(() => {
        form.setValue("cityId", onboardingTimeline?.cityId?.toString() || "");
        setIsLoadingFormData(false)
      }, 2000);

      return () => {
        clearTimeout(stateTimer);
        clearTimeout(subDomainTimer)
        clearTimeout(cityTimer);
      };
    }
  }, [onboardingTimeline]);

  

  const { data: country = [] } = useQuery({
    queryKey: ["getEmployeeCategoryData", MasterTypes.COUNTRY],
    queryFn: async () => {
      const res = await onboarding.getEmployeeCategory(MasterTypes.COUNTRY);
      return res.data;
    },
    retry: 1,
  });

  const selectedCountry = form.watch("countryId");

  const { data: states = [] } = useQuery({
    queryKey: ["getStates", selectedCountry],
    queryFn: async () => {
      const res = await onboarding.getEmployeeCategory(MasterTypes.STATE, {
        countryId: parseInt(selectedCountry),
      });
      return res.data;
    },
    enabled: !!selectedCountry,
    retry: 1,
  });

  const selectedState = form.watch("stateId");

  const { data: cities = [] } = useQuery({
    queryKey: ["getCities", selectedState],
    queryFn: async () => {
      const res = await onboarding.getEmployeeCategory(MasterTypes.CITY, {
        stateId: parseInt(selectedState),
      });
      return res.data;
    },
    enabled: !!selectedState,
    retry: 1,
  });

  

  const { data: categoryOptions = [] } = useQuery({
      queryKey: ["getEmployeeCategoryData", MasterTypes.EMPLOYEE_CATEGORY_TYPE],
      queryFn: async () => {
        const res = await onboarding.getEmployeeCategory(
          MasterTypes.EMPLOYEE_CATEGORY_TYPE
        );
        return res.data;
      },
      retry: 1,
    });
 

     const { data: categoryyesornodata = [] } = useQuery({
        queryKey: ["getEmployeeCategoryData", MasterTypes.YES_OR_NO],
        queryFn: async () => {
          const res = await onboarding.getEmployeeCategory(MasterTypes.YES_OR_NO);
          return res.data;
        },
        retry: 1,
      });
    
      const { data: gender = [] } = useQuery({
        queryKey: ["getEmployeeCategoryData", MasterTypes.GENDER],
        queryFn: async () => {
          const res = await onboarding.getEmployeeCategory(MasterTypes.GENDER);
          return res.data;
        },
        retry: 1,
      });
    
      
    
    

      const { data: domain = [] } = useQuery({
          queryKey: ["getonboardingKit", MasterTypes.DOMAIN],
          queryFn: async () => {
            const res = await onboarding.getEmployeeCategory(MasterTypes.DOMAIN);
            return res.data;
          },
          retry: 1,
        });
      
        const selectedDomainId = form.watch("domainId");
        const { data: subdomain = [], refetch: refetchSubdomain,isFetched } = useQuery({
          queryKey: ["subDomain", selectedDomainId],
          queryFn: () =>
            dropdownApi.fetchSubDropDown(MasterTypes.SUBDOMAIN, selectedDomainId),
          enabled: !!selectedDomainId,
        });


   useEffect(() => {
      if (selectedDomainId) {
           refetchSubdomain();
          }
    }, [selectedDomainId]);

  const onSubmit = (data: PersonalDetailsFormValues) => {
    let uploadData = {
     
      id: onboardingTimeline?.id,
      candidateId:onboardingTimeline?.candidateId,
      hiringRequestId:onboardingTimeline?.hiringRequestId,
      sourceId:onboardingTimeline?.sourceId,
      roleHiredFor:data.roleHiredFor,
      categoryId:onboardingTimeline?.resourceTypeId,
      dateOfJoining:data.dateOfJoining,
      onboardingManagerId:onboardingTimeline?.onboardingManagerId?onboardingTimeline?.onboardingManagerId:userId,
      personalMailId:data.personalMailId,
      currentAddress:data.currentAddress,
      finalOnboaridngDate:data.finalOnboaridngDate,
      aadharLast4Digits:data.aadharLast4Digits,
      jobLocation:data.jobLocation,
      dob:data.dob,
      genderId:data.genderId,
      transportRequirementId:data.transportRequirementId,
      candidateCode: data.candidateCode,
      hrqId: data.hrqId,
      hiringManagerName: data.hiringManagerName,
      countryId: data.countryId?data.countryId:null,
      phone: data.phone,
      domainId: data.domainId?data.domainId:null,
      subDomainId:data.subDomainId?data.subDomainId:null,
      stateId:data.stateId?data.stateId:null,
      cityId:data.cityId?data.cityId:null,
      candidateName:data.candidateName,
      nameAsPerAadhar:data.nameAsPerAadhar,
      pincode:data?.pincode?data?.pincode:null,
    };
   
    

    onSave(uploadData);
  };
  if (isLoadingFormData) return <SubmitFormLoader />;
  return (
    <div>
      <FormProvider {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="flex items-center justify-between w-full mt-5 mb-4">
            <h2 className="text-xl font-semibold text-gray-800 dark:text-white">
              Personal Details
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 mt-8 w-full">
            <div className="flex items-end gap-2 w-full">
              <div className="flex-1">
                <InputField
                  control={form.control}
                  name="candidateCode"
                  label="Candidate Code"
                  placeholder="Enter Candidate ID"
                  disabled
                />
              </div>
              </div>

            <InputField
              control={form.control}
              name="hrqId"
              label="HRQID"
              placeholder="e.g., HRQ1101"
           
              disabled
            />

            <InputField
              control={form.control}
              name="hiringManagerName"
              label="Hiring Manager"
              placeholder="Hiring Manager Name"
              disabled
            />

            <InputField
              control={form.control}
              name="sourceName"
              label="Source Name"
              placeholder="Source Name"
              disabled
            />
            <InputField
              control={form.control}
              name="candidateName"
              label="Candidate Name"
              placeholder="Candidate Name"
              disabled
            />

            <InputField
              control={form.control}
              name="roleHiredFor"
              label="Role Hired For"
              placeholder="Enter designation"
              disabled
            />
             
            <SelectField
              control={form.control}
              placeholder="Select Country"
              options={country}
              name="countryId"
              label="Country"
              disabled
            />
            <SelectField
              control={form.control}
              placeholder="Select State"
              options={states}
              name="stateId"
              label="State"
              disabled
            />
            <SelectField
              control={form.control}
              placeholder="Select City"
              options={cities}
              name="cityId"
              label="City"
              disabled
            />
            
            <SelectField
              control={form.control}
              name="domainId"
              label="Domain"
              placeholder="Select domain"
              options={domain}
              disabled
            />

            <SelectField
              control={form.control}
              name="subDomainId"
              label="Sub Domain"
              placeholder="Select sub domain"
              options={subdomain}
              disabled
            />
            <InputField
              control={form.control}
              name="phone"
              label="Contact Number"
              placeholder="Enter Phone No"
              disabled
            />
            <InputField
              control={form.control}
              name="personalMailId"
              label="Personal Mail ID"
              placeholder="Enter Personal Mail ID"
             disabled
            />
            <DatePickerField
              control={form.control}
              name="dateOfJoining"
              label="Date of Joining (initial onboarding date)"
              disabled
            />
             <InputField
              control={form.control}
              name="onboardingManagerId"
              label="Onboarding Manager"
              placeholder="Enter manager name"
              disabled
            />
            <InputField
              control={form.control}
              name="categoryId"
              label="Resource Category"
              placeholder="Select Resource Category"
              
            
              disabled
            />
            <InputField
              control={form.control}
              name="jobLocation"
              label="Job Location"
              placeholder="Enter Job Location"
              required
              disabled={!!onboardingTimeline?.id}
            />
           

             
            <InputField
              control={form.control}
              name="currentAddress"
              label="Current Local Address"
              placeholder="Enter Current Local Address"
              required
              disabled={!!onboardingTimeline?.id}
            />
          
          
           
            <DatePickerField
              control={form.control}
              name="finalOnboaridngDate"
              label="Final Onboarding Date"
              required
            />

           
            <InputField
              control={form.control}
              name="aadharLast4Digits"
              label="Aadhar number (Only last 4 digits)"
              placeholder="Enter Aadhar number"
              required
              maxLength={4}
              disabled={!!onboardingTimeline?.id}
            />
            <InputField
              control={form.control}
              name="nameAsPerAadhar"
              label="Name As Per Aadhar"
              placeholder="Name As Per Aadhar"
              required
            disabled={!!onboardingTimeline?.id}
            />
            <InputField
              control={form.control}
              name="pincode"
              label="Pincode"
              placeholder="Enter Pincode"
              maxLength={6}
             disabled={!!onboardingTimeline?.id}
             required
            />

            
            <DayMonthPickerField
            control={form.control}
            name="dob"
            label="Date of Birth (Date/Month)"
            required
            placeholder="DD/MM"
            disabled={!!onboardingTimeline?.id}
           />
            <SelectField
              control={form.control}
              name="genderId"
              label="Gender"
              placeholder="Select gender"
              options={gender}
              required
              disabled={!!onboardingTimeline?.id}
            />

            <SelectField
              control={form.control}
              name="transportRequirementId"
              label="Transport Requirement"
              placeholder="Select Transport Requirement"
              options={categoryyesornodata}
              required
              disabled={!!onboardingTimeline?.id}
            />
        </div>

          <div className="flex justify-end">
            <Button
              type="submit"
              size="sm"
              className="bg-[#00b388] hover:bg-[#009e79] h-9"
            >
              {onboardingTimeline?.id ? "Update" : "Submit"}
            </Button>
          </div>
        </form>
      </FormProvider>
    </div>
  );
}

export default PersonalDetails;
