'use client';

import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

import { Button } from '@/components/ui/button';
import { Form } from '@/components/ui/form';
import { InputField } from '../form-fields/InputField';
import { DatePickerField } from '../form-fields/DatePickerField';
import { toast } from "sonner";
import { Loader2 } from 'lucide-react';
import api from '@/lib/axiosInstance';
export const employmentFormSchema = z.object({
  profileCreatedOn: z.string().min(1, { message: 'Profile Created On is required' }),
  smartProfileId: z.string().min(1,"Smart Profile ID must be required"),
  profileApprovalDate: z.string().min(1, { message: 'Profile Approval Date is required' }),
  lhccCode: z.string().min(1, { message: 'LHCC is required' }),
  costCenterName: z.string().min(1, { message: 'Cost Center is required' }),

  employeeNameAsPerId: z.string(),
  employeeId: z.string(),

  hpeEmailId: z.string(),
  isEmployeeIdGenerated: z.boolean(),
}).superRefine((data, ctx) => {
  if (data.isEmployeeIdGenerated) {
    if (!data.employeeNameAsPerId || data.employeeNameAsPerId.trim() === "") {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Employee Name is required",
        path: ["employeeNameAsPerId"],
      });
    }

    if (!data.employeeId || !/^\d{8}$/.test(data.employeeId)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Employee ID must be exactly 8 digits",
        path: ["employeeId"],
      });
    }

    if (!data.hpeEmailId || !/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(data.hpeEmailId)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Enter a valid company email address",
        path: ["hpeEmailId"],
      });
    }
  }
});


type EmploymentFormValues = z.infer<typeof employmentFormSchema>;
type ITPCSetupFormValuesWithId = EmploymentFormValues & { id?: string };

interface IProps {
  onSave: (data: ITPCSetupFormValuesWithId) => void;
  onboardingTimeline: Partial<ITPCSetupFormValuesWithId>;
}

function ProfileTracker({ onSave, onboardingTimeline }: IProps) {
  const form = useForm<EmploymentFormValues>({
    resolver: zodResolver(employmentFormSchema),
    defaultValues: {
      profileCreatedOn: onboardingTimeline?.profileCreatedOn || '',
      smartProfileId: onboardingTimeline?.smartProfileId || '',
      profileApprovalDate: onboardingTimeline?.profileApprovalDate || '',
      lhccCode: onboardingTimeline?.lhccCode || '',
      costCenterName: onboardingTimeline?.costCenterName || '',
      employeeNameAsPerId: onboardingTimeline?.employeeNameAsPerId || '',
      employeeId: onboardingTimeline?.employeeId?.toString() || "",
      hpeEmailId: onboardingTimeline?.hpeEmailId || '',
      isEmployeeIdGenerated: onboardingTimeline?.isEmployeeIdGenerated || false,
    },
  });

  const watchIsGenerated = form.watch('isEmployeeIdGenerated');

  useEffect(() => {
    if (onboardingTimeline) {
      form.reset({
        profileCreatedOn: onboardingTimeline.profileCreatedOn || '',
        smartProfileId: onboardingTimeline.smartProfileId || '',
        profileApprovalDate: onboardingTimeline.profileApprovalDate || '',
        lhccCode: onboardingTimeline.lhccCode || '',
        costCenterName: onboardingTimeline.costCenterName || '',
        employeeNameAsPerId: onboardingTimeline.employeeNameAsPerId || '',
        employeeId: onboardingTimeline?.employeeId?.toString() || "",
        hpeEmailId: onboardingTimeline.hpeEmailId || '',
        isEmployeeIdGenerated: onboardingTimeline.isEmployeeIdGenerated || false,
      });
    }
  }, [onboardingTimeline, form]);

  const onSubmit = (data: EmploymentFormValues) => {
    const uploadData = {
  id: onboardingTimeline?.id,
  profileCreatedOn: data.profileCreatedOn?data.profileCreatedOn: null,
  smartProfileId: data.smartProfileId?data.smartProfileId : null,
  profileApprovalDate: data.profileApprovalDate?data.profileApprovalDate:null,
  lhccCode: data.lhccCode?data.lhccCode: null,
  costCenterName: data.costCenterName?data.costCenterName:null,
  employeeNameAsPerId: data.employeeNameAsPerId?data.employeeNameAsPerId: null,
  employeeId: data.employeeId?.toString().trim() ? Number(data.employeeId) : null,
  hpeEmailId: data.hpeEmailId?data.hpeEmailId: null,
  isEmployeeIdGenerated: data.isEmployeeIdGenerated?data.isEmployeeIdGenerated:null,
};

    onSave(uploadData);
  };

const [loadingEmpValidation, setLoadingEmpValidation] = React.useState(false);

 const getEmployeeDetailsById = async (employeeId: string) => {
  const response = await api.get(`/User/emp-details-by-emp-code?empCode=${employeeId}`);
  return response.data;
 
};



const validateEmployeeId = async () => {
  const empId = form.getValues("employeeId")?.trim();

  if (!/^\d{8}$/.test(empId)) {
    toast.error("Employee ID must be exactly 8 digits");
    return;
  }

  try {
    setLoadingEmpValidation(true);
    const data = await getEmployeeDetailsById(empId);

    if (!data?.status) {
      toast.error(data?.message || "No employee details found. You can enter them manually.");
      
      form.setValue("employeeNameAsPerId", "");
      form.setValue("hpeEmailId", "");
      return;
    }

    form.setValue("employeeNameAsPerId", data.employeeNameAsPerId || "");
    form.setValue("hpeEmailId", data.hpeEmailId || "");

    toast.success("Employee details fetched successfully");
  } catch (error) {
    const message = error?.response?.data?.message || "Failed to validate Employee ID";
   toast.error(message);
  } finally {
    setLoadingEmpValidation(false);
  }
};





  return (
    <div>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          

          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 mt-4 w-full">
            <DatePickerField
              control={form.control}
              name="profileCreatedOn"
              label="Profile Created On"
              required
            
            />
             <InputField
              control={form.control}
              name="smartProfileId"
              label="Smart Profile ID"
              placeholder="Enter Smart Profile ID"
              required
              maxLength={8}
            />
            <InputField
              control={form.control}
              name="lhccCode"
              label="LHCC (IN97/IN99)"
              placeholder="Enter LHCC code"
              required
            
            />
            <InputField
              control={form.control}
              name="costCenterName"
              label="Cost Center"
              placeholder="Enter cost center"
              required
            
            />
            <DatePickerField
              control={form.control}
              name="profileApprovalDate"
              label="Profile Approval Date"
              required
            
            />
            
           
            
            
            <div className="flex items-center space-x-2 mt-4">
            <div className="md:col-span-2">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  {...form.register("isEmployeeIdGenerated")}
                  id="isEmployeeIdGenerated"
                  className="h-4 w-4 accent-blue-600"
                />
                <label
                  htmlFor="isEmployeeIdGenerated"
                  className="text-sm font-medium"
                >
                  Is Employee ID Generated?
                </label>
              </div>
            </div>
          </div>
          <div className="flex items-end gap-2">
  <div className="flex-1">
    <InputField
      control={form.control}
      name="employeeId"
      label="EMP ID"
      placeholder="Enter Employee ID"
      required={watchIsGenerated}
      disabled={!watchIsGenerated}
      maxLength={8}
    />
  </div>
  <Button
    type="button"
    onClick={validateEmployeeId}
    disabled={!watchIsGenerated || loadingEmpValidation}
   className="bg-[#4096ff] hover:bg-[#009e79] h-9"
   size="sm"
    
  >
    {loadingEmpValidation ? <Loader2 className="animate-spin w-4 h-4" /> : "Validate"}
  </Button>
</div>

            <InputField
              control={form.control}
              name="employeeNameAsPerId"
              label="Employee Name As per Directory"
              placeholder="Enter name"
              required={watchIsGenerated}
              disabled={!watchIsGenerated}
            />
            
            <InputField
              control={form.control}
              name="hpeEmailId"
              label="Company Email ID"
              placeholder="Enter company email address"
              required={watchIsGenerated}
              disabled={!watchIsGenerated}
            />
            
            
            
            
          </div>

          <div className="flex justify-end">
            <Button
              type="submit"
              size="sm"
              className="bg-[#4096ff] hover:bg-[#009e79] h-9"
            
            >
              {onboardingTimeline?.id ? "Update" : "Submit"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}

export default ProfileTracker;
