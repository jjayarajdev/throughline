"use client";

import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import * as XLSX from "xlsx";

type MaybeStringArray<T> = T[] | string;

interface ExportButtonProps<T> {
  data: MaybeStringArray<T>;
  fileName?: string;
}

export function ExportButton<T extends Record<string, any>>({
  data,
  fileName = "export.xlsx",
}: ExportButtonProps<T>) {
  const handleExport = () => {
    let rows: T[] = [];

    // 1) If it's a string, try to parse it
    if (typeof data === "string") {
      try {
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed)) {
          rows = parsed;
        } else {
          console.error("Parsed JSON is not an array:", parsed);
        }
      } catch (e) {
        console.error("Failed to parse JSON string:", e);
      }
    } else if (Array.isArray(data)) {
      rows = data;
    }

    if (rows.length === 0) {
      alert("No data to export");
      return;
    }
    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Hiring Cart");
    XLSX.writeFile(workbook, fileName);
  };

  return (
    <Button
      onClick={handleExport}
      variant="ghost"
      size="sm"
      className="h-9 text-[#0958d9] hover:text-[#0958d9] hover:bg-[#E6F4F1] dark:text-[#00cc99] dark:hover:bg-[#11332b]"
    >
      <Download className="h-4 w-4 mr-2" />
      Export
    </Button>
  );
}
