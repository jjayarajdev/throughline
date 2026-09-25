import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp } from "lucide-react";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { format } from "date-fns";
import { useState } from "react";

interface SowTableProps {
    data: any[];
}

export const SowTable = ({ data }: SowTableProps) => {
    const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());
    const [expandedPOs, setExpandedPOs] = useState<Set<string>>(new Set());

    const toggleRow = (rowId: number) => {
        const newExpandedRows = new Set(expandedRows);
        if (newExpandedRows.has(rowId)) {
            newExpandedRows.delete(rowId);
        } else {
            newExpandedRows.add(rowId);
        }
        setExpandedRows(newExpandedRows);
    };

    const togglePOSection = (sowId: number, section: 'active' | 'inactive') => {
        const sectionKey = `${sowId}-${section}`;
        const newExpandedPOs = new Set(expandedPOs);
        if (newExpandedPOs.has(sectionKey)) {
            newExpandedPOs.delete(sectionKey);
        } else {
            newExpandedPOs.add(sectionKey);
        }
        setExpandedPOs(newExpandedPOs);
    };

    const renderPoTable = (sowId: number, poDetails: any[], isActive: boolean) => {
        const filteredPos = poDetails.filter(po => po.status === isActive);
        const sectionKey = `${sowId}-${isActive ? 'active' : 'inactive'}`;
        const isExpanded = expandedPOs.has(sectionKey);

        if (filteredPos.length === 0) return null;

        return (
            <div className="mb-4">
                <div
                    className="flex items-center gap-2 cursor-pointer mb-2 hover:bg-indigo-50 dark:hover:bg-indigo-950 p-2 rounded-md transition-colors"
                    onClick={() => togglePOSection(sowId, isActive ? 'active' : 'inactive')}
                >
                    <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0 transition-transform duration-200"
                    >
                        {isExpanded ? (
                            <ChevronUp className="h-4 w-4" />
                        ) : (
                            <ChevronDown className="h-4 w-4" />
                        )}
                    </Button>
                    <h4 className="text-sm font-medium">
                        {isActive ? 'Active POs' : 'Inactive POs'} ({filteredPos.length})
                    </h4>
                </div>
                {isExpanded && (
                    <div className="border rounded-lg overflow-hidden transition-all duration-200 ease-in-out dark:border-indigo-900/30">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-indigo-50/50 dark:bg-indigo-950/30">
                                    <TableHead className="text-sm font-semibold">PO Number</TableHead>
                                    <TableHead className="text-sm font-semibold">Start Date</TableHead>
                                    <TableHead className="text-sm font-semibold">End Date</TableHead>
                                    <TableHead className="text-sm font-semibold">Value</TableHead>
                                    <TableHead className="text-sm font-semibold">Status</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredPos.map((po: any) => (
                                    <TableRow
                                        key={po.id}
                                        className="hover:bg-indigo-50/30 dark:hover:bg-indigo-950/20 transition-colors duration-200"
                                    >
                                        <TableCell className="font-medium">{po.poNumber}</TableCell>
                                        <TableCell>
                                            {format(new Date(po.startDate), 'dd MMM yyyy')}
                                        </TableCell>
                                        <TableCell>
                                            {format(new Date(po.endDate), 'dd MMM yyyy')}
                                        </TableCell>
                                        <TableCell className="font-medium">
                                            ₹{po.poValue.toLocaleString()}
                                        </TableCell>
                                        <TableCell>
                                            <span className={`px-3 py-1 rounded-full text-xs font-medium transition-colors duration-200 ${po.status
                                                ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                                                : 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300'
                                                }`}>
                                                {po.status ? 'Active' : 'Inactive'}
                                            </span>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="rounded-lg border shadow-sm dark:border-slate-700">
            <Table>
                <TableHeader>
                    <TableRow className="bg-slate-100 dark:bg-slate-800/80">
                        <TableHead className="w-[200px] font-semibold">SOW Number</TableHead>
                        <TableHead className="w-[150px] font-semibold">Start Date</TableHead>
                        <TableHead className="w-[150px] font-semibold">End Date</TableHead>
                        <TableHead className="w-[150px] font-semibold">TC Value</TableHead>
                        <TableHead className="w-[120px] font-semibold">Status</TableHead>
                        <TableHead className="w-[100px] font-semibold">PO Details</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {data.map((sow) => (
                        <>
                            <TableRow
                                key={sow.id}
                                className="bg-slate-50 dark:bg-slate-800/30 transition-colors duration-200"
                            >
                                <TableCell className="font-medium">{sow.sowNumber}</TableCell>
                                <TableCell>
                                    {format(new Date(sow.startDate), 'dd MMM yyyy')}
                                </TableCell>
                                <TableCell>
                                    {format(new Date(sow.endDate), 'dd MMM yyyy')}
                                </TableCell>
                                <TableCell className="font-medium">₹{sow.tcValue.toLocaleString()}</TableCell>
                                <TableCell>
                                    <span className={`px-3 py-1 rounded-full text-xs font-medium transition-colors duration-200 ${sow.status
                                        ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                                        : 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300'
                                        }`}>
                                        {sow.status ? 'Active' : 'Inactive'}
                                    </span>
                                </TableCell>
                                <TableCell>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className={`h-9 w-9 p-0 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all duration-200 ${expandedRows.has(sow.id) ? 'bg-slate-100 dark:bg-slate-800' : ''
                                            }`}
                                        onClick={() => toggleRow(sow.id)}
                                    >
                                        {expandedRows.has(sow.id) ? (
                                            <ChevronUp className="h-4 w-4" />
                                        ) : (
                                            <ChevronDown className="h-4 w-4" />
                                        )}
                                        <span className="sr-only">Toggle PO Details</span>
                                    </Button>
                                </TableCell>
                            </TableRow>
                            {expandedRows.has(sow.id) && (
                                <TableRow key={`po-${sow.id}`}>
                                    <TableCell colSpan={6} className="p-0">
                                        <div className="py-4 px-6 bg-slate-50 dark:bg-slate-900/50">
                                            {sow.poDetails && sow.poDetails.length > 0 ? (
                                                <>
                                                    {renderPoTable(sow.id, sow.poDetails, true)}
                                                    {renderPoTable(sow.id, sow.poDetails, false)}
                                                </>
                                            ) : (
                                                <p className="text-center text-slate-500 dark:text-slate-400 py-4">
                                                    No PO details available
                                                </p>
                                            )}
                                        </div>
                                    </TableCell>
                                </TableRow>
                            )}
                        </>
                    ))}
                    {data.length === 0 && (
                        <TableRow>
                            <TableCell colSpan={6} className="text-center py-8 text-slate-500 dark:text-slate-400">
                                No SOWs found
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        </div>
    );
}