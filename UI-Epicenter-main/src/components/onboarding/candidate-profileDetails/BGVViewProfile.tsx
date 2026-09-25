"use client";
import { List } from "@/components/throughline/List";

import { Button, Card, Col, Descriptions, Flex, Input, Row, Tag, Typography } from "antd";
import { DownloadOutlined, FileTextOutlined, SafetyCertificateOutlined } from "@ant-design/icons";
import { useQuery } from "@tanstack/react-query";
import { MasterTypes } from "@/constants/masterTypes";
import { dropdownApi } from "@/services/api/master";
import { isPartner } from "@/store/userStore";
import { TatIndicator } from "../ITPCSetup";

interface Attachment {
  attachmentName?: string;
  attachmentURL?: string;
}

interface BGVProfileData {
  startDate?: string;
  vendorName?: string;
  pguName?: string;
  ndaAvailability?: boolean;
  cdaAvailability?: boolean;
  ndaAvailabilityDoc?: Attachment;
  cdaAvailabilityDoc?: Attachment;
  isBGVAvailableWithPartner?: boolean;
  bgvCompletionDate?: string;
  bgvCategoryId?: string;
  bgvStatusId?: string;
  uploadBGVDoc?: Attachment;
  candidateBGVCompleted?: boolean;
  comments?: string;
}
interface IProps {
  personalDetails: any;
}

export default function BGVViewProfile({ candidateData, personalDetails }: { candidateData: BGVProfileData; personalDetails: IProps }) {
  const { data: bgvCategory = [] } = useQuery({
    queryKey: ["categoryPguData", MasterTypes.BGV_CATEGORY],
    queryFn: () => dropdownApi.fetchDropdown(MasterTypes.BGV_CATEGORY),
    retry: 1,
  });
  const { data: bgvStatusTypes = [] } = useQuery({
    queryKey: ["categoryPguData", MasterTypes.BGV_STATUS_TYPES],
    queryFn: () => dropdownApi.fetchDropdown(MasterTypes.BGV_STATUS_TYPES),
    retry: 1,
  });

  const categoryName = getLabelById(bgvCategory, Number(candidateData?.bgvCategoryId));
  const bgvStatusName = getLabelById(bgvStatusTypes, Number(candidateData?.bgvStatusId));
  const dateOfJoining = (personalDetails as any)?.dateOfJoining;

  const docs = [
    ...(candidateData?.ndaAvailabilityDoc?.attachmentName ? [{ label: "NDA Document", doc: candidateData.ndaAvailabilityDoc }] : []),
    ...(candidateData?.cdaAvailabilityDoc?.attachmentName ? [{ label: "CDA Document", doc: candidateData.cdaAvailabilityDoc }] : []),
  ];

  return (
    <Card
      title={
        <span className="inline-flex items-center gap-2">
          <SafetyCertificateOutlined /> Background Verification (BGV)
        </span>
      }
    >
      <Flex vertical gap={24}>
        <div>
          {!isPartner && (
            <Flex justify="space-between" align="center" wrap gap={8} className="mb-3">
              <Typography.Title level={5} style={{ margin: 0 }}>
                Basic Information
              </Typography.Title>
              <TatIndicator startDate={dateOfJoining} endDate={candidateData?.bgvCompletionDate} />
            </Flex>
          )}
          <Descriptions
            bordered
            size="small"
            column={{ xs: 1, md: 2, lg: 3 }}
            items={[
              { key: "startDate", label: "Start Date", children: formatDate(candidateData?.startDate) },
              { key: "vendor", label: "Vendor", children: candidateData?.vendorName || "N/A" },
              { key: "pgu", label: "PGU ID", children: candidateData?.pguName || "N/A" },
              { key: "nda", label: "NDA Availability", children: renderBool(candidateData?.ndaAvailability) },
              { key: "cda", label: "CDA Availability", children: renderBool(candidateData?.cdaAvailability) },
            ]}
          />
          <Row gutter={[16, 16]} className="mt-4">
            <Col xs={24} lg={12}>
              {docs.length > 0 && <DocumentList docs={docs} />}
            </Col>
            <Col xs={24} lg={12}>
              <Card size="small" title="Status">
                <Tag color={candidateData?.candidateBGVCompleted ? "green" : "red"}>{candidateData?.candidateBGVCompleted ? "Accept" : "Reject"}</Tag>
                <Typography.Text strong className="mt-3" style={{ display: "block" }}>
                  Comments
                </Typography.Text>
                <Input.TextArea placeholder="Add comments..." value={candidateData?.comments} rows={4} readOnly className="mt-1" />
              </Card>
            </Col>
          </Row>
        </div>

        <div>
          <Typography.Title level={5}>BGV Status</Typography.Title>
          <Descriptions
            bordered
            size="small"
            column={{ xs: 1, md: 2, lg: 3 }}
            items={[
              { key: "withPartner", label: "BGV Available With Partner", children: renderBool(candidateData?.isBGVAvailableWithPartner) },
              { key: "completionDate", label: "BGV Completion Date", children: formatDate(candidateData?.bgvCompletionDate) },
              { key: "category", label: "BGV Category ID", children: categoryName || "N/A" },
              { key: "status", label: "BGV Status ID", children: bgvStatusName || "N/A" },
            ]}
          />
          {candidateData?.uploadBGVDoc?.attachmentName && (
            <div className="mt-4">
              <DocumentList docs={[{ label: "BGV Document", doc: candidateData.uploadBGVDoc }]} />
            </div>
          )}
        </div>
      </Flex>
    </Card>
  );
}

function DocumentList({ docs }: { docs: { label: string; doc: Attachment }[] }) {
  return (
    <List
      size="small"
      bordered
      dataSource={docs}
      renderItem={({ label, doc }) => (
        <List.Item actions={[<Button key="dl" size="small" icon={<DownloadOutlined />} href={doc.attachmentURL} target="_blank" rel="noopener noreferrer" />]}>
          <List.Item.Meta
            avatar={<FileTextOutlined />}
            title={
              <Typography.Text ellipsis>
                {label}: {doc.attachmentName}
              </Typography.Text>
            }
          />
        </List.Item>
      )}
    />
  );
}

function formatDate(dateStr?: string): string {
  if (!dateStr) return "N/A";
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-IN", { year: "numeric", month: "short", day: "numeric" });
}

function renderBool(value?: boolean): string {
  if (value === true) return "Yes";
  if (value === false) return "No";
  return "N/A";
}

function getLabelById(list: { id: number; name: string }[], id?: number): string {
  if (!id) return "N/A";
  const item = list.find((option) => option.id === Number(id));
  return item?.name || "N/A";
}
