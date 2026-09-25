"use client";

import { useEffect, useState } from "react";
import * as z from "zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Alert, Button, Card, Col, Flex, Form, Input, Row, Select, Space, Tooltip, Typography } from "antd";
import { EditOutlined, PlusOutlined } from "@ant-design/icons";
import DataTable, { type DataColumn } from "@/components/data-table/DataTable";
import { StatusBadge } from "@/components/status-badge";
import { toast } from "@/lib/toast";
import { validateWithZod, zodRules } from "@/lib/zodRules";
import { dropdownApi } from "@/services/api/master";
import { MasterTypes } from "@/constants/masterTypes";
import { usePartnerStore } from "@/store/userPartnerStore";
import { ContactMatrixPayload, partnerApi } from "@/services/api/partner.profile.api";

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

/** The Ant form is flat; the per-field rules come from the nested `contact` object schema. */
const contactFields = contactSchema.shape.contact;

interface ContactMatrixFormProps {
  onNext?: () => void;
  onPrevious?: () => void;
}

type Contact = z.infer<typeof contactSchema>["contact"];

const emptyContact: Contact = {
  contactType: "",
  name: "",
  email: "",
  countryCode: "",
  contactNumber: "",
  country: "",
  designation: "",
  status: "25001",
};

export default function CreateContactMatrixForm({ onNext, onPrevious }: ContactMatrixFormProps) {
  const [form] = Form.useForm<Contact>();
  const [showForm, setShowForm] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [selectedContact, setSelectedContact] = useState<any>(null);
  const { partnerCode, partnerId, setContactMatriId } = usePartnerStore();
  const [contactmatrixId, setContactMatrixId] = useState<number | null>(null);
  const [maxPhoneLength, setMaxPhoneLength] = useState<number>(10);

  useEffect(() => {
    setMounted(true);
    setContactMatrixId(Number(partnerId));
  }, [partnerId]);

  const {
    data: contactMatrix,
    refetch: refetchContactMatrix,
    isError,
    isLoading,
  } = useQuery({
    queryKey: ["partnerContactMatrix", contactmatrixId],
    queryFn: () => partnerApi.getContactMatrix(contactmatrixId?.toString()),
    enabled: !!contactmatrixId && mounted,
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
      form.resetFields();
      setContactMatrixId(data.data.partnerId);
      setShowForm(false);
      refetchContactMatrix();
      setContactMatriId(data.data.partnerId);
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message || error?.message || "Failed to add contactMatrix";
      toast.error(message);
    },
  });

  const updateContactMutation = useMutation({
    mutationFn: (values: ContactMatrixPayload) => partnerApi.updateContactMatrix(selectedContact.id, values),
    onSuccess: async () => {
      toast.success("Contact Updated successfully");
      form.resetFields();
      setShowForm(false);
      setSelectedContact(null);
      refetchContactMatrix();
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message || error?.message || "Failed to update contactMatrix";
      toast.error(message);
    },
  });

  function formatFormData(values: Contact): ContactMatrixPayload {
    // Combine country code and contact number for API
    const fullContactNumber = values.countryCode ? `${values.countryCode} ${values.contactNumber}` : values.contactNumber;

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

  function onFinish(raw: Contact) {
    const values = validateWithZod(contactFields, form, raw);
    if (!values) return;
    const selectedCountry = countries.find((c: any) => c.id.toString() === values.country);

    if (selectedCountry?.phoneMaxLength && values.contactNumber.length !== selectedCountry.phoneMaxLength) {
      form.setFields([{ name: "contactNumber", errors: [`Contact number must be ${selectedCountry.phoneMaxLength} digits for ${selectedCountry.name}`] }]);
      return;
    }
    const formattedData = formatFormData(values);
    if (selectedContact) {
      updateContactMutation.mutate(formattedData);
    } else {
      createContactMutation.mutate(formattedData);
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

    form.setFieldsValue({
      contactType: contact.contactMatrixTypeId.toString(),
      name: contact.name,
      email: contact.email,
      countryCode: countryCode,
      contactNumber: contactNumber,
      country: contact.countryId.toString(),
      designation: contact.designation || "",
      status: contact.statusName === "Active" ? "25001" : "25002",
    });
    setShowForm(true);
  };

  // Handle country selection and update country code
  const handleCountryChange = (countryId: string) => {
    const selectedCountry = countries.find((country: any) => country.id.toString() === countryId);
    form.setFieldValue("countryCode", selectedCountry?.countryCode || "");
    setMaxPhoneLength(selectedCountry?.phoneMaxLength || 10);
  };

  const columns: DataColumn<any>[] = [
    { key: "contactMatrixTypeName", title: "Contact Type", dataIndex: "contactMatrixTypeName" },
    { key: "name", title: "Name", dataIndex: "name" },
    { key: "email", title: "Email ID", dataIndex: "email" },
    { key: "contactNumber", title: "Contact Number", dataIndex: "contactNumber" },
    { key: "countryName", title: "Country", dataIndex: "countryName" },
    { key: "designation", title: "Designation", dataIndex: "designation" },
    { key: "statusName", title: "Status", dataIndex: "statusName", render: (v: string) => <StatusBadge status={v} /> },
    {
      key: "actions",
      title: "Actions",
      locked: true,
      width: 80,
      align: "center",
      render: (_: unknown, contact: any) => (
        <Tooltip title="Edit">
          <Button type="text" size="small" icon={<EditOutlined />} onClick={() => handleEdit(contact)} />
        </Tooltip>
      ),
    },
  ];

  if (!mounted) {
    return null;
  }

  const contactCount = contactMatrix?.data?.length || 0;
  const remainingContacts = Math.max(0, 1 - contactCount);
  const canProceed = contactCount >= 1;

  return (
    <Flex vertical gap={16}>
      <Flex wrap gap={16} align="center" justify="space-between">
        <Typography.Title level={5} style={{ margin: 0 }}>
          Contact Matrix
        </Typography.Title>
        <Space size={4}>
          <Typography.Text type="secondary">Partner ID:</Typography.Text>
          <Typography.Text strong>{partnerCode}</Typography.Text>
        </Space>
      </Flex>

      {remainingContacts > 0 && (
        <Alert
          type="info"
          showIcon
          message={`Please add ${remainingContacts} more contact${remainingContacts > 1 ? "s" : ""} to proceed. Minimum 1 contacts are required.`}
        />
      )}

      {!showForm && (
        <Flex justify="flex-end">
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => {
              setSelectedContact(null);
              form.resetFields();
              setShowForm(true);
            }}
          >
            Add
          </Button>
        </Flex>
      )}

      {showForm && (
        <Card>
          <Form form={form} layout="vertical" onFinish={onFinish} initialValues={emptyContact}>
            <Row gutter={[16, 8]}>
              <Col xs={24} md={12}>
                <Form.Item name="contactType" label="Contact Type" rules={zodRules(contactFields, "contactType")}>
                  <Select showSearch optionFilterProp="label" placeholder="Select contact type" options={contactTypes.map((o: any) => ({ value: String(o.id), label: o.name }))} />
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item name="name" label="Full Name" rules={zodRules(contactFields, "name")}>
                  <Input placeholder="Enter full name" />
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item name="email" label="Email ID" rules={zodRules(contactFields, "email")}>
                  <Input type="email" placeholder="Enter email" />
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item name="country" label="Country" rules={zodRules(contactFields, "country")}>
                  <Select
                    showSearch
                    optionFilterProp="label"
                    placeholder="Select country"
                    onChange={handleCountryChange}
                    options={countries.map((c: any) => ({ value: c.id.toString(), label: c.countryCode ? `${c.name} (${c.countryCode})` : c.name }))}
                  />
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item label="Contact Number" required>
                  <Space.Compact className="w-full">
                    <Form.Item name="countryCode" noStyle>
                      <Input disabled placeholder="+91" style={{ width: 96, textAlign: "center" }} />
                    </Form.Item>
                    <Form.Item
                      name="contactNumber"
                      noStyle
                      rules={zodRules(contactFields, "contactNumber")}
                      normalize={(v: string) => (v ?? "").replace(/\D/g, "").slice(0, maxPhoneLength)}
                    >
                      <Input type="tel" maxLength={maxPhoneLength} placeholder={`Enter ${maxPhoneLength}-digit contact number`} />
                    </Form.Item>
                  </Space.Compact>
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item name="designation" label="Designation" rules={zodRules(contactFields, "designation")}>
                  <Input placeholder="Enter designation" />
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item name="status" label="Status" rules={zodRules(contactFields, "status")}>
                  <Select placeholder="Select status" options={contactStatus.map((o: any) => ({ value: String(o.id), label: o.name }))} />
                </Form.Item>
              </Col>
            </Row>
            <Flex justify="flex-end">
              <Button type="primary" htmlType="submit" loading={createContactMutation.isPending || updateContactMutation.isPending}>
                {selectedContact ? "Update" : "Save"}
              </Button>
            </Flex>
          </Form>
        </Card>
      )}

      {isError && <Alert type="error" showIcon message="Failed to load contact matrix data. Please try again later." />}

      {contactMatrix?.data && <DataTable<any> rowKey="id" columns={columns} data={contactMatrix.data} loading={isLoading} pagination={false} emptyText="No contacts added yet" />}

      <Flex justify="space-between">
        <Button onClick={onPrevious}>Previous</Button>
        <Button type="primary" onClick={onNext} disabled={!canProceed}>
          Next
        </Button>
      </Flex>
    </Flex>
  );
}
