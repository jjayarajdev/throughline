"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ContactMatrixTable } from "@/components/partner-profile/ContactMatrixTable";
import { EscalationMatrixTable } from "@/components/partner-profile/EscalationMatrixTable";
import { EngagementTable } from "@/components/partner-profile/EngagementTable";
import { PODetailsTable } from "@/components/partner-profile/PODetailsTable";
import { PartnerHeader } from "@/components/partner-profile/PartnerHeader";
import { PartnerInfo } from "@/components/partner-profile/PartnerInfo";
import { LocationInfo } from "@/components/partner-profile/LocationInfo";
import { DocumentsList } from "@/components/partner-profile/DocumentsList";
import { partnerApi } from "@/services/api/partner.profile.api";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { ArrowLeft, CheckCircle, XCircle } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import z from "zod";

import { CandidateHiringRequests } from "@/components/candidate/Hiring-Table";
import { useUserStore } from "@/store/userStore";
import { FilterTypeEnum } from "@/constants/FilterTypeEnum";
import SubmitFormLoader from "@/components/common/SubmitFormLoader";

const approveStatusScehma = z.object({
  status: z.string().min(1, "Status is required"),
});
type FormValues = z.infer<typeof approveStatusScehma>;

export default function PartnerDetails() {
  const params = useParams<{ profile: string }>();
  const router = useRouter();
  const form = useForm<FormValues>({
    resolver: zodResolver(approveStatusScehma),
    defaultValues: {
      status: "",
    },
  });

  const { data: ParnterProfile = [],isLoading: isLoadingFormData } = useQuery({
    queryKey: ["ParnterProfile"],
    queryFn: () => partnerApi.getPartnerProfile(params.profile),
  });

  useEffect(() => {
    if (ParnterProfile) {
      const partnerData = ParnterProfile.data;
      form.reset({
        status: String(ParnterProfile?.data?.partnerStatusId),
      });
    }
  }, [ParnterProfile?.data?.partnerStatusId, form]);

  const partnerApprovalMutation = useMutation({
    mutationFn: (data: any) =>
      partnerApi.partnerApproval(
        ParnterProfile?.data?.partnerDetails?.id.toString(),
        data
      ),
    onSuccess: (data) => {
      toast.success(data.message);
      form.reset();
      router.push("/home/partner-onboarding");
    },
    onError: (error) => {
      toast.error("Failed to change partner status");
    },
  });
  const { userId } = useUserStore();

  function partnerOnboardingApproval(status: boolean) {
    const payload = {
      approvedBy: userId,
      approvedStatus: status,
    };
    partnerApprovalMutation.mutate(payload);
  }
    if (isLoadingFormData) return <SubmitFormLoader />;
  return (
    <div className="p-6">
      <div className="flex items-center mb-6">
        <div
         onClickCapture={() => router.back()}
          className="cursor-pointer flex items-center text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
         Go Back
        </div>
      </div>
      <div className="flex items-start gap-8">
        {/* Left Column */}
        <div className="flex-1">
          <PartnerHeader partner={ParnterProfile?.data} />
          <PartnerInfo partner={ParnterProfile?.data?.partnerDetails} />

          <Tabs defaultValue="contact" className="w-full">
            <TabsList className="w-full h-12 bg-[#DFE6E5] dark:border-white/[0.05] dark:bg-white/[0.03]">
              <TabsTrigger value="contact" className="flex-1">
                Contact Matrix
              </TabsTrigger>
              <TabsTrigger value="escalation" className="flex-1">
                Escalation Matrix
              </TabsTrigger>
              <TabsTrigger value="engagement" className="flex-1">
                Engagement
              </TabsTrigger>
              <TabsTrigger value="po" className="flex-1">
                SOW/PO Details
              </TabsTrigger>
              <TabsTrigger value="hrq" className="flex-1">
                Hiring Details
              </TabsTrigger>
            </TabsList>
            <TabsContent value="contact">
              <ContactMatrixTable
                contacts={ParnterProfile?.data?.partnerDetails?.contactMatrices}
              />
            </TabsContent>
            <TabsContent value="escalation">
              <EscalationMatrixTable
                escalations={ParnterProfile?.data?.partnerDetails?.escalationMatrices}
              />
            </TabsContent>
            <TabsContent value="engagement">
              <EngagementTable
                engagements={ParnterProfile?.data?.partnerDetails?.engagements}
              />
            </TabsContent>
            <TabsContent value="po">
              <PODetailsTable
                poDetails={ParnterProfile?.data?.partnerDetails?.soWs}
              />
            </TabsContent>
            <TabsContent value="hrq">
              {/* <HirignReqTable id={ParnterProfile?.data?.partnerDetails?.id}/> */}
              <CandidateHiringRequests filterType={FilterTypeEnum.PartnerProfileHiringDetails} id={ParnterProfile?.data?.partnerDetails?.id} />
            </TabsContent>
          </Tabs>
        </div>

        {/* Right Column */}
        <div className="w-80">
          <Card className="p-6 mb-6">
            <h2 className="text-xl font-semibold">VM Approval</h2>
            <div className="flex items-center justify-between bg-gray-100 dark:bg-gray-800/50 p-4 rounded-lg">
              {ParnterProfile?.data?.partnerDetails?.approvedStatus == null ? (
                <div className="flex justify-between w-full">
                  <Button
                    variant="default"
                    className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
                    onClick={() => partnerOnboardingApproval(true)}
                  >
                    <CheckCircle className="h-4 w-4" />
                    Approve
                  </Button>
                  <Button
                    variant="default"
                    className="flex items-center gap-2 bg-red-600 hover:bg-red-700"
                    onClick={() => partnerOnboardingApproval(false)}
                  >
                    <XCircle className="h-4 w-4" />
                    Reject
                  </Button>
                </div>
              ) : ParnterProfile.data.partnerDetails.approvedStatus ? (
                <span className="text-green-600 font-medium">VM Approved</span>
              ) : (
                <span className="text-red-600 font-medium">VM Rejected</span>
              )}
            </div>
          </Card>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-semibold">Locations</h2>
          </div>
          <LocationInfo partner={ParnterProfile?.data?.partnerDetails} />
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-semibold">Files/Documents</h2>
          </div>
          <DocumentsList documents={ParnterProfile?.data?.partnerDocuments} />
        </div>
      </div>
    </div>
  );
}