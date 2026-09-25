"use client";
import React from "react";
import { Button, Layout, Space, theme as antdTheme } from "antd";
import { MenuFoldOutlined, MenuUnfoldOutlined } from "@ant-design/icons";
import { ThemeToggleButton } from "@/components/throughline/ThemeToggle";
import UserDropdown from "@/components/header/UserDropdown";
import { useSidebar } from "@/components/context/SidebarContext";

const { Header } = Layout;

const AppHeader: React.FC = () => {
  const { isExpanded, toggleSidebar } = useSidebar();
  const { token } = antdTheme.useToken();

  return (
    <Header
      style={{
        position: "sticky",
        top: 0,
        zIndex: 100,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        borderBottom: `1px solid ${token.colorBorderSecondary}`,
        lineHeight: "56px",
      }}
    >
      <Button
        type="text"
        aria-label={isExpanded ? "Collapse navigation" : "Expand navigation"}
        icon={isExpanded ? <MenuFoldOutlined /> : <MenuUnfoldOutlined />}
        onClick={toggleSidebar}
      />
      <Space size="middle">
        <ThemeToggleButton />
        <UserDropdown />
      </Space>
    </Header>
  );
};

export default AppHeader;
