"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { InputField } from "../form-fields/InputField";
import { SelectField } from "../form-fields/SelectField";
import { Switch } from "@/components/ui/switch";
import { useHiringDropdownData } from "./hooks/useHiringFormData";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Hiring, hiringApi } from "../../services/api/hiring.api";
import { useEffect, useState } from "react";
import { toast } from "@/lib/toast";
import { useHiringStore } from "@/store/useHiringStore";
import { usePathname, useRouter } from "next/navigation";
import { RCMSValidationForm } from "./RCMSValidationForm";
import { getHiringType } from "./types";
import SubmitFormLoader from "../common/SubmitFormLoader";
import { DatePickerField } from "../form-fields/DatePickerField";
import { useUserStore } from "@/store/userStore";


const formSchema = z.object({
  jobTitle: z.string().min(1, "Role Hired For is required"),
  rmOwnerName: z.string().optional(),
  hiringManagerName: z.string().min(1, "Hiring Manager is required"),
  hrqId: z.string(),
  rcmsProjectId: z.string().min(1, "RCMS Project ID is required"),
  rcMsResourceRequestId: z
    .string()
    .min(1, "RCMS Resource Request ID is required"),
  projectName: z.string().min(1, "Project Name is required"),
  businessId: z.string().min(1, "businessId is required"),
  requestStartDate: z.string().min(1, "Request Start Date is required"),
  requestCreationDate: z.string().min(1, "Req Creation Date is required"),
  hiringTypeId: z.string().min(1, "Hiring Type is required"),
  projectDurationMonths: z.string().min(1, "Hiring Type is required"),
  hiringStatusName: z.string().optional(),
  isMultiplePositions: z.boolean(),
  numberOfPositions: z.coerce.number().min(1, "At least one position required"),
  approverEmail: z.string().optional(),
  employeeId: z.string().optional(),
  referredHrqId: z.string().optional(),
  domainId: z.string().min(1, "domain  is required"),
  domainManager: z.string().optional(),
  recordTypeId: z.number().optional(),
  hiringMangerId: z.number().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface RCMSFormProps {
  onNext?: () => void;
  onPrevious?: () => void;
  HiringDatabyid: getHiringType;
  isLoading: boolean;
}

export default function HiringForm({
  onNext,
  onPrevious,
  HiringDatabyid,
  isLoading,
}: RCMSFormProps) {
  const { business, hiringType, domain } = useHiringDropdownData();
  const { userId } = useUserStore();
  const pathname = usePathname();
  const isAddMode = pathname.includes("create-hiring");

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      jobTitle:  "",
      rmOwnerName: "",
      hiringManagerName: "",
      hrqId: "",
      rcmsProjectId: "",
      rcMsResourceRequestId: "",
      projectName: "",
      businessId: "",
      requestStartDate: "",
      requestCreationDate: new Date().toISOString().split("T")[0],
      projectDurationMonths: "",
      hiringTypeId: "",
      hiringStatusName: "New",
      isMultiplePositions: false,
      numberOfPositions: 1,
      approverEmail: "",
      employeeId: "",
      referredHrqId: "",
      domainManager: "",
      domainId: "",
      recordTypeId: 23001,
      hiringMangerId: NaN,
    },
  });

  const { getValues,formState } = form;
 
  const { data: BeteamApprover } = useQuery({
    queryKey: ["BeTeamApprover"],
    queryFn: () => hiringApi.getBETeamApprover(),
    enabled: isAddMode,
  });

  useEffect(() => {
    if (BeteamApprover) {
      form.setValue("approverEmail", BeteamApprover?.email);
    }
  }, [BeteamApprover, form]);

  const [valdate, setValidate] = useState(false);

  useEffect(() => {
    if (!isAddMode && HiringDatabyid) {
      setValidate(true);
      setJobTitle(HiringDatabyid.jobTitle);
      const data = HiringDatabyid;
      form.reset({
        jobTitle: data?.jobTitle,
        rmOwnerName: data?.rmOwnerName || "--", // optional field
        hiringManagerName: data?.hiringManagerName || "--",
        hrqId: data?.hrqId,
        rcmsProjectId: data?.rcMsProjectId,
        rcMsResourceRequestId: data?.rcMsResourceRequestId,
        projectName: data?.projectName,
        businessId: String(data?.businessId),
        requestStartDate: data?.requestStartDate,
        requestCreationDate: data?.requestCreationDate, // format date if needed
        hiringTypeId: String(data?.hiringTypeId) || "",
        projectDurationMonths: String(data?.projectDurationMonths) || "",
        hiringStatusName: String(data?.hiringStatusName) || "",
        isMultiplePositions: data?.isMultiplePositions || false,
        numberOfPositions: Number(data?.numberOfPositions) || 1,
        approverEmail: data?.approverEmail || "",
        employeeId: data?.employeeId || "",
        referredHrqId: data?.referredHrqId || "",
        domainId: String(data?.domainId) || "",
        domainManager: String(data?.domainManager) || "",
        hiringMangerId: (data?.hiringMangerId) || "",
      });
    }
  }, [form, HiringDatabyid, isAddMode]);

  const isMultiplePositions = form.watch("isMultiplePositions");
  const isemployeeId = form.watch("hiringTypeId");

  const handleValidate = async (data: Hiring, mode: string) => {
    const recordTypeId = mode === "replica" ? 23002 : 23001;
    if (data) {
      setValidate(true);
      form.reset({
        jobTitle: data?.jobTitle || "NA",
        rmOwnerName: data?.rmOwnerName || "Na", // optional field
        hiringManagerName:
          data.hiringManagerName != undefined
            ? String(data.hiringManagerName)
            : "",
        hrqId: mode === "replica" ? "NA" : data?.hrqId || "NA",
        businessId: data.businessId != undefined ? String(data.businessId) : "",
        rcmsProjectId: data?.rcMsProjectId || "",
        rcMsResourceRequestId: data?.rcMsResourceRequestId || "NA",
        projectName: data?.projectName,
        requestStartDate: new Date().toISOString().split("T")[0],
        requestCreationDate: new Date().toISOString().split("T")[0],
        isMultiplePositions: data?.isMultiplePositions,
        numberOfPositions: Number(data?.numberOfPositions) || 1,
        approverEmail: data?.approverEmail || "",
        hiringTypeId:
          data.hiringTypeId != undefined ? String(data.hiringTypeId) : "",
        projectDurationMonths:
          data.projectDurationMonths != undefined
            ? String(data.projectDurationMonths)
            : "",
        hiringStatusName: "New",
        employeeId: data?.employeeId || "",
        referredHrqId: data?.hrqId || "",
        domainId: data.domainId != undefined ? String(data.domainId) : "",
        recordTypeId: recordTypeId,
        hiringMangerId: data?.hiringMangerId,
      });
    }
  };

  const { setJobTitle } = useHiringStore();

  const { mutate: createHiringRequest, isPending } = useMutation({
    mutationKey: ["createHiringRequest"],
    mutationFn: hiringApi.createHiring,
    onSuccess: (data) => {
      setJobTitle(data.data.jobTitle);
      setValidate(false);
      form.reset();
      toast.success(
        data?.message || "REC Created successfully || moved to Hiring Bin"
      );
      router.back();
    },
    onError: (error) => {
      toast.error("Failed to create hiring");
      console.error("Error creating hiring:", error);
    },
  });

  const router = useRouter();

  const handleSave = async () => {
    const valid = await form.trigger();
    if (valid) {
      const payload = {
        ...getValues(),
        requestorId: userId,
        betApproverId: BeteamApprover.userId,
      };
      createHiringRequest(payload);
    } else {
      toast.error("Please fill all required fields correctly.");
    }
  };

  const onSubmit = (values: FormValues) => {};

  useEffect(() => {
    const domainManager = domain.find(
      (domain: { id: number }) => domain.id === Number(form.watch("domainId"))
    );

    if (domainManager) {
      form.setValue("domainManager", String(domainManager.domainManagerName));
    }
  }, [form.watch("domainId"), domain]);

  return (
    <>
      <div className="flex items-center mb-6"></div>
      <Form {...form}>
        {isAddMode && (
          <RCMSValidationForm
            setValidate={setValidate}
            onValidationSuccess={handleValidate}
          />
        )}
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="relative space-y-6"
        >
          {valdate && (
            <div>
              {(isPending || isLoading) && <SubmitFormLoader />}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <InputField
                  control={form.control}
                  name="jobTitle"
                  label="Role Hired For"
                  placeholder="Title Name"
                  disabled={!isAddMode}
                  required
                />

                <InputField
                  control={form.control}
                  name="rmOwnerName"
                  label="RM Owner"
                  placeholder="Owner"
                  disabled
                  required
                />

                <InputField
                  control={form.control}
                  name="hiringManagerName"
                  label="Hiring Manager"
                  placeholder="Name"
                  disabled
                  required
                />

                <InputField
                  control={form.control}
                  name="hrqId"
                  label="HRQ ID"
                  placeholder="hrqId"
                  disabled
                  required
                />

                <InputField
                  control={form.control}
                  name="rcmsProjectId"
                  label="RCMS Project ID"
                  placeholder=""
                  disabled
                  required
                />

                <InputField
                  control={form.control}
                  name="rcMsResourceRequestId"
                  label="RCMS Resource Request ID"
                  placeholder=""
                  disabled
                  required
                />
                <InputField
                  control={form.control}
                  name="projectName"
                  label="Project Name"
                  placeholder=""
                  disabled={!isAddMode}
                  required
                />

                <SelectField
                  control={form.control}
                  name="businessId"
                  label="Business Unit"
                  placeholder="Select Business"
                  options={business}
                  disabled={!isAddMode}
                  required
                />

                <DatePickerField
                  control={form.control}
                  name="requestStartDate"
                  label="Request Start Date"
                  disabled={!isAddMode}
                  required
                />

                <DatePickerField
                  control={form.control}
                  name="requestCreationDate"
                  label="Req Creation Date"
                  disabled={true}
                  required
                />

                <SelectField
                  control={form.control}
                  name="hiringTypeId"
                  label="Hiring Type"
                  placeholder="Select Hiring Type"
                  options={hiringType}
                  disabled={!isAddMode}
                  required
                />
                {isemployeeId == "13003" && (
                  <>
                    <InputField
                      control={form.control}
                      name="employeeId"
                      label="Employee ID"
                      placeholder="Enter employee id"
                      type="text"
                      disabled={!isAddMode}
                    />
                    <InputField
                      control={form.control}
                      name="referredHrqId"
                      label="Referred HRQ id"
                      placeholder="Enter HRQ id"
                      type="text"
                      disabled={!isAddMode}
                    />
                  </>
                )}

                <InputField
                  control={form.control}
                  name="projectDurationMonths"
                  label="Project Duration (Months)"
                  placeholder="Enter Duration"
                  type="number"
                  disabled={!isAddMode}
                  required
                />
                <InputField
                  control={form.control}
                  name="hiringStatusName"
                  label="Status"
                  placeholder="New"
                  disabled
                  required
                />

                <div className="border rounded-md p-4 max-w-3xl">
                  <label className="block text-sm mb-2">
                    Position Category
                  </label>
                  <div className="flex items-center space-x-6">
                    <div className="flex items-center space-x-2">
                      <Switch
                        disabled={!isAddMode}
                        checked={!isMultiplePositions}
                        onCheckedChange={(val: boolean) =>
                          form.setValue("isMultiplePositions", !val)
                        }
                      />
                      <span className="text-sm">Single</span>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Switch
                        disabled={!isAddMode}
                        checked={isMultiplePositions}
                        onCheckedChange={(val: boolean) =>
                          form.setValue("isMultiplePositions", val)
                        }
                        className="bg-[#00A76F]"
                      />
                      <span className="text-sm">Multiple</span>
                    </div>
                  </div>
                </div>
                {isMultiplePositions && (
                  <InputField
                    control={form.control}
                    name="numberOfPositions"
                    label="No. of Positions"
                    type="number"
                    placeholder="0"
                    disabled={!isAddMode}
                  />
                )}
                <SelectField
                  control={form.control}
                  name="domainId"
                  label="Domain"
                  placeholder="Select Type"
                  options={domain}
                  disabled={!isAddMode}
                  required
                />
                <InputField
                  control={form.control}
                  name="domainManager"
                  label="Domain Manager"
                  placeholder="*****"
                  disabled
                  required
                />
                <div className="flex items-end space-x-3">
                  <div className="flex-1">
                    <div className="text-sm font-medium mb-2">
                      BE Team Approver
                    </div>
                    <div className="text-sm h-10 w-full flex items-center px-3 rounded-md border border-input bg-gray-100 dark:bg-gray-700 dark:text-white">
                      {isAddMode ? BeteamApprover?.firstName + " "+ BeteamApprover?.lastName  : HiringDatabyid.betApproverName}
                    </div>
                  </div>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex justify-end pt-6">
                <div className="flex gap-4 ">
                  {!isAddMode ? null : (
                    <Button
                      variant="hpButton"
                      type="button"
                      onClick={handleSave}
                      className="px-8"
                      disabled={isPending}
                    >
                      {isPending ? "submitting..." : "Submit"}
                    </Button>
                  )}
                </div>
              </div>
            </div>
          )}
        </form>
      </Form>
    </>
  );
}
