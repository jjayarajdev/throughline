"use client";
import { useEffect, useMemo } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Button, Col, Dropdown, Flex, Form, Modal, Row, Select, Space, Typography } from "antd";
import type { MenuProps } from "antd";
import { DeleteOutlined, MoreOutlined } from "@ant-design/icons";
import { z } from "zod";
import DataTable, { type DataColumn } from "@/components/data-table/DataTable";
import { useTableState } from "@/components/data-table/useTableState";
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

/** role id whose mappings need a partner */
const PARTNER_ROLE_ID = "4";

interface UserRole {
  userId: number;
  fullName: string;
  roleId: number;
  roleName: string;
  isActive: boolean;
  partnerName?: string;
  email?: string;
}

const byText = (key: keyof UserRole) => (a: UserRole, b: UserRole) => String(a[key] ?? "").localeCompare(String(b[key] ?? ""));

/** Assign application roles to users and list / remove the existing mappings. */
const UserRoleMapping = () => {
  const [form] = Form.useForm<FormValues>();
  const t = useTableState({ pageSize: 50 });

  const selectedRole = Form.useWatch("roleId", form) || null;
  const selectedUserID = Form.useWatch("userId", form) || null;
  const partnerVisible = Number(selectedRole) === Number(PARTNER_ROLE_ID);

  const { data: userList = [] } = useQuery({ queryKey: ["userList"], queryFn: () => userRoleAPi.getUsers() });
  const { data: userRoleList = [] } = useQuery({ queryKey: ["userRoleList"], queryFn: () => userRoleAPi.getRoles() });
  const { data: partnerList } = useQuery({ queryKey: ["partnerList"], queryFn: () => partnerApi.getAllPartner() });

  const {
    data: userRolesResponse,
    isLoading: isLoadingUserRoles,
    error: userRolesError,
    refetch: refetchUserRoles,
  } = useQuery({
    queryKey: ["userRoles", selectedRole, t.pageNumber, selectedUserID, t.pageSize],
    queryFn: async () => {
      let url = `/User/paged/user-roles?isActive=true`;
      if (selectedRole) url += `&roleId=${selectedRole}`;
      if (selectedUserID) url += `&userId=${selectedUserID}`;
      const response = await api.post(url, { pageNumber: t.pageNumber, pageSize: t.pageSize });
      return response.data;
    },
  });

  useEffect(() => {
    if (userRolesError) toast.error("Failed to fetch user roles");
  }, [userRolesError]);

  // back to page 1 whenever the grid filter (role / user) changes
  useEffect(() => {
    t.resetPage();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedRole, selectedUserID]);

  const { mutate: createMapping, isPending: isSubmitting } = useMutation({
    mutationFn: (payload: Omit<FormValues, "partnerId"> & { partnerId: string | null }) => api.post("/User/user-role-mapping", payload),
    onSuccess: (res) => {
      if (res.status === 200) {
        toast.success("User role mapping created successfully!");
        refetchUserRoles();
      } else {
        console.error("Failed to submit form:", res.data);
      }
    },
    onError: (error: any) => {
      console.error("Error submitting form:", error);
      toast.error(error?.response?.data?.message || "Failed to create user role mapping");
    },
  });

  const removeUserRoleMutation = useMutation({
    mutationFn: async ({ userId, roleId }: { userId: number; roleId: number }) => {
      const response = await api.delete(`/User/remove-user-role?userId=${userId}&roleId=${roleId}`);
      return response.data;
    },
    onSuccess: () => {
      toast.success("User role removed successfully");
      refetchUserRoles();
    },
    onError: (error: any) => {
      console.error("Error removing user role:", error);
      toast.error(error.response?.data?.message || "Failed to remove user role");
    },
  });

  const onFinish = (values: FormValues) => {
    const data = validateWithZod(userRoleMappingSchema, form, { ...values, partnerId: values.partnerId ?? "", isActive: true });
    if (!data) return;
    createMapping({ ...data, partnerId: data.partnerId === "" || data.partnerId == null ? null : data.partnerId });
  };

  const confirmRemove = (userRole: UserRole) =>
    Modal.confirm({
      title: "Remove role",
      content: `Remove the ${userRole.roleName} role from ${userRole.fullName}?`,
      okText: "Remove",
      okButtonProps: { danger: true },
      onOk: () => removeUserRoleMutation.mutateAsync({ userId: userRole.userId, roleId: userRole.roleId }),
    });

  const rowMenu = (userRole: UserRole): MenuProps["items"] => [
    { key: "remove", danger: true, icon: <DeleteOutlined />, label: "Remove Role", onClick: () => confirmRemove(userRole) },
  ];

  const columns = useMemo<DataColumn<UserRole>[]>(
    () => [
      { key: "fullName", title: "Full Name", dataIndex: "fullName", sorter: byText("fullName") },
      { key: "roleName", title: "Role Name", dataIndex: "roleName", sorter: byText("roleName") },
      ...(partnerVisible
        ? [{ key: "partnerName", title: "Partner Name", dataIndex: "partnerName", sorter: byText("partnerName"), render: (v: string) => v || "N/A" } as DataColumn<UserRole>]
        : []),
      { key: "email", title: "Email", dataIndex: "email", sorter: byText("email") },
      {
        key: "actions",
        title: "Actions",
        locked: true,
        align: "center",
        width: 80,
        render: (_: unknown, userRole: UserRole) => (
          <Dropdown menu={{ items: rowMenu(userRole) }} trigger={["click"]}>
            <Button size="small" icon={<MoreOutlined />} />
          </Dropdown>
        ),
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [partnerVisible]
  );

  const userOptions = (userList as any[]).map((u) => ({ value: String(u.userId), label: u.email }));
  const roleOptions = (userRoleList as any[]).map((r) => ({ value: String(r.roleId), label: r.roleName }));
  const partnerOptions = ((partnerList as any)?.data ?? []).map((p: any) => ({ value: String(p.id), label: p.partnerName }));

  return (
    <Flex vertical gap={24}>
      <Flex vertical gap={8}>
        <Typography.Title level={5} style={{ margin: 0 }}>
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
            {selectedRole === PARTNER_ROLE_ID && (
              <Col xs={24} sm={12} md={8}>
                <Form.Item name="partnerId" label="Partner" rules={zodRules(userRoleMappingSchema, "partnerId")}>
                  <Select showSearch optionFilterProp="label" options={partnerOptions} placeholder="Select Partner" allowClear />
                </Form.Item>
              </Col>
            )}
          </Row>
          <Flex justify="flex-end">
            <Space>
              <Button onClick={() => form.resetFields()} disabled={isSubmitting}>
                Clear
              </Button>
              <Button type="primary" htmlType="submit" loading={isSubmitting}>
                Submit
              </Button>
            </Space>
          </Flex>
        </Form>
      </Flex>

      <Flex vertical gap={8}>
        <Typography.Title level={5} style={{ margin: 0 }}>
          User Role Table
        </Typography.Title>
        {selectedRole || selectedUserID ? (
          <DataTable<UserRole>
            storageKey="user-roles"
            rowKey={(r) => `${r.userId}-${r.roleId}`}
            columns={columns}
            data={userRolesResponse?.data?.items}
            loading={isLoadingUserRoles}
            pagination={{ current: t.pageNumber, pageSize: t.pageSize, total: userRolesResponse?.data?.totalCount ?? 0 }}
            onChange={t.onTableChange}
            emptyText="No users found for this role"
          />
        ) : (
          <Typography.Text type="secondary">Select a user or a role above to list the existing mappings.</Typography.Text>
        )}
      </Flex>
    </Flex>
  );
};

export default UserRoleMapping;
