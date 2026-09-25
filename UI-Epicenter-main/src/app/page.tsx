"use client";
import { useEffect } from "react";
import { Alert, Button, Card, Form, Input, Typography } from "antd";
import { ArrowRightOutlined, LockOutlined, MailOutlined } from "@ant-design/icons";
import { toast } from "@/lib/toast";
import { useLogin } from "@/lib/useAuth";
import { redirectBasedOnRole } from "@/components/layout/UserRoles";
import ThroughlineLogo, { ThroughlineMark } from "@/components/throughline/Logo";
import { brand } from "@/components/throughline/theme";

const { Title, Paragraph, Text } = Typography;

type LoginValues = { email: string; password: string };

export default function LoginPage() {
  const mutation = useLogin();
  const [form] = Form.useForm<LoginValues>();

  useEffect(() => {
    const storedData = sessionStorage.getItem("throughline-storage");
    if (!storedData) return;
    try {
      const roles = JSON.parse(storedData)?.state?.roles || [];
      if (roles.length > 0) redirectBasedOnRole(roles);
    } catch (error) {
      console.error("Failed to parse stored session:", error);
    }
  }, []);

  const onFinish = ({ email, password }: LoginValues) => {
    mutation.mutate(
      { email, password },
      {
        onSuccess: (data) => {
          redirectBasedOnRole(data.roles);
          toast.success("Login successful!");
        },
      }
    );
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", background: "#f5f5f5" }}>
      {/* Brand panel */}
      <div
        className="hidden lg:flex"
        style={{
          width: "50%",
          position: "relative",
          overflow: "hidden",
          background: `linear-gradient(135deg, ${brand.primaryActive} 0%, ${brand.primary} 55%, ${brand.primaryHover} 100%)`,
          color: "#fff",
          padding: 64,
          flexDirection: "column",
          justifyContent: "center",
        }}
      >
        <svg
          aria-hidden="true"
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", opacity: 0.18 }}
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <pattern id="tl-grid" width="48" height="48" patternUnits="userSpaceOnUse">
              <path d="M48 0H0V48" fill="none" stroke="#fff" strokeWidth="0.6" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#tl-grid)" />
          <path d="M0 400 H2000" stroke="#fff" strokeWidth="2" />
        </svg>

        <div style={{ position: "relative", maxWidth: 520 }}>
          <ThroughlineLogo size={56} light />
          <Title level={1} style={{ color: "#fff", marginTop: 40, marginBottom: 12, fontWeight: 700 }}>
            One line from request to hire.
          </Title>
          <Paragraph style={{ color: "rgba(255,255,255,0.85)", fontSize: 18, marginBottom: 0 }}>
            Throughline connects partners, hiring requests, candidates and interviews in a
            single, traceable flow.
          </Paragraph>
        </div>
      </div>

      {/* Sign-in panel */}
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: 32 }}>
        <div style={{ width: "100%", maxWidth: 420 }}>
          <div style={{ textAlign: "center", marginBottom: 28 }}>
            <ThroughlineMark size={56} />
            <Title level={3} style={{ marginTop: 16, marginBottom: 4 }}>
              Sign in to Throughline
            </Title>
            <Text type="secondary">Welcome back. Enter your credentials to continue.</Text>
          </div>

          <Card variant="borderless" style={{ boxShadow: "0 6px 24px rgba(0,0,0,0.06)" }}>
            <Form<LoginValues>
              form={form}
              layout="vertical"
              size="large"
              requiredMark={false}
              onFinish={onFinish}
              initialValues={{ email: "", password: "" }}
            >
              <Form.Item
                name="email"
                label="Email address"
                rules={[
                  { required: true, message: "Please enter your email address" },
                  { type: "email", message: "Please enter a valid email address" },
                ]}
              >
                <Input prefix={<MailOutlined />} placeholder="name@company.com" autoComplete="email" />
              </Form.Item>

              <Form.Item
                name="password"
                label="Password"
                rules={[
                  { required: true, message: "Please enter your password" },
                  { min: 6, message: "Password must be at least 6 characters" },
                ]}
              >
                <Input.Password
                  prefix={<LockOutlined />}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                />
              </Form.Item>

              {mutation.isError && (
                <Form.Item>
                  <Alert
                    type="error"
                    showIcon
                    message={
                      mutation.error?.message ||
                      "Login failed. Please check your credentials and try again."
                    }
                  />
                </Form.Item>
              )}

              <Form.Item style={{ marginBottom: 0 }}>
                <Button type="primary" htmlType="submit" block loading={mutation.isPending}>
                  {mutation.isPending ? "Signing you in…" : "Sign in"}
                  {!mutation.isPending && <ArrowRightOutlined />}
                </Button>
              </Form.Item>
            </Form>
          </Card>
        </div>
      </div>
    </div>
  );
}
