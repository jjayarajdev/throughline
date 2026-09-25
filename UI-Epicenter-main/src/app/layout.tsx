import type { Metadata } from "next";
import { AntdRegistry } from "@ant-design/nextjs-registry";
import "./globals.css";
import Providers from "@/components/providers";
import { Toaster } from "sonner";

export const metadata: Metadata = {
  title: "Throughline",
  description: "Throughline — partner hiring and candidate management platform",
  icons: { icon: "/throughline.svg" },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased">
        <AntdRegistry>
          <Providers>
            {children}
            <Toaster />
          </Providers>
        </AntdRegistry>
      </body>
    </html>
  );
}
