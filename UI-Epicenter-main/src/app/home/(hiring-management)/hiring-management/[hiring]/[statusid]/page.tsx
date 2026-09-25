"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { format } from "date-fns";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { toast, Toaster } from "sonner";
import { useRouter, useParams } from "next/navigation";
import { useMutation, useQuery } from "@tanstack/react-query";
import { hiringApi } from "@/services/api/hiring.api";
import { Loader2 } from "lucide-react";
import Loading from "./loading";
import SubmitFormLoader from "@/components/common/SubmitFormLoader";
import { ErrorHandler } from "@/components/error/ErrorHandler";

const schema = z.object({
  comments: z.string().nonempty({ message: "Comments are required" }),
});

type FormValues = z.infer<typeof schema>;

export default function ApprovalPage() {
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      comments: "",
    },
    mode: "onSubmit",
  });
  const { hiring, statusid } = useParams();

  const {
    data: hiringDetailsBYID,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["hiringDetailsBYID", Number(hiring)],
    queryFn: () => hiringApi.gethiringDetailByID(Number(hiring)),
  });

  const router = useRouter();

  const { mutate: ApproveBinToCart, isPending } = useMutation({
    mutationKey: ["ApproveBinToCart"],
    mutationFn: hiringApi.ApprovedBintoCart,
    onSuccess: (data) => {
      toast.success(data?.message || "approved successfull");
      router.push("/home/hiring-management?tab=bin");
    },
    onError: (error) => {
      toast.error("Something went wrong, please try again later.");
      console.error("Error creating partner:", error);
    },
  });

  const onSubmit = async (values: FormValues) => {
    const payload = {
      id: Number(hiring),
      approverComments: values?.comments,
      approvalStatusId: Number(statusid),
    };
    const valid = await form.trigger();
    if (valid) {
      ApproveBinToCart(payload);
    } else {
      console.log("Validation errors:", form.formState.errors);
    }
  };
  if (isLoading) return <Loading />;
  if (error) return <ErrorHandler error={error} />;

  return (
    <Form {...form}>
      <Toaster />
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <h1 className="relative text-2xl font-medium">Approval Page</h1>

        {isPending && <SubmitFormLoader />}
        <Card>
          <CardHeader>
            <CardTitle>Hiring Details</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {/* Column 1 */}
            <div className="space-y-4">
              <div>
                <p className="text-md font-medium   ">Role Hired for:</p>
                <p>{hiringDetailsBYID.jobTitle}</p>
              </div>
              <div>
                <p className="text-md font-medium ">
                  RCMS Resource Request ID:
                </p>
                <p>{hiringDetailsBYID.rcMsResourceRequestId}</p>
              </div>
              <div>
                <p className="text-md font-medium ">Business:</p>
                <p>{hiringDetailsBYID.businessName}</p>
              </div>
            </div>

            {/* Column 2 */}
            <div className="space-y-4">
              <div>
                <p className="text-md font-medium ">Hiring Manager:</p>
                <p>{hiringDetailsBYID.hiringManagerName}</p>
              </div>
              <div>
                <p className="text-md font-medium ">Project Name:</p>
                <p>{hiringDetailsBYID.projectName}</p>
              </div>
              <div>
                <p className="text-md font-medium ">Hiring Type:</p>
                <p>{hiringDetailsBYID.hiringTypeName}</p>
              </div>
            </div>

            {/* Column 3 */}
            <div className="space-y-4">
              <div>
                <p className="text-md font-medium ">HRQ ID:</p>
                <p>{hiringDetailsBYID.hrqId}</p>
              </div>
              <div>
                <p className="text-md font-medium ">Request Start Date:</p>
                <p>
                  {format(
                    new Date(hiringDetailsBYID.requestStartDate),
                    "yyyy/MM/dd"
                  )}
                </p>
              </div>
              <div>
                <p className="text-md font-medium ">
                  Project Duration (Months):
                </p>
                <p>{hiringDetailsBYID.projectDurationMonths} Months</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <p className="text-md font-medium ">RCMS Project ID:</p>
                <p>{hiringDetailsBYID.rcMsProjectId}</p>
              </div>
              <div>
                <p className="text-md font-medium ">Req Creation Date:</p>
                <p>
                  {format(
                    new Date(hiringDetailsBYID.requestCreationDate),
                    "yyyy/MM/dd"
                  )}
                </p>
              </div>
              <div>
                <p className="text-md font-medium ">Status:</p>
                <p>{hiringDetailsBYID.hiringStatusName}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Mandatory Date & Comments Section */}
        <div className="grid grid-cols-1 gap-6">
          <FormField
            control={form.control}
            name="comments"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Comments</FormLabel>
                <FormControl>
                  <textarea
                    {...field}
                    name="comments"
                    placeholder="Enter comments"
                    className="w-full rounded-md border border-input px-3 py-2 resize-none h-24 focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Submit Button */}
        <div className="flex justify-end">
          <Button
          variant="hpButton"
            disabled={isPending}
            type="submit"
            className="px-6"
          >
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              "Submit"
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
