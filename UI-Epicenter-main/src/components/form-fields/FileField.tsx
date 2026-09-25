import api from "@/lib/axiosInstance";
import React, { useState } from "react";
import {
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Eye, Upload } from "lucide-react";
import { Control } from "react-hook-form";

interface FileFieldProps {
    control: Control<any>;
    name: string;
    label: string;
    accept?: string;
    required?: boolean;
    disabled?: boolean;
}

export function FileField({
    control,
    name,
    label,
    accept = ".pdf,.doc,.docx",
    required = false,
    disabled = false,
}: FileFieldProps) {
    const [uploading, setUploading] = useState(false);

    return (
        <FormField
            control={control}
            name={name}
            render={({ field }) => (
                <FormItem>
                    <FormLabel className="text-sm font-medium">
                        {label}<span className="text-amber-950 dark:text-emerald-700">{field.value?.attachmentURL ? "(" + field.value?.attachmentName + ")" : null}</span>
                        {required && <span className="text-red-500">*</span>}
                    </FormLabel>
                    <div className="flex gap-2 items-center">
                        <FormControl>
                            <div className="relative flex-1">
                                <Input
                                    id="file-upload"
                                    type="file"
                                    accept={accept}
                                    disabled={disabled || uploading}
                                    className="h-10 w-full"
                                    onChange={async (e) => {
                                        const file = e.target.files?.[0];
                                        if (!file) return;
                                        setUploading(true);
                                        try {
                                            const formData = new FormData();
                                            formData.append("file", file);
                                            const res = await api.post("/FileServer/upload", formData, {
                                                headers: { "Content-Type": "multipart/form-data" },
                                            });
                                            const fileName = res.data.fileName || res.data;
                                            field.onChange({
                                                attachmentURL: fileName,
                                                attachmentName: fileName
                                            });
                                        } catch (error) {
                                            console.error("Upload failed", error);
                                        } finally {
                                            setUploading(false);
                                        }
                                    }}
                                />
                                <label htmlFor="file-upload">
                                    <Upload className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
                                </label>
                            </div>
                        </FormControl>
                        {/* {field.value?.attachmentURL && (
                            <Button
                                type="button"
                                variant="outline"
                                size="icon"
                                className="h-10 w-10"
                                onClick={() => window.open(field.value.attachmentURL, "_blank")}
                            >
                                <Eye className="h-4 w-4" />
                            </Button>
                        )} */}
                    </div>
                    <FormMessage />
                </FormItem>
            )}
        />
    );
}