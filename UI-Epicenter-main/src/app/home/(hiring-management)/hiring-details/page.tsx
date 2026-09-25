"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format } from "date-fns";
import {
  FileText,
  Users,
  Calendar,
  Award,
  Briefcase,
  Building,
  Download,
  ExternalLink,
  MoveLeft,
} from "lucide-react";
import Link from "next/link";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { hiringApi } from "@/services/api/hiring.api";
import { ErrorHandler } from "@/components/error/ErrorHandler";
import SubmitFormLoader from "@/components/common/SubmitFormLoader";

export default function HiringDetailsPage() {
  const searchParams = useSearchParams();
  const hrqId = searchParams.get("hrqid")?.toString() || "";
  const {
    data: hiringData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["hiringViewData", hrqId],
    queryFn: () => hiringApi.getHiringView(hrqId),
  });

  if (isLoading) {
    return <SubmitFormLoader />;
  }

  if (error) return <ErrorHandler error={error} />;

  const formatFieldName = (key: string): string => {
    if (key === "hrqId") return "HRQ ID";
    if (key === "jobTitle") return "Role Hired For";

    return key
      .replace(/([A-Z])/g, " $1")
      .replace(/^./, (str) => str.toUpperCase())
      .trim();
  };

  const formatValue = (key: string, value: any): React.ReactNode => {
    if (value === null || value === undefined || value === "") {
      return "-";
    }

    if (key.includes("Date") && typeof value === "string") {
      try {
        return format(new Date(value), "MMM dd, yyyy");
      } catch (e) {
        return value;
      }
    }

    return value;
  };

  const filterFields = (obj: Record<string, any>): [string, any][] => {
    return Object.entries(obj).filter(([key, value]) => {
      if (key.includes("Experience")) return true;

      if (key === "hrqId") return true;

      if (
        (key.toLowerCase().includes("id") && key !== "hrqId") ||
        typeof value === "boolean" ||
        (typeof value === "number" && !key.includes("Experience"))
      ) {
        return false;
      }

      return true;
    });
  };

  const getInitials = (name: string | undefined | null): string => {
    if (!name) return "??";
    return name
      .split(" ")
      .map((part) => part[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };

  const {
    viewHiringDetails = {},
    viewJobDetails = {},
    viewInterviewRounds = [],
    viewCalibrationDetails = [],
  } = hiringData || {};

  return (
    <div className=" p-4">
      <div
        onClick={() => window.history.back()}
        className="cursor-pointer flex px-2 mb-4 text-lg text-green-600 hover:underline"
      >
        <MoveLeft /> Go Back
      </div>
      <div className="bg-gradient-to-r from-[#f8fafc] to-[#f1f5f9] dark:from-gray-800 dark:to-gray-900 rounded-lg p-6 mb-3 shadow-sm border border-gray-100 dark:border-gray-700">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Badge className="bg-green-100 text-green-600 border-green-200">
                {viewHiringDetails.hrqId}
              </Badge>
              <Badge className="bg-[#01A982]/10 text-[#01A982] border-[#01A982]/20">
                {viewHiringDetails.hiringTypeName}
              </Badge>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              {viewHiringDetails.jobTitle}
            </h1>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-2 text-gray-600 dark:text-gray-300">
              <div className="flex items-center gap-1.5">
                <Briefcase className="h-4 w-4" />
                <span>{viewHiringDetails.projectName}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Building className="h-4 w-4" />
                <span>{viewHiringDetails.businessName}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Calendar className="h-4 w-4" />
                <span>
                  {formatValue(
                    "requestStartDate",
                    viewHiringDetails.requestStartDate
                  )}
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-col items-end gap-2">
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Domain
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-sm font-medium">
                {viewHiringDetails.domainName}
              </Badge>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Tabs */}
      <Tabs defaultValue="details" className="mt-4">
        <div className="border-b">
          <TabsList className="w-full h-12 bg-[#DFE6E5] dark:border-white/[0.05] dark:bg-white/[0.03]">
            <TabsTrigger value="details" className="flex-1">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                <span>Details</span>
              </div>
            </TabsTrigger>
            <TabsTrigger value="interviews" className="flex-1">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                <span>Interview Rounds</span>
              </div>
            </TabsTrigger>
            <TabsTrigger value="calibration" className="flex-1">
              <div className="flex items-center gap-2">
                <Award className="h-4 w-4" />
                <span>Calibration</span>
              </div>
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="details">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-3">
            <Card className="shadow-sm border-gray-200 dark:border-gray-800 overflow-hidden">
              <CardHeader className="bg-gray-50 dark:bg-gray-900 py-2 border-b border-gray-200 dark:border-gray-700">
                <CardTitle className="text-lg flex items-center gap-2 text-gray-800 dark:text-gray-100">
                  <Briefcase className="h-5 w-5 text-[#01A982]" />
                  Hiring Information
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-gray-100 dark:divide-gray-800">
                  {filterFields(viewHiringDetails).map(([key, value], idx) => (
                    <div
                      key={key}
                      className={`flex px-3 py-2 ${
                        idx % 2 === 1 ? "bg-gray-50 dark:bg-gray-900/30" : ""
                      }`}
                    >
                      <div className="w-1/2 text-gray-600 dark:text-gray-300 font-medium">
                        {formatFieldName(key)}
                      </div>
                      <div className="w-1/2 text-gray-900 dark:text-gray-100">
                        {formatValue(key, value)}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-sm border-gray-200 dark:border-gray-800 overflow-hidden">
              <CardHeader className="bg-gray-50 dark:bg-gray-900 py-2 border-b border-gray-200 dark:border-gray-700">
                <CardTitle className="text-lg flex items-center gap-2 text-gray-800 dark:text-gray-100">
                  <FileText className="h-5 w-5 text-[#01A982]" />
                  Job Information
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {Object.keys(viewJobDetails).length > 0 ? (
                  <div className="divide-y divide-gray-100 dark:divide-gray-800">
                    {filterFields(viewJobDetails)
                      .filter(([key]) => key !== "jobDescription")
                      .map(([key, value], idx) => (
                        <div
                          key={key}
                          className={`flex px-3 py-2 ${
                            idx % 2 === 1
                              ? "bg-gray-50 dark:bg-gray-900/30"
                              : ""
                          }`}
                        >
                          <div className="w-1/2 text-gray-600 dark:text-gray-300 font-medium">
                            {formatFieldName(key)}
                          </div>
                          <div className="w-1/2 text-gray-900 dark:text-gray-100">
                            {key.includes("Experience") ? (
                              <Badge
                                variant="outline"
                                className="bg-green-50 text-green-700 border-green-200"
                              >
                                {value} years
                              </Badge>
                            ) : (
                              formatValue(key, value)
                            )}
                          </div>
                        </div>
                      ))}
                  </div>
                ) : (
                  <div className="flex items-center justify-center p-4 text-gray-500">
                    <div className="text-center">
                      <FileText className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                      <p>No job details available</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {viewJobDetails?.jobDescription && (
              <Card className="shadow-sm border-gray-200 dark:border-gray-800 md:col-span-2 mt-4">
                <CardHeader className="py-2 border-b border-gray-200 dark:border-gray-700">
                  <CardTitle className="text-lg flex items-center gap-2 text-gray-800 dark:text-gray-100">
                    <FileText className="h-5 w-5 text-[#01A982]" />
                    Job Description
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-3">
                  <div className="prose prose-sm max-w-none dark:prose-invert">
                    <p className="whitespace-pre-wrap">
                      {formatValue(
                        "jobDescription",
                        viewJobDetails.jobDescription
                      )}
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* <Card className="shadow-sm border-gray-200 dark:border-gray-800">
              <CardHeader className="py-2 border-b border-gray-200 dark:border-gray-700">
                <CardTitle className="text-lg flex items-center gap-2 text-gray-800 dark:text-gray-100">
                  <User className="h-5 w-5 text-[#01A982]" />
                  Key Personnel
                </CardTitle>
              </CardHeader>
              <CardContent className="py-2">
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10 bg-[#01A982]/20 text-[#01A982]">
                      <AvatarFallback>
                        {getInitials(viewHiringDetails.hiringManagerName)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-medium">
                        {viewHiringDetails.hiringManagerName}
                      </div>
                      <div className="text-sm text-gray-500">
                        Hiring Manager
                      </div>
                    </div>
                  </div>

                  <Separator />

                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10 bg-green-100 text-green-700">
                      <AvatarFallback>
                        {getInitials(viewHiringDetails.rmOwnerName)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-medium">
                        {viewHiringDetails.rmOwnerName}
                      </div>
                      <div className="text-sm text-gray-500">RM Owner</div>
                    </div>
                  </div>

                  <Separator />

                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10 bg-amber-100 text-amber-700">
                      <AvatarFallback>
                        {getInitials(viewHiringDetails.domainManagerName)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-medium">
                        {viewHiringDetails.domainManagerName}
                      </div>
                      <div className="text-sm text-gray-500">
                        Domain Manager
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card> */}
          </div>
        </TabsContent>

        <TabsContent value="interviews">
          <div className="mt-3">
            <div className="mb-3">
              <h2 className="text-xl font-semibold">Interview Process</h2>
              <p className="text-gray-500 text-sm mt-1">
                The hiring process consists of {viewInterviewRounds.length}{" "}
                interview rounds
              </p>
            </div>

            <div className="relative">
              <div className="space-y-2">
                {viewInterviewRounds.map((round, index) => (
                  <div key={index} className="relative">
                    <Card className=" shadow-sm border-gray-200 dark:border-gray-800 hover:shadow-md transition-shadow">
                      <CardHeader className="flex items-start justify-between gap-6 border-b border-gray-200 dark:border-gray-700">
                        {/* Round Number + Title */}
                        <div className="flex items-center gap-3 min-w-[200px]">
                          <div className="h-8 w-8 rounded-full bg-[#01A982] text-white flex items-center justify-center font-medium shadow">
                            {round.roundNumber}
                          </div>
                          <CardTitle className="text-lg text-gray-800 dark:text-gray-100">
                            {round.roundNameName}
                            <div className="text-sm font-normal text-gray-500 mt-0.5">
                              {round.modeOfInterviewName}
                            </div>
                          </CardTitle>
                        </div>

                        {/* Panel Members */}
                        <div className="min-w-[250px]">
                          <h3 className="text-sm font-medium text-gray-500 mb-1">
                            Panel Members
                          </h3>
                          <div className="flex flex-wrap gap-2">
                            {round.panelNames?.split(",").map((name, idx) => (
                              <div
                                key={idx}
                                className="flex items-center gap-2 bg-gray-50 dark:bg-gray-800 px-3 py-1.5 rounded-full"
                              >
                                <Avatar className="h-6 w-6 bg-[#01A982]/10 text-[#01A982]">
                                  <AvatarFallback>
                                    {getInitials(name.trim())}
                                  </AvatarFallback>
                                </Avatar>
                                <span className="text-sm">{name.trim()}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Comments */}
                        <div className="flex-1 max-w-[300px]">
                          <h3 className="text-sm font-medium text-gray-500 mb-1">
                            Comments
                          </h3>
                          <div className="bg-gray-50 dark:bg-gray-900 p-3 rounded-md text-gray-700 dark:text-gray-300">
                            {round.comments || "-"}
                          </div>
                        </div>

                        {/* Badge aligned right */}
                        <Badge className="ml-auto whitespace-nowrap bg-green-50 text-green-700 border-green-200">
                          {round.modeOfInterviewName}
                        </Badge>
                      </CardHeader>
                      {round.feedbackCritriaOptions &&
                        round.feedbackCritriaOptions.length > 0 && (
                          <CardContent className="py-2">
                            <div className="space-y-3">
                              <h3 className="text-sm font-medium text-gray-500">
                                Feedback Criteria
                              </h3>
                              <div className="flex flex-wrap gap-2">
                                {round.feedbackCritriaOptions?.map(
                                  (name, idx) => (
                                    <div
                                      key={idx}
                                      className="flex items-center gap-2 bg-gray-50 dark:bg-gray-800 px-3 py-1.5 rounded-full"
                                    >
                                      <Avatar className="h-6 w-6 bg-[#01A982]/10 text-[#01A982]">
                                        <AvatarFallback>
                                          {idx + 1}
                                        </AvatarFallback>
                                      </Avatar>
                                      <span className="text-sm">
                                        {name.name}
                                      </span>
                                    </div>
                                  )
                                )}
                              </div>
                            </div>
                          </CardContent>
                        )}
                    </Card>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="calibration">
          {viewCalibrationDetails.length > 0 ? (
            <div className="mt-3 space-y-3">
              {viewCalibrationDetails.map((calibration, index) => (
                <Card
                  key={index}
                  className="shadow-sm border-gray-200 dark:border-gray-800 overflow-hidden"
                >
                  <CardHeader className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
                      <CardTitle className="text-lg flex items-center gap-2 text-gray-800 dark:text-gray-100">
                        <Award className="h-5 w-5 text-[#01A982]" />
                        Calibration Session
                      </CardTitle>

                      <Badge
                        variant="outline"
                        className="bg-green-50 text-green-700 border-green-200 flex items-center gap-1"
                      >
                        <Calendar className="h-3.5 w-3.5" />
                        {formatValue(
                          "calibrationDate",
                          calibration.calibrationDate
                        )}
                      </Badge>
                    </div>
                  </CardHeader>

                  <CardContent className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h3 className="text-sm font-medium text-gray-500 mb-2">
                          Attendees
                        </h3>
                        <div className="flex items-center gap-2">
                          <Avatar className="h-6 w-6 bg-[#01A982]/10 text-[#01A982]">
                            <AvatarFallback>
                              {getInitials(calibration.attendees)}
                            </AvatarFallback>
                          </Avatar>
                          <span>{calibration.attendees || "-"}</span>
                        </div>
                      </div>

                      <div>
                        <h3 className="text-sm font-medium text-gray-500 mb-2">
                          Certifications
                        </h3>
                        {calibration.certifications !== "NA" ? (
                          <Badge
                            variant="outline"
                            className="bg-green-50 text-green-700 border-green-200"
                          >
                            {calibration.certifications}
                          </Badge>
                        ) : (
                          <span className="text-gray-500">
                            No certifications required
                          </span>
                        )}
                      </div>

                      <div className="md:col-span-2">
                        <h3 className="text-sm font-medium text-gray-500 mb-2">
                          Comments
                        </h3>
                        <div className="bg-gray-50 dark:bg-gray-900 p-3 rounded-md text-gray-700 dark:text-gray-300">
                          {calibration.comments || "-"}
                        </div>
                      </div>

                      {calibration.documents && (
                        <div className="md:col-span-2">
                          <h3 className="text-sm font-medium text-gray-500 mb-2">
                            Documents
                          </h3>
                          <div className="border rounded-lg overflow-hidden">
                            <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900 border-b">
                              <div className="flex items-center gap-2">
                                <FileText className="h-4 w-4 text-green-600" />
                                <span className="font-medium truncate">
                                  {calibration.documents.attachmentName}
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Link
                                  href={calibration.documents.attachmentURL}
                                  target="_blank"
                                  className="text-sm px-2 py-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800 text-green-600 transition-colors inline-flex items-center gap-1"
                                >
                                  <ExternalLink className="h-3.5 w-3.5" />
                                  View
                                </Link>
                                <Link
                                  href={calibration.documents.attachmentURL}
                                  download
                                  className="text-sm px-2 py-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800 text-green-600 transition-colors inline-flex items-center gap-1"
                                >
                                  <Download className="h-3.5 w-3.5" />
                                  Download
                                </Link>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="mt-3">
              <Card className="border-dashed border-gray-300 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/50">
                <CardContent className="pt-6 text-center py-12">
                  <Award className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                  <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-1">
                    No Calibration Information
                  </h3>
                  <p className="text-gray-500 max-w-md mx-auto">
                    No calibration sessions have been scheduled or conducted yet
                    for this hiring request.
                  </p>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
