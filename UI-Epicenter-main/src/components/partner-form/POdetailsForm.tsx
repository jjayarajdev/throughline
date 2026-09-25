"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { Plus, MoreVertical } from "lucide-react";
import { InputField } from "../form-fields/InputField";
import { SelectField } from "../form-fields/SelectField";
import { FileField } from "../form-fields/FileField";
import { useMutation, useQuery } from "@tanstack/react-query";
import { MasterTypes } from "@/constants/masterTypes";
import { dropdownApi } from "@/services/api/master";
import { partnerApi, PoDetailsPayload } from "@/services/api/partner.profile.api";
import { toast } from "sonner";
import { poDetailSchema } from "@/services/api/partner.profile.api";
import { usePartnerStore } from "@/store/userPartnerStore";
import {   useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DatePickerField } from "../form-fields/DatePickerField";

type PoDetailFormValues = z.infer<typeof poDetailSchema>;

interface PODetailsFormProps {
    onNext?: () => void;
    onPrevious?: () => void;
}

export default function PODetailsForm({ onNext, onPrevious }: PODetailsFormProps) {
    const [mounted, setMounted] = useState(false);
    const [showForm, setShowForm] = useState(false);
    const [poTypeForm, setPoTypeFrom] = useState<'NEW' | 'CR'>('NEW');
    const [selectedPo, setSelectedPo] = useState<any>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [showExtensionFields, setShowExtensionFields] = useState(false);
    const router = useRouter()
    const { partnerCode } = usePartnerStore();
    const searchParams = useSearchParams();
     const partnerId = searchParams.get("id") || "";

    useEffect(() => {
        setMounted(true);
    }, []);

    const form = useForm<z.infer<typeof poDetailSchema>>({
        resolver: zodResolver(poDetailSchema),
        defaultValues: {
            poNumber: "",
            sowNumber: "",
            sowStartDate: "",
            sowEndDate: "",
            poValue: "",
            poTypeId: "",
            poStatusId: "20001",
            thresholdPercentage: "",
            extensionDate: "",
            extendedBy: "",
            crId: "",
        },
    });

    const { data: poDetails = [], refetch: refetchPoDetails } = useQuery({
        queryKey: ["poDetails"],
        queryFn: () => partnerApi.getPoDetails(String(partnerId)),
        enabled: !!partnerId && mounted,
    });

    const { data: poTypes = [] } = useQuery({
        queryKey: ["poTypes"],
        queryFn: () => dropdownApi.fetchDropdown(MasterTypes.PO_TYPE),
        enabled: mounted,
    });

    const { data: poStatuses = [] } = useQuery({
        queryKey: ["poStatuses"],
        queryFn: () => dropdownApi.fetchDropdown(MasterTypes.PO_STATUS),
        enabled: mounted,
    });

    function formatFormData(values: PoDetailFormValues): PoDetailsPayload {
        return {
            id: selectedPo?.id || 0,
            isActive: true,
            poNumber: values.poNumber,
            sowNumber: values.sowNumber,
            sowStartDate: values.sowStartDate,
            sowEndDate: values.sowEndDate,
            poValue: values.poValue,
            poTypeId: values.poTypeId,
            poStatusId: values.poStatusId,
            thresholdPercentage: Number(values.thresholdPercentage),
            poDocuments: values.poDocuments,
            partnerId: partnerId,
            amendmentValue: values.amendmentValue || 0,
            extensionDate: values.extensionDate || undefined,
            extendedBy: values.extendedBy || undefined,
            crId: values.crId || undefined,
        };
    }

    const createPoMutation = useMutation({
        mutationFn: partnerApi.createPoDetails,
        onSuccess: () => {
            toast.success("PO details created successfully");
            setShowForm(false);
            setShowExtensionFields(false);
            form.reset();
            refetchPoDetails();
        },
        onError: (error) => {
            toast.error("Failed to create PO details");
            console.error("Error creating PO details:", error);
        },
    });

    const updatePoMutation = useMutation({
        mutationFn: (data: PoDetailsPayload) =>
            partnerApi.updatePoDetails(selectedPo.id, data),
        onSuccess: () => {
            toast.success("PO details updated successfully");
            setShowForm(false);
            setSelectedPo(null);
            setShowExtensionFields(false);
            form.reset();
            refetchPoDetails();
        },
        onError: (error) => {
            toast.error("Failed to update PO details");
            console.error("Error updating PO details:", error);
        },
    });

    function onSubmit(values: PoDetailFormValues) {
        const formattedData = formatFormData(values);
        if (selectedPo) {
            // If editing, use update mutation
            updatePoMutation.mutate(formattedData);
        } else {
            // If creating new, use create mutation
            createPoMutation.mutate(formattedData);
        }
    }

    const handleSave = async () => {
        const result = await form.trigger();
        if (result) {
            const values = form.getValues();
            onSubmit(values);
        }
    };

    const handlePoTypeChange = (type: 'NEW' | 'CR') => {
        setPoTypeFrom(type);
        form.setValue('poTypeId', type);
        if (type === 'NEW') {
            form.unregister('amendmentValue');
        }
    };

    const handleEdit = (poDetail: any) => {
        setSelectedPo(poDetail);
        setIsEditing(true);
        setShowExtensionFields(false);
        setPoTypeFrom(poDetail.poTypeId === '9002' ? 'CR' : 'NEW');
        form.reset({
            poNumber: poDetail.poNumber,
            sowNumber: poDetail.sowNumber,
            sowStartDate: new Date(poDetail.sowStartDate).toISOString().split('T')[0],
            sowEndDate: new Date(poDetail.sowEndDate).toISOString().split('T')[0],
            poValue: poDetail.poValue.toString(),
            poTypeId: poDetail.poTypeId.toString(),
            poStatusId: poDetail.poStatusId.toString(),
            thresholdPercentage: poDetail.thresholdPercentage.toString(),
            amendmentValue: poDetail.amendmentValue?.toString(),
            extensionDate: poDetail.extensionDate ? new Date(poDetail.extensionDate).toISOString().split('T')[0] : "",
            extendedBy: poDetail.extendedBy || "",
            crId: poDetail.crId || "",
        });
        setShowForm(true);
    };

    const handleExtension = (poDetail: any) => {
        handleEdit(poDetail);
        setShowExtensionFields(true);
    };

    const handleCancel = () => {
        setShowForm(false);
        setSelectedPo(null);
        setShowExtensionFields(false);
        form.reset();
    };

    if (!mounted) {
        return null;
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-semibold">PO Initiation</h2>
                    <div className="flex items-center gap-2 text-sm">
                        <span className="text-muted-foreground">Partner ID:</span>
                        <span className="font-medium">{partnerCode}</span>
                    </div>
                </div>

                <div className="flex justify-end items-center mb-4">
                    {!showForm && (
                        <Button
                            type="button"
                            variant="default"
                            size="sm"
                            className="bg-[#00A76F] hover:bg-[#00A76F]/90"
                            onClick={() => {
                                setShowForm(true);
                                setIsEditing(false);
                                setSelectedPo(null);
                                setShowExtensionFields(false);
                                form.reset();
                            }}
                        >
                            <Plus className="h-4 w-4 mr-2" />
                            Add
                        </Button>
                    )}
                </div>

                {showForm && (
                    <div className="space-y-6">
                        <div className="flex gap-4 mb-6">
                            <Button
                                type="button"
                                variant={poTypeForm === 'NEW' ? 'default' : 'outline'}
                                onClick={() => handlePoTypeChange('NEW')}
                                disabled={isEditing}
                            >
                                New
                            </Button>
                            <Button
                                type="button"
                                variant={poTypeForm === 'CR' ? 'default' : 'outline'}
                                onClick={() => handlePoTypeChange('CR')}
                                disabled={isEditing}
                            >
                                CR
                            </Button>
                        </div>

                        <div className="space-y-6">
                            <div className="relative border rounded-lg p-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <InputField
                                        control={form.control}
                                        name="poNumber"
                                        label="PO Number"
                                        placeholder="Enter PO number"
                                        required
                                    />

                                    <InputField
                                        control={form.control}
                                        name="sowNumber"
                                        label={poTypeForm === 'NEW' ? "SOW Number" : "CR Number"}
                                        placeholder="Enter SOW number"
                                        required
                                    />

                                    <DatePickerField
                                        control={form.control}
                                        name="sowStartDate"
                                        label={poTypeForm === 'NEW' ? "SOW Start date" : "CR Start date"}
                                      
                                        required
                                    />

                                    <DatePickerField
                                        control={form.control}
                                        name="sowEndDate"
                                        label={poTypeForm === 'NEW' ? "SOW End date" : "CR End date"}
                                        
                                        required
                                    />

                                    <InputField
                                        control={form.control}
                                        name="poValue"
                                        label="PO Value ⟨₹⟩"
                                        type="number"
                                        placeholder="Enter PO value"
                                        required
                                    />

                                    <SelectField
                                        control={form.control}
                                        name="poTypeId"
                                        label="PO Type"
                                        placeholder="Select Type"
                                        options={poTypes}
                                        disabled={isEditing}
                                        required
                                    />

                                    <SelectField
                                        control={form.control}
                                        name="poStatusId"
                                        label="PO Status"
                                        placeholder="Select Status"
                                        options={poStatuses}
                                        required
                                    />

                                    <FileField
                                        control={form.control}
                                        name="poDocuments"
                                        label="PO Documents"
                                        required
                                    />

                                    <InputField
                                        control={form.control}
                                        name="thresholdPercentage"
                                        label="Threshold (%)"
                                        type="number"
                                        placeholder="Enter threshold"
                                        required
                                    />

                                    {poTypeForm === 'CR' && (
                                        <InputField
                                            control={form.control}
                                            name="amendmentValue"
                                            label="Amendment value as per CR"
                                            type="number"
                                            placeholder="Enter amendment value"
                                            required
                                        />
                                    )}

                                    {showExtensionFields && (
                                        <>
                                            <DatePickerField
                                                control={form.control}
                                                name="extensionDate"
                                                label="Extension Date"
                                              
                                                required
                                            />

                                            <InputField
                                                control={form.control}
                                                name="extendedBy"
                                                label="Extended By"
                                                placeholder="Enter name"
                                                required
                                            />

                                            <InputField
                                                control={form.control}
                                                name="crId"
                                                label="CR ID (Mention CRID if exists)"
                                                placeholder="Enter CR ID"
                                                required
                                            />
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end gap-2">
                            <Button type="button" variant="outline" onClick={handleCancel}>
                                Cancel
                            </Button>
                            <Button type="submit">
                                {selectedPo ? 'Update' : 'Save'}
                            </Button>
                        </div>
                    </div>
                )}

                {poDetails?.data?.length > 0 && (
                    <div className="overflow-x-auto h-80">
                        <table className="w-full border-collapse table-auto">
                            <thead>
                                <tr className="bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
                                    <th className="px-4 py-2 text-left">Po Number</th>
                                    <th className="px-4 py-2 text-left">Number</th>
                                    <th className="px-4 py-2 text-left">Start Date</th>
                                    <th className="px-4 py-2 text-left">End Date</th>
                                    <th className="px-4 py-2 text-left">Po Value</th>
                                    <th className="px-4 py-2 text-left">Po Type</th>
                                    <th className="px-4 py-2 text-left">Threshold</th>
                                    <th className="px-4 py-2 text-left">Status</th>
                                    <th className="px-4 py-2 text-left">Extension Date</th>
                                    <th className="px-4 py-2 text-left">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {poDetails.data.map((poDetail: any) => (
                                    <tr key={poDetail.id} className="border-b">
                                        <td className="px-4 py-2">{poDetail.poNumber}</td>
                                        <td className="px-4 py-2">{poDetail.sowNumber}</td>
                                        <td className="px-4 py-2">{poDetail.sowStartDate.split("T")[0]}</td>
                                        <td className="px-4 py-2">{poDetail.sowEndDate.split("T")[0]}</td>
                                        <td className="px-4 py-2">{poDetail.poValue}</td>
                                        <td className="px-4 py-2">{poDetail.poTypeName}</td>
                                        <td className="px-4 py-2">{poDetail.thresholdPercentage}</td>
                                        <td className="px-4 py-2">{poDetail.poStatusName}</td>
                                        <td className="px-4 py-2">{poDetail?.extensionDate?.split("T")[0]}</td>
                                        <td className="px-4 py-2">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" className="h-8 w-8 p-0">
                                                        <MoreVertical className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem onClick={() => handleEdit(poDetail)}>
                                                        Edit
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem onClick={() => handleExtension(poDetail)}>
                                                        Extension
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                <div className="flex justify-between pt-6">
                    <Button variant="secondary" type="button" className="px-8" onClick={onPrevious}>
                        Previous
                    </Button>
                    <Button type="submit" className="px-8" onClick={() => router.replace('/home/partner-onboarding')}>
                        Submit
                    </Button>
                </div>
            </form>
        </Form>
    );
}