import { Card } from "@/components/ui/card";
import { FileText, Download } from "lucide-react";
import Link from "next/link";

interface DocumentsListProps {
  documents: any[];
}

export function DocumentsList({ documents }: DocumentsListProps) {
  return (
    <Card className="p-4">
      <div className="space-y-4">
        {documents?.map((file: any, index: number) => (
          <div key={index} className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <FileText className="h-6 w-6 text-gray-600 shrink-0" />
              <div className="min-w-0">
                <div className="font-medium truncate max-w-xs sm:max-w-sm md:max-w-md lg:max-w-lg" title={file.attachmentName}>
                  {file.attachmentName}
                </div>
                {file.size && (
                  <div className="text-sm text-gray-500 truncate">{file.size}</div>
                )}
              </div>
            </div>
            <div className="flex gap-2 shrink-0">
              {file.attachmentURL && (
                <Link
                  href={file.attachmentURL}
                  target="_blank"
                  className="text-gray-500 hover:text-gray-700"
                >
                  <Download className="h-5 w-5" />
                </Link>
              )}
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}