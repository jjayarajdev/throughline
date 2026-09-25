"use client";

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
import { Card, CardContent } from "@/components/ui/card";
import { Upload, Trash2, FileText, Plus } from "lucide-react";
import { Control } from "react-hook-form";
import { toast } from "sonner";
import { ResumePreview } from "../common/ResumePreview";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useQuery } from "@tanstack/react-query";
import { partnerApi } from "@/services/api/partner.profile.api";
import { useDebounce } from "@/lib/useDebounce";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import Pagination from "../common/Pagination";
import { ca } from "zod/v4/locales";

interface Document {
  id?: number;
  attachmentName: string;
  attachmentURL: string;
  name?: string;
  partnerId?: number;
  partnerEmpanelId?: number;
  candiadateBGVId?:number
}

interface MultiDocumentFieldProps {
  control: Control<any>;
  name: string;
  label: string;
  accept?: string;
  required?: boolean;
  disabled?: boolean;
  maxFiles?: number;
  partnerId?: number | string; // Add partnerId prop
  isCreating?: boolean; // Add flag to determine if creating or updating
  partnerEmpanelId?:number
  isToggle?:boolean;
  refetchPartner?:any
  candiadateBGVId?:any;
  docType?:any
additionalDocId?:any
uploadBGVDocId?:number
}

export function MultiDocumentField({
  control,
  name,
  label,
  accept = ".pdf,.doc,.docx,.ppt,.pptx",
  required = false,
  disabled = false,
  maxFiles = 10,
  partnerId,
  isCreating = false,
  partnerEmpanelId,
  isToggle,
  refetchPartner,
  candiadateBGVId,
  docType,
  additionalDocId,
  uploadBGVDocId
}: MultiDocumentFieldProps) {
 
  const [uploading, setUploading] = useState(false);
  const [docRefresh, setDocRefresh] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchText, setSearchText] = useState("");
  const debouncedSearch = useDebounce(searchText, 300);
  const [pageSize, setPageSize] = useState(50);

  const handleFileUpload = async (file: File, field: any) => {
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await api.post("/FileServer/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const fileName = res.data.fileName || res.data;

      // Create document with appropriate partnerId based on create/update mode
      const newDocument: Document = {
        id: 0, // Always 0 for new uploads
        attachmentURL: fileName,
        attachmentName: fileName,
        name: fileName,
        partnerId: isCreating ? 0 : partnerId ? Number(partnerId) : 0, // 0 for creating, actual partnerId for updating
        partnerEmpanelId: isCreating ? 0 : partnerId ? Number(partnerId) : 0, // Handle partnerEmpanelId for empanelment documents
        candiadateBGVId:isCreating?0:candiadateBGVId?Number(candiadateBGVId):0
      };

      // Get current documents array
      const currentDocuments = field.value || [];

      // Check if we've reached the max files limit
      if (currentDocuments.length >= maxFiles) {
        toast.error(`Maximum ${maxFiles} files allowed`);
        return;
      }

      // Add new document to the array
      const updatedDocuments = [...currentDocuments, newDocument];
      field.onChange(updatedDocuments);

      toast.success("Document uploaded successfully");
    } catch (error) {
      console.error("Upload failed", error);
      toast.error("Failed to upload document");
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteDocument = async (
    index: number,
    field: any,
    document: Document
  ) => {
    try {
      // Call delete API if document has a filename
      if (document?.attachmentURL) {
        await api.delete(`/FileServer/${document?.attachmentName}`);
      }

      // Remove document from array
      const currentDocuments = field.value || [];
    const updatedDocuments = currentDocuments.filter(
      (doc: Document) => doc?.attachmentURL !== document?.attachmentURL
    );
    field.onChange(updatedDocuments);
   if (typeof refetchPartner === "function") {
       await refetchPartner();
    }
    
    await reFetchData();
    setDocRefresh((prev) => prev + 1);
      toast.success("Document deleted successfully");
    } catch (error:any) {
      console.error("Delete failed", error);
      toast.error(error);
    }
  };

  // Helper function to construct full URL for preview
  const getPreviewUrl = (document: Document) => {
    if (!document?.attachmentURL) return "";

    // If it's already a full URL, return as is
    if (document?.attachmentURL.startsWith("http")) {
      return document?.attachmentURL;
    }

    // Construct full URL from filename
    return `${process.env.NEXT_PUBLIC_API_BASE_URL}/FileServer/${document?.attachmentURL}`;
  };
  let partnerIds=partnerEmpanelId?partnerEmpanelId:partnerId;
  let url=candiadateBGVId?`onboarding/CandidateBgv/paged/documents?bgvDocId=${candiadateBGVId}&docType=${docType}`:partnerEmpanelId?`Empanelment/paged/sow-quote-documents?partnerempanelId=${partnerEmpanelId}`:`/Partner/paged/capability-deck-documants?partnerId=${partnerId}`

  const {
    data: capabilityDeckDocuments,
    refetch: reFetchData,
    isPending,
  } = useQuery({
    queryKey: [
      "capabilityDeckDocuments",
      partnerIds,
      currentPage,
      debouncedSearch,
      pageSize,
    ],
    queryFn: () =>
      partnerApi.getcapabilityDeckDocuments(url, {
        pageNumber: currentPage,
        pageSize,

        searchText: debouncedSearch || undefined,
      }),
    enabled: !!partnerId,
    refetchOnWindowFocus: true,
  });
  const getcapabilityDeckDocumentsData = capabilityDeckDocuments?.items || [];
  const hasPrevious = capabilityDeckDocuments?.hasPrevious;
  const hasNext = capabilityDeckDocuments?.hasNext;
  const totalPages = capabilityDeckDocuments?.totalPages || 1;

  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem className="space-y-4">
          <FormLabel className="text-sm font-medium">
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
            {field.value?.length > 0 && (
              <span className="text-muted-foreground ml-2">
                {/* ({field.value.length} document
                {field.value.length !== 1 ? "s" : ""} uploaded) */}
              </span>
            )}
          </FormLabel>

          {/* Upload Section */}
          <div className="space-y-4">
            <div className="flex gap-2 items-center">
              <FormControl>
                <div className="relative flex-1">
                  <Input
                    id={`file-upload-${name}`}
                    type="file"
                    accept={accept}
                    disabled={
                      disabled || uploading || field.value?.length >= maxFiles
                    }
                    className="h-10 w-full"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      await handleFileUpload(file, field);
                      // Clear the input so the same file can be uploaded again if needed
                      e.target.value = "";
                    }}
                  />
                  <label
                    htmlFor={`file-upload-${name}`}
                    className="cursor-pointer"
                  >
                    <div className="absolute right-3 top-3 flex items-center gap-2">
                      {uploading ? (
                        <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full" />
                      ) : (
                        <Plus className="h-4 w-4 text-muted-foreground" />
                      )}
                    </div>
                  </label>
                </div>
              </FormControl>
            </div>

            {field.value?.length >= maxFiles && (
              <p className="text-sm text-amber-600 dark:text-amber-400">
                Maximum {maxFiles} files allowed. Delete a file to upload a new
                one.
              </p>
            )}
          </div>

          {(() => {
            const docs = field.value || [];
            if (docs.length === 0) return null;
            let isLatestOnly = false;

            if (isToggle && !!partnerEmpanelId) {
                 isLatestOnly = true;
            } else if (!isToggle && !!partnerId ) {
                   isLatestOnly = true;
            } else if(!isToggle && !!additionalDocId){
                     isLatestOnly = true;
            }else if(!isToggle && !!uploadBGVDocId){
                     isLatestOnly = true;
            }
        const renderDocs = isLatestOnly ? [docs[docs.length - 1]] : docs;

            return renderDocs.map((doc, i) => {
              const isLatest = i === docs.length - 1;
              const index = isLatestOnly ? docs.length - 1 : i;

              return (
                <Card
                  key={`${docRefresh}-${doc?.attachmentName}`}
                  className="border border-border/50 hover:border-border transition-colors"
                >
                  <CardContent className="p-3">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="flex-shrink-0">
                          <FileText className="h-5 w-5 text-blue-500" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p
                            className="text-sm font-medium truncate"
                            title={doc?.attachmentName}
                          >
                            {doc?.attachmentName}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {isLatest ? "Latest Document" : `Document ${i + 1}`}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <ResumePreview
                          url={getPreviewUrl(doc)}
                          fileName={doc?.attachmentName}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleDeleteDocument(index, field, doc);
                          }}
                          disabled={disabled}
                          title="Delete document"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            });
          })()}
          <Dialog>
            <DialogTrigger asChild>
              <Button
                onClick={async () => await reFetchData()}
                variant="hpButton"
                className="w-64"
                 disabled={!(!!(isToggle ? partnerEmpanelId : partnerId)|| additionalDocId || uploadBGVDocId)}
              >
                Previous Documents
              </Button>
            </DialogTrigger>

            <DialogContent className="w-full sm:max-w-5xl px-6">
              <DialogHeader>
                <DialogTitle>Previous Documents</DialogTitle>
              </DialogHeader>
              <div className="overflow-auto max-h-[900px]">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-teal-200 dark:bg-gray-800">
                      <TableHead>S.No</TableHead>
                      <TableHead>File Name</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Time</TableHead>
                      <TableHead>View</TableHead>
                      <TableHead>Delete</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {getcapabilityDeckDocumentsData?.map(
                      (doc: any, index: number) => (
                        <TableRow key={doc?.id}>
                          <TableCell>{index + 1}</TableCell>
                          <TableCell>{doc?.attachmentName}</TableCell>
                          <TableCell>{doc?.createdDate}</TableCell>
                          <TableCell>{doc?.createdTime}</TableCell>
                          <TableCell>
                            <ResumePreview
                              url={doc?.attachmentURL}
                              fileName={doc?.attachmentName}
                            />
                          </TableCell>
                          <TableCell>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                handleDeleteDocument(index, field, doc);
                              }}
                              title="Delete document"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      )
                    )}
                  </TableBody>
                </Table>
                <div className="flex items-center justify-between p-4">
                  <div className="text-sm text-gray-500">
                    Page {currentPage} of {totalPages}
                  </div>
                  <Pagination
                    value={pageSize}
                    totalEntry={capabilityDeckDocuments?.totalCount}
                    onChange={(newSize) => {
                      setPageSize(newSize);
                    }}
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={setCurrentPage}
                    hasNext={hasNext}
                    hasPrevious={hasPrevious}
                  />
                </div>
              </div>
            </DialogContent>
          </Dialog>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
