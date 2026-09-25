"use client";

import { useEffect, useState } from "react";
import * as z from "zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
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

/** The Ant form is flat; the per-field rules come from the nested `escalation` object schema. */
const escalationFields = escalationSchema.shape.escalation;

interface EscalationMatrixFormProps {
  onNext?: () => void;
  onPrevious?: () => void;
}

type Escalation = z.infer<typeof escalationSchema>["escalation"];

const emptyEscalation: Escalation = {
  contactType: "",
  name: "",
  email: "",
  countryCode: "",
  contactNumber: "",
  country: "",
  designation: "",
  status: "25001",
};

export default function CreateEscalationMatrixForm({ onNext, onPrevious }: EscalationMatrixFormProps) {
  const [form] = Form.useForm<Escalation>();
  const [showForm, setShowForm] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { partnerCode, setPartnerCode, partnerId, setPartnerId } = usePartnerStore();
  const [contactmatrixId, setContactMatrixId] = useState<number | null>(Number(partnerId));
  const [selectedContact, setSelectedContact] = useState<any>(null);
  const [maxPhoneLength, setMaxPhoneLength] = useState<number>(10);
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
  }, []);

  const {
    data: escalationMatrix,
    refetch: refetchescalationMatrix,
    isError,
    isLoading,
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
    queryFn: () => dropdownApi.fetchDropdown(MasterTypes.ESCALATION_MATRIX_CONTACT_TYPE),
    enabled: mounted,
  });

  const { data: contactStatus = [] } = useQuery({
    queryKey: ["contactStatus"],
    queryFn: () => dropdownApi.fetchDropdown(MasterTypes.ACTIVE_INACTIVE_STATUS),
    enabled: mounted,
  });

  const createEscalationMutation = useMutation({
    mutationFn: partnerApi.createPartnerEscalationMatrix,
    onSuccess: async (data) => {
      setContactMatrixId(data.data.partnerId);
      toast.success("Escalation added successfully");
      form.resetFields();
      setShowForm(false);
      await refetchescalationMatrix();
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message || error?.message || "Failed to create escalation contact";
      toast.error(message);
    },
  });

  const updateContactMutation = useMutation({
    mutationFn: (values: ContactMatrixPayload) => partnerApi.updateEscalationMatrix(selectedContact.id, values),
    onSuccess: async () => {
      toast.success("Contact Updated successfully");
      form.resetFields();
      setShowForm(false);
      setSelectedContact(null);
      await refetchescalationMatrix();
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message || error?.message || "Failed to update escalation contact";
      toast.error(message);
    },
  });

  function formatFormData(values: Escalation): ContactMatrixPayload {
    // Combine country code and contact number for API
    const fullContactNumber = values.countryCode ? `${values.countryCode} ${values.contactNumber}` : values.contactNumber;

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

  function onFinish(raw: Escalation) {
    const values = validateWithZod(escalationFields, form, raw);
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
      createEscalationMutation.mutate(formattedData);
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
      contactType: contact.contactTypeId.toString(),
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
    { key: "escalationMatrixTypeName", title: "Contact Type", dataIndex: "escalationMatrixTypeName" },
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

  const escalationCount = escalationMatrix?.data?.length || 0;
  const remainingContacts = Math.max(0, 1 - escalationCount);
  const canProceed = escalationCount >= 1;

  return (
    <Flex vertical gap={16}>
      <Flex wrap gap={16} align="center" justify="space-between">
        <Typography.Title level={5} style={{ margin: 0 }}>
          Escalation Matrix
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
          message={`Please add ${remainingContacts} more escalation contact${remainingContacts > 1 ? "s" : ""} to proceed. Minimum 1 contacts are required.`}
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
          <Form form={form} layout="vertical" onFinish={onFinish} initialValues={emptyEscalation}>
            <Row gutter={[16, 8]}>
              <Col xs={24} md={12}>
                <Form.Item name="contactType" label="Contact Type" rules={zodRules(escalationFields, "contactType")}>
                  <Select showSearch optionFilterProp="label" placeholder="Select contact type" options={escalationTypes.map((o: any) => ({ value: String(o.id), label: o.name }))} />
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item name="name" label="Full Name" rules={zodRules(escalationFields, "name")}>
                  <Input placeholder="Enter full name" />
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item name="email" label="Email ID" rules={zodRules(escalationFields, "email")}>
                  <Input type="email" placeholder="Enter email" />
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item name="country" label="Country" rules={zodRules(escalationFields, "country")}>
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
                      rules={zodRules(escalationFields, "contactNumber")}
                      normalize={(v: string) => (v ?? "").replace(/\D/g, "").slice(0, maxPhoneLength)}
                    >
                      <Input type="tel" maxLength={maxPhoneLength} placeholder={`Enter ${maxPhoneLength}-digit contact number`} />
                    </Form.Item>
                  </Space.Compact>
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item name="designation" label="Designation" rules={zodRules(escalationFields, "designation")}>
                  <Input placeholder="Enter designation" />
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item name="status" label="Status" rules={zodRules(escalationFields, "status")}>
                  <Select placeholder="Select status" options={contactStatus.map((o: any) => ({ value: String(o.id), label: o.name }))} />
                </Form.Item>
              </Col>
            </Row>
            <Flex justify="flex-end">
              <Button type="primary" htmlType="submit" loading={createEscalationMutation.isPending || updateContactMutation.isPending}>
                {selectedContact ? "Update" : "Save"}
              </Button>
            </Flex>
          </Form>
        </Card>
      )}

      {isError && <Alert type="error" showIcon message="Failed to load escalation matrix data. Please try again later." />}

      {escalationMatrix?.data && (
        <DataTable<any> rowKey="id" columns={columns} data={escalationMatrix.data} loading={isLoading} pagination={false} emptyText="No escalation contacts added yet" />
      )}

      <Flex justify="space-between">
        <Button onClick={onPrevious}>Previous</Button>
        <Button
          type="primary"
          disabled={!canProceed}
          onClick={() => {
            setPartnerCode("PID****");
            setPartnerId("");
            toast.info("Partner has been created successfully");
            router.replace(`/home/partner-onboarding`);
          }}
        >
          Submit
        </Button>
      </Flex>
    </Flex>
  );
}
