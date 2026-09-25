import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Mail,
  Phone,
  MapPin,
  Building2,
  Calendar,
  Clock,
  Star,
  Briefcase,
  Target,
  Users,
  MessageSquare,
  User2,
  Code2Icon,
  File,
} from "lucide-react";
import { ResumePreview } from "../common/ResumePreview";
import { StatusBadge } from "../status-badge";
import { formatDate, formatTime, tatBetween } from "@/helpers/helper";
import { format, parseISO } from "date-fns";

const getInitials = (name?: string) => {
  if (!name || typeof name !== 'string') return ""; // Handle undefined, null or empty string
  
  return name
    .split(" ")
    .map((n) => n?.[0])
    .filter(Boolean) // Filter out undefined or empty characters
    .join("")
    .toUpperCase()
    .slice(0, 2);
};

const StarRating = ({ rating }: { rating?: number }) => {
  const safeRating = rating || 0;
  
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`w-3 h-3 ${
            star <= safeRating
              ? "fill-[#1677ff] text-[#1677ff]"
              : "fill-gray-200 dark:fill-gray-600 text-gray-200 dark:text-gray-600"
          }`}
        />
      ))}
      <span className="text-xs ml-1 text-[#001529] dark:text-[#FFFFFF]">({safeRating}/5)</span>
    </div>
  );
};

const InfoItem = ({
  icon,
  label,
  value,
  className = "",
}: {
  icon: React.ReactNode;
  label: string;
  value?: string | number;
  className?: string;
}) => (
  <div className={`flex items-center gap-2 ${className}`}>
    <div className="text-[#1677ff] flex-shrink-0">{icon}</div>
    <div className="min-w-0 flex-1">
      <span className="text-xs text-[#001529]/70 dark:text-[#FFFFFF]/70">{label}:</span>
      <p className="text-sm font-medium truncate text-[#001529] dark:text-[#FFFFFF]">{value || "N/A"}</p>
    </div>
  </div>
);

export default function CandidateProfile({ data }: { data?: any }) {
  // Handle case where data is undefined or null
  if (!data) {
    return (
      <div className="max-w-screen mx-auto flex flex-col gap-6 min-h-screen p-6 bg-[#FFFFFF] dark:bg-[#001529]">
        <Card className="border-0 shadow-lg bg-[#FFFFFF] dark:bg-[#000000] border-[#1677ff]/10">
          <CardContent className="p-6 text-center">
            <div className="py-12">
              <User2 className="w-16 h-16 mx-auto mb-4 opacity-30 text-[#001529] dark:text-[#FFFFFF]" />
              <h3 className="text-lg font-medium mb-2 text-[#001529] dark:text-[#FFFFFF]">No Candidate Data</h3>
              <p className="text-sm text-[#001529]/60 dark:text-[#FFFFFF]/60">
                Unable to load candidate information
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Safe data extraction with defaults
  const candidateData = {
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
    primarySkills: data?.primarySkills || "",
    secondarySkills: data?.secondarySkills || "",
    candidateHistory: data?.candidateHistory || [],
    resume: data?.resume || null,
  };

  // Safe skills processing
  const getPrimarySkills = () => {
    if (!candidateData.primarySkills || typeof candidateData.primarySkills !== 'string') {
      return [];
    }
    return candidateData.primarySkills.split(",").filter(skill => skill.trim());
  };

  const getSecondarySkills = () => {
    if (!candidateData.secondarySkills || typeof candidateData.secondarySkills !== 'string') {
      return [];
    }
    return candidateData.secondarySkills.split(",").filter(skill => skill.trim());
  };

  return (
    <div className="max-w-screen mx-auto flex flex-col gap-6 min-h-screen bg-[#FFFFFF] dark:bg-[#001529]">
      <Card className="border-0 shadow-lg bg-[#FFFFFF] dark:bg-[#000000] border-[#1677ff]/10 dark:border-[#1677ff]/20">
        <CardContent className="px-6">
          <div className="flex flex-row gap-6">
            <div className="flex-1 space-y-3">
              <div className="flex flex-col gap-2">
                <InfoItem
                  icon={<User2 className="w-4 h-4" />}
                  label="Candidate Name"
                  value={candidateData.fullName}
                />
                <InfoItem
                  icon={<Mail className="w-4 h-4" />}
                  label="Email"
                  value={candidateData.email}
                />
                <InfoItem
                  icon={<Phone className="w-4 h-4" />}
                  label="Phone"
                  value={candidateData.phoneNumber}
                />
              </div>
            </div>

            {/* Professional Information */}
            <div className="flex-1 space-y-3">
              <div className="flex flex-col gap-2">
                <InfoItem
                  icon={<MapPin className="w-4 h-4" />}
                  label="Location"
                  value={`${candidateData.cityName}, ${candidateData.state}, ${candidateData.country}`}
                />
                <InfoItem
                  icon={<Code2Icon className="w-4 h-4" />}
                  label="Candidate Code"
                  value={candidateData.candidateCode}
                />
                <InfoItem
                  icon={<Building2 className="w-4 h-4" />}
                  label="Current Organisation"
                  value={candidateData.currentLastOrganisation}
                />
              </div>
            </div>

            {/* Additional Information */}
            <div className="flex-1 space-y-3">
              <div className="flex flex-col gap-2">
                <InfoItem
                  icon={<Calendar className="w-4 h-4" />}
                  label="Last Working Date"
                  value={formatDate(candidateData.lastWorkingDate)}
                />
                <InfoItem
                  icon={<Clock className="w-4 h-4" />}
                  label="Notice Period"
                  value={`${candidateData.noticePeriodDays} days`}
                />
                <InfoItem
                  icon={<Target className="w-4 h-4" />}
                  label="Experience"
                  value={`${candidateData.relevantExperienceYears} years`}
                />
              </div>
            </div>

            <div className="flex-1 space-y-3">
              <div className="flex flex-col gap-2">
                <InfoItem
                  icon={<Target className="w-4 h-4" />}
                  label="Currently Working"
                  value={candidateData.currentlyWorking}
                />
                <InfoItem
                  icon={<Target className="w-4 h-4" />}
                  label="Diversity"
                  value={candidateData.diversity}
                />
                {candidateData.referredByEmail && (
                  <InfoItem
                    icon={<Target className="w-4 h-4" />}
                    label="Referred By"
                    value={candidateData.referredByEmail}
                  />
                )}
                {candidateData.resume?.attachmentURL && (
                  <div className="flex items-center gap-2">
                    <File className="w-4 h-4 text-[#1677ff] flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <span className="text-xs text-[#001529]/70 dark:text-[#FFFFFF]/70">Resume</span>
                      <ResumePreview
                        url={candidateData.resume.attachmentURL}
                        fileName={candidateData.resume.fileName || "Resume"}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="flex-1 space-y-3">
              <div className="flex flex-col gap-2">
                <InfoItem
                  icon={<User2 className="w-4 h-4" />}
                  label="Candidate Name"
                  value={candidateData.fullName}
                />
                <InfoItem
                  icon={<Mail className="w-4 h-4" />}
                  label="Email"
                  value={candidateData.email}
                />
                <InfoItem
                  icon={<Phone className="w-4 h-4" />}
                  label="Phone"
                  value={candidateData.phoneNumber}
                />
              </div>
            </div>
          </div>

          <Separator className="my-2 bg-[#1677ff]/20 dark:bg-[#1677ff]/30" />

          {/* Skills & Expertise Section */}
          <div className="space-y-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <h4 className="text-sm font-medium mb-2 text-[#001529] dark:text-[#FFFFFF]">Primary Skills</h4>
                <div className="flex flex-wrap gap-2">
                  {getPrimarySkills().length > 0 ? (
                    getPrimarySkills().map((skill: string, idx: number) => (
                      <Badge 
                        variant="outline" 
                        key={idx} 
                        className="text-xs bg-[#1677ff] text-[#FFFFFF] border-[#1677ff] hover:bg-[#69b1ff] dark:bg-[#1677ff] dark:text-[#FFFFFF] dark:border-[#1677ff] dark:hover:bg-[#69b1ff]"
                      >
                        {skill.trim()}
                      </Badge>
                    ))
                  ) : (
                    <span className="text-xs text-[#001529]/60 dark:text-[#FFFFFF]/60">No primary skills listed</span>
                  )}
                </div>
              </div>

              <div className="flex-1">
                <h4 className="text-sm font-medium mb-2 text-[#001529] dark:text-[#FFFFFF]">Secondary Skills</h4>
                <div className="flex flex-wrap gap-2">
                  {getSecondarySkills().length > 0 ? (
                    getSecondarySkills().map((skill: string, idx: number) => (
                      <Badge
                        key={idx}
                        variant="outline"
                        className="border-[#13c2c2] text-[#0070F8] bg-[#13c2c2]/10 text-xs hover:bg-[#13c2c2]/20 dark:border-[#13c2c2] dark:text-[#13c2c2] dark:bg-[#13c2c2]/10 dark:hover:bg-[#13c2c2]/20"
                      >
                        {skill.trim()}
                      </Badge>
                    ))
                  ) : (
                    <span className="text-xs text-[#001529]/60 dark:text-[#FFFFFF]/60">No secondary skills listed</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Interview History Section */}
      <Card className="border-0 shadow-md bg-[#FFFFFF] dark:bg-[#000000] border-[#1677ff]/10 dark:border-[#1677ff]/20">
        <CardHeader className="bg-gradient-to-r from-[#1677ff]/5 to-[#69b1ff]/5 dark:from-[#1677ff]/10 dark:to-[#69b1ff]/10">
          <CardTitle className="text-lg flex items-center gap-2 text-[#001529] dark:text-[#FFFFFF]">
            <Briefcase className="w-5 h-5 text-[#1677ff]" />
            Interview History
            <Badge variant="outline" className="ml-2 bg-[#1677ff]/10 text-[#1677ff] border-[#1677ff]/30 dark:bg-[#1677ff]/20 dark:text-[#1677ff] dark:border-[#1677ff]/40">
              {candidateData.candidateHistory.length}{" "}
              {candidateData.candidateHistory.length === 1
                ? "application"
                : "applications"}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {candidateData.candidateHistory.length > 0 ? (
            candidateData.candidateHistory.map((history: any, idx: number) => (
              <div className="shadow-md py-2 rounded-lg border border-[#1677ff]/10 dark:border-[#1677ff]/20 bg-[#FFFFFF] dark:bg-[#001529]" key={idx}>
                <CardHeader className="border-b border-[#1677ff]/10 dark:border-[#1677ff]/20 bg-gradient-to-r from-[#1677ff]/5 to-[#69b1ff]/5 dark:from-[#1677ff]/10 dark:to-[#69b1ff]/10">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <Badge
                          variant="outline"
                          className="bg-[#1677ff] text-[#FFFFFF] text-lg border-[#1677ff] font-bold dark:bg-[#1677ff] dark:text-[#FFFFFF] dark:border-[#1677ff]"
                        >
                          {history?.hrqId || "N/A"}
                        </Badge>
                        <h3 className="font-semibold text-[#001529] dark:text-[#FFFFFF]">
                          {history?.roleHiredFor || "Unknown Role"}
                        </h3>
                      </div>
                      <div className="flex items-center gap-4 text-sm">
                        <span className="flex items-center gap-1 text-[#001529] dark:text-[#FFFFFF]">
                          <Building2 className="w-3 h-3 text-[#1677ff]" />
                          Partner: {history?.partner || "N/A"}
                        </span>
                        <StatusBadge status={history?.hiringStatus || "Unknown"} />
                      </div>
                    </div>

                    {history?.candidateInterviewFeedback?.length > 0 && (
                      <Badge
                        variant="outline"
                        className="bg-[#0070F8]/10 text-[#0070F8] border-[#0070F8]/30 dark:bg-[#0070F8]/20 dark:text-[#0070F8] dark:border-[#0070F8]/40"
                      >
                        {history.candidateInterviewFeedback.length} interview rounds
                      </Badge>
                    )}
                    <div className="text-right text-sm text-[#001529]/70 dark:text-[#FFFFFF]/70">
                      TAT: {tatBetween(history?.tatDate, history?.tatEndDate) || "N/A"}
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="bg-[#FFFFFF] dark:bg-[#001529]">
                  {history?.candidateInterviewFeedback?.length > 0 ? (
                    <div className="flex flex-col divide-y divide-[#1677ff]/10 dark:divide-[#1677ff]/20">
                      {history.candidateInterviewFeedback.map(
                        (feedback: any, i: number) => (
                          <div key={i} className="rounded-md my-2 p-4 bg-gradient-to-r from-[#FFFFFF] to-[#1677ff]/5 dark:from-[#001529] dark:to-[#1677ff]/10">
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center gap-2">
                                <div className="w-6 h-6 rounded-full bg-[#1677ff] text-[#FFFFFF] text-xs flex items-center justify-center font-medium">
                                  {i + 1}
                                </div>
                                <h4 className="font-medium text-[#001529] dark:text-[#FFFFFF]">
                                  {feedback?.interviewRoundName || "Unknown Round"}
                                </h4>
                              </div>
                              <StatusBadge
                                status={feedback?.candidateInterviewStatusName || "Unknown"}
                              />
                            </div>

                            <div className="flex flex-col md:flex-row gap-4 mb-4">
                              <div className="flex-1">
                                <InfoItem
                                  icon={<Users className="w-4 h-4" />}
                                  label="Panel Members"
                                  value={feedback?.interviewPanelNames}
                                />
                              </div>
                              <div className="flex-1">
                                <InfoItem
                                  icon={<Calendar className="w-4 h-4" />}
                                  label="Interview Date/Time"
                                  value={`${formatDate(feedback?.interviewDate)} at ${formatTime(feedback?.interviewTime)}`}
                                />
                              </div>
                              <div className="flex-1">
                                <InfoItem
                                  icon={<Target className="w-4 h-4" />}
                                  label="Interview Mode"
                                  value={feedback?.interviewModeName}
                                />
                              </div>
                              <div className="flex-1">
                                <InfoItem
                                  icon={<Target className="w-4 h-4" />}
                                  label="Feedback Given By"
                                  value={`${feedback?.feedbackGivenByUserName || "N/A"}-${feedback?.feedbackGivenByUserRoleName || "N/A"}`}
                                />
                              </div>
                              <div className="flex-1">
                                <InfoItem
                                  icon={<Target className="w-4 h-4" />}
                                  label="Feedback Date/Time"
                                  value={
                                    feedback?.feedbackGivenOn
                                      ? `${formatDate(feedback.feedbackGivenOn)} at ${formatTime(
                                          format(parseISO(feedback.feedbackGivenOn), "HH:mm:ss")
                                        )}`
                                      : "N/A"
                                  }
                                />
                              </div>
                              <div className="flex-1">
                                <InfoItem
                                  icon={<Target className="w-4 h-4" />}
                                  label="TAT(in days)"
                                  value={tatBetween(feedback?.interviewDate, feedback?.feedbackGivenOn)}
                                />
                              </div>
                            </div>

                            {feedback?.comments && (
                              <div className="p-3 bg-[#91caff]/10 dark:bg-[#91caff]/15 rounded-lg border border-[#91caff]/30 dark:border-[#91caff]/40">
                                <div className="flex items-start gap-2">
                                  <MessageSquare className="w-4 h-4 text-[#1677ff] mt-0.5 flex-shrink-0" />
                                  <div className="flex">
                                    <span className="text-xs font-medium uppercase tracking-wide text-[#001529] dark:text-[#FFFFFF]">
                                      Interview Comments: <span className="normal-case text-[#001529]/80 dark:text-[#FFFFFF]/80">{feedback.comments}</span>
                                    </span>
                                  </div>
                                </div>
                              </div>
                            )}

                            {feedback?.feedbackCategoryDetails?.length > 0 && (
                              <div className="flex bg-[#91caff]/10 dark:bg-[#91caff]/15 p-2 rounded-md flex-col gap-3 border border-[#91caff]/30 dark:border-[#91caff]/40">
                                <h5 className="text-sm font-medium flex items-center gap-2 text-[#001529] dark:text-[#FFFFFF]">
                                  <Star className="w-4 h-4 text-[#1677ff]" />
                                  Detailed Feedback & Ratings
                                </h5>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                  {feedback.feedbackCategoryDetails.map(
                                    (fc: any, j: number) => (
                                      <div
                                        key={j}
                                        className="p-3 rounded-lg border border-[#1677ff]/20 dark:border-[#1677ff]/30 shadow-sm bg-[#FFFFFF] dark:bg-[#000000]"
                                      >
                                        <div className="flex items-center justify-between mb-2">
                                          <span className="text-sm font-medium text-[#001529] dark:text-[#FFFFFF]">
                                            {fc?.criteriaOptionName || "Unknown Criteria"}
                                          </span>
                                          <StarRating rating={fc?.rating} />
                                        </div>
                                        {fc?.comments && (
                                          <div className="mt-2 p-2 rounded text-xs bg-[#7764FC]/10 dark:bg-[#7764FC]/15 border border-[#7764FC]/20 dark:border-[#7764FC]/30">
                                            <strong className="text-[#001529] dark:text-[#FFFFFF]">Feedback:</strong> 
                                            <span className="text-[#001529]/80 dark:text-[#FFFFFF]/80"> {fc.comments}</span>
                                          </div>
                                        )}
                                      </div>
                                    )
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        )
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Briefcase className="w-12 h-12 mx-auto mb-2 opacity-30 text-[#001529] dark:text-[#FFFFFF]" />
                      <p className="text-sm text-[#001529]/60 dark:text-[#FFFFFF]/60">
                        No interview rounds available for this application
                      </p>
                    </div>
                  )}
                </CardContent>
              </div>
            ))
          ) : (
            <div className="text-center py-12">
              <Briefcase className="w-16 h-16 mx-auto mb-4 opacity-30 text-[#001529] dark:text-[#FFFFFF]" />
              <h3 className="text-lg font-medium mb-2 text-[#001529] dark:text-[#FFFFFF]">No Interview History</h3>
              <p className="text-sm text-[#001529]/60 dark:text-[#FFFFFF]/60">
                This candidate hasn't been through any interview processes yet.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
