"use client";
import { Layout, Spin } from "antd";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AppHeader from "@/components/layout/AppHeader";
import AppSidebar from "@/components/layout/AppSidebar";

const { Content } = Layout;

/**
 * Everything under /home depends on the signed-in user held in sessionStorage (roles drive
 * menus, tabs and columns), so this shell renders on the client only. That avoids
 * server/client hydration mismatches from role-dependent markup.
 */
export default function HomeLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!sessionStorage.getItem("throughline-storage")) {
      router.replace("/");
      return;
    }
    setReady(true);
  }, [router]);

  if (!ready) return <Spin fullscreen />;

  return (
    <Layout style={{ minHeight: "100vh" }} hasSider>
      <AppSidebar />
      <Layout>
        <AppHeader />
        <Content style={{ minHeight: "calc(100vh - 56px)" }}>{children}</Content>
      </Layout>
    </Layout>
  );
}
