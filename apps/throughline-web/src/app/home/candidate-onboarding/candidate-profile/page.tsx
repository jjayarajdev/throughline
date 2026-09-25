"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Breadcrumb, Card, Col, Flex, Row, Space, Tabs, Tag, Typography } from "antd";
import { BankOutlined, CalendarOutlined, FileDoneOutlined, UserOutlined } from "@ant-design/icons";
import { onboarding } from "@/services/api/onboarding.api";
import OnboardingViewProfile from "@/components/onboarding/candidate-profileDetails/OnboardingViewProfile";
import ProfileTrackerViewProfile from "@/components/onboarding/candidate-profileDetails/ProfileTrackerViewProfile";
import AssetsViewProfile from "@/components/onboarding/candidate-profileDetails/AssetsViewProfile";
import TrainingViewProfile from "@/components/onboarding/candidate-profileDetails/TrainingViewProfile";
import BGVViewProfile from "@/components/onboarding/candidate-profileDetails/BGVViewProfile";
import api from "@/lib/axiosInstance";
import { toast } from "@/lib/toast";
import { useOnboardCandidateStore } from "@/store/useCandidateOnboarding";
import { isPartner } from "@/store/userStore";

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

function StatCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: React.ReactNode; color?: string }) {
  return (
    <Card size="small">
      <Space size="middle" align="center">
        <Typography.Text style={{ fontSize: 24 }}>{icon}</Typography.Text>
        <div>
          <Typography.Text type="secondary">{label}</Typography.Text>
          <div>{color ? <Tag color={color}>{value || "-"}</Tag> : <Typography.Text strong>{value || "-"}</Typography.Text>}</div>
        </div>
      </Space>
    </Card>
  );
}

interface CandidateDetailsViewProps {
  candidateId: string;
  onBack: () => void;
}

/** Read-only view of an onboarded employee: personal, profile tracker, assets, training and BGV details. */
export default function CandidateDetailsView(_props: CandidateDetailsViewProps) {
  const searchParams = useSearchParams();
  const candidate = searchParams.get("id");
  const { candidateRateCardId } = useOnboardCandidateStore.getState();
  const hasShownError = useRef(false);
  const [activeTab, setActiveTab] = useState("onboarding");
  const [personalDetails, setPersonalDetails] = useState<any>(null);

  useEffect(() => {
    if (candidate) fetchOnboardingDataWithId(Number(candidate));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [candidate]);

  const fetchOnboardingDataWithId = async (id: number) => {
    try {
      const res = await api.get(`/onboarding/CandidatePersonalDetails/${id}`);
      setPersonalDetails(res.data.data);
      hasShownError.current = false;
    } catch {
      if (!hasShownError.current) {
        toast.error("Failed to load personal details.");
        hasShownError.current = true;
      }
    }
  };

  const { data: rateCarddata } = useQuery({
    queryKey: ["getProfileTracker", candidateRateCardId],
    queryFn: () => onboarding.getRateCard(candidateRateCardId),
    enabled: !!candidateRateCardId,
    retry: 1,
  });
  const { data: profileTracker } = useQuery({
    queryKey: ["getProfileTracker", personalDetails?.id],
    queryFn: () => onboarding.getProfileTracker(personalDetails.id),
    enabled: !!personalDetails?.id,
    retry: 1,
  });
  const { data: assetDetails } = useQuery({
    queryKey: ["getAssetDetails", personalDetails?.id],
    queryFn: () => onboarding.getAssetDetails(personalDetails.id),
    enabled: !!personalDetails?.id && activeTab === "assets",
    retry: 1,
  });
  const { data: trainingDetails } = useQuery({
    queryKey: ["getTrainingDetails", personalDetails?.id],
    queryFn: () => onboarding.getTrainingDetails(personalDetails.id),
    enabled: !!personalDetails?.id && activeTab === "training",
    retry: 1,
  });
  const { data: bgvDetails } = useQuery({
    queryKey: ["getCandidateBgvDetails", personalDetails?.id],
    queryFn: () => onboarding.getCandidateBgvDetails(personalDetails.id),
    enabled: !!personalDetails?.id && activeTab === "bgv",
    retry: 1,
  });

  const tabItems = [
    { key: "onboarding", label: "PersonalDetails", children: <OnboardingViewProfile candidateData={personalDetails} /> },
    { key: "profile", label: "Profile Tracker", disabled: isPartner, children: <ProfileTrackerViewProfile candidateData={profileTracker} /> },
    { key: "assets", label: "Asset Details", disabled: isPartner, children: <AssetsViewProfile candidateData={assetDetails} personalDetails={personalDetails} /> },
    { key: "training", label: "Training Details", disabled: isPartner, children: <TrainingViewProfile candidateData={trainingDetails} personalDetails={personalDetails} /> },
    { key: "bgv", label: "BGV Details", children: <BGVViewProfile candidateData={bgvDetails} personalDetails={personalDetails} /> },
  ];

  return (
    <Flex vertical gap={16} className="p-4">
      <PathBreadcrumb />
      <Typography.Title level={4} style={{ margin: 0 }}>
        Employee Details View
      </Typography.Title>

      <Row gutter={[16, 16]}>
        <Col xs={24} md={12} lg={6}>
          <StatCard icon={<UserOutlined />} label="HRQID" value={personalDetails?.hrqId} color="blue" />
        </Col>
        <Col xs={24} md={12} lg={6}>
          <StatCard icon={<BankOutlined />} label="Candidate Code" value={personalDetails?.candidateCode} />
        </Col>
        {!isPartner && (
          <Col xs={24} md={12} lg={6}>
            <StatCard icon={<FileDoneOutlined />} label="Category" value={rateCarddata?.categoryName} color="purple" />
          </Col>
        )}
        {!isPartner && (
          <Col xs={24} md={12} lg={6}>
            <StatCard icon={<CalendarOutlined />} label="Partner Rate" value={rateCarddata?.partnerRate} color="orange" />
          </Col>
        )}
      </Row>

      <Tabs activeKey={activeTab} onChange={setActiveTab} items={tabItems} />
    </Flex>
  );
}
