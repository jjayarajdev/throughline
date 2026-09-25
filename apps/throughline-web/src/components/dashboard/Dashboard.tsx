"use client";
import React from "react";
import { useQuery } from "@tanstack/react-query";
import { Button, Card, Col, Flex, Result, Row, Skeleton, Space, Statistic, Typography, theme } from "antd";
import {
  AimOutlined,
  CalendarOutlined,
  CarryOutOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  CommentOutlined,
  ExclamationCircleOutlined,
  FileTextOutlined,
  MessageOutlined,
  RiseOutlined,
  TeamOutlined,
  UserSwitchOutlined,
} from "@ant-design/icons";
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip as ChartTooltip, XAxis, YAxis } from "recharts";
import { hiringApi } from "@/services/api/hiring.api";
import { isAdmin, isDomainManager, isHiringManager, isPanel, isRmowner } from "@/store/userStore";

const { Text, Title } = Typography;

type Tone = "primary" | "success" | "warning" | "error" | "info" | "purple";

function MetricCard({ title, value, icon, tone = "primary", note }: { title: string; value: number | undefined; icon: React.ReactNode; tone?: Tone; note?: React.ReactNode }) {
  const { token } = theme.useToken();
  const color: Record<Tone, string> = {
    primary: token.colorPrimary,
    success: token.colorSuccess,
    warning: token.colorWarning,
    error: token.colorError,
    info: token.colorInfo,
    purple: token.purple6,
  };
  return (
    <Card variant="borderless" style={{ height: "100%" }}>
      <Flex justify="space-between" align="flex-start">
        <Statistic title={title} value={value ?? 0} />
        <span
          style={{
            display: "inline-flex",
            width: 44,
            height: 44,
            borderRadius: "50%",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 20,
            color: color[tone],
            background: `color-mix(in srgb, ${color[tone]} 12%, transparent)`,
          }}
        >
          {icon}
        </span>
      </Flex>
      {note && (
        <Text style={{ color: color[tone], fontSize: 13 }} className="mt-3 inline-flex items-center gap-1">
          {note}
        </Text>
      )}
    </Card>
  );
}

export default function Dashboard() {
  const { token } = theme.useToken();
  const { data, isLoading, error, refetch } = useQuery({ queryKey: ["dashboardData"], queryFn: () => hiringApi.getDashboard() });

  if (error)
    return <Result status="error" title="Could not load the dashboard" subTitle={(error as Error).message} extra={<Button onClick={() => refetch()}>Retry</Button>} />;

  const d = data ?? ({} as any);
  const chartColors = [token.colorPrimary, token.cyan6, token.purple6, token.gold6, token.red6, token.green6, token.magenta6, token.geekblue6];
  const pieData = ((d.candidateStageSummary ?? []) as { name: string; count: number }[]).map((item, i) => ({ ...item, fill: chartColors[i % chartColors.length] }));
  const weekly = (d.weeklySubmissions ?? []) as { name: string; count: number }[];
  const unassigned = d.unassignedHiringRequestCount ?? 0;

  return (
    <Flex vertical gap={16} className="p-4">
      <div>
        <Title level={4} style={{ margin: 0 }}>
          Dashboard
        </Title>
        <Text type="secondary">Overview of your recruitment metrics</Text>
      </div>

      <Skeleton loading={isLoading} active paragraph={{ rows: 6 }}>
        <Row gutter={[16, 16]}>
          {isAdmin && (
            <Col xs={24} md={12} xl={6}>
              <MetricCard title="Active partners" value={d.activePartners} icon={<TeamOutlined />} tone="success" note={<><RiseOutlined /> Active partnerships</>} />
            </Col>
          )}
          <Col xs={24} md={12} xl={6}>
            <MetricCard title="Active candidates" value={d.activeCandidates} icon={<UserSwitchOutlined />} tone="primary" note={<><AimOutlined /> In pipeline</>} />
          </Col>
          <Col xs={24} md={12} xl={6}>
            <MetricCard title="Active requests" value={d.activeRequests} icon={<FileTextOutlined />} tone="purple" note={<><ClockCircleOutlined /> Open positions</>} />
          </Col>
          {(isAdmin || isRmowner || isHiringManager || isDomainManager) && (
            <Col xs={24} md={12} xl={6}>
              <MetricCard
                title="Unassigned requests"
                value={unassigned}
                icon={unassigned > 0 ? <ExclamationCircleOutlined /> : <CheckCircleOutlined />}
                tone={unassigned > 0 ? "error" : "success"}
                note={unassigned > 0 ? <><ExclamationCircleOutlined /> Needs attention</> : <><CheckCircleOutlined /> All assigned</>}
              />
            </Col>
          )}
          {isPanel && (
            <>
              <Col xs={24} md={12} xl={6}>
                <MetricCard title="Interviews scheduled" value={d.interviewsScheduled} icon={<CalendarOutlined />} tone={d.interviewsScheduled > 0 ? "warning" : "success"} />
              </Col>
              <Col xs={24} md={12} xl={6}>
                <MetricCard title="Interviews completed" value={d.interviewsCompleted} icon={<CarryOutOutlined />} tone="info" />
              </Col>
              <Col xs={24} md={12} xl={6}>
                <MetricCard title="Feedback given" value={d.feedbackGiven} icon={<MessageOutlined />} tone="success" />
              </Col>
              <Col xs={24} md={12} xl={6}>
                <MetricCard title="Feedback pending" value={d.feedbackPending} icon={<CommentOutlined />} tone={d.feedbackPending > 0 ? "purple" : "success"} />
              </Col>
            </>
          )}
        </Row>

        <Row gutter={[16, 16]} className="mt-4">
          <Col xs={24} lg={12}>
            <Card
              variant="borderless"
              title={
                <Space>
                  <AimOutlined style={{ color: token.colorPrimary }} />
                  Candidate stage summary
                </Space>
              }
            >
              <div style={{ height: 320 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={120} paddingAngle={2} dataKey="count">
                      {pieData.map((entry, i) => (
                        <Cell key={i} fill={entry.fill} />
                      ))}
                    </Pie>
                    <ChartTooltip contentStyle={{ background: token.colorBgElevated, border: `1px solid ${token.colorBorderSecondary}`, borderRadius: token.borderRadius, color: token.colorText }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <Row gutter={[8, 8]} className="mt-2">
                {pieData.map((item, i) => (
                  <Col xs={12} key={i}>
                    <Space size={6}>
                      <span style={{ display: "inline-block", width: 10, height: 10, borderRadius: "50%", background: item.fill }} />
                      <Text>{item.name}</Text>
                      <Text strong>({item.count})</Text>
                    </Space>
                  </Col>
                ))}
              </Row>
            </Card>
          </Col>
          <Col xs={24} lg={12}>
            <Card
              variant="borderless"
              title={
                <Space>
                  <RiseOutlined style={{ color: token.colorPrimary }} />
                  Weekly profile submissions
                </Space>
              }
            >
              <div style={{ height: 320 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={weekly} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={token.colorBorderSecondary} />
                    <XAxis dataKey="name" stroke={token.colorTextSecondary} fontSize={12} />
                    <YAxis stroke={token.colorTextSecondary} fontSize={12} />
                    <ChartTooltip contentStyle={{ background: token.colorBgElevated, border: `1px solid ${token.colorBorderSecondary}`, borderRadius: token.borderRadius, color: token.colorText }} />
                    <Bar dataKey="count" fill={token.colorPrimary} radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <Card size="small" variant="borderless" style={{ background: token.colorFillAlter }} className="mt-3">
                <Text>
                  Total submissions this week: <Text strong>{weekly.reduce((sum, day) => sum + (day.count ?? 0), 0)}</Text>
                </Text>
              </Card>
            </Card>
          </Col>
        </Row>
      </Skeleton>
    </Flex>
  );
}
