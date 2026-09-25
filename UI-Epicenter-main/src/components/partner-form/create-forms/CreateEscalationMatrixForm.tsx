"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Pencil, Plus } from "lucide-react";
import { InputField } from "../../form-fields/InputField";
import { SelectField } from "../../form-fields/SelectField";
import { useState, useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { MasterTypes } from "@/constants/masterTypes";
import { dropdownApi } from "@/services/api/master";
import {
  ContactMatrixPayload,
  partnerApi,
} from "@/services/api/partner.profile.api";
import { usePartnerStore } from "@/store/userPartnerStore";
import { toast } from "@/lib/toast";
import { useParams, useRouter } from "next/navigation";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { StatusBadge } from "@/components/status-badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";

// Custom validation functions
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

const escalationSchema = z.object({
  escalation: z.object({
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

interface EscalationMatrixFormProps {
  onNext?: () => void;
  onPrevious?: () => void;
}

type Escalation = z.infer<typeof escalationSchema>["escalation"];

export default function CreateEscalationMatrixForm({
  onNext,
  onPrevious,
}: EscalationMatrixFormProps) {
  const [showForm, setShowForm] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { partnerCode, setPartnerCode, partnerId, setPartnerId } =
    usePartnerStore();
  const [contactmatrixId, setContactMatrixId] = useState<number | null>(
    Number(partnerId)
  );
  const [selectedContact, setSelectedContact] = useState<any>(null);
   const [maxPhoneLength, setMaxPhoneLength] = useState<number>(10);
  const params = useParams<{ partner: string }>();
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
  }, []);

  const form = useForm<z.infer<typeof escalationSchema>>({
    resolver: zodResolver(escalationSchema),
    defaultValues: {
      escalation: {
        contactType: "",
        name: "",
        email: "",
        countryCode: "",
        contactNumber: "",
        country: "",
        designation: "",
        status: "25001",
      },
    },
  });

  const {
    data: escalationMatrix,
    refetch: refetchescalationMatrix,
    isError,
  } = useQuery({
    queryKey: ["escalationMatrix", contactmatrixId],
    queryFn: () => partnerApi.getEscalationMatrix(contactmatrixId?.toString()),
    enabled: !!contactmatrixId && mounted,
  });

  const { data: countries = [] } = useQuery({
    queryKey: ["country"],
    queryFn: () => dropdownApi.fetchDropdown(MasterTypes.COUNTRY),
    enabled: mounted,
  });

  const { data: escalationTypes = [] } = useQuery({
    queryKey: ["escalationTypes"],
    queryFn: () =>
      dropdownApi.fetchDropdown(MasterTypes.ESCALATION_MATRIX_CONTACT_TYPE),
    enabled: mounted,
  });

  const { data: contactStatus = [] } = useQuery({
    queryKey: ["contactStatus"],
    queryFn: () =>
      dropdownApi.fetchDropdown(MasterTypes.ACTIVE_INACTIVE_STATUS),
    enabled: mounted,
  });

  const createEscalationMutation = useMutation({
    mutationFn: partnerApi.createPartnerEscalationMatrix,
    onSuccess: async (data) => {
      setContactMatrixId(data.data.partnerId);
      toast.success("Escalation added successfully");
      form.reset();
      setShowForm(false);
      await refetchescalationMatrix();
    },
    onError: (error:any) => {
      const message =
            error?.response?.data?.message ||
            error?.message ||                 
           "Failed to create escalation contact";

           toast.error(message);
    },
  });

  const updateContactMutation = useMutation({
    mutationFn: (values: ContactMatrixPayload) =>
      partnerApi.updateEscalationMatrix(selectedContact.id, values),
    onSuccess: async (data) => {
      toast.success("Contact Updated successfully");
      form.reset();
      setShowForm(false);
      setSelectedContact(null);
      form.reset({ escalation: emptyEscalation })
      await refetchescalationMatrix();
    },
    onError: (error:any) => {
      const message =
            error?.response?.data?.message ||
            error?.message ||                 
           "Failed to update escalation contact";

           toast.error(message);
    },
  });

  function formatFormData(values: Escalation): ContactMatrixPayload {
    // Combine country code and contact number for API
    const fullContactNumber = values.countryCode
      ? `${values.countryCode} ${values.contactNumber}`
      : values.contactNumber;

    return {
      id: selectedContact?.id || 0,
      isActive: true,
      contactTypeId: Number(values.contactType),
      name: values.name,
      email: values.email,
      contactNumber: fullContactNumber,
      countryId: values.country,
      designation: values.designation,
      statusId: values.status,
      partnerId: String(partnerId),
    };
  }

  const emptyEscalation = {
    contactType: "",
    name: "",
    email: "",
    countryCode: "",
    contactNumber: "",
    country: "",
    designation: "",
    status: "",
  };

  function onSubmit(values: z.infer<typeof escalationSchema>) {
    const selectedCountry = countries.find(
        (c: any) => c.id.toString() === values.escalation.country
       );

      if (
         selectedCountry?.phoneMaxLength &&
         values.escalation.contactNumber.length !== selectedCountry.phoneMaxLength
        ) {
         form.setError("escalation.contactNumber", {
         type: "manual",
         message: `Contact number must be ${selectedCountry.phoneMaxLength} digits for ${selectedCountry.name}`,
        });
        return;
        }
    const formattedData = formatFormData(values.escalation);
    if (selectedContact) {
      updateContactMutation.mutate(formattedData);
    } else {
      createEscalationMutation.mutate(formattedData);
    }
    // form.reset({ escalation: emptyEscalation });
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
      escalation: {
        contactType: contact.contactTypeId.toString(),
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

  // Handle country selection and update country code
  const handleCountryChange = (countryId: string) => {
    form.setValue("escalation.country", countryId);

    // Find the selected country and get its country code
    const selectedCountry = countries.find((country: any) => country.id.toString() === countryId);

    if (selectedCountry?.countryCode) {
      form.setValue("escalation.countryCode", selectedCountry.countryCode);
    } else {
      form.setValue("escalation.countryCode", "");
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

  const escalationCount = escalationMatrix?.data?.length || 0;
  const remainingContacts = Math.max(0, 1 - escalationCount);
  const canProceed = escalationCount >= 1;

  return (
    <>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-semibold">Escalation Matrix</h2>
            <div className="flex items-center gap-2 text-sm">
              <span className="text-muted-foreground">Partner ID:</span>
              <span className="font-medium">{partnerCode}</span>
            </div>
          </div>

          {remainingContacts > 0 && (
            <Alert>
              <AlertDescription>
                Please add {remainingContacts} more escalation contact
                {remainingContacts > 1 ? "s" : ""} to proceed. Minimum 1
                contacts are required.
              </AlertDescription>
            </Alert>
          )}

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
                name="escalation.contactType"
                label="Contact Type"
                placeholder="Select contact type"
                options={escalationTypes}
                required
              />

              <InputField
                control={form.control}
                name="escalation.name"
                label="Full Name"
                placeholder="Enter full name"
                required
              />

              <InputField
                control={form.control}
                name="escalation.email"
                label="Email ID"
                placeholder="Enter email"
                type="email"
                required
              />

              <FormField
                control={form.control}
                name="escalation.country"
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
                    name="escalation.countryCode"
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
                    name="escalation.contactNumber"
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
                name="escalation.designation"
                label="Designation"
                placeholder="Enter designation"
                required
              />

              <SelectField
                control={form.control}
                name="escalation.status"
                label="Status"
                placeholder="Select status"
                options={contactStatus}
                required
              />
            </div>
          )}

          <div className="flex justify-end pt-6">
            {showForm && (
              <Button type="submit" variant="hpButton" className="px-8">
                {selectedContact ? "Update" : "Save"}
              </Button>
            )}
          </div>
        </form>
      </Form>

      <div className="mt-6">
        {isError && (
          <div className="text-red-500 text-center mb-4">
            Failed to load escalation matrix data. Please try again later.
          </div>
        )}

        {escalationMatrix?.data && (
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
                  <th className="px-4 py-2 text-left">Status</th>
                  <th className="px-4 py-2 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {escalationMatrix.data.map((contact: any) => (
                  <tr key={contact.id} className="border-b">
                    <td className="px-4 py-2">
                      {contact.escalationMatrixTypeName}
                    </td>
                    <td className="px-4 py-2">{contact.name}</td>
                    <td className="px-4 py-2">{contact.email}</td>
                    <td className="px-4 py-2">{contact.contactNumber}</td>
                    <td className="px-4 py-2">{contact.countryName}</td>
                    <td className="px-4 py-2">{contact.designation}</td>
                    <td className="px-4 py-2">
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
      <div className="flex justify-between pt-6">
        <Button
          variant="secondary"
          type="button"
          className="px-8"
          onClick={onPrevious}
        >
          Previous
        </Button>
        <Button
          type="button"
          className="px-8"
          onClick={() => {
            setPartnerCode("PID****")
            setPartnerId("")
            toast.message("Partner has been created successfully")
            router.replace(`/home/partner-onboarding`)
          }}
          disabled={!canProceed}
        >
          Submit
        </Button>
      </div>
    </>
  );
}