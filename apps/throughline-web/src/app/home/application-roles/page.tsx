"use client";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Button, Col, Flex, Form, Row, Select, Typography } from "antd";
import { z } from "zod";
import { toast } from "@/lib/toast";
import { validateWithZod, zodRules } from "@/lib/zodRules";
import api from "@/lib/axiosInstance";
import { userRoleAPi } from "@/services/api/user.api";
import { partnerApi } from "@/services/api/partner.profile.api";

const userRoleMappingSchema = z.object({
  userId: z.string().min(1, "Role is required"),
  roleId: z.string().min(1, "Role is required"),
  partnerId: z.string().optional(),
  isActive: z.boolean().optional(),
});
type FormValues = z.infer<typeof userRoleMappingSchema>;

/** Standalone user -> application-role mapping form. */
const UserRoleMapping = () => {
  const [form] = Form.useForm<FormValues>();

  const { data: userList = [] } = useQuery({ queryKey: ["userList"], queryFn: () => userRoleAPi.getUsers() });
  const { data: userRoleList = [] } = useQuery({ queryKey: ["userRoleList"], queryFn: () => userRoleAPi.getRoles() });
  const { data: partnerList } = useQuery({ queryKey: ["partnerList"], queryFn: () => partnerApi.getAllPartner() });

  const { mutate: createMapping, isPending } = useMutation({
    mutationFn: (payload: FormValues) => api.post("/User/user-role-mapping", payload),
    onSuccess: (res) => {
      if (res.status === 200) {
        toast.success("User role mapping created successfully!");
        form.resetFields();
      } else {
        console.error("Failed to submit form:", res.data);
      }
    },
    onError: (error) => console.error("Error submitting form:", error),
  });

  const onFinish = (values: FormValues) => {
    const data = validateWithZod(userRoleMappingSchema, form, { ...values, partnerId: values.partnerId ?? "", isActive: true });
    if (data) createMapping(data);
  };

  const userOptions = (userList as any[]).map((u) => ({ value: String(u.userId), label: u.email }));
  const roleOptions = (userRoleList as any[]).map((r) => ({ value: String(r.roleId), label: r.roleName }));
  const partnerOptions = ((partnerList as any)?.data ?? []).map((p: any) => ({ value: String(p.id), label: p.partnerName }));

  return (
    <Flex vertical gap={16} className="p-4">
      <Typography.Title level={4} style={{ margin: 0 }}>
        Application Roles
      </Typography.Title>
      <Form form={form} layout="vertical" onFinish={onFinish} initialValues={{ isActive: true }}>
        <Row gutter={[16, 8]}>
          <Col xs={24} sm={12} md={8}>
            <Form.Item name="userId" label="User" rules={zodRules(userRoleMappingSchema, "userId")}>
              <Select showSearch optionFilterProp="label" options={userOptions} placeholder="Search email..." allowClear />
            </Form.Item>
          </Col>
          <Col xs={24} sm={12} md={8}>
            <Form.Item name="roleId" label="Role Type" rules={zodRules(userRoleMappingSchema, "roleId")}>
              <Select showSearch optionFilterProp="label" options={roleOptions} placeholder="Select Role" allowClear />
            </Form.Item>
          </Col>
          <Col xs={24} sm={12} md={8}>
            <Form.Item name="partnerId" label="Partner" rules={zodRules(userRoleMappingSchema, "partnerId")}>
              <Select showSearch optionFilterProp="label" options={partnerOptions} placeholder="Select Partner" allowClear />
            </Form.Item>
          </Col>
        </Row>
        <Flex justify="flex-end">
          <Button type="primary" htmlType="submit" loading={isPending}>
            Submit
          </Button>
        </Flex>
      </Form>
    </Flex>
  );
};

export default UserRoleMapping;
