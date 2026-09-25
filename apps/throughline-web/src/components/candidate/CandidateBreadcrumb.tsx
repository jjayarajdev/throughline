"use client";
import { Breadcrumb, Typography } from "antd";
import { usePathname, useRouter } from "next/navigation";

const getLabel = (segment: string) => segment.replace(/-/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());

/** Path-derived breadcrumb: Home → each segment after /home; intermediate crumbs go back. */
export function CandidateBreadcrumb() {
  const pathname = usePathname();
  const router = useRouter();
  const segments = pathname.split("/").filter(Boolean).filter((s) => s !== "home");

  return (
    <Breadcrumb
      items={[
        { title: <Typography.Link onClick={() => router.push("/home/dashboard")}>Home</Typography.Link> },
        ...segments.map((segment, idx) => {
          const isLast = idx === segments.length - 1;
          return {
            title: isLast ? getLabel(segment) : <Typography.Link onClick={() => router.back()}>{getLabel(segment)}</Typography.Link>,
          };
        }),
      ]}
    />
  );
}

export default CandidateBreadcrumb;
