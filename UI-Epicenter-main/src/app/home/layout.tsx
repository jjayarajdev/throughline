"use client";
import { Layout } from "antd";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import AppHeader from "@/components/layout/AppHeader";
import AppSidebar from "@/components/layout/AppSidebar";

const { Content } = Layout;

export default function HomeLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const router = useRouter();

  useEffect(() => {
    if (!sessionStorage.getItem("throughline-storage")) {
      router.replace("/");
    }
  }, [router]);

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
