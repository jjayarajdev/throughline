import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronRight  } from "lucide-react";

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,

} from "@/components/ui/tooltip";
import { ScrollArea } from "@/components/ui/scroll-area";
import { format } from "date-fns";


import React, { useState } from "react";
import { CardContent } from "../ui/card";


interface PODetailsTableProps {
  poDetails: any[];
}

export function PODetailsTable({ poDetails }: PODetailsTableProps) {
  const [expandedRows, setExpandedRows] = useState<string[]>([]);
 const toggleRow = (sowNumber: string) => {
    setExpandedRows(prev =>
      prev.includes(sowNumber)
        ? prev.filter(row => row !== sowNumber)
        : [...prev, sowNumber]
    );
  };
 return (
    <div className="overflow-x-auto h-80">
      <CardContent className="p-6">
        <ScrollArea className="h-[600px] rounded-md">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50 dark:bg-gray-800 hover:bg-gray-50/80 dark:hover:bg-gray-700">
                <TableHead className="w-[50px]"></TableHead>
                <TableHead className="font-semibold">SOW Number</TableHead>
                <TableHead className="font-semibold">Start Date</TableHead>
                <TableHead className="font-semibold">End Date</TableHead>
                <TableHead className="font-semibold">TC Value</TableHead>
                <TableHead className="font-semibold">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {poDetails?.map((sow) => (
                <React.Fragment key={sow.sowNumber}>
                  <TableRow className="hover:bg-gray-50/50">
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleRow(sow.sowNumber)}
                        className="hover:bg-gray-100"
                      >
                        {expandedRows.includes(sow.sowNumber) ? (
                          <ChevronDown className="h-4 w-4 text-gray-500" />
                        ) : (
                          <ChevronRight className="h-4 w-4 text-gray-500" />
                        )}
                      </Button>
                    </TableCell>
                    <TableCell className="font-medium">{sow.sowNumber}</TableCell>
                    <TableCell>{format(new Date(sow.startDate), "yyyy-MM-dd")}</TableCell>
                    <TableCell>{format(new Date(sow.endDate), "yyyy-MM-dd")}</TableCell>
                    <TableCell className="font-medium">{sow.tcValue}</TableCell>
                    <TableCell>
                      <Badge
                        variant={sow.status ? "default" : "secondary"}
                        className={`${sow.status
                            ? "bg-green-100 text-green-600"
                            : "bg-red-100 text-red-800"
                          }`}
                      >
                        {sow.status ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <TooltipProvider>
                        <Tooltip>

                          <TooltipContent>
                            <p>Edit SOW details</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </TableCell>
                  </TableRow>

                  {/* PO Details Expandable Section */}
                  {expandedRows.includes(sow.sowNumber) && (
                    <TableRow>
                      <TableCell colSpan={7} className="p-0">
                        <div className="p-4 bg-gray-50/30 dark:bg-gray-900 border-l-2 border-[#007E61]">
                          <div className="flex justify-between items-center mb-4">
                            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-100">PO Details</h3>
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipContent>
                                  <p>Add new PO to this SOW</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </div>
                          <div className="rounded-md border">
                            <Table>
                              <TableHeader>
                                <TableRow className="bg-gray-50 dark:bg-gray-800 hover:bg-gray-50/80 dark:hover:bg-gray-700">
                                  <TableHead className="font-medium">PO Number</TableHead>
                                  <TableHead className="font-medium">Start Date</TableHead>
                                  <TableHead className="font-medium">End Date</TableHead>
                                  <TableHead className="font-medium">Value</TableHead>
                                  <TableHead className="font-medium">Status</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {sow.poDetails.map((po) => (
                                  <TableRow key={po.poNumber} className="hover:bg-gray-50/30">
                                    <TableCell>{po.poNumber}</TableCell>
                                    <TableCell>{format(new Date(po.startDate), "yyyy-MM-dd")}</TableCell>
                                    <TableCell>{format(new Date(po.endDate), "yyyy-MM-dd")}</TableCell>
                                    <TableCell className="font-medium">{po.poValue}</TableCell>
                                    <TableCell>
                                      <Badge
                                        variant={po.status ? "default" : "secondary"}
                                        className={`${po.status
                                            ? "bg-green-100 text-green-600"
                                            : "bg-red-100 text-red-800"
                                          }`}
                                      >
                                        {po.status ? "Active" : "Inactive"}
                                      </Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                      <TooltipProvider>
                                        <Tooltip>

                                          <TooltipContent>
                                            <p>Edit PO details</p>
                                          </TooltipContent>
                                        </Tooltip>
                                      </TooltipProvider>
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </React.Fragment>
              ))}
            </TableBody>
          </Table>
        </ScrollArea>
      </CardContent>
    </div>
  );
}