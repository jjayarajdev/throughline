"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Pencil, Plus } from "lucide-react";
import { InputField } from "../form-fields/InputField";
import { SelectField } from "../form-fields/SelectField";
import { useEffect, useState } from "react";
import { dropdownApi } from "@/services/api/master";
import { useMutation, useQuery } from "@tanstack/react-query";
import { MasterTypes } from "@/constants/masterTypes";
import { usePartnerStore } from "@/store/userPartnerStore";
import { ContactMatrixPayload, partnerApi } from "@/services/api/partner.profile.api";
import { toast } from "@/lib/toast";
import { useSearchParams } from "next/navigation";
import { StatusBadge } from "../status-badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "../ui/input";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "../ui/dialog";
import { isAdmin, isPartner, isVendorManager } from "@/store/userStore";

const validateSpaces = (value: string) => {
    // Check for leading or trailing spaces
    if (value !== value.trim()) {
        return false;
    }
    // Check for multiple consecutive spaces
    if (/\s{2,}/.test(value)) {
        return false;
    }
    return true;
};

const validateCapitalization = (value: string) => {
    if (value.length === 0) return true;
    return /^[A-Z]/.test(value);
};

const validateLowercase = (value: string) => {
    return value === value.toLowerCase();
};

// Update the schema with validation rules
const contactSchema = z.object({
    contact: z.object({
        contactType: z.string().min(1, "Contact type is required"),
        name: z
            .string()
            .min(1, "Name is required")
            .refine(validateSpaces, {
                message: "Name cannot have leading/trailing spaces or multiple consecutive spaces",
            })
            .refine(validateCapitalization, {
                message: "First letter of name must be capitalized",
            }),
        email: z
            .string()
            .email("Invalid email address")
            .min(1, "Email is required")
            .refine(validateSpaces, {
                message: "Email cannot have leading/trailing spaces or multiple consecutive spaces",
            })
            .refine(validateLowercase, {
                message: "Email must be in lowercase",
            }),
        countryCode: z.string().optional(),
        contactNumber: z
        .string()
        .nonempty("Contact number is required")
        .refine((val) => /^\d+$/.test(val), {
        message: "Only numbers are allowed",
        }),
        country: z.string().min(1, "Country is required"),
        designation: z
            .string()
            .min(1, "Designation is required")
            .refine(validateSpaces, {
                message: "Designation cannot have leading/trailing spaces or multiple consecutive spaces",
            })
            .refine(validateCapitalization, {
                message: "First letter of designation must be capitalized",
            }),
        status: z.string().min(1, "Status is required"),
    }),
});
interface ContactMatrixFormProps {
    onNext?: () => void;
    onPrevious?: () => void;
}

type Contact = z.infer<typeof contactSchema>["contact"];

export default function ContactMatrixForm({ onNext, onPrevious }: ContactMatrixFormProps) {
    const [showForm, setShowForm] = useState(false);
    const [mounted, setMounted] = useState(false);
    const [selectedContact, setSelectedContact] = useState<any>(null);
    const { partnerCode } = usePartnerStore();
    const [contactmatrixId, setContactMatrixId] = useState<number | null>(null);
    const searchParams = useSearchParams();
    const partnerId = searchParams.get("id") || ""
    const [maxPhoneLength, setMaxPhoneLength] = useState<number>(10);
     const [pendingAction, setPendingAction] = useState<null | (() => void)>(null);
    const [openModal, setOpenModal] = useState(false);
     const [modalMessage, setModalMessage] = useState("");
    const [isChanged, setIsChanged] = useState(false);
    useEffect(() => {
        setMounted(true);
        setContactMatrixId(Number(partnerId));
    }, [partnerId]);

    const form = useForm<z.infer<typeof contactSchema>>({
        resolver: zodResolver(contactSchema),
        defaultValues: {
            contact: {
                contactType: "",
                name: "",
                email: "",
                contactNumber: "",
                countryCode: "",
                country: "",
                designation: "",
                status:isPartner?"25002":"25001",
            },
        },
    });

    const { data: contactMatrix, refetch: refetchContactMatrix, isError } = useQuery({
        queryKey: ["partnerContactMatrix", partnerId],
        queryFn: () => partnerApi.getContactMatrix(partnerId),
        enabled: !!partnerId && mounted,
    });

    const { data: countries = [] } = useQuery({
        queryKey: ["country"],
        queryFn: () => dropdownApi.fetchDropdown(MasterTypes.COUNTRY),
        enabled: mounted,
    });

    const { data: contactTypes = [] } = useQuery({
        queryKey: ["contactTypes"],
        queryFn: () => dropdownApi.fetchDropdown(MasterTypes.CONTACT_MATRIX_CONTACT_TYPE),
        enabled: mounted,
    });

    const { data: contactStatus = [] } = useQuery({
        queryKey: ["contactStatus"],
        queryFn: () => dropdownApi.fetchDropdown(MasterTypes.ACTIVE_INACTIVE_STATUS),
        enabled: mounted,
    });

    const createContactMutation = useMutation({
        mutationFn: partnerApi.createPartnerContactMatrix,
        onSuccess: async (data) => {
            toast.success("Contact added successfully");
            form.reset();
            setShowForm(false);
            refetchContactMatrix();
        },
        onError: (error:any) => {
            const message =
           error?.response?.data?.message ||
           error?.message ||                 
          "Failed to add contact";

          toast.error(message);
           
        },
    });
const emptyEscalation = {
        contactType: "",
        name: "",
        email: "",
        contactNumber: "",
        country: "",
        designation: "",
        status: "",
    };
    const updateContactMutation = useMutation({
        mutationFn: (values: ContactMatrixPayload) => partnerApi.updateContactMatrix(selectedContact.id, values),
        onSuccess: async (data) => {
            toast.success("Contact Updated successfully");
            form.reset();
            setShowForm(false);
            setSelectedContact(null)
            form.reset({ contact: emptyEscalation })
            refetchContactMatrix()
        },
        onError: (error:any) => {
            const message =
            error?.response?.data?.message ||
            error?.message ||                 
           "Failed to update contact";

           toast.error(message);
            

        },

    })


    function formatFormData(values: Contact): ContactMatrixPayload {
        // Combine country code and contact number for API
        const fullContactNumber = values.countryCode
            ? `${values.countryCode} ${values.contactNumber}`
            : values.contactNumber;

        return {
            id: selectedContact?.id || 0,
            isActive: true,
            contactMatrixTypeId: Number(values.contactType),
            name: values.name,
            email: values.email,
            contactNumber: fullContactNumber,
            countryId: values.country,
            designation: values.designation,
            statusId: values.status,
            partnerId: String(partnerId),
        };
    }
 
 const watchedValues = form.watch(); 
useEffect(() => {
  if (selectedContact) {
    const formattedInitial = {
      contactType: selectedContact.contactMatrixTypeId?.toString() || "",
      name: selectedContact.name || "",
      email: selectedContact.email || "",
      countryCode: selectedContact.contactNumber?.split(" ")[0] || "",
      contactNumber: selectedContact.contactNumber?.split(" ")[1] || "",
      country: selectedContact.countryId?.toString() || "",
      designation: selectedContact.designation || "",
      status: selectedContact.statusName === "Active" ? "25001" : "25002",
    };

    setIsChanged(hasChanges(formattedInitial, watchedValues.contact));
  } else {
    setIsChanged(true);
  }
}, [watchedValues, selectedContact]);


    function hasChanges(oldData: any, newData: any) {
     return JSON.stringify(oldData) !== JSON.stringify(newData);
    }


    function onSubmit(values: z.infer<typeof contactSchema>) {
        const selectedCountry = countries.find(
        (c: any) => c.id.toString() === values.contact.country
       );

      if (
         selectedCountry?.phoneMaxLength &&
         values.contact.contactNumber.length !== selectedCountry.phoneMaxLength
        ) {
         form.setError("contact.contactNumber", {
         type: "manual",
         message: `Contact number must be ${selectedCountry.phoneMaxLength} digits for ${selectedCountry.name}`,
        });
        return;
        }
       const formattedData = formatFormData(values.contact);
        let isPrivilegedUser= (isAdmin || isVendorManager)
        if (selectedContact) {
    if (hasChanges(selectedContact, formattedData)) {
      if (isPrivilegedUser) {
        updateContactMutation.mutate(formattedData);
      } else {
        setModalMessage(
          "You are modifying an existing contact. Please check, if you are changing anything in old record, it will go for vendor manager approval. Do you want to continue?"
        );
        setPendingAction(() => () => updateContactMutation.mutate(formattedData));
        setOpenModal(true);
      }
    } else {
      updateContactMutation.mutate(formattedData);
    }
  } else {
    if (isPrivilegedUser) {
      createContactMutation.mutate(formattedData);
    } else {
      setModalMessage(
        "You are creating a new contact. This will go for vendor manager approval. Do you want to continue?"
      );
      setPendingAction(() => () => createContactMutation.mutate(formattedData));
      setOpenModal(true);
    }
  }
      
    }


    const handleEdit = (contact: any) => {
        setSelectedContact(contact);

        // Parse the contact number to separate country code and number
        let countryCode = "";
        let contactNumber = contact.contactNumber;

        if (contact.contactNumber.startsWith("+")) {
            const spaceIndex = contact.contactNumber.indexOf(" ");
            if (spaceIndex !== -1) {
                countryCode = contact.contactNumber.substring(0, spaceIndex);
                contactNumber = contact.contactNumber.substring(spaceIndex + 1);
            }
        }
        form.reset({
            contact: {
                contactType: contact.contactMatrixTypeId.toString(),
                name: contact.name,
                email: contact.email,
                countryCode: countryCode,
                contactNumber: contactNumber,
                country: contact.countryId.toString(),
                designation: contact.designation || "",
                status: contact.statusName === "Active" ? "25001" : "25002",
            },
        });
        setShowForm(true);
    };
    // Handle country selection and update contact number with country code
    const handleCountryChange = (countryId: string) => {
        form.setValue("contact.country", countryId);

        // Find the selected country and get its country code
        const selectedCountry = countries.find((country: any) => country.id.toString() === countryId);

        if (selectedCountry?.countryCode) {
            form.setValue("contact.countryCode", selectedCountry.countryCode);
        } else {
            form.setValue("contact.countryCode", "");
        }

         if (selectedCountry?.phoneMaxLength) {
             setMaxPhoneLength(selectedCountry.phoneMaxLength);
          } else {
            setMaxPhoneLength(10); 
          }
    };

    if (!mounted) {
        return null;
    }

    return (
        <>
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-2xl font-semibold">Contact Matrix</h2>
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
                                    setSelectedContact(null);
                                    form.reset();
                                    setShowForm(true);
                                }}
                            >
                                <Plus className="h-4 w-4 mr-2" />
                                Add
                            </Button>
                        )}
                    </div>

                    {showForm && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-6 border rounded-lg relative">
                            <SelectField
                                control={form.control}
                                name="contact.contactType"
                                label="Contact Type"
                                placeholder="Select contact type"
                                options={contactTypes}
                                required
                            />

                            <InputField
                                control={form.control}
                                name="contact.name"
                                label="Full Name"
                                placeholder="Enter full name"
                                required
                            />

                            <InputField
                                control={form.control}
                                name="contact.email"
                                label="Email ID"
                                placeholder="Enter email"
                                type="email"
                                required
                            />


                            <FormField
                                control={form.control}
                                name="contact.country"
                                render={({ field }) => (
                                    <FormItem className="w-full">
                                        <FormLabel className="text-sm font-medium text-gray-700 dark:text-gray-200">
                                            Country <span className="text-red-500">*</span></FormLabel>
                                        <Select
                                            onValueChange={handleCountryChange}
                                            value={field.value}
                                        >
                                            <FormControl>
                                                <SelectTrigger className="h-10 w-full">
                                                    <SelectValue placeholder="Select country" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {countries.map((country: any) => (
                                                    <SelectItem key={country.id} value={country.id.toString()}>
                                                        <div className="flex items-center gap-2">
                                                            <span>{country.name}</span>
                                                            {country.countryCode && (
                                                                <span className="text-xs text-gray-500">
                                                                    ({country.countryCode})
                                                                </span>
                                                            )}
                                                        </div>
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {/* Country Code and Contact Number Row */}
                            <div className="md:col-span-1">
                                <FormLabel className="text-sm font-medium text-gray-700 dark:text-gray-200 mb-2 block">
                                    Contact Number <span className="text-red-500">*</span>
                                </FormLabel>
                                <div className="flex gap-2">
                                    {/* Country Code Field */}
                                    <FormField
                                        control={form.control}
                                        name="contact.countryCode"
                                        render={({ field }) => (
                                            <FormItem className="w-24">
                                                <FormControl>
                                                    <Input
                                                        {...field}
                                                        placeholder="+91"
                                                        disabled
                                                        className="text-center bg-gray-50 dark:bg-gray-800"
                                                        value={field.value ? `${field.value}` : ""}
                                                    />
                                                </FormControl>
                                            </FormItem>
                                        )}
                                    />

                                    {/* Contact Number Field */}
                                    <FormField
                                        control={form.control}
                                        name="contact.contactNumber"
                                        render={({ field }) => (
                                            <FormItem className="flex-1">
                                                <FormControl>
                                                    <Input
                                                        {...field}
                                                        placeholder={`Enter ${maxPhoneLength}-digit contact number`}
                                                        type="tel"
                                                        maxLength={maxPhoneLength}
                                                        onChange={(e) => {
                                                            // Only allow numbers and limit to 14 digits
                                                            const value = e.target.value.replace(/\D/g, '');
                                                            if (value.length <= maxPhoneLength) {
                                                                field.onChange(value);
                                                            }
                                                        }}
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                            </div>


                            <InputField
                                control={form.control}
                                name="contact.designation"
                                label="Designation"
                                placeholder="Enter designation"
                                required
                            // disabled
                            />

                            <SelectField
                                control={form.control}
                                name="contact.status"
                                label="Status"
                                placeholder="Select status"
                                options={contactStatus}
                                required
                                disabled={!selectedContact && isPartner}
                            />
                        </div>
                    )}

                    <div className="flex justify-end pt-6">
                        {showForm && (
                            <Button type="submit" disabled={!isChanged} variant="hpButton" className="px-8">
                                {selectedContact ? 'Update' : 'Save'}
                            </Button>
                        )}
                    </div>
                </form>
            </Form>

            <div className="mt-6">
                {isError && (
                    <div className="text-red-500 text-center mb-4">
                        Failed to load contact matrix data. Please try again later.
                    </div>
                )}

                {contactMatrix?.data && (
                    <div className="overflow-x-auto">
                        <table className="w-full border-collapse table-auto">
                            <thead>
                                <tr className="bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
                                    <th className="px-4 py-2 text-left">Contact Type</th>
                                    <th className="px-4 py-2 text-left">Name</th>
                                    <th className="px-4 py-2 text-left">Email ID</th>
                                    <th className="px-4 py-2 text-left">Contact Number</th>
                                    <th className="px-4 py-2 text-left">Country</th>
                                    <th className="px-4 py-2 text-left">Designation</th>
                                     <th className="px-4 py-2 text-left">Approval Status</th>
                                    <th className="px-4 py-2 text-left">Status</th>
                                    <th className="px-4 py-2 text-left">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {contactMatrix.data.map((contact: any) => (
                                    <tr key={contact.id} className="border-b">
                                        <td className="px-4 py-2">{contact.contactMatrixTypeName}</td>
                                        <td className="px-4 py-2">{contact.name}</td>
                                        <td className="px-4 py-2">{contact.email}</td>
                                        <td className="px-4 py-2">{contact.contactNumber}</td>
                                        <td className="px-4 py-2">{contact.countryName}</td>
                                        <td className="px-4 py-2">{contact.designation}</td>
                                        <td className="px-4 py-2">
                                            {contact.approvalStatusId === 1 && (
                                           <span className="text-red-500 font-medium">Pending</span>
                                            )}
                                          {contact.approvalStatusId === 2 && (
                                            <span className="text-green-600 font-medium">Approved</span>
                                             )}
                                        </td>

                                        <td className="px-4 py-2">
                                            {/* <span
                                                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${contact.statusName === "Active"
                                                    ? "bg-green-100 text-green-600"
                                                    : "bg-red-100 text-red-800"
                                                    }`}
                                            >
                                                {contact.statusName}
                                            </span> */}
                                            <StatusBadge status={contact.statusName as any} />

                                        </td>
                                        <td className="px-4 py-2">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleEdit(contact)}
                                            >
                                                <Pencil className="h-4 w-4" />
                                            </Button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

            </div>
            
     <ConfirmationDialog
     open={openModal}
     onOpenChange={setOpenModal}
     message={modalMessage}
     onConfirm={() => {
       if (pendingAction) pendingAction();
      }}
     />
            <div className="flex justify-between pt-6">
                <Button variant="secondary" type="button" className="px-8" onClick={onPrevious}>
                    Previous
                </Button>
                <Button
                    type="button"
                    className="px-8"
                    onClick={onNext}
                >
                    Next
                </Button>
            </div>
        </>
    );
}

interface ConfirmationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  message: string;
  onConfirm: () => void;
  onCancel?: () => void;
  title?: string;
}

export function ConfirmationDialog({
  open,
  onOpenChange,
  message,
  onConfirm,
  onCancel,
  title = "Confirmation",
}: ConfirmationDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-gray-700">{message}</p>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => {
              if (onCancel) onCancel();
              onOpenChange(false);
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={() => {
              onConfirm();
              onOpenChange(false);
            }}
          >
            Continue
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}