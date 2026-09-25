import { Eye, Loader2, Download } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useState } from "react";

interface ResumePreviewProps {
  url: string;
  fileName?: string;
}

export function ResumePreview({ url, fileName }: ResumePreviewProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  return (
    <>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="hover:text-[#1677ff]"
        onClick={() => setOpen(true)}
      >
        <Eye className="h-4 w-4" />
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="w-full max-w-[94vw] min-w-[800px] h-[95vh] p-4">
          <DialogHeader className="pb-3 border-b">
            <div className="flex items-center justify-between">
              <DialogTitle className="text-xl font-semibold text-[#1677ff]">
                {fileName || "Document"}
              </DialogTitle>
              {loading && (
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin text-[#1677ff]" />
                  <span className="text-sm text-gray-500">Loading document...</span>
                </div>
              )}
            </div>
          </DialogHeader>

          <div className="flex-1 w-full h-[calc(98vh-120px)] relative mt-2 overflow-hidden">
            <iframe
              src={url}
              className="w-full h-full rounded-lg border border-gray-200 shadow-sm bg-white"
              style={{
                width: "100%",
                transform: "scale(0.9)", // Reduced scale to fit width
                transformOrigin: "top center", // Center alignment
                margin: "0 auto", // Center the content
              }}
              title="Resume Preview"
              onLoad={() => setLoading(false)}
            />

            {loading && (
              <div className="absolute inset-0 flex items-center justify-center bg-white/90 rounded-lg">
                <div className="text-center bg-white p-6 rounded-lg shadow-sm">
                  <Loader2 className="h-8 w-8 animate-spin text-[#1677ff] mx-auto mb-3" />
                  <p className="text-sm font-medium text-gray-700">
                    Loading document...
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    This may take a few seconds
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="absolute bottom-0 left-0 right-0 p-4 border-t bg-white">
            <div className="flex justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open(url, "_blank")}
                className="flex items-center gap-2 hover:text-[#1677ff] hover:border-[#1677ff] hover:bg-[#1677ff]/5"
              >
                <Download className="h-4 w-4" />
                <span>Download</span>
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}