import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { CandidateDetailsTypes } from "../slot-management/types";

interface CandidateDetailsSheetProps {
  isOpen: boolean;
  onClose: () => void;
  candidate: CandidateDetailsTypes | null;
  children?: React.ReactNode;
  title?: string;
}

export function CandidateDetailsSheet({
  isOpen,
  onClose,
  candidate,
  children,
  title = "Candidate Details",
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
      <SheetContent side="right" className="w-[800px] p-0 overflow-hidden flex flex-col">
        <SheetHeader className="p-4 pb-2 border-b shrink-0">
          <SheetTitle className="text-xl font-semibold text-[#007E61]">
            {title}
          </SheetTitle>
        </SheetHeader>
        
        {/* Make this div scrollable */}
        <div className="flex-1 overflow-y-auto p-4">
          {candidate ? (
            <>
              <div className="space-y-1 bg-gray-50 p-2 rounded-lg">
                <div className="grid gap-1">
                  <DetailRow
                    label="Candidate Name"
                    value={candidateData.candidateName || candidateData.fullName}
                  />

                  {candidateData?.intakeStatusName && (
                    <DetailRow
                      label="Status"
                      value={candidateData.intakeStatusName}
                    />
                  )}
                  {candidateData?.interviewModeName && (
                    <DetailRow
                      label="Mode of Interview"
                      value={candidateData.interviewModeName}
                    />
                  )}

                  {candidateData.panelNames && (
                    <DetailRow
                      label="Panel Member"
                      value={candidateData.panelNames || "No panel members assigned"}
                    />
                  )}
                  {candidateData?.availableDays && (
                    <DetailRow
                      label="Available Days"
                      value={formatArray(candidateData.availableDays)}
                    />
                  )}

                  {candidateData?.rejectionCount && (
                    <DetailRow
                      label="Declined"
                      value={candidateData.rejectionCount}
                    />
                  )}
                  {candidateData?.hmComments && (
                       <DetailRow
                      label="Hiring Comments"
                      value={candidateData.hmComments || "No comments available"}
                    />
                  )}
                  {candidateData?.partnerComments && (
                       <DetailRow
                      label="Partner Comments"
                      value={candidateData.partnerComments || "No comments available"}
                    />
                  )}

                 
                </div>
              </div>
              {children}
            </>
          ) : (
            <div className="text-center text-gray-500 py-8">
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
    <div className="flex justify-between items-center py-1">
      <span className="text-sm font-medium text-gray-500">{label}</span>
      <span className="text-sm font-medium text-gray-500 ml-4 text-right">{value || "-"}</span>
    </div>
  );
}
