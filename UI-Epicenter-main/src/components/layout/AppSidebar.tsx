"use client";
import React, { useMemo } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Avatar, Layout, Menu, Typography, theme as antdTheme } from "antd";
import type { MenuProps } from "antd";
import { useSidebar } from "../context/SidebarContext";
import { MenuItemProps, menuItemsByRole } from "./UserRoles";
import { useUserStore } from "@/store/userStore";
import ThroughlineLogo, { ThroughlineMark } from "@/components/throughline/Logo";
import { brand } from "@/components/throughline/theme";

const { Sider } = Layout;
const { Text } = Typography;

export const SIDER_WIDTH = 240;
export const SIDER_COLLAPSED_WIDTH = 64;

/** Menu entries for the signed-in user's roles, de-duplicated by route. */
export function useRoleMenuItems(): MenuItemProps[] {
  const { roles } = useUserStore();
  return useMemo(() => {
    if (!roles?.length) return [];
    const merged = roles.flatMap((role) => menuItemsByRole[role.name] || []);
    return Array.from(new Map(merged.map((item) => [item.href, item])).values());
  }, [roles]);
}

const AppSidebar: React.FC = () => {
  const { isExpanded, isMobileOpen } = useSidebar();
  const { userName, email } = useUserStore();
  const pathname = usePathname();
  const items = useRoleMenuItems();
  const { token } = antdTheme.useToken();

  const collapsed = !isExpanded && !isMobileOpen;

  // Highlight the entry whose route is the longest prefix of the current path,
  // so detail pages (e.g. /home/hiring-management/hiring-profile) keep their section lit.
  const selectedKey = useMemo(() => {
    const match = items
      .filter((i) => pathname === i.href || pathname.startsWith(i.href + "/"))
      .sort((a, b) => b.href.length - a.href.length)[0];
    return match?.href ?? pathname;
  }, [items, pathname]);

  const menuItems: MenuProps["items"] = items.map((item) => ({
    key: item.href,
    icon: <span className="anticon">{item.icon}</span>,
    label: <Link href={item.href}>{item.label}</Link>,
  }));

  return (
    <Sider
      collapsible
      collapsed={collapsed}
      trigger={null}
      width={SIDER_WIDTH}
      collapsedWidth={SIDER_COLLAPSED_WIDTH}
      theme="dark"
      style={{
        position: "sticky",
        top: 0,
        height: "100vh",
        overflow: "auto",
        background: brand.siderBg,
      }}
    >
      <Link
        href="/home/dashboard"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: collapsed ? "center" : "flex-start",
          height: 56,
          padding: collapsed ? 0 : "0 16px",
          color: "#fff",
        }}
      >
        {collapsed ? <ThroughlineMark size={32} /> : <ThroughlineLogo size={32} light />}
      </Link>

      <Menu
        theme="dark"
        mode="inline"
        selectedKeys={[selectedKey]}
        items={menuItems}
        style={{ background: "transparent", borderInlineEnd: 0, marginTop: 8 }}
      />

      {!collapsed && (
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            padding: 12,
            borderTop: "1px solid rgba(255,255,255,0.08)",
            display: "flex",
            alignItems: "center",
            gap: 10,
          }}
        >
          <Avatar style={{ background: token.colorPrimary, flexShrink: 0 }}>
            {userName?.charAt(0)?.toUpperCase() || "U"}
          </Avatar>
          <div style={{ minWidth: 0 }}>
            <Text strong style={{ color: "#fff", display: "block" }} ellipsis>
              {userName || "User"}
            </Text>
            <Text style={{ color: "rgba(255,255,255,0.55)", fontSize: 12, display: "block" }} ellipsis>
              {email || ""}
            </Text>
          </div>
        </div>
      )}
    </Sider>
  );
};

export default AppSidebar;
