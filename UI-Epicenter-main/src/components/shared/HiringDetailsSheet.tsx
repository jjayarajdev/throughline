import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { CandidateDetailsTypes } from "../slot-management/types";
import { HiringPageRequest } from "@/services/api/hiring.api";
import { StatusBadge } from "../status-badge";

interface CandidateDetailsSheetProps {
  isOpen: boolean;
  onClose: () => void;
  candidate: HiringPageRequest | null;
  children?: React.ReactNode;
  title?: string;
}

export function HiringDetailSheet({
  isOpen,
  onClose,
  candidate,
  children,
  title = "Hiring Details",
}: CandidateDetailsSheetProps) {
  const defaultCandidate: CandidateDetailsTypes = {
    hrqId: "",
    candidateCode: "",
    candidateName: "",
    jobTitle: "",
    partnerName: "",
    intakeStatusName: "",
    interviewModeName: "",
  };

  const candidateData = candidate || defaultCandidate;

  function formatArray(value?: string | string[] | null) {
    if (Array.isArray(value)) {
      return value
        .map((day) => day.charAt(0).toUpperCase() + day.slice(1))
        .join(", ");
    }
    return value || "-";
  }

  return (
    <Sheet
      aria-describedby={undefined}
      open={isOpen}
      onOpenChange={(val) => !val && onClose()}
    >
      <SheetContent side="right" className="w-[800px] p-4">
        <SheetHeader className="pb-2 border-b">
          <SheetTitle className="text-xl font-semibold text-[#007E61]">
            {title}
          </SheetTitle>
        </SheetHeader>
        <div className=" space-y-2">
          {candidate ? (
            <>
              <div className="space-y-1 bg-gray-50 p-2 rounded-lg">
                <div className="grid gap-1">
                  <DetailRow
                    label="Hiring Status"
                    value={
                      <StatusBadge status={candidateData?.hiringStatusName} />
                    }
                  />
                  <DetailRow label="HRQ ID" value={candidateData?.hrqId} />
                 
                  <DetailRow
                    label="Project Name"
                    value={candidateData?.projectName}
                  />
                  <DetailRow
                    label="Requestor Name"
                    value={candidateData?.requestorName}
                  />
                   <DetailRow
                    label="Role Hired For"
                    value={candidateData?.jobTitle}
                  />

             
                  {candidateData?.interviewModeName && (
                    <DetailRow
                      label="Mode of Interview"
                      value={candidateData.interviewModeName}
                    />
                  )}

                  {candidateData.panelNames && (
                    <DetailRow
                      label="Panel Member"
                      value={
                        candidateData.panelNames || "No panel members assigned"
                      }
                    />
                  )}
               

                
                </div>
              </div>
              {children}
            </>
          ) : (
            <div className="text-center text-gray-500">
              No candidate selected
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

// Helper component for detail rows with null checks
function DetailRow({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-sm font-medium text-gray-500">{label}</span>
      <span className="text-sm font-medium text-gray-500">{value || "-"}</span>
    </div>
  );
}
