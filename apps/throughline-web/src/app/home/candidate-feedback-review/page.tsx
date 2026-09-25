"use client";
import { useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { format, parseISO } from "date-fns";
import { Button, Card, Col, Descriptions, Divider, Empty, Flex, Rate, Result, Row, Space, Spin, Statistic, Tag, Typography } from "antd";
import { ArrowLeftOutlined, UserOutlined } from "@ant-design/icons";

import { candidateApi } from "@/services/api/candidate.api";
import { StatusBadge } from "@/components/status-badge";
import { formatDate, formatTime, getTatHours, tatBetween } from "@/helpers/helper";
import { EnumType } from "@/constants/slot-status";

const StarRating = ({ rating }: { rating: number }) => (
  <Space size={4}>
    <Rate disabled value={rating} allowHalf style={{ fontSize: 14 }} />
    <Typography.Text strong>{rating}/5</Typography.Text>
  </Space>
);

/** All interview-round feedback for one candidate (`?candidateId=`). */
export default function CandidateFeedbackReview() {
  const searchParams = useSearchParams();
  const candidateId = searchParams.get("candidateId")?.toString() || "";

  const { data: candidateFeedbackData, isLoading, error } = useQuery({
    queryKey: ["hiringViewData", candidateId],
    queryFn: () => candidateApi.getCandidateFeedback(candidateId),
  });

  if (isLoading) return <Spin fullscreen />;
  if (error)
    return (
      <Result
        status="error"
        title="Could not load candidate feedback"
        subTitle={(error as any)?.response?.data?.message || (error as Error).message}
        extra={<Button onClick={() => window.history.back()}>Go Back</Button>}
      />
    );

  const isEmpty = !candidateFeedbackData || Object.keys(candidateFeedbackData).length === 0;
  if (isEmpty)
    return (
      <Flex vertical gap={16} className="p-4">
        <Empty description="No feedback data available for this candidate." />
      </Flex>
    );

  const { candidateName, candidateCode, getCnadidateInterviewRoundFeedbackDetailsDtos } = candidateFeedbackData;
  const rounds: any[] = getCnadidateInterviewRoundFeedbackDetailsDtos ?? [];

  const calculateOverallRating = () => {
    const allFeedback: any[] = rounds.flatMap((round) => round?.feedbackCategoryDetails ?? []);
    return allFeedback.length > 0 ? Math.round((allFeedback.reduce((sum, item) => sum + item.rating, 0) / allFeedback.length) * 10) / 10 : 0;
  };
  const overall = calculateOverallRating();

  return (
    <Flex vertical gap={16} className="p-4">
      <div>
        <Button type="link" icon={<ArrowLeftOutlined />} onClick={() => window.history.back()} style={{ paddingInline: 0 }}>
          Go Back
        </Button>
      </div>

      <Card>
        <Flex justify="space-between" align="center" wrap gap={16}>
          <Space orientation="vertical" size={0}>
            <Typography.Title level={4} style={{ margin: 0 }}>
              <UserOutlined /> Candidate Feedback Summary
            </Typography.Title>
            <Typography.Text strong>
              {candidateName} (<Typography.Link onClick={() => window.history.back()}>{candidateCode}</Typography.Link>)
            </Typography.Text>
          </Space>
          <Space size="large" wrap>
            <Statistic title="Interview Rounds" value={rounds.length} />
            {overall > 0 && (
              <Statistic
                title="Average Rating"
                valueRender={() => <StarRating rating={candidateFeedbackData?.finalStatus === "Rejected" ? 0 : overall} />}
              />
            )}
            <Statistic title="Final Status" valueRender={() => <StatusBadge status={candidateFeedbackData?.finalStatus} />} />
          </Space>
        </Flex>
      </Card>

      {rounds.map((round, index) => {
        const tat = tatBetween(round?.interviewDate, round?.feedbackGivenOn ?? round?.interviewDate);
        const tatOverdue = getTatHours(round?.interviewDate, round?.feedbackGivenOn ? round?.feedbackGivenOn : round?.interviewDate) > EnumType.tat;
        return (
          <Card
            key={round?.interviewSlotId ?? index}
            size="small"
            title={
              <Space wrap>
                <Tag color="blue">{index + 1}</Tag>
                <Typography.Text strong>{round?.interviewRoundName}</Typography.Text>
                <Typography.Text type="secondary">Interview Mode:</Typography.Text>
                <Typography.Text>{round?.interviewModeName}</Typography.Text>
                <Typography.Text type="secondary">Interview Date:</Typography.Text>
                <Typography.Text>
                  {formatDate(round?.interviewDate)}, Time: {formatTime(round?.interviewTime)}
                </Typography.Text>
              </Space>
            }
            extra={
              <Space>
                <StatusBadge color={tatOverdue ? "red" : "green"} status={tat} />
                <StatusBadge status={round?.candidateInterviewStatusName} />
              </Space>
            }
          >
            {round?.panelFeedbackComments && round?.feedbackCategoryDetails?.length === 0 && (
              <Typography.Paragraph>
                <Typography.Text strong>Feedback Comments : </Typography.Text>
                {round?.panelFeedbackComments}
              </Typography.Paragraph>
            )}

            <Descriptions size="small" column={{ xs: 1, md: 2, xl: 4 }}>
              {round?.feedbackGivenByUserName && (
                <Descriptions.Item label="Feedback Given By">
                  {round?.feedbackGivenByUserName} ({round?.feedbackGivenByUserRoleName})
                </Descriptions.Item>
              )}
              {round?.feedbackGivenOn && (
                <Descriptions.Item label="Feedback given On">{format(parseISO(round?.feedbackGivenOn), "dd MMM yyyy, hh:mm a")}</Descriptions.Item>
              )}
              {round?.interviewPanelNames && <Descriptions.Item label="Panel">{round?.interviewPanelNames}</Descriptions.Item>}
              {round?.interviewAdditionalPanelNames && <Descriptions.Item label="Additional Panel">{round?.interviewAdditionalPanelNames}</Descriptions.Item>}
            </Descriptions>

            {round?.feedbackCategoryDetails?.length > 0 && (
              <>
                <Divider titlePlacement="left" plain>
                  Feedback Categories
                </Divider>
                <Row gutter={[12, 12]}>
                  {round.feedbackCategoryDetails.map((feedback: any, idx: number) => (
                    <Col xs={24} key={idx}>
                      <Flex justify="space-between" align="center" wrap gap={8}>
                        <Typography.Text>
                          <Typography.Text strong>{feedback.criteriaOptionName} : </Typography.Text>
                          <Typography.Text type="secondary">{feedback.comments}</Typography.Text>
                        </Typography.Text>
                        <StarRating rating={feedback.rating} />
                      </Flex>
                    </Col>
                  ))}
                </Row>
              </>
            )}
          </Card>
        );
      })}
    </Flex>
  );
}
