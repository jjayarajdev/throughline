"use client";
import { useRouter } from "next/navigation";
import { Button, Flex, Result, Space } from "antd";
import { ArrowLeftOutlined, HomeOutlined } from "@ant-design/icons";

export default function UnauthorizedPage() {
  const router = useRouter();

  const handleGoBack = () => {
    if (window.history.length > 1) router.back();
    else router.push("/home");
  };

  return (
    <Flex align="center" justify="center" className="p-4" style={{ minHeight: "100vh" }}>
      <Result
        status="403"
        title="Access Denied"
        subTitle="You don't have permission to access this page. Please contact your administrator if you believe this is an error."
        extra={
          <Space wrap>
            <Button type="primary" icon={<HomeOutlined />} onClick={() => router.push("/home/dashboard")}>
              Back to dashboard
            </Button>
            <Button icon={<ArrowLeftOutlined />} onClick={handleGoBack}>
              Go back
            </Button>
          </Space>
        }
      />
    </Flex>
  );
}
