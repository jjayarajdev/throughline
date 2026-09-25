"use client";
import Link from "next/link";
import { Avatar, Dropdown, Space, Typography } from "antd";
import type { MenuProps } from "antd";
import { DownOutlined, LogoutOutlined, UserOutlined } from "@ant-design/icons";
import { useLogout } from "@/lib/useLogout";
import { useUserStore } from "@/store/userStore";

const { Text } = Typography;

export default function UserDropdown() {
  const { userName, email, roles, partnerName, partnerId } = useUserStore();
  const logout = useLogout();

  const items: MenuProps["items"] = [
    {
      key: "info",
      disabled: true,
      style: { cursor: "default" },
      label: (
        <div style={{ padding: "4px 0", minWidth: 220 }}>
          <Text strong style={{ display: "block" }}>
            {userName}
          </Text>
          {roles.length > 0 && (
            <Text type="secondary" style={{ display: "block", fontSize: 12 }}>
              {roles.map((role) => role.name).join(", ")}
            </Text>
          )}
          <Text type="secondary" style={{ display: "block", fontSize: 12 }}>
            {email}
          </Text>
          {partnerName && (
            <Text type="secondary" style={{ display: "block", fontSize: 12 }}>
              {partnerName}
            </Text>
          )}
        </div>
      ),
    },
    { type: "divider" },
    ...(partnerId
      ? [
          {
            key: "profile",
            icon: <UserOutlined />,
            label: <Link href={`/home/edit-profile?id=${partnerId}&tab=profile`}>Edit profile</Link>,
          },
        ]
      : []),
    {
      key: "logout",
      icon: <LogoutOutlined />,
      label: "Sign out",
      onClick: () => logout(),
    },
  ];

  return (
    <Dropdown menu={{ items }} trigger={["click"]} placement="bottomRight">
      <a onClick={(e) => e.preventDefault()} style={{ color: "inherit" }}>
        <Space size={8}>
          <Avatar size="small" icon={<UserOutlined />} />
          <span style={{ fontWeight: 500 }}>{userName}</span>
          <DownOutlined style={{ fontSize: 10 }} />
        </Space>
      </a>
    </Dropdown>
  );
}
