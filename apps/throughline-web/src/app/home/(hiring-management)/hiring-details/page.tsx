"use client";
import { useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Avatar, Button, Card, Col, Descriptions, Empty, Flex, Result, Row, Space, Spin, Tabs, Tag, Typography } from "antd";
import { ArrowLeftOutlined, BankOutlined, CalendarOutlined, DownloadOutlined, ExportOutlined, FileTextOutlined, ShopOutlined, StarOutlined, TeamOutlined } from "@ant-design/icons";
import { format } from "date-fns";
import { hiringApi } from "@/services/api/hiring.api";
import { errorMessage } from "@/components/hiring-forms/shared";

const formatFieldName = (key: string): string => {
  if (key === "hrqId") return "HRQ ID";
  if (key === "jobTitle") return "Role Hired For";
  return key
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (str) => str.toUpperCase())
    .trim();
};

const formatValue = (key: string, value: any): React.ReactNode => {
  if (value === null || value === undefined || value === "") return "-";
  if (key.includes("Date") && typeof value === "string") {
    try {
      return format(new Date(value), "MMM dd, yyyy");
    } catch {
      return value;
    }
  }
  return value;
};

const filterFields = (obj: Record<string, any>): [string, any][] =>
  Object.entries(obj).filter(([key, value]) => {
    if (key.includes("Experience")) return true;
    if (key === "hrqId") return true;
    if ((key.toLowerCase().includes("id") && key !== "hrqId") || typeof value === "boolean" || (typeof value === "number" && !key.includes("Experience"))) return false;
    return true;
  });

const getInitials = (name: string | undefined | null): string => {
  if (!name) return "??";
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .toUpperCase()
    .substring(0, 2);
};

/** Read-only view of a hiring request: details, interview rounds and calibration sessions. */
export default function HiringDetailsPage() {
  const searchParams = useSearchParams();
  const hrqId = searchParams.get("hrqid")?.toString() || "";
  const { data: hiringData, isLoading, error } = useQuery({
    queryKey: ["hiringViewData", hrqId],
    queryFn: () => hiringApi.getHiringView(hrqId),
  });

  if (isLoading) return <Spin fullscreen />;
  if (error) return <Result status="error" title="Could not load hiring details" subTitle={errorMessage(error)} />;

  const { viewHiringDetails = {}, viewJobDetails = {}, viewInterviewRounds = [], viewCalibrationDetails = [] } = (hiringData || {}) as any;

  const detailsTab = (
    <Row gutter={[16, 16]}>
      <Col xs={24} md={12}>
        <Card
          size="small"
          title={
            <Space>
              <ShopOutlined />
              Hiring Information
            </Space>
          }
        >
          <Descriptions bordered size="small" column={1} items={filterFields(viewHiringDetails).map(([key, value]) => ({ key, label: formatFieldName(key), children: formatValue(key, value) }))} />
        </Card>
      </Col>
      <Col xs={24} md={12}>
        <Card
          size="small"
          title={
            <Space>
              <FileTextOutlined />
              Job Information
            </Space>
          }
        >
          {Object.keys(viewJobDetails).length > 0 ? (
            <Descriptions
              bordered
              size="small"
              column={1}
              items={filterFields(viewJobDetails)
                .filter(([key]) => key !== "jobDescription")
                .map(([key, value]) => ({
                  key,
                  label: formatFieldName(key),
                  children: key.includes("Experience") ? <Tag color="green">{value} years</Tag> : formatValue(key, value),
                }))}
            />
          ) : (
            <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No job details available" />
          )}
        </Card>
      </Col>
      {viewJobDetails?.jobDescription && (
        <Col span={24}>
          <Card
            size="small"
            title={
              <Space>
                <FileTextOutlined />
                Job Description
              </Space>
            }
          >
            <Typography.Paragraph style={{ whiteSpace: "pre-wrap", marginBottom: 0 }}>{formatValue("jobDescription", viewJobDetails.jobDescription)}</Typography.Paragraph>
          </Card>
        </Col>
      )}
    </Row>
  );

  const interviewsTab = (
    <Flex vertical gap={12}>
      <div>
        <Typography.Title level={5} style={{ margin: 0 }}>
          Interview Process
        </Typography.Title>
        <Typography.Text type="secondary">The hiring process consists of {viewInterviewRounds.length} interview rounds</Typography.Text>
      </div>
      {viewInterviewRounds.map((round: any, index: number) => (
        <Card
          key={index}
          size="small"
          title={
            <Space>
              <Avatar size="small" style={{ verticalAlign: "middle" }}>
                {round.roundNumber}
              </Avatar>
              <span>{round.roundNameName}</span>
              <Typography.Text type="secondary">{round.modeOfInterviewName}</Typography.Text>
            </Space>
          }
          extra={<Tag color="green">{round.modeOfInterviewName}</Tag>}
        >
          <Row gutter={[16, 12]}>
            <Col xs={24} md={12}>
              <Typography.Text type="secondary">Panel Members</Typography.Text>
              <Flex wrap gap={6} className="mt-1">
                {round.panelNames?.split(",").map((name: string, idx: number) => (
                  <Tag key={idx} icon={<Avatar size={18}>{getInitials(name.trim())}</Avatar>} style={{ paddingInlineStart: 4 }}>
                    {name.trim()}
                  </Tag>
                ))}
              </Flex>
            </Col>
            <Col xs={24} md={12}>
              <Typography.Text type="secondary">Comments</Typography.Text>
              <Typography.Paragraph style={{ marginBottom: 0 }}>{round.comments || "-"}</Typography.Paragraph>
            </Col>
            {round.feedbackCritriaOptions && round.feedbackCritriaOptions.length > 0 && (
              <Col span={24}>
                <Typography.Text type="secondary">Feedback Criteria</Typography.Text>
                <Flex wrap gap={6} className="mt-1">
                  {round.feedbackCritriaOptions.map((c: { name: string }, idx: number) => (
                    <Tag key={idx}>
                      {idx + 1}. {c.name}
                    </Tag>
                  ))}
                </Flex>
              </Col>
            )}
          </Row>
        </Card>
      ))}
    </Flex>
  );

  const calibrationTab =
    viewCalibrationDetails.length > 0 ? (
      <Flex vertical gap={12}>
        {viewCalibrationDetails.map((calibration: any, index: number) => (
          <Card
            key={index}
            size="small"
            title={
              <Space>
                <StarOutlined />
                Calibration Session
              </Space>
            }
            extra={
              <Tag color="green" icon={<CalendarOutlined />}>
                {formatValue("calibrationDate", calibration.calibrationDate)}
              </Tag>
            }
          >
            <Descriptions
              bordered
              size="small"
              column={{ xs: 1, md: 2 }}
              items={[
                {
                  key: "attendees",
                  label: "Attendees",
                  children: (
                    <Space>
                      <Avatar size="small">{getInitials(calibration.attendees)}</Avatar>
                      {calibration.attendees || "-"}
                    </Space>
                  ),
                },
                {
                  key: "certifications",
                  label: "Certifications",
                  children: calibration.certifications !== "NA" ? <Tag color="green">{calibration.certifications}</Tag> : <Typography.Text type="secondary">No certifications required</Typography.Text>,
                },
                { key: "comments", label: "Comments", span: 2, children: calibration.comments || "-" },
                ...(calibration.documents
                  ? [
                      {
                        key: "documents",
                        label: "Documents",
                        span: 2,
                        children: (
                          <Flex justify="space-between" align="center" wrap gap={8}>
                            <Space>
                              <FileTextOutlined />
                              <Typography.Text strong>{calibration.documents.attachmentName}</Typography.Text>
                            </Space>
                            <Space>
                              <Typography.Link href={calibration.documents.attachmentURL} target="_blank">
                                <ExportOutlined /> View
                              </Typography.Link>
                              <Typography.Link href={calibration.documents.attachmentURL} download>
                                <DownloadOutlined /> Download
                              </Typography.Link>
                            </Space>
                          </Flex>
                        ),
                      },
                    ]
                  : []),
              ]}
            />
          </Card>
        ))}
      </Flex>
    ) : (
      <Card size="small">
        <Empty description={<span>No Calibration Information</span>}>
          <Typography.Text type="secondary">No calibration sessions have been scheduled or conducted yet for this hiring request.</Typography.Text>
        </Empty>
      </Card>
    );

  return (
    <Flex vertical gap={16} className="p-4">
      <div>
        <Button type="link" icon={<ArrowLeftOutlined />} onClick={() => window.history.back()} style={{ paddingInline: 0 }}>
          Go Back
        </Button>
      </div>

      <Card>
        <Flex justify="space-between" align="center" wrap gap={12}>
          <Flex vertical gap={6}>
            <Space>
              <Tag color="green">{viewHiringDetails.hrqId}</Tag>
              <Tag color="blue">{viewHiringDetails.hiringTypeName}</Tag>
            </Space>
            <Typography.Title level={4} style={{ margin: 0 }}>
              {viewHiringDetails.jobTitle}
            </Typography.Title>
            <Space wrap size="middle">
              <Typography.Text type="secondary">
                <ShopOutlined /> {viewHiringDetails.projectName}
              </Typography.Text>
              <Typography.Text type="secondary">
                <BankOutlined /> {viewHiringDetails.businessName}
              </Typography.Text>
              <Typography.Text type="secondary">
                <CalendarOutlined /> {formatValue("requestStartDate", viewHiringDetails.requestStartDate)}
              </Typography.Text>
            </Space>
          </Flex>
          <Flex vertical align="flex-end" gap={4}>
            <Typography.Text type="secondary">Domain</Typography.Text>
            <Tag>{viewHiringDetails.domainName}</Tag>
          </Flex>
        </Flex>
      </Card>

      <Tabs
        defaultActiveKey="details"
        items={[
          { key: "details", label: "Details", icon: <FileTextOutlined />, children: detailsTab },
          { key: "interviews", label: "Interview Rounds", icon: <TeamOutlined />, children: interviewsTab },
          { key: "calibration", label: "Calibration", icon: <StarOutlined />, children: calibrationTab },
        ]}
      />
    </Flex>
  );
}
