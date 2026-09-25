"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Users,
  UserCheck,
  FileText,
  AlertCircle,
  TrendingUp,
  Target,
  Clock,
  UserX,
  CheckCircle,
  XCircle,
  Search,
  Icon,
  CalendarClock,
  CalendarCheck,
  MessageCircle,
  MessageSquareWarning,
} from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { useQuery } from "@tanstack/react-query";
import { hiringApi } from "@/services/api/hiring.api";
import DashboardSkeleton from "./DashboardSkelton";
import { ErrorHandler } from "../error/ErrorHandler";
import {
  isAdmin,
  isDomainManager,
  isHiringManager,
  isPanel,
  isPartner,
  isRmowner,
} from "@/store/userStore";
import { isMainThread } from "worker_threads";

// Throughline colour palette
const colors = {
  primary: "#1677ff",
  secondary: "#00C4A7",
  accent: "#6366F1",
  warning: "#F59E0B",
  danger: "#EF4444",
  success: "#10B981",
  gray: "#6B7280",
};

// Chart colors for pie chart
const chartColors = [
  colors.primary,
  colors.secondary,
  colors.accent,
  colors.warning,
  colors.danger,
  colors.success,
];

export default function DashboardDemo() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["dashboardData"],
    queryFn: () => hiringApi.getDashboard(),
  });

  if (isLoading) return <DashboardSkeleton />;
  if (error) return <ErrorHandler error={error} />;
  const {
    activePartners,
    activeCandidates,
    activeRequests,
    unassignedHiringRequestCount,
    weeklySubmissions,
    candidateStageSummary,
     interviewsScheduled,
     interviewsCompleted,
     feedbackGiven,
    feedbackPending
  } = data;

  // Prepare data for charts
  const pieData = candidateStageSummary?.map((item, index) => ({
    ...item,
    fill: chartColors[index % chartColors.length],
  }));

  return (
    <div className="min-h-screen p-6">
      <div className=" mx-auto space-y-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold ">Dashboard</h1>
          <p className=" mt-2">
            Overview of your recruitment metrics
          </p>
        </div>

        {/* Key Metrics Cards */}
        <div
          className={`grid grid-cols-1 md:grid-cols-3 lg:${
            isHiringManager || isDomainManager ? "grid-cols-3" : "grid-cols-4"
          } gap-6`}
        >
          {/* Active Partners */}
          {isAdmin && (
            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium ">
                      Active Partners
                    </p>
                    <p className="text-3xl font-bold ">
                      {activePartners}
                    </p>
                  </div>

                  <div className="bg-[#1677ff]/10 p-3 rounded-full">
                    <Users className="w-6 h-6 text-[#1677ff]" />
                  </div>
                </div>
                <div className="mt-4 flex items-center text-sm">
                  <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
                  <span className="text-green-600">Active partnerships</span>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Active Candidates */}
          <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium ">
                    Active Candidates
                  </p>
                  <p className="text-3xl font-bold ">
                    {activeCandidates}
                  </p>
                </div>
                <div className="bg-blue-100 p-3 rounded-full">
                  <UserCheck className="w-6 h-6 text-blue-600" />
                </div>
              </div>
              <div className="mt-4 flex items-center text-sm">
                <Target className="w-4 h-4 text-blue-500 mr-1" />
                <span className="text-blue-600">In pipeline</span>
              </div>
            </CardContent>
          </Card>

          {/* Active Requests */}
          <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium ">
                    Active Requests
                  </p>
                  <p className="text-3xl font-bold ">
                    {activeRequests}
                  </p>
                </div>
                <div className="bg-purple-100 p-3 rounded-full">
                  <FileText className="w-6 h-6 text-purple-600" />
                </div>
              </div>
              <div className="mt-4 flex items-center text-sm">
                <Clock className="w-4 h-4 text-purple-500 mr-1" />
                <span className="text-purple-600">Open positions</span>
              </div>
            </CardContent>
          </Card>

          {/* Unassigned Requests */}
          {(isAdmin || isRmowner || isHiringManager || isDomainManager) && (
            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium ">
                      Unassigned Requests
                    </p>
                    <p className="text-3xl font-bold ">
                      {unassignedHiringRequestCount}
                    </p>
                  </div>
                  <div
                    className={`p-3 rounded-full ${
                      unassignedHiringRequestCount > 0
                        ? "bg-red-100"
                        : "bg-green-100"
                    }`}
                  >
                    {unassignedHiringRequestCount > 0 ? (
                      <AlertCircle className="w-6 h-6 text-red-600" />
                    ) : (
                      <CheckCircle className="w-6 h-6 text-green-600" />
                    )}
                  </div>
                </div>
                <div className="mt-4 flex items-center text-sm">
                  {unassignedHiringRequestCount > 0 ? (
                    <>
                      <AlertCircle className="w-4 h-4 text-red-500 mr-1" />
                      <span className="text-red-600">Needs attention</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4 text-green-500 mr-1" />
                      <span className="text-green-600">All assigned</span>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {(isPanel) && ( <>
    {/* Interviews Scheduled */}
    <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium ">Interviews Scheduled</p>
            <p className="text-3xl font-bold ">{interviewsScheduled}</p>
          </div>
          <div
            className={`p-3 rounded-full ${
              interviewsScheduled > 0 ? "bg-yellow-100" : "bg-green-100"
            }`}
          >
            {interviewsScheduled > 0 ? (
              <CalendarClock className="w-6 h-6 text-yellow-600" />
            ) : (
              <CheckCircle className="w-6 h-6 text-green-600" />
            )}
          </div>
        </div>
      </CardContent>
    </Card>

    {/* Interviews Completed */}
    <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium ">Interviews Completed</p>
            <p className="text-3xl font-bold ">{interviewsCompleted}</p>
          </div>
          <div
            className={`p-3 rounded-full ${
              interviewsCompleted > 0 ? "bg-blue-100" : "bg-gray-100"
            }`}
          >
            <CalendarCheck
              className={`w-6 h-6 ${
                interviewsCompleted > 0 ? "text-blue-600" : "text-gray-400"
              }`}
            />
          </div>
        </div>
      </CardContent>
    </Card>

    {/* Feedback Given */}
    <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium ">Feedback Given</p>
            <p className="text-3xl font-bold ">{feedbackGiven}</p>
          </div>
          <div
            className={`p-3 rounded-full ${
              feedbackGiven > 0 ? "bg-green-100" : "bg-gray-100"
            }`}
          >
            <MessageCircle
              className={`w-6 h-6 ${
                feedbackGiven > 0 ? "text-green-600" : "text-gray-400"
              }`}
            />
          </div>
        </div>
      </CardContent>
    </Card>

    {/* Feedback Pending */}
    <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium ">Feedback Pending</p>
            <p className="text-3xl font-bold ">{feedbackPending}</p>
          </div>
          <div
            className={`p-3 rounded-full ${
              feedbackPending > 0 ? "bg-purple-100" : "bg-green-100"
            }`}
          >
            {feedbackPending > 0 ? (
              <MessageSquareWarning className="w-6 h-6 text-purple-600" />
            ) : (
              <CheckCircle className="w-6 h-6 text-green-600" />
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  </>
          )}
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Candidate Stage Summary */}
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="text-lg font-semibold  flex items-center gap-2">
                <Target className="w-5 h-5 text-[#1677ff]" />
                Candidate Stage Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={120}
                      paddingAngle={2}
                      dataKey="count"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Legend */}
              <div className="grid grid-cols-2 gap-2 mt-4">
                {pieData.map((item, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: item.fill }}
                    />
                    <span className="text-sm ">{item.name}</span>
                    <span className="text-sm font-medium ">
                      ({item.count})
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Weekly Submissions */}
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="text-lg font-semibold  flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-[#1677ff]" />
                Weekly Profile Submissions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={weeklySubmissions}
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="name" stroke="#6B7280" fontSize={12} />
                    <YAxis stroke="#6B7280" fontSize={12} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "white",
                        border: "1px solid #e5e7eb",
                        borderRadius: "8px",
                      }}
                    />
                    <Bar
                      dataKey="count"
                      fill={colors.primary}
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Summary */}
              <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                <p className="text-sm ">
                  Total submissions this week:{" "}
                  <span className="font-medium ">
                    {weeklySubmissions.reduce((sum, day) => sum + day.count, 0)}
                  </span>
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Detailed Breakdown */}
        {/* <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="text-lg font-semibold  flex items-center gap-2">
              <Search className="w-5 h-5 text-[#1677ff]" />
              Candidate Pipeline Details
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {candidateStageSummary.map((stage, index) => {
                const getIcon = (stageName: string) => {
                  const name = stageName.toLowerCase();
                  if (name.includes("dropped"))
                    return <UserX className="w-5 h-5 text-red-500" />;
                  if (name.includes("identified"))
                    return <Search className="w-5 h-5 text-blue-500" />;
                  if (name.includes("pending"))
                    return <Clock className="w-5 h-5 text-yellow-500" />;
                  if (name.includes("interview"))
                    return <Users className="w-5 h-5 text-purple-500" />;
                  if (name.includes("rejected"))
                    return <XCircle className="w-5 h-5 text-red-500" />;
                  if (name.includes("screening"))
                    return <Target className="w-5 h-5 text-[#1677ff]" />;
                  return <Users className="w-5 h-5 text-gray-500" />;
                };

                return (
                  <div
                    key={index}
                    className="bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {getIcon(stage.name)}
                        <div>
                          <p className="font-medium ">
                            {stage.name}
                          </p>
                          <p className="text-2xl font-bold ">
                            {stage.count}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card> */}
      </div>
    </div>
  );
}
