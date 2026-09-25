"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, usePathname, useRouter, useSearchParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Breadcrumb, Button, Card, Flex, Modal, Tabs, Typography } from "antd";
import { toast } from "@/lib/toast";
import { onboarding } from "@/services/api/onboarding.api";
import api from "@/lib/axiosInstance";

import PersonalDetails from "@/components/onboarding/PersonalDetails";
import ProfileTracker from "@/components/onboarding/ProfileTracker";
import ITPCSetup from "@/components/onboarding/ITPCSetup";
import TrainingOrientation from "@/components/onboarding/TrainingOrientation";
import BGVDashboard from "@/components/onboarding/BGVDashboard";
import { useOnboardCandidateStore } from "@/store/useCandidateOnboarding";
import { isPartner } from "@/store/userStore";

type TabKey = "candidatePersonalDetails" | "profileTracker" | "assetDetails" | "trainingDetails" | "candidateBgvDetails";

const tabOrder: TabKey[] = ["candidatePersonalDetails", "profileTracker", "assetDetails", "trainingDetails", "candidateBgvDetails"];

const TAB_ENDPOINT_MAP: Record<TabKey, string> = {
  candidatePersonalDetails: "/CandidatePersonalDetails",
  profileTracker: "/ProfileTracker",
  assetDetails: "/AssetDetails",
  trainingDetails: "/TrainingDetails",
  candidateBgvDetails: "/CandidateBgv",
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

/** Breadcrumb from the current path (Home > … ); intermediate crumbs go back. */
function PathBreadcrumb() {
  const pathname = usePathname();
  const router = useRouter();
  const segments = pathname.split("/").filter(Boolean).filter((seg) => seg !== "home");
  const getLabel = (segment: string) => segment.replace(/-/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
  return (
    <Breadcrumb
      items={[
        { title: <Link href="/home/dashboard">Home</Link> },
        ...segments.map((segment, idx) => ({
          title: idx === segments.length - 1 ? getLabel(segment) : <Typography.Link onClick={() => router.back()}>{getLabel(segment)}</Typography.Link>,
        })),
      ]}
    />
  );
}

/** The onboarding wizard: personal details, profile tracker, assets, training and BGV sections. */
export default function OnboardingTabs() {
  const { candidateId, hiringRequestId } = useOnboardCandidateStore.getState();
  const router = useRouter();
  const DEFAULT_TAB: TabKey = "candidatePersonalDetails";
  const params = useSearchParams();
  const tabFromUrl = params.get("tab");
  const [activeTab, setActiveTab] = useState<TabKey>((tabFromUrl as TabKey) ?? DEFAULT_TAB);

  useEffect(() => {
    if (tabFromUrl && tabFromUrl !== activeTab) setActiveTab(tabFromUrl as TabKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tabFromUrl]);

  const handleTabChange = (value: string) => {
    setActiveTab(value as TabKey);
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const fetchOnboardingDataWithId = async (id: number) => {
    try {
      const url = id ? `/onboarding/CandidatePersonalDetails/${id}` : `/onboarding/CandidatePersonalDetails/0?candidateId=${candidateId}&hiringRequestId=${hiringRequestId}`;
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
    enabled: !!personalDetails?.id,
    retry: 1,
  });
  const { data: trainingDetails, isPending: isTrainingLoading } = useQuery({
    queryKey: ["getTrainingDetails", personalDetails?.id],
    queryFn: () => onboarding.getTrainingDetails(personalDetails.id),
    enabled: !!personalDetails?.id,
    retry: 1,
  });
  const { data: bgvDetails, isPending: isBgvLoading } = useQuery({
    queryKey: ["getCandidateBgvDetails", personalDetails?.id],
    queryFn: () => onboarding.getCandidateBgvDetails(personalDetails.id),
    enabled: !!personalDetails?.id,
    retry: 1,
  });

  const invalidateSections = () => {
    queryClient.invalidateQueries({ queryKey: ["getProfileTracker", personalDetails.id] });
    queryClient.invalidateQueries({ queryKey: ["getAssetDetails", personalDetails.id] });
    queryClient.invalidateQueries({ queryKey: ["getTrainingDetails", personalDetails.id] });
    queryClient.invalidateQueries({ queryKey: ["getCandidateBgvDetails", personalDetails.id] });
  };

  const createSection = useMutation({
    mutationFn: ({ data, endpoint }: { data: any; endpoint: string }) => onboarding.createOnboarding(data, endpoint),
    onSuccess: async (res, variables) => {
      toast.success(res?.message || "Created successfully.");
      const newId = res?.data?.id;
      if (variables.endpoint === "/CandidatePersonalDetails" && newId) {
        setCreatedParentId(newId);
        router.replace(`/home/candidate-onboarding/${newId}?tab=candidatePersonalDetails`);
        await fetchOnboardingDataWithId(newId);
      } else if (personalDetails?.id) {
        invalidateSections();
      }
    },
    onError: (err) => {
      console.error(err);
      toast.error("Failed to create details.");
    },
  });

  const updateSection = useMutation({
    mutationFn: ({ id, data, endpoint }: { id: number; data: any; endpoint: string }) => onboarding.updateOnboarding(id, data, endpoint),
    onSuccess: async (res, variables) => {
      toast.success(res?.message || "Updated successfully.");
      if (variables.endpoint === "/CandidatePersonalDetails") {
        await fetchOnboardingDataWithId(createdParentId!);
      }
      invalidateSections();
    },
    onError: (err) => {
      console.error(err);
      toast.error("Failed to update details.");
    },
  });

  const sectionIdMap = useMemo<Record<TabKey, number | undefined>>(
    () => ({
      candidatePersonalDetails: personalDetails?.id,
      profileTracker: profileTracker?.id,
      assetDetails: assetDetails?.id,
      trainingDetails: trainingDetails?.id,
      candidateBgvDetails: bgvDetails?.id,
    }),
    [personalDetails, profileTracker, assetDetails, trainingDetails, bgvDetails]
  );

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
    const sectionId = sectionIdMap[section];
    const payload = { ...data, id: data?.id, candidatePersonalDetailsId: personalDetails?.id };

    if (section === "candidatePersonalDetails") {
      if (!sectionId) createSection.mutate({ data, endpoint });
      else updateSection.mutate({ id: sectionId, data, endpoint });
    } else {
      if (!sectionId) createSection.mutate({ data: payload, endpoint });
      else updateSection.mutate({ id: sectionId, data: payload, endpoint });
    }
  };

  function isTabDisabled(tab: TabKey): boolean {
    const index = tabOrder.indexOf(tab);
    if (isPartner) {
      if (["assetDetails", "trainingDetails", "profileTracker"].includes(tab)) return true;
      if (tab === "candidateBgvDetails") {
        const isPersonalDone = !!sectionIdMap["candidatePersonalDetails"];
        return !(isPersonalDone && assetDetails?.isJoinConfirmed);
      }
      return false;
    }
    if (tab === "trainingDetails") return !(assetDetails?.isJoinConfirmed && assetDetails?.pcReceivedOn);
    if (tab === "candidateBgvDetails") return !trainingDetails?.isOrientationCompleted;

    // any previous section incomplete or still loading blocks this one
    return tabOrder.slice(0, index).some((prevTab) => {
      const sectionId = sectionIdMap[prevTab];
      const isLoading =
        (prevTab === "profileTracker" && isProfileLoading) ||
        (prevTab === "assetDetails" && isAssetLoading) ||
        (prevTab === "trainingDetails" && isTrainingLoading) ||
        (prevTab === "candidateBgvDetails" && isBgvLoading);
      return !sectionId || isLoading;
    });
  }

  const handlePrev = () => {
    const index = tabOrder.indexOf(activeTab);
    if (index <= 0) return;
    const prevAvailableTab = tabOrder
      .slice(0, index)
      .reverse()
      .find((tab) => !isTabDisabled(tab));
    if (prevAvailableTab) setActiveTab(prevAvailableTab);
    else toast.info("No previous section available.");
  };

  const handleNext = () => {
    const currentIndex = tabOrder.indexOf(activeTab);
    const currentTab = tabOrder[currentIndex];
    if (!sectionIdMap[currentTab]) {
      toast.error(`Please complete and save the "${formatTabLabel(currentTab)}" section before proceeding.`);
      return;
    }
    const nextAvailableTab = tabOrder.slice(currentIndex + 1).find((tab) => !isTabDisabled(tab));
    if (nextAvailableTab) setActiveTab(nextAvailableTab);
    else toast.info("No further sections are available to proceed.");
  };

  const { mutate: submitBGV } = useMutation({
    mutationFn: onboarding.submitBGVVerification,
    onSuccess: () => toast.success("BGV verification completed successfully"),
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
    submitBGV({
      candidateId: personalDetails?.candidateId,
      hiringRequestId: personalDetails?.hiringRequestId,
      candidatePersonalDetailsId: personalDetails?.id,
      candidateBGVCompleted: true,
    });
    router.back();
  };

  const sectionContent: Record<TabKey, React.ReactNode> = {
    candidatePersonalDetails: <PersonalDetails onboardingTimeline={personalDetails} onSave={(data) => handleSave("candidatePersonalDetails", data)} />,
    profileTracker: <ProfileTracker onboardingTimeline={profileTracker} onSave={(data) => handleSave("profileTracker", data)} />,
    assetDetails: <ITPCSetup onboardingTimeline={assetDetails} onSave={(data) => handleSave("assetDetails", data)} personalDetails={personalDetails} />,
    trainingDetails: <TrainingOrientation onboardingTimeline={trainingDetails} onSave={(data) => handleSave("trainingDetails", data)} assetDetails={assetDetails} />,
    candidateBgvDetails: <BGVDashboard onboardingTimeline={bgvDetails} personalDetails={personalDetails} onSave={(data) => handleSave("candidateBgvDetails", data)} />,
  };

  return (
    <Flex vertical gap={16} className="p-4">
      <PathBreadcrumb />
      <Card>
        <Tabs
          activeKey={activeTab}
          onChange={handleTabChange}
          destroyOnHidden
          items={tabOrder.map((tab) => ({ key: tab, label: formatTabLabel(tab), disabled: isTabDisabled(tab), children: sectionContent[tab] }))}
        />

        <Flex justify="flex-end" className="mt-2">
          {activeTab === "candidateBgvDetails" && bgvDetails?.candidateBGVCompleted && !isPartner ? (
            <Button type="primary" onClick={() => setShowCompleteDialog(true)} disabled={!bgvDetails?.isBGVAvailableWithPartner}>
              Completed Onboarding
            </Button>
          ) : null}
        </Flex>

        <Modal
          open={showCompleteDialog}
          title="Complete Onboarding"
          okText="OK"
          onCancel={() => setShowCompleteDialog(false)}
          onOk={() => {
            setShowCompleteDialog(false);
            handleBGVSubmit();
          }}
        >
          <Typography.Paragraph>
            Click the <strong>OK</strong> button to confirm the completion of the candidate&apos;s onboarding.
            <br />
            Please note that this action is <strong>final</strong> and will prevent any further edits.
          </Typography.Paragraph>
          <Typography.Paragraph>You can check once again to ensure all data is entered correctly before proceeding.</Typography.Paragraph>
        </Modal>

        <Flex justify="space-between" className="mt-6">
          <Button onClick={handlePrev} disabled={tabOrder.indexOf(activeTab) === 0}>
            Previous
          </Button>
          <Button onClick={handleNext} disabled={tabOrder.indexOf(activeTab) === tabOrder.length - 1}>
            Next
          </Button>
        </Flex>
      </Card>
    </Flex>
  );
}
