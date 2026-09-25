"use client";
import { CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { MasterTypes } from "@/constants/masterTypes";
import { hiringApi } from "@/services/api/hiring.api";
import { dropdownApi } from "@/services/api/master";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  CreditCard,
  FileText,
  Calendar,
  UserCheck,
  Mail,
  PauseCircle,
  User2,
  Notebook,
  User,
  Clock,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { TextareaField } from "../form-fields/TextAreaField";
import { SelectField } from "../form-fields/SelectField";
import { isAdmin, isDomainManager, isHiringManager, isRmowner, isVendorManager, useUserStore } from "@/store/userStore";
import { hiringStatusType } from "@/constants/enumTypes";
import { RadioGroup } from "@radix-ui/react-radio-group";
import { RadioGroupItem } from "@/components/ui/radio-group";

interface HiringDetail {
  onholdRequestedByName: string;
  onholdComments: string;
  onholdDate: any;
  onholdByUserName: any;
  onholdReasonName: any;
  hiringManagerName: any;
  jobTitle: string;
  hrqId: string;
  rcMsProjectId: string;
  rcMsResourceRequestId: string;
  requestCreationDate: string;
  approverComments: string;
  hiringStatusName: string;
  approvalStatusName: string;
  approverEmail: string;
  hiringStatusId: number;
  rmOwnerId: number;
  id: number;
  hasChildRequests:boolean
}

interface Props {
  data: HiringDetail;
}

export function HiringDetailsTable({ data }: Props) {
  const [status, setStatus] = useState(data.hiringStatusId);
  const [rmowner, setRmowner] = useState(data.rmOwnerId);

  const [isHoldDialogOpen, setIsHoldDialogOpen] = useState(false);
  const { userId } = useUserStore();
  const { data: onHoldRequestedBy } = useQuery({
    queryKey: ["onHoldRequestedBy"],
    queryFn: () => dropdownApi.fetchDropdown(MasterTypes.CAN_ONHOLD_ROLES),
  });
  const { data: rmOwner } = useQuery({
    queryKey: ["rmOwner"],
    queryFn: () => dropdownApi.fetchDropdown(MasterTypes.RM_OWNER),
  });
  const { data: holdReasons } = useQuery({
    queryKey: ["holdReasons"],
    queryFn: () => dropdownApi.fetchDropdown(MasterTypes.HRQ_ONHOLD_REASONS),
  });

  const hiringId = data?.id;
  const validation = data;

  const { mutate: changeStatus, isPending } = useMutation({
    mutationKey: ["changeStatus"],
    mutationFn: ({
      hiringRequestId,
      hiringStatusId,
    }: {
      hiringRequestId: number;
      hiringStatusId: number;
    }) => hiringApi.changeHiringStatus(hiringRequestId, hiringStatusId),
    onSuccess: (data) => {
      toast.success(data?.message || "slot assigned");
      queryClient.invalidateQueries({ queryKey: ["hiringProfile"] });
    },
  });

  const { mutate: changeRmowner, isPending: rmownerLoading } = useMutation({
    mutationKey: ["changeRmowner"],
    mutationFn: ({
      hiringRequestId,
      rmownerId,
    }: {
      hiringRequestId: number;
      rmownerId: number;
    }) => hiringApi.changeRmowner(hiringRequestId, rmownerId),
    onSuccess: (data) => {
      toast.success(data?.message || "slot assigned");
    },
  });

  const holdFormSchema = z.object({
    reason: z.string().min(1, "Please select a reason"),
    onHoldRequestedBy: z.string().min(1, "please select on hold requested by"),
    isTalentPool:z.boolean().optional(),
    isIdentifiedTalents:z.boolean().optional(),
    onholdCategoryId:z.string().optional(),
    onholdComments: z.string().optional(),
  }).refine(
    (data) => {
      if (validation?.hasChildRequests) {
        return !!data.onholdCategoryId;
      }
      return true;
    },
    {
      path: ["onholdCategoryId"],
      message: "Please select On Hold Category",
    }
  );

  // Initialize form
  const holdForm = useForm<z.infer<typeof holdFormSchema>>({
    resolver: zodResolver(holdFormSchema),
    defaultValues: {
      reason: "",
      onHoldRequestedBy:"",
      onholdComments: "",
    },
  });
  const queryClient = useQueryClient();
  const putOnHolds = useMutation({
    mutationKey: ["putOnHold"],
    mutationFn: (data: any) => hiringApi.holdHiringRequest(data),
    onSuccess: (data) => {
      toast.success(data?.message || "on hold request created");
      setIsHoldDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ["hiringProfile"] });
      holdForm.reset();
    },
    onError: (error) => {
      toast.error(error?.message || "Something went wrong, please try again later.");
      console.error("Error creating partner:", error);
    },
  });

  const onHoldSubmit = (values: z.infer<typeof holdFormSchema>) => {
     const freezeCandidateType = [
    values.isTalentPool ? 1 : null,
    values.isIdentifiedTalents ? 3 : null,
  ].filter((v): v is number => v !== null);
    const payload = {
      onholdRaisedByUserId: userId,
      hiringRequestId: hiringId,
      onholdReasonId: values.reason,
      onholdRequestedByRoleId: values.onHoldRequestedBy,
      onholdComments: values.onholdComments,
      onholdDate: new Date().toISOString(),
      freezeCandidateTypes:freezeCandidateType,
      onholdCategoryId:values.onholdCategoryId?Number(values.onholdCategoryId):1,
    };
    putOnHolds.mutate(payload);
  };

  const fields = [
    {
      key: "hrq",
      icon: <CreditCard className="w-5 h-5" />,
      label: "HRQ ID",
      value: data.hrqId,
    },
    {
      key: "rcms",
      icon: <FileText className="w-5 h-5" />,
      label: "RCMS ID",
      value: data.rcMsProjectId,
    },
    {
      key: "rr",
      icon: <CreditCard className="w-5 h-5" />,
      label: "RR ID",
      value: data.rcMsResourceRequestId,
    },
    {
      key: "hiringStatusName",
      icon: <CreditCard className="w-5 h-5" />,
      label: "Req Status",
      value: data.hiringStatusName,
    },
    ...(data.onholdReasonName
      ? [
          {
            key: "onholdReasonName",
            icon: <CreditCard className="w-5 h-5" />,
            label: "On Hold Reason",
            value: data.onholdReasonName,
          },
          {
            key: "onholdByUserName",
            icon: <CreditCard className="w-5 h-5" />,
            label: "On Hold By",
            value: data.onholdByUserName,
          },
          {
            key: "onholdDate",
            icon: <CreditCard className="w-5 h-5" />,
            label: "Date On Hold",
            value: new Date(data.onholdDate).toLocaleDateString(),
          },
          {
            key: "onholdComments",
            icon: <Notebook className="w-5 h-5" />,
            label: "On hold Comment",
            value: data.onholdComments || "No comments provided",
          },
          {
            key: "onholdRequestedByName",
            icon: <User className="w-5 h-5" />,
            label: "On hold Requested By",
            value: data.onholdRequestedByName || "",
          },
        ]
      : []),
    // {
    //   key: "status",
    //   icon: <Mail className="w-5 h-5" />,
    //   label: "Req Status",
    //   isSelect: true,
    //   options: hiringStatus,
    //   selected: status,
    //   onSelect: (newStatus: string) => {
    //     setStatus(newStatus);
    //     changeStatus({
    //       hiringRequestId: hiringId,
    //       hiringStatusId: Number(newStatus),
    //     });
    //   },
    // },
    {
      key: "title",
      icon: <UserCheck className="w-5 h-5" />,
      label: "Role Hired For",
      value: data.jobTitle,
    },
    {
      key: "created",
      icon: <Calendar className="w-5 h-5" />,
      label: "Req Created Date",
      value: new Date(data.requestCreationDate).toLocaleDateString(),
    },
    {
      key: "hiringManagerName",
      icon: <UserCheck className="w-5 h-5" />,
      label: "Hiring Manager",
      value: data.hiringManagerName, // assuming this is your manager field
    },
    {
      key: "rmOwner",
      icon: <Mail className="w-5 h-5" />,
      label: "RM Owner",
      isRmowner: true,
      options: rmOwner,
      selected: rmowner,
      onSelect: (rmOwner: string) => {
        setRmowner(Number(rmOwner));
        changeRmowner({
          hiringRequestId: hiringId,
          rmownerId: Number(rmOwner),
        });
      },
    },
  ];
  useEffect(() => {
    setRmowner(data.rmOwnerId);
  }, [data.rmOwnerId]);

  return (
    <CardContent className="space-y-4">
      <div className="flex justify-between mb-4">
        <div className="flex items-center gap-2">
          <User2 className="h-6 w-6 text-[#1677ff]" />
          <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
            Hiring Request Details
          </h2>
        </div>
        {(  isAdmin || isRmowner || isDomainManager || isHiringManager || isVendorManager) &&(
      <Dialog open={isHoldDialogOpen} onOpenChange={setIsHoldDialogOpen}>
{(() => {
  const reviewId = Number(data.onHoldReviewStatusId); 

 
  if (reviewId === 85001) {
    return (
      <Button
        variant="outline"
        className="flex items-center gap-2 border-amber-500 text-amber-600 hover:bg-amber-50"
        disabled
      >
         <Clock className="h-4 w-4" />
        Pending
      </Button>
    );
  }

  
  if (reviewId === 85002) {
    return (
      <Button
        variant="outline"
        className="flex items-center gap-2 border-green-500 text-green-600 hover:bg-green-50"
        disabled={isPending}
        onClick={() =>
          changeStatus({
            hiringRequestId: hiringId,
            hiringStatusId: hiringStatusType.WIP,
          })
        }
      >
        <Mail className="h-4 w-4" />
        {isPending ? "Reactivating..." : "Reactivate"}
      </Button>
    );
  }

 
  return (
    <DialogTrigger asChild>
      <Button
        variant="outline"
        className="flex items-center gap-2 border-amber-500 text-amber-600 hover:bg-amber-50"
      >
        
         <PauseCircle className="h-4 w-4" />
        On Hold
      </Button>
    </DialogTrigger>
  );
})()}



          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Hold Hiring Request</DialogTitle>
            </DialogHeader>

            <Form {...holdForm}>
              <form
                onSubmit={holdForm.handleSubmit(onHoldSubmit)}
                className="space-y-4 pt-4"
              >

                {data?.hasChildRequests && <div>
                    <Label className="mb-2 text-sm font-medium text-gray-700 dark:text-gray-200">
                      OnHold Category *
                    </Label>
                    <Controller
                      control={holdForm.control}
                      name="onholdCategoryId"
                      render={({ field }) => (
                        <RadioGroup
                          value={field.value}
                          onValueChange={field.onChange}
                          className="flex gap-6"
                        >
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem
                              value="1"
                              id="onHoldStatus-fully"
                            />
                            <Label
                              className="text-gray-600 dark:text-gray-300 font-normal"
                              htmlFor="orientationStatus-fully"
                            >
                              Fully
                            </Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem
                              value="2"
                              id="onHoldStatus-partially"
                            />
                            <Label
                              className="text-gray-600 dark:text-gray-300 font-normal"
                              htmlFor="onHoldStatus-partially"
                            >
                              Partially
                            </Label>
                          </div>
                        </RadioGroup>
                        
                      )}
                    />
                    {holdForm.formState.errors.onholdCategoryId && (
                        <p className="text-red-500 text-xs mt-1">
                          {holdForm.formState.errors.onholdCategoryId.message}
                        </p>
                     )}
                  </div>}


                <SelectField
                  control={holdForm.control}
                  name="reason"
                  label="Hold Reason"
                  placeholder="Select a reason for putting this request on hold"
                  options={holdReasons}
                />
                <SelectField
                  control={holdForm.control}
                  name="onHoldRequestedBy"
                  label="On hold requested by "
                  placeholder="Select a onhold requested by"
                  options={onHoldRequestedBy}
                />
                {holdForm.watch("onholdCategoryId") === "2" && 
                <div>
                   <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                     Select Candidate Transfer Category
                   </label>
                <div className="flex flex-col md:flex-row items-center md:gap-6">
               <div className="flex items-center gap-2">
                <input
                 type="checkbox"
                 {...holdForm.register("isTalentPool")}
                 id="isTalentPool"
                 className="h-4 w-4 accent-blue-600"
                />
                 <label htmlFor="isTalentPool" className="text-sm font-medium text-gray-700 dark:text-gray-200">
                  Talent Pool
                 </label>
               </div>
           
               <div className="flex items-center gap-2">
                <input
                 type="checkbox"
                 {...holdForm.register("isIdentifiedTalents")}
                 id="isIdentifiedTalents"
                 className="h-4 w-4 accent-blue-600"
                />
                 <label htmlFor="isIdentifiedTalents" className="text-sm font-medium text-gray-700 dark:text-gray-200">
                  Identified Talents
                 </label>
               </div>
                </div>
                </div>
                }
                <TextareaField
                  control={holdForm.control}
                  name="onholdComments"
                  label="Additional Comments (optional)"
                  placeholder="Enter comments or notes"
                  rows={3}
                />

                <DialogFooter className="pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsHoldDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    className="bg-amber-600 hover:bg-amber-700"
                    disabled={putOnHolds.isPending}
                  >
                    {putOnHolds.isPending ? "Processing..." : "Put on Hold"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
        )}
  
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {fields.map((f) => (
          <div key={f.key} className="flex items-start space-x-2">
            <div className="mt-1 text-[#1677ff]">{f.icon}</div>
            <div className="flex-1 gap-2">
              <Label className="font-medium my-1">{f.label}</Label>
              {f.isSelect ? (
                <Select
                  value={f.selected}
                  onValueChange={f.onSelect}
                  className="w-full"
                  disabled={true}
                >
                  <SelectTrigger className="border-[#1677ff]/20 hover:border-[#1677ff] focus:ring-[#1677ff]/20">
                    <SelectValue placeholder="Select RmOwner" />
                  </SelectTrigger>
                  <SelectContent>
                    {f.options?.map((opt) => (
                      <SelectItem
                        key={opt.id}
                        value={opt.id}
                        className="hover:bg-[#1677ff]/10 focus:bg-[#1677ff]/10"
                      >
                        {opt.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : f.isRmowner ? (
                <Select
                  value={f.selected}
                  onValueChange={f.onSelect}
                  className="w-full"
                  disabled={rmownerLoading || !(isAdmin || isRmowner || isVendorManager)}
                >
                  <SelectTrigger className="border-[#1677ff]/20 hover:border-[#1677ff] focus:ring-[#1677ff]/20">
                    <SelectValue placeholder="Select Status" />
                  </SelectTrigger>
                  <SelectContent>
                    {f.options?.map((opt: any) => (
                      <SelectItem
                        key={opt.id}
                        value={opt.id}
                        className="hover:bg-[#1677ff]/10 focus:bg-[#1677ff]/10"
                      >
                        {opt.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <p className="mt-1 font-medium text-gray-800 dark:text-gray-100">
                  {f?.value}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </CardContent>
  );
}
