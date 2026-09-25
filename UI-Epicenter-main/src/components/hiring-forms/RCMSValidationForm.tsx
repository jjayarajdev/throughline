"use client";
import { Dispatch, SetStateAction } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button, Col, Form, Input, Row, Switch } from "antd";
import * as z from "zod";
import { toast } from "@/lib/toast";
import { validateWithZod, zodRules } from "@/lib/zodRules";
import { hiringApi } from "../../services/api/hiring.api";

const newSchema = z.object({
  mode: z.literal("new"),
  rcMsId: z.string().min(1, "RCMS ID is required"),
  projectId: z.string().min(1, "Project ID is required"),
});

const replicaSchema = z.object({
  mode: z.literal("replica"),
  hrqid: z.string().min(1, "HRQ ID is required"),
});

const validationSchema = z.discriminatedUnion("mode", [newSchema, replicaSchema]);

type ValidationFormValues = { mode: "new" | "replica"; rcMsId?: string; projectId?: string; hrqid?: string };

interface RCMSValidationFormProps {
  onValidationSuccess: (data: any, mode: "new" | "replica") => void;
  setValidate: Dispatch<SetStateAction<boolean>>;
}

/** Look up an RCMS request (new) or an existing HRQ (replica) before creating a hiring request. */
export function RCMSValidationForm({ onValidationSuccess, setValidate }: RCMSValidationFormProps) {
  const [form] = Form.useForm<ValidationFormValues>();
  const mode = Form.useWatch("mode", form) ?? "new";
  const rcMsId = Form.useWatch("rcMsId", form);
  const projectId = Form.useWatch("projectId", form);
  const hrqid = Form.useWatch("hrqid", form);

  const { refetch, isFetching: isLoading } = useQuery({
    queryKey: ["validateHiring", mode, mode === "new" ? [rcMsId, projectId] : hrqid],
    queryFn: () => (mode === "new" ? hiringApi.getHiringByID(form.getFieldValue("rcMsId"), form.getFieldValue("projectId")) : hiringApi.getHiringReplica(form.getFieldValue("hrqid"))),
    enabled: false,
  });

  const onFinish = async (values: ValidationFormValues) => {
    const data = validateWithZod(validationSchema, form, { ...values, mode });
    if (!data) return;
    if (mode === "new") setValidate(false);
    try {
      const response = await refetch();
      const result: any = response?.data;
      if (result?.status === false) {
        toast.error(result?.message);
        setValidate(false);
        return;
      }
      if (response.data) onValidationSuccess(response.data, mode);
    } catch (error) {
      console.error("Validation failed:", error);
    }
  };

  return (
    <Form form={form} layout="vertical" onFinish={onFinish} initialValues={{ mode: "new", rcMsId: "", projectId: "", hrqid: "" }} className="py-4">
      <Row gutter={[16, 8]}>
        <Col span={24}>
          <Form.Item name="mode" label="Type of Rec" getValueProps={(v) => ({ checked: v === "replica" })} normalize={(checked: boolean) => (checked ? "replica" : "new")} layout="horizontal">
            <Switch checkedChildren="Replica" unCheckedChildren="New" />
          </Form.Item>
        </Col>
        {mode === "new" ? (
          <>
            <Col xs={24} md={8}>
              <Form.Item name="rcMsId" label="RCMS PROJECT ID" rules={zodRules(newSchema, "rcMsId")}>
                <Input placeholder="enter rcms project id" />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item name="projectId" label="RESOURCE REQUEST ID" rules={zodRules(newSchema, "projectId")}>
                <Input placeholder="enter resource request id" />
              </Form.Item>
            </Col>
          </>
        ) : (
          <Col xs={24} md={8}>
            <Form.Item name="hrqid" label="HRQ ID" rules={zodRules(replicaSchema, "hrqid")}>
              <Input placeholder="HRQ ID" />
            </Form.Item>
          </Col>
        )}
        <Col span={24}>
          <Button type="primary" htmlType="submit" loading={isLoading}>
            {isLoading ? "Validating..." : "Validate"}
          </Button>
        </Col>
      </Row>
    </Form>
  );
}
