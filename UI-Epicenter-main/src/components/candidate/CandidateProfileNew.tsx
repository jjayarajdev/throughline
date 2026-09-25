"use client";
import { Card, Col, Descriptions, Divider, Empty, Flex, Rate, Row, Space, Tag, Typography } from "antd";
import { ShopOutlined, StarOutlined, TeamOutlined, UserOutlined } from "@ant-design/icons";
import { format, parseISO } from "date-fns";
import { StatusBadge } from "@/components/status-badge";
import { formatDate, formatTime, tatBetween } from "@/helpers/helper";
import { ResumePreview } from "./ResumePreview";

const StarRating = ({ rating }: { rating?: number }) => {
  const safeRating = rating || 0;
  return (
    <Space size={4}>
      <Rate disabled value={safeRating} style={{ fontSize: 12 }} />
      <Typography.Text type="secondary">({safeRating}/5)</Typography.Text>
    </Space>
  );
};

const splitSkills = (skills: unknown) => (typeof skills === "string" ? skills.split(",").filter((s) => s.trim()) : []);

/** Candidate profile: personal details, skills and the full interview history per HRQ. */
export default function CandidateProfile({ data }: { data?: any }) {
  if (!data) {
    return (
      <Card>
        <Empty image={<UserOutlined style={{ fontSize: 48 }} />} description={<Typography.Text type="secondary">Unable to load candidate information</Typography.Text>}>
          <Typography.Title level={5}>No Candidate Data</Typography.Title>
        </Empty>
      </Card>
    );
  }

  const c = {
    fullName: data?.fullName || "Unknown Candidate",
    email: data?.email || "N/A",
    phoneNumber: data?.phoneNumber || "N/A",
    cityName: data?.cityName || "N/A",
    state: data?.state || "N/A",
    country: data?.country || "N/A",
    candidateCode: data?.candidateCode || "N/A",
    currentLastOrganisation: data?.currentLastOrganisation || "N/A",
    lastWorkingDate: data?.lastWorkingDate || null,
    noticePeriodDays: data?.noticePeriodDays || 0,
    relevantExperienceYears: data?.relevantExperienceYears || 0,
    currentlyWorking: data?.currentlyWorking || "N/A",
    diversity: data?.diversity || "N/A",
    referredByEmail: data?.referredByEmail || null,
    primarySkills: splitSkills(data?.primarySkills),
    secondarySkills: splitSkills(data?.secondarySkills),
    candidateHistory: (data?.candidateHistory || []) as any[],
    resume: data?.resume || null,
  };

  return (
    <Flex vertical gap={16}>
      <Card>
        <Descriptions bordered size="small" column={{ xs: 1, md: 2, xl: 3 }}>
          <Descriptions.Item label="Candidate Name">{c.fullName}</Descriptions.Item>
          <Descriptions.Item label="Email">{c.email}</Descriptions.Item>
          <Descriptions.Item label="Phone">{c.phoneNumber}</Descriptions.Item>
          <Descriptions.Item label="Location">{`${c.cityName}, ${c.state}, ${c.country}`}</Descriptions.Item>
          <Descriptions.Item label="Candidate Code">{c.candidateCode}</Descriptions.Item>
          <Descriptions.Item label="Current Organisation">{c.currentLastOrganisation}</Descriptions.Item>
          <Descriptions.Item label="Last Working Date">{formatDate(c.lastWorkingDate)}</Descriptions.Item>
          <Descriptions.Item label="Notice Period">{`${c.noticePeriodDays} days`}</Descriptions.Item>
          <Descriptions.Item label="Experience">{`${c.relevantExperienceYears} years`}</Descriptions.Item>
          <Descriptions.Item label="Currently Working">{c.currentlyWorking}</Descriptions.Item>
          <Descriptions.Item label="Diversity">{c.diversity}</Descriptions.Item>
          {c.referredByEmail && <Descriptions.Item label="Referred By">{c.referredByEmail}</Descriptions.Item>}
          {c.resume?.attachmentURL && (
            <Descriptions.Item label="Resume">
              <ResumePreview url={c.resume.attachmentURL} fileName={c.resume.fileName || "Resume"} />
            </Descriptions.Item>
          )}
        </Descriptions>

        <Divider titlePlacement="left">Skills</Divider>
        <Row gutter={[16, 16]}>
          <Col xs={24} md={12}>
            <Typography.Text strong>Primary Skills</Typography.Text>
            <Flex wrap gap={4} className="mt-2">
              {c.primarySkills.length ? (
                c.primarySkills.map((skill, idx) => (
                  <Tag key={idx} color="blue">
                    {skill.trim()}
                  </Tag>
                ))
              ) : (
                <Typography.Text type="secondary">No primary skills listed</Typography.Text>
              )}
            </Flex>
          </Col>
          <Col xs={24} md={12}>
            <Typography.Text strong>Secondary Skills</Typography.Text>
            <Flex wrap gap={4} className="mt-2">
              {c.secondarySkills.length ? (
                c.secondarySkills.map((skill, idx) => (
                  <Tag key={idx} color="cyan">
                    {skill.trim()}
                  </Tag>
                ))
              ) : (
                <Typography.Text type="secondary">No secondary skills listed</Typography.Text>
              )}
            </Flex>
          </Col>
        </Row>
      </Card>

      <Card
        title={
          <Space>
            <ShopOutlined />
            Interview History
            <Tag color="blue">
              {c.candidateHistory.length} {c.candidateHistory.length === 1 ? "application" : "applications"}
            </Tag>
          </Space>
        }
      >
        {c.candidateHistory.length > 0 ? (
          <Flex vertical gap={16}>
            {c.candidateHistory.map((history: any, idx: number) => (
              <Card
                key={idx}
                type="inner"
                title={
                  <Space wrap>
                    <Tag color="blue">{history?.hrqId || "N/A"}</Tag>
                    <Typography.Text strong>{history?.roleHiredFor || "Unknown Role"}</Typography.Text>
                    <Typography.Text type="secondary">Partner: {history?.partner || "N/A"}</Typography.Text>
                    <StatusBadge status={history?.hiringStatus || "Unknown"} />
                  </Space>
                }
                extra={
                  <Space>
                    {history?.candidateInterviewFeedback?.length > 0 && <Tag>{history.candidateInterviewFeedback.length} interview rounds</Tag>}
                    <Typography.Text type="secondary">TAT: {tatBetween(history?.tatDate, history?.tatEndDate) || "N/A"}</Typography.Text>
                  </Space>
                }
              >
                {history?.candidateInterviewFeedback?.length > 0 ? (
                  <Flex vertical gap={16}>
                    {history.candidateInterviewFeedback.map((feedback: any, i: number) => (
                      <div key={i}>
                        <Flex justify="space-between" align="center" className="mb-2">
                          <Space>
                            <Tag color="blue">{i + 1}</Tag>
                            <Typography.Text strong>{feedback?.interviewRoundName || "Unknown Round"}</Typography.Text>
                          </Space>
                          <StatusBadge status={feedback?.candidateInterviewStatusName || "Unknown"} />
                        </Flex>
                        <Descriptions size="small" column={{ xs: 1, md: 2, xl: 3 }}>
                          <Descriptions.Item label={<Space><TeamOutlined />Panel Members</Space>}>{feedback?.interviewPanelNames || "N/A"}</Descriptions.Item>
                          <Descriptions.Item label="Interview Date/Time">{`${formatDate(feedback?.interviewDate)} at ${formatTime(feedback?.interviewTime)}`}</Descriptions.Item>
                          <Descriptions.Item label="Interview Mode">{feedback?.interviewModeName || "N/A"}</Descriptions.Item>
                          <Descriptions.Item label="Feedback Given By">{`${feedback?.feedbackGivenByUserName || "N/A"}-${feedback?.feedbackGivenByUserRoleName || "N/A"}`}</Descriptions.Item>
                          <Descriptions.Item label="Feedback Date/Time">
                            {feedback?.feedbackGivenOn
                              ? `${formatDate(feedback.feedbackGivenOn)} at ${formatTime(format(parseISO(feedback.feedbackGivenOn), "HH:mm:ss"))}`
                              : "N/A"}
                          </Descriptions.Item>
                          <Descriptions.Item label="TAT(in days)">{tatBetween(feedback?.interviewDate, feedback?.feedbackGivenOn)}</Descriptions.Item>
                        </Descriptions>

                        {feedback?.comments && (
                          <Typography.Paragraph className="mt-2">
                            <Typography.Text strong>Interview Comments: </Typography.Text>
                            {feedback.comments}
                          </Typography.Paragraph>
                        )}

                        {feedback?.feedbackCategoryDetails?.length > 0 && (
                          <>
                            <Divider titlePlacement="left" plain>
                              <Space>
                                <StarOutlined />
                                Detailed Feedback & Ratings
                              </Space>
                            </Divider>
                            <Row gutter={[12, 12]}>
                              {feedback.feedbackCategoryDetails.map((fc: any, j: number) => (
                                <Col xs={24} md={12} key={j}>
                                  <Card size="small">
                                    <Flex justify="space-between" align="center">
                                      <Typography.Text strong>{fc?.criteriaOptionName || "Unknown Criteria"}</Typography.Text>
                                      <StarRating rating={fc?.rating} />
                                    </Flex>
                                    {fc?.comments && (
                                      <Typography.Paragraph type="secondary" className="mt-2" style={{ marginBottom: 0 }}>
                                        <Typography.Text strong>Feedback:</Typography.Text> {fc.comments}
                                      </Typography.Paragraph>
                                    )}
                                  </Card>
                                </Col>
                              ))}
                            </Row>
                          </>
                        )}
                      </div>
                    ))}
                  </Flex>
                ) : (
                  <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No interview rounds available for this application" />
                )}
              </Card>
            ))}
          </Flex>
        ) : (
          <Empty description={<Typography.Text type="secondary">This candidate hasn&apos;t been through any interview processes yet.</Typography.Text>}>
            <Typography.Title level={5}>No Interview History</Typography.Title>
          </Empty>
        )}
      </Card>
    </Flex>
  );
}
