import { Button } from "@/components/ui/button";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Pencil } from "lucide-react";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  
} from "@/components/ui/dialog";
import { Eye, X } from "lucide-react";
import { formatDate } from "@/helpers/helper";
import { parseISO,format } from "date-fns";

export interface SowCR {
    crNumber: string;
    crRequestDate: string;
    crTypeId: number;
    extendedDate: string;
    id: number;
    isActive: boolean;
    isRateChanged?: boolean;
    sowId: number;
    comments?: string;
    crValue?:string
}
interface Iprops {
    crData: SowCR[]
    onEditCR: (cr: SowCR) => void;
    isToggle:boolean
}

export default function CrHistoryDetails({ crData ,onEditCR,isToggle}: Iprops) {
    
     function isDate(utcDateStr: string): string {
      if (!utcDateStr) return "";
      const date = parseISO(utcDateStr); 
      return format(date, 'yyyy/MM/dd'); 
    }
    return (
      <>
        <Table>
          <TableHeader>
            <TableRow className="bg-teal-200 dark:bg-gray-800">
              <TableHead>CR Category</TableHead>
              <TableHead>CR Number</TableHead>
              <TableHead>CR Requested Date</TableHead>
             { <TableHead>Extended End Date</TableHead>}
              <TableHead>Value Change</TableHead>
             { isToggle && <TableHead>Rate Change</TableHead>}
              <TableHead>Others</TableHead>
              <TableHead className="text-center">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {crData && crData.length > 0 ? (
              crData.map((cr: SowCR) => (
                <TableRow key={cr.id}>
                  <TableCell>
                    {cr?.comments
                      ? "Others"
                      : cr?.extendedDate
                      ? "Validity-extension"
                      : cr?.isRateChanged
                      ? "Rate-Change"
                      : "Value-Change"}
                  </TableCell>
                  <TableCell>{cr?.crNumber}</TableCell>
                  <TableCell>
                    {formatDate(cr?.crRequestDate)}
                  </TableCell>

                  <TableCell>
                    {isDate(cr?.extendedDate)}
                  </TableCell>

                  <TableCell>{cr?.crValue}</TableCell>
                  {isToggle && <TableCell>{cr?.isRateChanged ? "yes" : ""}</TableCell>}
                  <TableCell>
                    {
                      <Dialog>
                        <DialogTrigger asChild>
                          <button
                            className="hover:text-primary"
                            title="View Comments"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        </DialogTrigger>
                        <DialogContent className="max-w-3xl rounded-2xl p-6 shadow-2xl bg-background dark:bg-zinc-900 border border-border">
                          <DialogHeader className="mb-2">
                            <DialogTitle className="text-2xl font-bold text-foreground leading-snug">
                              💬 CR Comments
                            </DialogTitle>
                            <DialogDescription className="text-sm text-muted-foreground mt-1">
                              Detailed explanation of the requested change.
                            </DialogDescription>
                          </DialogHeader>

                          <div className="mt-4 max-h-[400px] overflow-y-auto p-5 bg-muted rounded-lg border border-muted-foreground/10">
                            <p className="text-base leading-relaxed text-foreground tracking-tight whitespace-pre-wrap">
                              {cr?.comments || "No comments available."}
                            </p>
                          </div>
                        </DialogContent>
                      </Dialog>
                    }
                  </TableCell>

                  <TableCell className="text-center">
                    <Button
                      size="icon"
                      onClick={() => onEditCR(cr)}
                      variant="ghost"
                    >
                      <Pencil className="h-4 w-4 text-primary" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="text-center py-4 text-gray-500"
                >
                  No CRs found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </>
    );
}
