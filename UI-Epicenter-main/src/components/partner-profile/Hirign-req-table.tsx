"use client";

import { hiringApi } from '@/services/api/hiring.api';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from '../ui/button';
import { Check, ChevronDown, Menu, X } from 'lucide-react';
import { toast } from "sonner";
import api from "@/lib/axiosInstance";

interface HrqTableProps {
    id: number;
}

interface PartnerHrqItem {
    id: number;
    hrqId: string;
    jobTitle: string;
    businessName: string;
    partnerAssignedDate: string;
    rmOwnerName: string;
    hiringRequestId: string;
}

interface PartnerHrqResponse {
    data: {
        items: PartnerHrqItem[];
        totalCount: number;
    };
}

const HirignReqTable = ({ id }: HrqTableProps) => {
    const queryClient = useQueryClient();

    const { data: PartnerHrq, isFetching } = useQuery<PartnerHrqResponse>({
        queryKey: ["PartnerHrq", id],
        queryFn: () => hiringApi.getHiringRequestForPartners({
            pageNumber: 1,
            pageSize: 10,
        }, id),
        enabled: !!id,
    });

    const unassignMutation = useMutation({
        mutationFn: async (hiringRequestId: number) => {
            const response = await api.patch(`/HiringRequest/partner-hrqs/remove-partner/${hiringRequestId}/${id}`);
            return response.data;
        },
        onSuccess: () => {
            toast.success("Hiring Request unassigned successfully");
            queryClient.invalidateQueries({ queryKey: ["PartnerHrq", id] });
        },
        onError: () => {
            toast.error("Failed to unassign partner");
        }
    });

    const handleUnassign = (hiringRequestId: number) => {
        unassignMutation.mutate(hiringRequestId);
    };

    const formatDate = (dateString: string) => {
        if (!dateString) return '';
        return new Date(dateString).toISOString().split('T')[0];
    };

    if (isFetching) {
        return (
            <div className="flex justify-center items-center h-80">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        );
    }

    return (
        <div className="overflow-x-auto h-80">
            <table className="w-full border-collapse table-auto">
                <thead>
                    <tr className="bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
                        <th className="px-4 py-2 text-left">HRQ ID</th>
                        <th className="px-4 py-2 text-left">Role Hired For</th>
                        <th className="px-4 py-2 text-left">BusinessName</th>
                        <th className="px-4 py-2 text-left">Assigned Date</th>
                        <th className="px-4 py-2 text-left">RM Owner</th>
                        <th className="px-4 py-2 text-left">Action</th>
                    </tr>
                </thead>
                <tbody>
                    {!PartnerHrq?.data?.items?.length ? (
                        <tr>
                            <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                                No data available
                            </td>
                        </tr>
                    ) : (
                        PartnerHrq.data.items.map((poDetail: PartnerHrqItem) => (
                            <tr key={poDetail.id} className="border-b hover:bg-gray-50">
                                <td className="px-4 py-2">{poDetail.hrqId}</td>
                                <td className="px-4 py-2">{poDetail.jobTitle}</td>
                                <td className="px-4 py-2">{poDetail.businessName}</td>
                                <td className="px-4 py-2">{formatDate(poDetail.partnerAssignedDate)}</td>
                                <td className="px-4 py-2">{poDetail.rmOwnerName}</td>
                                <td className="px-4 py-2">
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button
                                                variant="outline"
                                                className="h-8 p-2"
                                            >
                                                <Menu className="h-4 w-4 mr-1" />
                                                <ChevronDown className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent
                                            align="end"
                                            className="w-[160px]"
                                        >
                                            <DropdownMenuItem
                                                onClick={() => handleUnassign(parseInt(poDetail.hiringRequestId))}
                                                className="h-8 text-red-600 hover:text-red-700"
                                            >
                                                <X className="h-4 w-4 mr-2" />
                                                Unassign
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </td>
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
        </div>
    );
};

export default HirignReqTable;