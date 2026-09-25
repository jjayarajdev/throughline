import React from "react";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover"; // adjust path
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Columns4 } from "lucide-react"; // or wherever you import icons
import { ExportButton } from "../form-fields/ExportButton";
import { isPartner } from "@/store/userStore";

interface Column {
  id: string;
  label: string;
  visible: boolean;
}

interface ColumnsPopoverProps {
  columns: Column[];
  toggleColumn: (id: string) => void;
  screeningData: any; // adjust type if possible
  buttonName: string;
}

const ColumnsPopover: React.FC<ColumnsPopoverProps> = ({
  columns,
  toggleColumn,
  screeningData = [],
  buttonName,
}) => {
  return (
    <div className="flex items-center gap-2">
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
             className="h-9 text-[#007E61] hover:text-[#007E61] hover:bg-[#E6F4F1] dark:text-[#00cc99] dark:hover:bg-[#11332b]"
          >
            <Columns4 className="h-4 w-4 mr-2" />
            Columns
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className="w-56 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white"
          align="end"
        >
          <div className="space-y-2">
            {columns.map((column) => (
              <div key={column.id} className="flex items-center space-x-2">
                <Checkbox
                  className="border-green-600 cursor-pointer dark:border-green-600 data-[state=checked]:bg-green-600 data-[state=checked]:border-green-700 data-[state=checked]:text-white dark:data-[state=checked]:bg-green-600 dark:data-[state=checked]:text-white"
                  id={column.id}
                  checked={column.visible}
                  onCheckedChange={() => toggleColumn(column.id)}
                />
                <label
                  htmlFor={column.id}
                  className="text-sm cursor-pointer font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  {column.label}
                </label>
              </div>
            ))}
          </div>
        </PopoverContent>
      </Popover>
      {/* {
        (!isPartner && screeningData.length>0 ) && (
          <ExportButton data={screeningData} fileName={`${buttonName}-list.xlsx`} />
        )
      } */}
    </div>
  );
};

export default ColumnsPopover;
