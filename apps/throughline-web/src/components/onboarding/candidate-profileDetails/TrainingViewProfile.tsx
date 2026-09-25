"use client";
import { List } from "@/components/throughline/List";

import { Button, Card, Descriptions, Flex, Space, Tag, Typography } from "antd";
import { BookOutlined, CalendarOutlined, CheckCircleOutlined, CloseCircleOutlined, DownloadOutlined, FileTextOutlined } from "@ant-design/icons";
import { useQuery } from "@tanstack/react-query";
import { MasterTypes } from "@/constants/masterTypes";
import { onboarding } from "@/services/api/onboarding.api";
import { isPartner } from "@/store/userStore";
import { TatIndicator } from "../ITPCSetup";

interface Attachment {
  id: number;
  attachmentName: string;
  attachmentURL: string;
}

interface TrainingProfileData {
  trainingSharedOn?: string;
  trainingCompleted?: string;
  orientationDate?: string;
  orientationStatusName?: string;
  rcmsUploadStatusName?: string;
  reasonForReschedule?: string;
  resumeUploaded?: Attachment;
  isTrainingCompleted?: boolean;
  orientationCompletionDate?: string;
  releaseToOperationsDate?: string;
  trainingModuleIds?: number[];
  orientationSharedOn?: string;
  rescheduleOrientationDate?: string;
  sessionTakenByManagerName?: string;
  isMovedToManager?: boolean;
  isOrientationCompleted?: boolean;
}

interface IProps {
  dateOfJoining?: string;
}

type Module = { id: number; name: string };

export default function TrainingViewProfile({ candidateData, personalDetails }: { candidateData: TrainingProfileData; personalDetails: IProps }) {
  const { data: TRAINING_MODULE = [], isFetched: isTrainingFetched } = useQuery({
    queryKey: ["getOrientationStatus", MasterTypes.TRAINING_MODULE],
    queryFn: () => onboarding.getEmployeeCategory(MasterTypes.TRAINING_MODULE).then((res) => res.data),
    retry: 1,
  });

  const assignedModuleIds = candidateData?.trainingModuleIds || [];
  const completedModules = (TRAINING_MODULE as Module[]).filter((mod) => assignedModuleIds.includes(mod.id));
  const pendingModules = (TRAINING_MODULE as Module[]).filter((mod) => !assignedModuleIds.includes(mod.id));

  const sectionTitle = (title: string, endDate?: string) => (
    <Flex justify="space-between" align="center" wrap gap={8}>
      <span>{title}</span>
      {!isPartner && <TatIndicator startDate={personalDetails?.dateOfJoining} endDate={endDate} />}
    </Flex>
  );

  return (
    <Card
      title={
        <span className="inline-flex items-center gap-2">
          <CalendarOutlined /> Training Details
        </span>
      }
    >
      <Flex vertical gap={16}>
        <Card size="small" title={sectionTitle("Training", candidateData?.trainingCompleted)}>
          <Descriptions
            bordered
            size="small"
            column={{ xs: 1, md: 2, lg: 3 }}
            items={[
              { key: "sharedOn", label: "Training Shared On", children: formatDate(candidateData?.trainingSharedOn) },
              { key: "completed", label: "Training Completed", children: candidateData?.isTrainingCompleted ? "Yes" : "No" },
              { key: "completedDate", label: "Training Completed Date", children: formatDate(candidateData?.trainingCompleted) },
            ]}
          />
        </Card>

        <Card size="small" title={sectionTitle("Release to Operations", candidateData?.releaseToOperationsDate)}>
          <Descriptions
            bordered
            size="small"
            column={{ xs: 1, md: 2 }}
            items={[
              { key: "releaseDate", label: "Release To Operations Date", children: formatDate(candidateData?.releaseToOperationsDate) },
              { key: "moved", label: "Moved To Manager", children: candidateData?.isMovedToManager ? "Yes" : "No" },
            ]}
          />
        </Card>

        <Card size="small" title={sectionTitle("Orientation", candidateData?.orientationCompletionDate)}>
          <Descriptions
            bordered
            size="small"
            column={{ xs: 1, md: 2, lg: 3 }}
            items={[
              { key: "scheduledOn", label: "Orientation Scheduled On Date", children: formatDate(candidateData?.orientationSharedOn) },
              { key: "isCompleted", label: "Orientation Completed", children: candidateData?.isOrientationCompleted ? "Yes" : "No" },
              { key: "completedDate", label: "Orientation Completed", children: formatDate(candidateData?.orientationCompletionDate) },
              { key: "status", label: "Orientation Status", children: candidateData?.orientationStatusName || "N/A" },
              { key: "rescheduleDate", label: "Reschedule Orientation Date", children: formatDate(candidateData?.rescheduleOrientationDate) },
              { key: "reason", label: "Reason for Reschedule", children: candidateData?.reasonForReschedule || "N/A" },
              { key: "session", label: "Session Taken By Managers", children: candidateData?.sessionTakenByManagerName || "N/A" },
              { key: "rcms", label: "RCMS Upload Status", children: candidateData?.rcmsUploadStatusName || "N/A" },
            ]}
          />
        </Card>

        <div>
          <Typography.Text type="secondary">Resume Uploaded</Typography.Text>
          {candidateData?.resumeUploaded?.attachmentName && (
            <Card size="small" className="mt-2" style={{ maxWidth: 540 }}>
              <Flex justify="space-between" align="center" gap={8}>
                <Space>
                  <FileTextOutlined />
                  <Typography.Text>{candidateData.resumeUploaded.attachmentName}</Typography.Text>
                </Space>
                <Button
                  size="small"
                  icon={<DownloadOutlined />}
                  onClick={() => {
                    if (candidateData.resumeUploaded?.attachmentURL) window.open(candidateData.resumeUploaded.attachmentURL, "_blank");
                  }}
                />
              </Flex>
            </Card>
          )}
        </div>

        <Card
          size="small"
          title={
            <span className="inline-flex items-center gap-2">
              <BookOutlined /> All Training Modules
            </span>
          }
        >
          {isTrainingFetched ? (
            TRAINING_MODULE.length > 0 ? (
              <Flex vertical gap={12}>
                {completedModules.length > 0 && (
                  <List
                    size="small"
                    header={
                      <Tag color="green" icon={<CheckCircleOutlined />}>
                        Completed
                      </Tag>
                    }
                    dataSource={completedModules}
                    renderItem={(mod) => (
                      <List.Item>
                        <Typography.Text type="success">{mod.name}</Typography.Text>
                      </List.Item>
                    )}
                  />
                )}
                {pendingModules.length > 0 && (
                  <List
                    size="small"
                    header={
                      <Tag color="red" icon={<CloseCircleOutlined />}>
                        Pending
                      </Tag>
                    }
                    dataSource={pendingModules}
                    renderItem={(mod) => (
                      <List.Item>
                        <Typography.Text type="danger">{mod.name}</Typography.Text>
                      </List.Item>
                    )}
                  />
                )}
              </Flex>
            ) : (
              <Typography.Text type="secondary" italic>
                No modules found.
              </Typography.Text>
            )
          ) : (
            <Typography.Text type="secondary" italic>
              Fetching modules...
            </Typography.Text>
          )}
        </Card>
      </Flex>
    </Card>
  );
}

function formatDate(dateStr?: string): string {
  if (!dateStr) return "N/A";
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-IN", { year: "numeric", month: "short", day: "numeric" });
}
