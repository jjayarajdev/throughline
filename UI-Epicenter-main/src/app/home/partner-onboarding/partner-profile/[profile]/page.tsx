"use client";
import React from "react";
import { useParams, useRouter } from "next/navigation";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Button, Card, Col, Flex, Row, Space, Spin, Tabs, Typography } from "antd";
import { ArrowLeftOutlined, CheckCircleOutlined, CloseCircleOutlined } from "@ant-design/icons";

import { ContactMatrixTable } from "@/components/partner-profile/ContactMatrixTable";
import { EscalationMatrixTable } from "@/components/partner-profile/EscalationMatrixTable";
import { EngagementTable } from "@/components/partner-profile/EngagementTable";
import { PODetailsTable } from "@/components/partner-profile/PODetailsTable";
import { PartnerHeader } from "@/components/partner-profile/PartnerHeader";
import { PartnerInfo } from "@/components/partner-profile/PartnerInfo";
import { LocationInfo } from "@/components/partner-profile/LocationInfo";
import { DocumentsList } from "@/components/partner-profile/DocumentsList";
import HirignReqTable from "@/components/partner-profile/Hirign-req-table";
import { partnerApi } from "@/services/api/partner.profile.api";
import { toast } from "@/lib/toast";
import { useUserStore } from "@/store/userStore";
import { FilterTypeEnum } from "@/constants/FilterTypeEnum";

/** Partner profile: header stats, details, matrices / engagements / SOWs / HRQs, and VM approval. */
export default function PartnerDetails() {
  const params = useParams<{ profile: string }>();
  const router = useRouter();
  const { userId } = useUserStore();

  const { data: ParnterProfile, isLoading } = useQuery({
    queryKey: ["ParnterProfile"],
    queryFn: () => partnerApi.getPartnerProfile(params.profile),
  });

  const details = ParnterProfile?.data?.partnerDetails;

  const partnerApprovalMutation = useMutation({
    mutationFn: (data: any) => partnerApi.partnerApproval(details?.id?.toString(), data),
    onSuccess: (data) => {
      toast.success(data.message);
      router.push("/home/partner-onboarding");
    },
    onError: () => toast.error("Failed to change partner status"),
  });

  const partnerOnboardingApproval = (status: boolean) => partnerApprovalMutation.mutate({ approvedBy: userId, approvedStatus: status });

  if (isLoading) return <Spin fullscreen />;

  const tabs = [
    { key: "contact", label: "Contact Matrix", children: <ContactMatrixTable contacts={details?.contactMatrices} /> },
    { key: "escalation", label: "Escalation Matrix", children: <EscalationMatrixTable escalations={details?.escalationMatrices} /> },
    { key: "engagement", label: "Engagement", children: <EngagementTable engagements={details?.engagements} /> },
    { key: "po", label: "SOW/PO Details", children: <PODetailsTable poDetails={details?.soWs} /> },
    { key: "hrq", label: "Hiring Details", children: <HirignReqTable id={details?.id} filterType={FilterTypeEnum.PartnerProfileHiringDetails} /> },
  ];

  return (
    <Flex vertical gap={16} className="p-4">
      <div>
        <Button type="link" icon={<ArrowLeftOutlined />} onClick={() => router.back()} style={{ paddingInline: 0 }}>
          Go Back
        </Button>
      </div>
      <Row gutter={[24, 24]}>
        <Col xs={24} lg={17}>
          <Flex vertical gap={16}>
            <PartnerHeader partner={ParnterProfile?.data} />
            <PartnerInfo partner={details} />
            <Tabs defaultActiveKey="contact" items={tabs} destroyOnHidden />
          </Flex>
        </Col>
        <Col xs={24} lg={7}>
          <Flex vertical gap={16}>
            <Card title="VM Approval" size="small">
              {details?.approvedStatus == null ? (
                <Space wrap>
                  <Button type="primary" icon={<CheckCircleOutlined />} loading={partnerApprovalMutation.isPending} onClick={() => partnerOnboardingApproval(true)}>
                    Approve
                  </Button>
                  <Button danger type="primary" icon={<CloseCircleOutlined />} loading={partnerApprovalMutation.isPending} onClick={() => partnerOnboardingApproval(false)}>
                    Reject
                  </Button>
                </Space>
              ) : details.approvedStatus ? (
                <Typography.Text type="success" strong>
                  VM Approved
                </Typography.Text>
              ) : (
                <Typography.Text type="danger" strong>
                  VM Rejected
                </Typography.Text>
              )}
            </Card>
            <Typography.Title level={5} style={{ margin: 0 }}>
              Locations
            </Typography.Title>
            <LocationInfo partner={details} />
            <Typography.Title level={5} style={{ margin: 0 }}>
              Files/Documents
            </Typography.Title>
            <DocumentsList documents={ParnterProfile?.data?.partnerDocuments} />
          </Flex>
        </Col>
      </Row>
    </Flex>
  );
}
