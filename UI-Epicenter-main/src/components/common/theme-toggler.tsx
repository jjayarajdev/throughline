"use client";
import React, { useEffect, useState } from "react";
import { Button, Tooltip } from "antd";
import { MoonOutlined, SunOutlined } from "@ant-design/icons";
import { useTheme } from "next-themes";

export const ThemeToggleButton: React.FC = () => {
  const { setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);
  if (!mounted) return <Button type="text" shape="circle" icon={<SunOutlined />} disabled />;

  const dark = resolvedTheme === "dark";
  return (
    <Tooltip title={dark ? "Switch to light mode" : "Switch to dark mode"}>
      <Button
        type="text"
        shape="circle"
        aria-label="Toggle colour theme"
        icon={dark ? <SunOutlined /> : <MoonOutlined />}
        onClick={() => setTheme(dark ? "light" : "dark")}
      />
    </Tooltip>
  );
};
