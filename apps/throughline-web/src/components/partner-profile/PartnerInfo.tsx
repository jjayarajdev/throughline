"use client";
import { Card, Descriptions } from "antd";
import { StatusBadge } from "@/components/status-badge";

interface PartnerInfoProps {
  partner: any;
}

/** Key partner facts (ID, name, start date, status, tenure, city). */
export function PartnerInfo({ partner }: PartnerInfoProps) {
  return (
    <Card>
      <Descriptions size="small" column={{ xs: 1, md: 2 }}>
        <Descriptions.Item label="Partner ID">{partner?.partnerCode || "-"}</Descriptions.Item>
        <Descriptions.Item label="Partner Name">{partner?.partnerName || "-"}</Descriptions.Item>
        <Descriptions.Item label="Start Date">{partner?.startDate?.split("T")[0] || "-"}</Descriptions.Item>
        <Descriptions.Item label="Status">{partner?.partnerStatusName ? <StatusBadge status={partner.partnerStatusName} /> : "-"}</Descriptions.Item>
        <Descriptions.Item label="Partner Tenure in the System (In Days)">{partner?.partnerTenureInDays || "N/A"}</Descriptions.Item>
        <Descriptions.Item label="City">{partner?.cityName || "-"}</Descriptions.Item>
      </Descriptions>
    </Card>
  );
}
