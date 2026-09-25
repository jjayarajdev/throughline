"use client";

import { useEffect, useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { onboarding } from "@/services/api/onboarding.api";
import api from "@/lib/axiosInstance";

import PersonalDetails from "@/components/onboarding/PersonalDetails";
import ProfileTracker from "@/components/onboarding/ProfileTracker";
import ITPCSetup from "@/components/onboarding/ITPCSetup";
import TrainingOrientation from "@/components/onboarding/TrainingOrientation";
import BGVDashboard from "@/components/onboarding/BGVDashboard";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Breadcrumbs } from "@/components/common/Breadcrumbs";
import { useOnboardCandidateStore } from "@/store/useCandidateOnboarding";
import { isPartner } from "@/store/userStore";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type TabKey =
  | "candidatePersonalDetails"
  | "profileTracker"
  | "assetDetails"
  | "trainingDetails"
  | "candidateBgvDetails";



export default function OnboardingTabs() {
  const { candidateId, hiringRequestId } = useOnboardCandidateStore.getState();
  
  
  const tabOrder: TabKey[] = [
    "candidatePersonalDetails",
    "profileTracker",
    "assetDetails",
    "trainingDetails",
    "candidateBgvDetails",
  ];

  const TAB_ENDPOINT_MAP: Record<TabKey, string> = {
    candidatePersonalDetails: "/CandidatePersonalDetails",
    profileTracker: "/ProfileTracker",
    assetDetails: "/AssetDetails",
    trainingDetails: "/TrainingDetails",
    candidateBgvDetails: "/CandidateBgv",
  };
  const router = useRouter();
  const DEFAULT_TAB = "candidatePersonalDetails";
  const params = useSearchParams();
  const tabFromUrl = params.get("tab");
  const [activeTab, setActiveTab] = useState<any>(
    tabFromUrl ?? DEFAULT_TAB
  );
  
  
    useEffect(() => {
      if (tabFromUrl && tabFromUrl !== activeTab) {
        setActiveTab(tabFromUrl);
      }
    }, [tabFromUrl]);
  
    
    const handleTabChange = (value: string) => {
      setActiveTab(value);
      router.replace(`?tab=${encodeURIComponent(value)}`);
    };
  
  const [createdParentId, setCreatedParentId] = useState<number | null>(null);
  const [personalDetails, setPersonalDetails] = useState<any>(null);
  const [showCompleteDialog, setShowCompleteDialog] = useState(false);
 

  const { id } = useParams();
  
  const queryClient = useQueryClient();

  useEffect(() => {
  if (id) {
    const numericId = id === "new" ? 0 : Number(id);
    fetchOnboardingDataWithId(numericId);
  }
}, [id]);


  const fetchOnboardingDataWithId = async (id: number) => {
  try {
    
   const url = id
     ? `/onboarding/CandidatePersonalDetails/${id}`
     : `/onboarding/CandidatePersonalDetails/0?candidateId=${candidateId}&hiringRequestId=${hiringRequestId}`;

   const res = await api.get(url);


    const personal = res.data.data;
    

    setPersonalDetails(personal);
    setCreatedParentId(personal.id);
  } catch (err) {
    console.error("Error fetching personal details:", err);
    toast.error("Failed to load personal details.");
  }
};


  const { data: profileTracker, isPending: isProfileLoading } = useQuery({
    queryKey: ["getProfileTracker", personalDetails?.id],
    queryFn: () => onboarding.getProfileTracker(personalDetails.id),
    enabled: !!personalDetails?.id,
    retry: 1,
  });

  const { data: assetDetails, isPending: isAssetLoading } = useQuery({
    queryKey: ["getAssetDetails", personalDetails?.id],
    queryFn: () => onboarding.getAssetDetails(personalDetails.id),
    enabled: !!personalDetails?.id ,
    retry: 1,
  });

  const { data: trainingDetails, isPending: isTrainingLoading } = useQuery(
    {
      queryKey: ["getTrainingDetails", personalDetails?.id],
      queryFn: () => onboarding.getTrainingDetails(personalDetails.id),
      enabled: !!personalDetails?.id,
      retry: 1,
    }
  );

  const { data: bgvDetails, isPending: isBgvLoading } = useQuery({
    queryKey: ["getCandidateBgvDetails", personalDetails?.id],
    queryFn: () => onboarding.getCandidateBgvDetails(personalDetails.id),
    enabled: !!personalDetails?.id,
    retry: 1,
  });

  const createSection = useMutation({
    mutationFn: ({ data, endpoint }: { data: any; endpoint: string }) =>
      onboarding.createOnboarding(data, endpoint),
    onSuccess: async (res, variables) => {
      toast.success(res?.message || "Created successfully.");
      const newId = res?.data?.id;

      if (variables.endpoint === "/CandidatePersonalDetails" && newId) {
        setCreatedParentId(newId);
        router.replace(`/home/candidate-onboarding/${newId}?tab=candidatePersonalDetails`);
        await fetchOnboardingDataWithId(newId);
      }else if (personalDetails?.id) {
       queryClient.invalidateQueries({ queryKey: ["getProfileTracker",personalDetails.id] });
       queryClient.invalidateQueries({ queryKey: ["getAssetDetails",personalDetails.id] });
       queryClient.invalidateQueries({ queryKey: ["getTrainingDetails",personalDetails.id] });
       queryClient.invalidateQueries({ queryKey: ["getCandidateBgvDetails",personalDetails.id] });
     }
    },
    onError: (err) => {
      console.error(err);
      toast.error("Failed to create details.");
    },
  });

  const updateSection = useMutation({
    mutationFn: ({
      id,
      data,
      endpoint,
    }: {
      id: number;
      data: any;
      endpoint: string;
    }) => onboarding.updateOnboarding(id, data, endpoint),
    onSuccess: async (res, variables) => {
      toast.success(res?.message || "Updated successfully.");

      if (variables.endpoint === "/CandidatePersonalDetails") {
        await fetchOnboardingDataWithId(createdParentId!);
      }
         queryClient.invalidateQueries({ queryKey: ["getProfileTracker",personalDetails.id] });
         queryClient.invalidateQueries({ queryKey: ["getAssetDetails",personalDetails.id] });
         queryClient.invalidateQueries({ queryKey: ["getTrainingDetails",personalDetails.id] });
         queryClient.invalidateQueries({ queryKey: ["getCandidateBgvDetails",personalDetails.id] });
    },
    onError: (err) => {
      console.error(err);
      toast.error("Failed to update details.");
    },
  });

 const handleSave = async (section: TabKey, data: any) => {
    const endpoint = TAB_ENDPOINT_MAP[section];
   
    if (!endpoint) {
      toast.error("Unknown section");
      return;
    }

    if (section !== "candidatePersonalDetails" && !personalDetails?.id) {
      toast.error("Please complete Personal Details first.");
      return;
    }

    const sectionIdMap: Record<TabKey, number | undefined> = {
      candidatePersonalDetails: personalDetails?.id,
      profileTracker: profileTracker?.id,
      assetDetails: assetDetails?.id,
      trainingDetails: trainingDetails?.id,
      candidateBgvDetails: bgvDetails?.id,
    };

    const sectionId = sectionIdMap[section];

    const payload = {
      ...data,
      id:data?.id,
      candidatePersonalDetailsId: personalDetails?.id,
    };
    
    if (section === "candidatePersonalDetails") {
      if (!sectionId) {
        createSection.mutate({ data, endpoint });
      } else {
        updateSection.mutate({ id: sectionId, data, endpoint });
      }
    } else {
      if (!sectionId) {
        createSection.mutate({ data: payload, endpoint });
      } else {
        updateSection.mutate({ id: sectionId, data: payload, endpoint });
      }
    }
  };

function formatTabLabel(tab: TabKey): string {
  switch (tab) {
    case "candidateBgvDetails":
      return "Background Verification";
    case "candidatePersonalDetails":
      return "Personal Details";
    case "profileTracker":
      return "Profile Tracker";
    case "assetDetails":
      return "Asset Details";
    case "trainingDetails":
      return "Training Details";
    default:
      return tab;
  }
}



  const handlePrev = () => {
  const index = tabOrder.indexOf(activeTab);
  if (index <= 0) return;

  const previousTabs = tabOrder.slice(0, index).reverse();
  const prevAvailableTab = previousTabs.find((tab) => !isTabDisabled(tab));

  if (prevAvailableTab) {
    setActiveTab(prevAvailableTab);
  } else {
    toast.info("No previous section available.");
  }
};

const sectionIdMap = useMemo(() => ({
  candidatePersonalDetails: personalDetails?.id,
  profileTracker: profileTracker?.id,
  assetDetails: assetDetails?.id,
  trainingDetails: trainingDetails?.id,
  candidateBgvDetails: bgvDetails?.id,
}), [personalDetails, profileTracker, assetDetails, trainingDetails, bgvDetails]);


 
const handleNext = () => {
  const currentIndex = tabOrder.indexOf(activeTab);
  const currentTab = tabOrder[currentIndex];
  const currentTabId = sectionIdMap[currentTab];

  if (!currentTabId) {
    toast.error(
      `Please complete and save the "${formatTabLabel(currentTab)}" section before proceeding.`
    );
    return;
  }

  // Filter out tabs that are disabled
  const remainingTabs = tabOrder.slice(currentIndex + 1);
  const nextAvailableTab = remainingTabs.find((tab) => !isTabDisabled(tab));

  if (nextAvailableTab) {
    setActiveTab(nextAvailableTab);
  } else {
    toast.info("No further sections are available to proceed.");
  }
};



function isTabDisabled(tab: TabKey): boolean {
  const index = tabOrder.indexOf(tab);

  if (isPartner) {
    
    if (["assetDetails", "trainingDetails", "profileTracker"].includes(tab)) {
      return true; 
    }

    if (tab === "candidateBgvDetails") {
      // Enable BGV tab as soon as personal details are done
      const personalDetailsId = sectionIdMap["candidatePersonalDetails"];
      const isPersonalDone = !!personalDetailsId;
      return !(isPersonalDone && assetDetails?.isJoinConfirmed); 
    }

    return false; 
  }

  // Non-partner case (normal sequential flow)
  if (tab === "trainingDetails") {
    return !(assetDetails?.isJoinConfirmed && assetDetails?.pcReceivedOn);
  }

  if (tab === "candidateBgvDetails") {
    return !trainingDetails?.isOrientationCompleted;
  }

  // Check if any previous tab is incomplete/loading
  const isBlocked = tabOrder
    .slice(0, index)
    .some((prevTab) => {
      const sectionId = sectionIdMap[prevTab];
      const isLoading =
        (prevTab === "profileTracker" && isProfileLoading) ||
        (prevTab === "assetDetails" && isAssetLoading) ||
        (prevTab === "trainingDetails" && isTrainingLoading) ||
        (prevTab === "candidateBgvDetails" && isBgvLoading);
      return !sectionId || isLoading;
    });

  return isBlocked;
}







const { mutate: submitBGV, isPending: isSubmitting } = useMutation({
  mutationFn: onboarding.submitBGVVerification,
  onSuccess: () => {
    toast.success("BGV verification completed successfully");
  },
  onError: (error) => {
    toast.error("Failed to submit BGV verification");
    console.error("Submit Error:", error);
  },
});

const handleBGVSubmit = () => {
  if (!personalDetails?.candidateId || !personalDetails?.hiringRequestId || !personalDetails?.id) {
    toast.error("Missing candidate information");
    
    return;
  }

  const payload = {
    candidateId:personalDetails?.candidateId,
    hiringRequestId: personalDetails?.hiringRequestId,
    candidatePersonalDetailsId: personalDetails?.id,
    candidateBGVCompleted: true,
  };

  submitBGV(payload);
  
  router.back()
};

  return (
    <div className="py-10 px-4 sm:px-6">
      <Breadcrumbs />
      <Card>
        <CardContent className="pt-6">
          <Tabs value={activeTab} onValueChange={handleTabChange}>
            <ScrollArea className="w-full whitespace-nowrap">
              <TabsList className="w-full h-12 bg-[#DFE6E5] dark:bg-white/[0.03]">
                {tabOrder.map((tab) => (
                  <TabsTrigger
                    key={tab}
                    value={tab}
                    className="flex-1 capitalize"
                    disabled={isTabDisabled(tab)}
                  >
                    {formatTabLabel(tab)}
                  </TabsTrigger>
                ))}
              </TabsList>
              <ScrollBar orientation="horizontal" className="invisible" />
            </ScrollArea>

            <TabsContent value="candidatePersonalDetails">
              <PersonalDetails
                onboardingTimeline={personalDetails}
                onSave={(data) => handleSave("candidatePersonalDetails", data)}
              />
            </TabsContent>

            <TabsContent value="profileTracker">
              <ProfileTracker
                onboardingTimeline={profileTracker}
                onSave={(data) => handleSave("profileTracker", data)}
              />
            </TabsContent>

            <TabsContent value="assetDetails">
              <ITPCSetup
                onboardingTimeline={assetDetails}
                onSave={(data) => handleSave("assetDetails", data)}
                personalDetails={personalDetails}
              />
            </TabsContent>

            <TabsContent value="trainingDetails">
              <TrainingOrientation
                onboardingTimeline={trainingDetails}
                onSave={(data) => handleSave("trainingDetails", data)}
                assetDetails={assetDetails}
              />
            </TabsContent>

            <TabsContent value="candidateBgvDetails">
              <BGVDashboard
                onboardingTimeline={bgvDetails}
                personalDetails={personalDetails}
                onSave={(data) => handleSave("candidateBgvDetails", data)}
              />
            </TabsContent>
            <div className="flex justify-end  mt-2">
              {activeTab === "candidateBgvDetails" &&
              bgvDetails?.candidateBGVCompleted &&
              !isPartner ? (
                <Button
                  onClick={() => setShowCompleteDialog(true)}
                  className="bg-[#00b388] hover:bg-[#009e79] h-9"
                  disabled={!bgvDetails?.isBGVAvailableWithPartner}
                >
                  Completed Onboarding
                </Button>
              ) : null}

              <Dialog
                open={showCompleteDialog}
                onOpenChange={setShowCompleteDialog}
              >
                <DialogContent className="sm:max-w-[600px] p-8 rounded-2xl">
                  <DialogHeader>
                    <DialogTitle className="text-xl font-semibold">
                      Complete Onboarding
                    </DialogTitle>
                    <DialogDescription className="text-base leading-relaxed">
                      Click the <strong>OK</strong> button to confirm the
                      completion of the candidate's onboarding. <br />
                      Please note that this action is <strong>final</strong> and
                      will prevent any further edits.
                      <br />
                      <br />✅ You can check once again to ensure all data is
                      entered correctly before proceeding.
                    </DialogDescription>
                  </DialogHeader>
                  <DialogFooter className="mt-6">
                    <Button
                      variant="outline"
                      className="text-base px-6 py-2"
                      onClick={() => setShowCompleteDialog(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      className="bg-[#00b388] hover:bg-[#009e79] text-base px-6 py-2"
                      onClick={() => {
                        setShowCompleteDialog(false);
                        handleBGVSubmit();
                      }}
                    >
                      OK
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>

            <div className="mt-6 flex justify-between">
              <Button
                onClick={handlePrev}
                disabled={tabOrder.indexOf(activeTab) === 0}
                variant="outline"
              >
                Previous
              </Button>
              <Button
                onClick={handleNext}
                disabled={tabOrder.indexOf(activeTab) === tabOrder.length - 1}
                variant="outline"
              >
                Next
              </Button>
            </div>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
