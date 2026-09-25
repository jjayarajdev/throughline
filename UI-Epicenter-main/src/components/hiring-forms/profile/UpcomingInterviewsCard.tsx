import { ScrollArea } from "@/components/ui/scroll-area";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Calendar, Briefcase, FileText } from "lucide-react";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { ErrorHandler } from "@/components/error/ErrorHandler";

interface Interview {
  interviewSlotId: number;
  time: any;
  date: any;
  nickname: string;
  candidateName: string | undefined;
  id: string;
  name: string;
  avatarUrl?: string;
  candidateId: string;
  company: string;
  round: string;
  datetime: string; // e.g. "10 AM, 2025-04-23"
}

interface UpcomingInterviewsCardProps {
  interviews: Interview[];
  onSeeAll?: () => void;
}

export function UpcomingInterviewsCard({
  interviews,
}: UpcomingInterviewsCardProps) {
  if (!interviews || interviews.length === 0) {
    return (
      <Card className=" h-[30vh]  dark:bg-gray-800 p-2">
        <div className="flex items-center justify-between px-4 py-2 border-b dark:border-gray-700">
          <h4 className="font-semibold text-[#01a982]">Upcoming Interviews</h4>
        </div>
        <ErrorHandler
          isEmpty={true}
          emptyMessage="There is no upcoming Interviews"
        />
      </Card>
    );
  }
  return (
    <Card className="bg-white dark:bg-gray-800">
      <div className="flex items-center justify-between px-4 py-2 border-b dark:border-gray-700">
        <h4 className="font-semibold text-[#01a982]">Upcoming Interviews</h4>
      </div>

      <ScrollArea className="h-48 p-0">
        <div className="space-y-3 p-2">
          {interviews.map((i) => (
            <div
              key={i.interviewSlotId}
              className="bg-gray-50 hover:bg-gray-100 transition-colors dark:bg-gray-700 p-4 rounded-lg border border-gray-100"
            >
              <div className="flex items-center space-x-4">
                <Avatar className="h-10 w-10 border-2 border-[#007E61]/20">
                  <AvatarImage src={i.avatarUrl} />
                  <AvatarFallback className="bg-[#007E61]/10 text-[#007E61]">
                    {i.candidateName
                      ?.split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="font-medium text-gray-900 dark:text-gray-100">
                      {i.candidateName}
                    </p>
                    <Badge
                      variant="outline"
                      className="bg-[#007E61]/10 text-[#007E61] border-none"
                    >
                      {i.round}
                    </Badge>
                  </div>
                  <div className="flex flex-col space-y-1">
                    <div className="flex items-center text-sm text-gray-500 dark:text-gray-400 space-x-2">
                      <FileText className="w-4 h-4" />
                      <span>{i.candidateId}</span>
                      <span className="text-gray-300">•</span>
                      <Briefcase className="w-4 h-4" />
                      <span>{i.nickname}</span>
                    </div>
                    <div className="flex items-center text-sm text-gray-500 dark:text-gray-400 space-x-2">
                      <Calendar className="w-4 h-4 text-[#007E61]" />
                      <span>
                        {format(
                          new Date(`${i.date.split("T")[0]}T${i.time}`),
                          "MMM dd, yyyy - hh:mm aa"
                        )}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    </Card>
  );
}
