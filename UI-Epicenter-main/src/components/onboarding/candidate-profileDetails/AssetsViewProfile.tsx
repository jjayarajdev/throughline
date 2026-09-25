"use client";

import { Card, Col, Descriptions, Row, Space, Typography } from "antd";
import { BankOutlined, ClockCircleOutlined, SettingOutlined } from "@ant-design/icons";
import { useQuery } from "@tanstack/react-query";
import { MasterTypes } from "@/constants/masterTypes";
import { onboarding } from "@/services/api/onboarding.api";
import { isPartner } from "@/store/userStore";
import { TatIndicator } from "../ITPCSetup";

interface AssetProfileData {
  pcRequestCreatedDate?: string;
  pcRequestRefNo?: string;
  pcSerialNo?: string;
  pcAllocationDate?: string;
  modeOfPcShipmentId?: number;
  modeOfPcShipmentName?: string;
  pcReceivedOn?: string;
  pcConfigurationDate?: string;
  itAssetStatusID?: number;
  itAssetStatusName?: string;
  complianceFollowedId?: number;
  complianceFollowedName?: string;
  delayCategoryName?: string;
  pcIssueTat?: number;
  releaseToOperationsTat?: number;
  tatOnFinalConfiguration?: number;
  comments?: string;
  isJoinConfirmed?: boolean;
  isPCAllocated?: boolean;
}

interface IProps {
  personalDetails: any;
}

export default function AssetsViewProfile({ candidateData, personalDetails }: { candidateData: AssetProfileData; personalDetails: IProps }) {
  const { data: pcShipmentOptions = [] } = useQuery({
    queryKey: ["getPcShipmentModes", MasterTypes.PC_SHIPMENT_MODE],
    queryFn: () => onboarding.getEmployeeCategory(MasterTypes.PC_SHIPMENT_MODE).then((res) => res.data),
    retry: 1,
  });
  const { data: itAssetStatusOptions = [] } = useQuery({
    queryKey: ["getItAssetStatus", MasterTypes.IT_ASSET_STATUS],
    queryFn: () => onboarding.getEmployeeCategory(MasterTypes.IT_ASSET_STATUS).then((res) => res.data),
    retry: 1,
  });
  // kept for parity with the legacy view (compliance is shown from `complianceFollowedName`)
  useQuery({
    queryKey: ["getComplianceOptions", MasterTypes.YES_OR_NO],
    queryFn: () => onboarding.getEmployeeCategory(MasterTypes.YES_OR_NO).then((res) => res.data),
    retry: 1,
  });

  const shipmentLabel = getLabelById(pcShipmentOptions, candidateData?.modeOfPcShipmentId);
  const assetStatusLabel = getLabelById(itAssetStatusOptions, candidateData?.itAssetStatusID);
  const dateOfJoining = (personalDetails as any)?.dateOfJoining;

  const items = [
    { key: "joinConfirmed", label: "Join Confirmed", children: candidateData?.isJoinConfirmed ? "Yes" : "No" },
    { key: "pcAllocated", label: "PC Allocated", children: candidateData?.isPCAllocated ? "Yes" : "No" },
    { key: "pcRequestCreatedDate", label: "PC Request Created Date", children: formatDate(candidateData?.pcRequestCreatedDate) },
    { key: "pcRequestRefNo", label: "PC Request Ref No.", children: candidateData?.pcRequestRefNo || "N/A" },
    { key: "pcSerialNo", label: "PC Serial No.", children: candidateData?.pcSerialNo || "N/A" },
    { key: "pcAllocationDate", label: "PC Allocation Date", children: formatDate(candidateData?.pcAllocationDate) },
    { key: "shipment", label: "Mode of PC Shipment", children: shipmentLabel || "N/A" },
    { key: "pcReceivedOn", label: "PC Received On", children: formatDate(candidateData?.pcReceivedOn) },
    { key: "pcConfigurationDate", label: "PC Configuration Date", children: formatDate(candidateData?.pcConfigurationDate) },
    { key: "assetStatus", label: "IT Asset Status", children: assetStatusLabel || "N/A" },
    { key: "compliance", label: "Compliance Followed", children: candidateData?.complianceFollowedName || "N/A" },
    { key: "delay", label: "Delay Category", children: candidateData?.delayCategoryName || "N/A" },
  ];

  return (
    <Card
      title={
        <span className="inline-flex items-center gap-2">
          <BankOutlined /> Asset Details
        </span>
      }
      extra={
        !isPartner && (
          <Row gutter={[12, 12]}>
            <Col>
              <Card size="small">
                <Space>
                  <ClockCircleOutlined />
                  <div>
                    <Typography.Text type="secondary">PC Allocation TAT</Typography.Text>
                    <div>
                      <TatIndicator startDate={dateOfJoining} endDate={candidateData?.pcAllocationDate} />
                    </div>
                  </div>
                </Space>
              </Card>
            </Col>
            <Col>
              <Card size="small">
                <Space>
                  <SettingOutlined />
                  <div>
                    <Typography.Text type="secondary">PC Configuration TAT</Typography.Text>
                    <div>
                      <TatIndicator startDate={dateOfJoining} endDate={candidateData?.pcConfigurationDate} />
                    </div>
                  </div>
                </Space>
              </Card>
            </Col>
          </Row>
        )
      }
    >
      <Descriptions bordered size="small" column={{ xs: 1, md: 2, lg: 3 }} items={items} />
      {candidateData?.comments && (
        <Descriptions bordered size="small" column={1} className="mt-4" items={[{ key: "comments", label: "Comments", children: candidateData.comments }]} />
      )}
    </Card>
  );
}

function getLabelById(list: { id: number; name: string }[], id?: number): string {
  if (!id) return "N/A";
  const item = list.find((option) => option.id === Number(id));
  return item?.name || "N/A";
}

function formatDate(dateStr?: string): string {
  if (!dateStr) return "N/A";
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-IN", { year: "numeric", month: "short", day: "numeric" });
}
