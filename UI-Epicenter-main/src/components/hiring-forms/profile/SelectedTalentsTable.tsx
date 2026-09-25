import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { MoveHorizontal } from "lucide-react";
import { ErrorHandler } from "@/components/error/ErrorHandler";
import { Button } from "@/components/ui/button";
import { CandidateDetailsTypes } from "@/components/slot-management/types";
import { useState } from "react";
import TransferCandidateSheet from "@/components/hiring-forms/profile/sheets/TransferCandidateSheet";
import { Checkbox } from "@/components/ui/checkbox";
import { useRouter } from "next/navigation";
import { StatusBadge } from "@/components/status-badge";
import { tatFormat } from "@/helpers/helper";
import { isAdmin, isRmowner, isVendorManager } from "@/store/userStore";
import { ResumePreview } from "@/components/common/ResumePreview";

interface Talent {
  candidateName: any;
  nickName: string;
  currentInterviewRoundName: string;
  interviewTatDate(interviewTatDate: any): string;
  id: string;
  name: string;
  email: string;
  partner: string;
  status: string;
  candidateCode: string;
  fullName: string;
  partnerName: string;
  intakeStatusName: string;
  enableCandidateHrqTransfer?: boolean;
  resume: {
    attachmentURL?: string;
  }
}

interface SelectedTalentsTableProps {
  talents: Talent[];
  onToggleAll?: (checked: boolean) => void;
  onToggleOne?: (id: string, checked: boolean) => void;
  actionVisible?: boolean;
}

export function SelectedTalentsTable({
  talents,
  onToggleAll,
  onToggleOne,
  actionVisible = false,
}: SelectedTalentsTableProps) {
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [selectedCandidate, setSelectedCandidate] =
    useState<CandidateDetailsTypes | null>(null);

  const handleOpenSheet = (data: CandidateDetailsTypes) => {
    if (!data) return; // Add guard clause
    setSelectedCandidate(data);
    setIsSheetOpen(true);
  };
  if (!talents || talents.length === 0) {
    return (
      <ErrorHandler
        isEmpty={true}
        emptyMessage="There are no candidates at the moment."
      />
    );
  }
  const router = useRouter();
  return (
    <>
      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm">
        <div className="flex items-center mb-4"></div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10"></TableHead>
              <TableHead>Candidate ID</TableHead>
              <TableHead>Candidate Name</TableHead>
              <TableHead>Candidate Email</TableHead>
              <TableHead>Partner</TableHead>
              {/* <TableHead>Round Name</TableHead> */}
              <TableHead>Intake Status</TableHead>
              <TableHead>Resume</TableHead>
              <TableHead>TAT (Hours/Days)</TableHead>
              {(actionVisible && (isRmowner || isAdmin || isVendorManager)) && (
                <TableHead className="w-32">Actions</TableHead>
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {talents?.map((t) => (
              <TableRow key={t.id}>
                <TableCell className="w-10">
                  {/* <Checkbox
                  onCheckedChange={(val) => onToggleOne?.(t.id, !!val)}
                /> */}
                </TableCell>
                <TableCell
                  className="text-green-700 hover:cursor-pointer"
                  onClick={() =>
                    router.push(
                      `/home/candidate-management/candidate-profile?id=${t?.candidateCode}`
                    )
                  }
                >
                  {t?.candidateCode}
                </TableCell>
                <TableCell>{t?.fullName}</TableCell>
                <TableCell>{t?.email}</TableCell>
                <TableCell>{t?.nickName}</TableCell>
                {/* <TableCell>{t?.currentInterviewRoundName}</TableCell> */}
                <TableCell>
                  <StatusBadge status={t?.intakeStatusName as any} />
                </TableCell>

                {t?.resume?.attachmentURL && (
                  <ResumePreview
                    url={t?.resume?.attachmentURL}
                    fileName={`${t?.candidateName}'s Resume`}
                  />
                )}

                <TableCell>
                  <StatusBadge status={tatFormat(t?.interviewTatDate as any)} />
                </TableCell>
                {t?.enableCandidateHrqTransfer && (
                  <TableCell>
                    <Button
                      variant="hpButton"
                      size="sm"
                      className="flex items-center space-x-1"
                      onClick={() => handleOpenSheet(t)}
                    >
                      <MoveHorizontal className="w-4 h-4" />
                      <span>Transfer</span>
                    </Button>
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      {selectedCandidate && (
        <TransferCandidateSheet
          isOpen={isSheetOpen}
          onClose={() => {
            setIsSheetOpen(false);
            setSelectedCandidate(null);
          }}
          selectedCandidate={selectedCandidate}
        />
      )}
    </>
  );
}
