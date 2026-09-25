"use client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider, useTheme } from "next-themes";
import { App as AntdApp, ConfigProvider, theme as antdTheme } from "antd";
import { useEffect, useMemo, useState } from "react";
import { SidebarProvider } from "./context/SidebarContext";
import { baseTheme, darkOverrides } from "./throughline/theme";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
    },
  },
});

/** Ant Design ConfigProvider that follows the next-themes light/dark setting. */
function AntdThemeProvider({ children }: { children: React.ReactNode }) {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const dark = mounted && resolvedTheme === "dark";

  const theme = useMemo(
    () => ({
      ...baseTheme,
      algorithm: dark ? antdTheme.darkAlgorithm : antdTheme.defaultAlgorithm,
      components: {
        ...baseTheme.components,
        ...(dark ? darkOverrides.components : {}),
        Layout: {
          ...baseTheme.components?.Layout,
          ...(dark ? darkOverrides.components?.Layout : {}),
        },
      },
    }),
    [dark]
  );

  return (
    <ConfigProvider theme={theme}>
      <AntdApp>{children}</AntdApp>
    </ConfigProvider>
  );
}

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <AntdThemeProvider>
          <SidebarProvider>{children}</SidebarProvider>
        </AntdThemeProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
