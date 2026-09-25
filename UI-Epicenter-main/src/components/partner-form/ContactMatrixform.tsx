"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Alert, Button, Card, Col, Flex, Form, Input, Modal, Row, Select, Space, Table, Typography } from "antd";
import type { ColumnsType } from "antd/es/table";
import { EditOutlined, PlusOutlined } from "@ant-design/icons";
import * as z from "zod";
import { dropdownApi } from "@/services/api/master";
import { MasterTypes } from "@/constants/masterTypes";
import { usePartnerStore } from "@/store/userPartnerStore";
import { ContactMatrixPayload, partnerApi } from "@/services/api/partner.profile.api";
import { toast } from "@/lib/toast";
import { validateWithZod, zodRules } from "@/lib/zodRules";
import { StatusBadge } from "../status-badge";
import { isAdmin, isPartner, isVendorManager } from "@/store/userStore";

const validateSpaces = (value: string) => {
  if (value !== value.trim()) return false;
  if (/\s{2,}/.test(value)) return false;
  return true;
};

const validateCapitalization = (value: string) => {
  if (value.length === 0) return true;
  return /^[A-Z]/.test(value);
};

const validateLowercase = (value: string) => value === value.toLowerCase();

const contactFieldsSchema = z.object({
  contactType: z.string().min(1, "Contact type is required"),
  name: z
    .string()
    .min(1, "Name is required")
    .refine(validateSpaces, { message: "Name cannot have leading/trailing spaces or multiple consecutive spaces" })
    .refine(validateCapitalization, { message: "First letter of name must be capitalized" }),
  email: z
    .string()
    .email("Invalid email address")
    .min(1, "Email is required")
    .refine(validateSpaces, { message: "Email cannot have leading/trailing spaces or multiple consecutive spaces" })
    .refine(validateLowercase, { message: "Email must be in lowercase" }),
  countryCode: z.string().optional(),
  contactNumber: z
    .string()
    .nonempty("Contact number is required")
    .refine((val) => /^\d+$/.test(val), { message: "Only numbers are allowed" }),
  country: z.string().min(1, "Country is required"),
  designation: z
    .string()
    .min(1, "Designation is required")
    .refine(validateSpaces, { message: "Designation cannot have leading/trailing spaces or multiple consecutive spaces" })
    .refine(validateCapitalization, { message: "First letter of designation must be capitalized" }),
  status: z.string().min(1, "Status is required"),
});

const contactSchema = z.object({ contact: contactFieldsSchema });

interface ContactMatrixFormProps {
  onNext?: () => void;
  onPrevious?: () => void;
}

type Contact = z.infer<typeof contactSchema>["contact"];
type FormValues = z.infer<typeof contactSchema>;

const emptyContact: Contact = {
  contactType: "",
  name: "",
  email: "",
  contactNumber: "",
  countryCode: "",
  country: "",
  designation: "",
  status: "",
};

const rules = (name: keyof typeof contactFieldsSchema.shape) => zodRules(contactFieldsSchema, name);

export default function ContactMatrixForm({ onNext, onPrevious }: ContactMatrixFormProps) {
  const [showForm, setShowForm] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [selectedContact, setSelectedContact] = useState<any>(null);
  const { partnerCode } = usePartnerStore();
  const searchParams = useSearchParams();
  const partnerId = searchParams.get("id") || "";
  const [maxPhoneLength, setMaxPhoneLength] = useState<number>(10);
  const [pendingAction, setPendingAction] = useState<null | (() => void)>(null);
  const [openModal, setOpenModal] = useState(false);
  const [modalMessage, setModalMessage] = useState("");
  const [isChanged, setIsChanged] = useState(false);
  const [form] = Form.useForm<FormValues>();
  const watchedContact = Form.useWatch("contact", form);

  const defaultContact: Contact = { ...emptyContact, status: isPartner ? "25002" : "25001" };

  useEffect(() => {
    setMounted(true);
  }, [partnerId]);

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
    onSuccess: async () => {
      toast.success("Contact added successfully");
      form.resetFields();
      setShowForm(false);
      refetchContactMatrix();
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || error?.message || "Failed to add contact");
    },
  });

  const updateContactMutation = useMutation({
    mutationFn: (values: ContactMatrixPayload) => partnerApi.updateContactMatrix(selectedContact.id, values),
    onSuccess: async () => {
      toast.success("Contact Updated successfully");
      form.resetFields();
      setShowForm(false);
      setSelectedContact(null);
      form.setFieldsValue({ contact: emptyContact });
      refetchContactMatrix();
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || error?.message || "Failed to update contact");
    },
  });

  function formatFormData(values: Contact): ContactMatrixPayload {
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

  function hasChanges(oldData: any, newData: any) {
    return JSON.stringify(oldData) !== JSON.stringify(newData);
  }

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
      setIsChanged(hasChanges(formattedInitial, watchedContact));
    } else {
      setIsChanged(true);
    }
  }, [watchedContact, selectedContact]);

  function onFinish(raw: FormValues) {
    const values = validateWithZod(contactSchema, form, raw);
    if (!values) return;
    const selectedCountry = countries.find((c: any) => c.id.toString() === values.contact.country);
    if (selectedCountry?.phoneMaxLength && values.contact.contactNumber.length !== selectedCountry.phoneMaxLength) {
      form.setFields([
        {
          name: ["contact", "contactNumber"],
          errors: [`Contact number must be ${selectedCountry.phoneMaxLength} digits for ${selectedCountry.name}`],
        },
      ]);
      return;
    }
    const formattedData = formatFormData(values.contact);
    const isPrivilegedUser = isAdmin || isVendorManager;
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
    } else if (isPrivilegedUser) {
      createContactMutation.mutate(formattedData);
    } else {
      setModalMessage("You are creating a new contact. This will go for vendor manager approval. Do you want to continue?");
      setPendingAction(() => () => createContactMutation.mutate(formattedData));
      setOpenModal(true);
    }
  }

  const handleEdit = (contact: any) => {
    setSelectedContact(contact);
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
      contact: {
        contactType: contact.contactMatrixTypeId.toString(),
        name: contact.name,
        email: contact.email,
        countryCode,
        contactNumber,
        country: contact.countryId.toString(),
        designation: contact.designation || "",
        status: contact.statusName === "Active" ? "25001" : "25002",
      },
    });
    setShowForm(true);
  };

  const handleCountryChange = (countryId: string) => {
    form.setFieldValue(["contact", "country"], countryId);
    const selectedCountry = countries.find((country: any) => country.id.toString() === countryId);
    form.setFieldValue(["contact", "countryCode"], selectedCountry?.countryCode || "");
    setMaxPhoneLength(selectedCountry?.phoneMaxLength || 10);
  };

  if (!mounted) return null;

  const columns: ColumnsType<any> = [
    { key: "type", title: "Contact Type", dataIndex: "contactMatrixTypeName" },
    { key: "name", title: "Name", dataIndex: "name" },
    { key: "email", title: "Email ID", dataIndex: "email" },
    { key: "contactNumber", title: "Contact Number", dataIndex: "contactNumber" },
    { key: "country", title: "Country", dataIndex: "countryName" },
    { key: "designation", title: "Designation", dataIndex: "designation" },
    {
      key: "approval",
      title: "Approval Status",
      dataIndex: "approvalStatusId",
      render: (v: number) =>
        v === 1 ? <Typography.Text type="danger" strong>Pending</Typography.Text> : v === 2 ? <Typography.Text type="success" strong>Approved</Typography.Text> : null,
    },
    { key: "status", title: "Status", dataIndex: "statusName", render: (v: string) => <StatusBadge status={v} /> },
    {
      key: "actions",
      title: "Actions",
      render: (_: unknown, contact: any) => <Button type="text" size="small" icon={<EditOutlined />} onClick={() => handleEdit(contact)} />,
    },
  ];

  return (
    <Flex vertical gap={16}>
      <Flex justify="space-between" align="center" wrap gap={8}>
        <Typography.Title level={4} style={{ margin: 0 }}>
          Contact Matrix
        </Typography.Title>
        <Space>
          <Typography.Text type="secondary">Partner ID:</Typography.Text>
          <Typography.Text strong>{partnerCode}</Typography.Text>
        </Space>
      </Flex>

      {!showForm && (
        <Flex justify="flex-end">
          <Button
            type="primary"
            size="small"
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

      <Form form={form} layout="vertical" onFinish={onFinish} initialValues={{ contact: defaultContact }}>
        {showForm && (
          <Card>
            <Row gutter={[16, 8]}>
              <Col xs={24} md={12}>
                <Form.Item name={["contact", "contactType"]} label="Contact Type" rules={rules("contactType")}>
                  <Select placeholder="Select contact type" showSearch optionFilterProp="label" options={contactTypes.map((o: any) => ({ value: String(o.id), label: o.name }))} />
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item name={["contact", "name"]} label="Full Name" rules={rules("name")}>
                  <Input placeholder="Enter full name" />
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item name={["contact", "email"]} label="Email ID" rules={rules("email")}>
                  <Input type="email" placeholder="Enter email" />
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item name={["contact", "country"]} label="Country" rules={rules("country")}>
                  <Select
                    placeholder="Select country"
                    showSearch
                    optionFilterProp="label"
                    onChange={handleCountryChange}
                    options={countries.map((c: any) => ({
                      value: c.id.toString(),
                      label: c.countryCode ? `${c.name} (${c.countryCode})` : c.name,
                    }))}
                  />
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item label="Contact Number" required>
                  <Space.Compact className="w-full">
                    <Form.Item name={["contact", "countryCode"]} noStyle>
                      <Input placeholder="+91" disabled style={{ width: 96, textAlign: "center" }} />
                    </Form.Item>
                    <Form.Item
                      name={["contact", "contactNumber"]}
                      noStyle
                      rules={rules("contactNumber")}
                      getValueFromEvent={(e) => e.target.value.replace(/\D/g, "").slice(0, maxPhoneLength)}
                    >
                      <Input type="tel" maxLength={maxPhoneLength} placeholder={`Enter ${maxPhoneLength}-digit contact number`} />
                    </Form.Item>
                  </Space.Compact>
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item name={["contact", "designation"]} label="Designation" rules={rules("designation")}>
                  <Input placeholder="Enter designation" />
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item name={["contact", "status"]} label="Status" rules={rules("status")}>
                  <Select placeholder="Select status" disabled={!selectedContact && isPartner} options={contactStatus.map((o: any) => ({ value: String(o.id), label: o.name }))} />
                </Form.Item>
              </Col>
            </Row>
            <Flex justify="flex-end">
              <Button type="primary" htmlType="submit" disabled={!isChanged} loading={createContactMutation.isPending || updateContactMutation.isPending}>
                {selectedContact ? "Update" : "Save"}
              </Button>
            </Flex>
          </Card>
        )}
      </Form>

      {isError && <Alert type="error" showIcon message="Failed to load contact matrix data. Please try again later." />}

      {contactMatrix?.data && <Table rowKey="id" size="middle" columns={columns} dataSource={contactMatrix.data} pagination={false} scroll={{ x: "max-content" }} />}

      <ConfirmationDialog
        open={openModal}
        onOpenChange={setOpenModal}
        message={modalMessage}
        onConfirm={() => {
          if (pendingAction) pendingAction();
        }}
      />

      <Flex justify="space-between">
        <Button onClick={onPrevious}>Previous</Button>
        <Button type="primary" onClick={onNext}>
          Next
        </Button>
      </Flex>
    </Flex>
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

export function ConfirmationDialog({ open, onOpenChange, message, onConfirm, onCancel, title = "Confirmation" }: ConfirmationDialogProps) {
  return (
    <Modal
      open={open}
      title={title}
      okText="Continue"
      cancelText="Cancel"
      destroyOnHidden
      onCancel={() => {
        if (onCancel) onCancel();
        onOpenChange(false);
      }}
      onOk={() => {
        onConfirm();
        onOpenChange(false);
      }}
    >
      <Typography.Paragraph>{message}</Typography.Paragraph>
    </Modal>
  );
}
