"use client";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Eye } from "lucide-react";


interface ReasonForDeclineDialogProps {
  comments?: string;
}

export function CommentsDialog({ comments }: ReasonForDeclineDialogProps) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <button className="hover:text-primary" title="View Comments">
          <Eye className="w-4 h-4" />
        </button>
      </DialogTrigger>

      <DialogContent className="max-w-3xl rounded-2xl p-6 shadow-2xl bg-background dark:bg-zinc-900 border border-border">
        <DialogHeader className="mb-2">
          <DialogTitle className="text-2xl font-bold text-foreground leading-snug">
            💬 Reason for Rescheduled
          </DialogTitle>
          <DialogDescription className="text-lg font-bold text-muted-foreground mt-1">
            Detailed explanation of why the candidate was rescheduled Date.
          </DialogDescription>
        </DialogHeader>

        <div className="mt-4 max-h-[400px] overflow-y-auto p-5 bg-muted rounded-lg border border-muted-foreground/10">
          <p className="text-base leading-relaxed text-foreground tracking-tight whitespace-pre-wrap">
            {comments || "No comments available."}
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
