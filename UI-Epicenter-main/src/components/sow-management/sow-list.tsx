"use client";

import { Button } from "@/components/ui/button";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { partnerApi } from "@/services/api/partner.profile.api";
import TableSkeletonLoader from "@/components/skelton/TableSkelton";
import { ChevronDown, ChevronRight } from "lucide-react";
import Pagination from "../common/Pagination";

interface SOW {
    sowNumber: string;
    startDate: string;
    endDate: string;
    tcValue: number;
    status: boolean;
    poDetails: PODetail[];
    soW_CRs: SOWCR[];
    partnerId: number;
    partnerName: string;
    partnerCode: string;
    id: number;
    isActive: boolean;
}

interface PODetail {
    poNumber: string;
    startDate: string;
    endDate: string;
    poValue: number;
    status: boolean;
    pO_CRs: POCR[];
    sowId: number;
    sowNumber: string;
    id: number;
    isActive: boolean;
}

interface SOWCR {
    crTypeId: number;
    crNumber: string;
    crRequestDate: string;
    extendedDate?: string;
    isRateChanged: boolean;
    comments?: string;
    sowId: number;
    id: number;
    isActive: boolean;
}

interface POCR {
    // Add POCR interface properties if needed
}

export default function CompleteSowList() {
    const [currentPage, setCurrentPage] = useState(1);
    const [expandedSowIds, setExpandedSowIds] = useState<Set<number>>(new Set());
    const [activeTab, setActiveTab] = useState(1);
      const [pageSize, setPageSize] = useState(50);
    
    // Fetch all three categories simultaneously
    const { data: activeSows, isLoading: isLoadingActive } = useQuery({
        queryKey: ["sowDetails", 1, currentPage,pageSize],
        queryFn: () => partnerApi.getCompleteSowList(1, {
            pageNumber: currentPage,
            pageSize
        }),
    });

    const { data: upForRenewalSows, isLoading: isLoadingRenewal } = useQuery({
        queryKey: ["sowDetails", 2, currentPage],
        queryFn: () => partnerApi.getCompleteSowList(2, {
            pageNumber: currentPage,
            pageSize
        }),
    });

    const { data: inactiveSows, isLoading: isLoadingInactive } = useQuery({
        queryKey: ["sowDetails", 3, currentPage],
        queryFn: () => partnerApi.getCompleteSowList(3, {
            pageNumber: currentPage,
            pageSize
        }),
    });

    const toggleSowExpansion = (sowId: number) => {
        const newExpandedSows = new Set(expandedSowIds);
        if (newExpandedSows.has(sowId)) {
            newExpandedSows.delete(sowId);
        } else {
            newExpandedSows.add(sowId);
        }
        setExpandedSowIds(newExpandedSows);
    };

    const renderPODetails = (poDetails: PODetail[]) => {
        if (!poDetails || poDetails.length === 0) {
            return (
                <TableRow>
                    <TableCell colSpan={5} className="text-center py-4">
                        No PO details available
                    </TableCell>
                </TableRow>
            );
        }

        return poDetails.map((po) => (
            <TableRow key={po.id}>
                <TableCell>{po.poNumber}</TableCell>
                <TableCell>{format(new Date(po.startDate), 'dd MMM yyyy')}</TableCell>
                <TableCell>{format(new Date(po.endDate), 'dd MMM yyyy')}</TableCell>
                <TableCell>₹{po.poValue.toLocaleString()}</TableCell>
                <TableCell>
                    <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${po.status
                            ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                            : "bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300"
                            }`}
                    >
                        {po.status ? "Active" : "Inactive"}
                    </span>
                </TableCell>
            </TableRow>
        ));
    };

    const isLoading = isLoadingActive || isLoadingRenewal || isLoadingInactive;

    if (isLoading) {
        return <TableSkeletonLoader />;
    }

    // Get the current data based on active tab
    const getCurrentData = () => {
        switch (activeTab) {
            case 1:
                return activeSows?.data;
            case 2:
                return upForRenewalSows?.data;
            case 3:
                return inactiveSows?.data;
            default:
                return null;
        }
    };

    const currentData = getCurrentData();
    const sows = currentData?.items || [];
    const totalPages = currentData?.totalPages || 1;
    const hasPrevious = currentData?.hasPrevious;
    const hasNext = currentData?.hasNext;

    return (
        <div className="p-6">
            <div className="flex mb-4 border-b">
                <button
                    className={`px-6 py-3 text-sm font-medium ${activeTab === 1
                        ? "text-cyan-500 border-b-2 border-cyan-500"
                        : "text-gray-500 hover:text-gray-700"
                        }`}
                    onClick={() => {
                        setPageSize(10); 
                        setActiveTab(1);
                        setCurrentPage(1);
                      
                    }}
                >
                    Active ({activeSows?.data?.totalCount || 0})
                </button>
                <button
                    className={`px-6 py-3 text-sm font-medium ${activeTab === 2
                        ? "text-cyan-500 border-b-2 border-cyan-500"
                        : "text-gray-500 hover:text-gray-700"
                        }`}
                    onClick={() => {
                        setPageSize(10);
                        setActiveTab(2);
                        setCurrentPage(1);
                         
                    }}
                >
                    Up for Renewal <span className="text-red-900">({upForRenewalSows?.data?.totalCount || 0})</span>
                </button>
                <button
                    className={`px-6 py-3 text-sm font-medium ${activeTab === 3
                        ? "text-cyan-500 border-b-2 border-cyan-500"
                        : "text-gray-500 hover:text-gray-700"
                        }`}
                    onClick={() => {
                        setPageSize(10); 
                        setActiveTab(3);
                        setCurrentPage(1);
                        
                    }}
                >
                    Inactive ({inactiveSows?.data?.totalCount || 0})
                </button>
            </div>

            <div className="bg-white rounded-lg shadow dark:bg-gray-900">
                <Table>
                    <TableHeader>
                        <TableRow className="bg-[#E5F9F6] dark:bg-gray-800">
                            <TableHead className="w-[50px]"></TableHead>
                            <TableHead>Partner Code</TableHead>
                            <TableHead>SOW Number</TableHead>
                            <TableHead>Start Date</TableHead>
                            <TableHead>End Date</TableHead>
                            <TableHead>TC Value</TableHead>
                            <TableHead>Status</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {sows.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={7} className="text-center py-4">
                                    No SOWs found
                                </TableCell>
                            </TableRow>
                        ) : (
                            sows.map((sow: any) => (
                                <>
                                    <TableRow key={sow.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                                        <TableCell>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="h-8 w-8 p-0"
                                                onClick={() => toggleSowExpansion(sow.id)}
                                            >
                                                {expandedSowIds.has(sow.id) ? (
                                                    <ChevronDown className="h-4 w-4" />
                                                ) : (
                                                    <ChevronRight className="h-4 w-4" />
                                                )}
                                            </Button>
                                        </TableCell>
                                        <TableCell>{sow.partnerCode}</TableCell>
                                        <TableCell>{sow.sowNumber}</TableCell>
                                        <TableCell>{format(new Date(sow.startDate), 'dd MMM yyyy')}</TableCell>
                                        <TableCell>{format(new Date(sow.endDate), 'dd MMM yyyy')}</TableCell>
                                        <TableCell>₹{sow.tcValue.toLocaleString()}</TableCell>
                                        <TableCell>
                                            <span
                                                className={`px-3 py-1 rounded-full text-xs font-medium ${sow.status
                                                    ? "bg-emerald-50 text-emerald-700"
                                                    : "bg-slate-100 text-slate-700"
                                                    }`}
                                            >
                                                {sow.status ? "Active" : "Inactive"}
                                            </span>
                                        </TableCell>
                                    </TableRow>
                                    {expandedSowIds.has(sow.id) && (
                                        <TableRow>
                                            <TableCell colSpan={7} className="p-0 border-t-0">
                                                <div className="p-4 bg-gray-50 dark:bg-gray-800">
                                                    <Table>
                                                        <TableHeader>
                                                            <TableRow className="bg-[#EEF2FF] dark:bg-gray-800">
                                                                <TableHead>PO Number</TableHead>
                                                                <TableHead>Start Date</TableHead>
                                                                <TableHead>End Date</TableHead>
                                                                <TableHead>PO Value</TableHead>
                                                                <TableHead>Status</TableHead>
                                                            </TableRow>
                                                        </TableHeader>
                                                        <TableBody>
                                                            {renderPODetails(sow.poDetails)}
                                                        </TableBody>
                                                    </Table>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </>
                            ))
                        )}
                    </TableBody>
                </Table>

                <div className="flex items-center justify-between p-4 border-t">
                    <div className="text-sm text-gray-500">
                        Page {currentPage} of {totalPages}
                    </div>
                      <Pagination
                                  value={pageSize}
                                  totalEntry={currentData?.totalCount}
                                  onChange={(newSize) => {
                                    setPageSize(newSize);
                                  }}
                                  currentPage={currentPage}
                                  totalPages={totalPages || 0}
                                  onPageChange={setCurrentPage}
                                  hasNext={hasNext}
                                  hasPrevious={hasPrevious}
                                />
                </div>
            </div>
        </div>
    );
}