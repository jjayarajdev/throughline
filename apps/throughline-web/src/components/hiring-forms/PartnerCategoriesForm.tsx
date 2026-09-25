"use client";
import { useEffect } from "react";
import { useParams } from "next/navigation";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Button, Col, Flex, Form, Input, InputNumber, Row, Select, Space, Spin, Switch } from "antd";
import axios from "axios";
import * as z from "zod";
import { toast } from "@/lib/toast";
import { validateWithZod, zodRules } from "@/lib/zodRules";
import { dropdownApi } from "@/services/api/master";
import { MasterTypes } from "@/constants/masterTypes";
import { hiringApi, PartnerCategoriesPayload } from "@/services/api/hiring.api";
import { idNameMulti, toIdOptions } from "./shared";

const PartnerCategoriesSchema = z.object({
  isSpecificPartner: z.boolean(),
  isProxyPartner: z.boolean(),
  isRecommendThePartner: z.boolean(),
  selectedPartners: z
    .array(
      z.object({
        id: z.number(),
        name: z.string(),
      })
    )
    .optional(),
  profileCAP: z.coerce.number().min(1, "At least one position required").max(10, "Maximum 10 profiles allowed per day"),
  comments: z.string().optional(),
});

type PartnerCategory = z.infer<typeof PartnerCategoriesSchema>;

const defaultValues: PartnerCategory = {
  isSpecificPartner: false,
  isProxyPartner: false,
  isRecommendThePartner: false,
  selectedPartners: [],
  profileCAP: Number("10"),
  comments: "",
};

interface RCMSStep2FormProps {
  onPrevious?: () => void;
  onNext?: () => void;
}

/** Step 3 of the hiring request: which partners may submit profiles and the daily profile cap. */
export default function PartnerCategories({ onPrevious, onNext }: RCMSStep2FormProps) {
  const [form] = Form.useForm<PartnerCategory>();
  const { hiring } = useParams();
  const isSpecificPartner = Form.useWatch("isSpecificPartner", form);

  const { data: ActivePartner = [], refetch: refetchPartner } = useQuery({
    queryKey: ["ActivePartner", hiring],
    queryFn: () => dropdownApi.fetchSpecificpartner(MasterTypes.DOMAIN_SPECIFIC_PARTNERS, String(hiring)),
    enabled: true,
  });

  const { mutate: addPartnerCategories, isPending: createPending } = useMutation({
    mutationKey: ["addPartnerCategories"],
    mutationFn: hiringApi.CreatePartnerCategories,
    onSuccess: (data) => {
      form.resetFields();
      toast.success(data?.message || "Partner categories created successfully");
      onNext?.();
    },
    onError: (error) => {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 400) {
          toast.error(error.response.data?.message || "Bad Request");
        } else {
          toast.error("baD request");
        }
      } else {
        toast.error("Something went wrong.");
      }
    },
  });

  const { data: getPartnerCategories, isLoading: getPartnerLoading } = useQuery({
    queryKey: ["getPartnerCategories", hiring],
    queryFn: () => hiringApi.getPartnerCategory(Number(hiring)),
    enabled: !!hiring,
    retry: false,
  });

  const { mutate: updatePartnerCategories, isPending: UpdateLoading } = useMutation({
    mutationFn: (values: PartnerCategoriesPayload) => hiringApi.updatePartnerCategories(Number(getPartnerCategories?.id), values),
    onSuccess: (data) => {
      toast.success(data?.message || "updated Successfully");
      onNext?.();
    },
    onError: (error) => {
      toast.error("Failed to update hiring");
      console.log("Error updating hiring:", error);
    },
  });

  const handleSubmit = (raw: PartnerCategory) => {
    const values = validateWithZod(PartnerCategoriesSchema, form, raw);
    if (!values) return;
    const payload = {
      hiringRequestId: Number(hiring),
      isSpecificPartner: values.isSpecificPartner,
      isProxyPartner: values.isProxyPartner,
      isRecommendThePartner: values.isRecommendThePartner,
      selectedPartners: values?.selectedPartners?.map((partner: { id: number }) => ({
        partnerId: partner.id,
        assignedOn: new Date().toISOString(),
        partnerCategoryId: getPartnerCategories?.id || 0,
      })),
      profileCAP: Number(values.profileCAP),
      comments: values.comments,
      id: getPartnerCategories?.id || 0,
    } as unknown as PartnerCategoriesPayload;
    if (getPartnerCategories) {
      updatePartnerCategories(payload);
    } else {
      addPartnerCategories(payload);
    }
  };

  useEffect(() => {
    const load = async () => {
      if (!getPartnerCategories) {
        form.resetFields();
        return;
      }
      form.resetFields();
      form.setFieldsValue({
        isSpecificPartner: Boolean(getPartnerCategories.isSpecificPartner),
        isProxyPartner: Boolean(getPartnerCategories.isProxyPartner),
        isRecommendThePartner: Boolean(getPartnerCategories.isRecommendThePartner),
        profileCAP: getPartnerCategories.profileCAP ?? 1,
        comments: getPartnerCategories.comments ?? "",
      });
      const res = await refetchPartner();
      const result = ((res.data ?? []) as { id: number; name: string }[]).filter((partner) =>
        (getPartnerCategories.selectedPartners ?? []).some((p: { partnerId: number }) => p.partnerId === partner.id)
      );
      form.setFieldValue("selectedPartners", result);
    };
    load();
  }, [getPartnerCategories, form, refetchPartner]);

  return (
    <Form form={form} layout="vertical" onFinish={handleSubmit} initialValues={defaultValues}>
      <Spin spinning={createPending || UpdateLoading || getPartnerLoading}>
        <Flex vertical gap={16}>
          <Form.Item label="Partner Category" style={{ marginBottom: 0 }}>
            <Space size="large" wrap>
              <Space>
                <Form.Item name="isSpecificPartner" valuePropName="checked" noStyle>
                  <Switch />
                </Form.Item>
                Specific Partner
              </Space>
              <Space>
                <Form.Item name="isProxyPartner" valuePropName="checked" noStyle>
                  <Switch />
                </Form.Item>
                Proxy
              </Space>
            </Space>
          </Form.Item>

          <Row gutter={[16, 8]}>
            {isSpecificPartner && (
              <Col xs={24} md={12}>
                <Form.Item name="selectedPartners" label="Select Partners" rules={zodRules(PartnerCategoriesSchema, "selectedPartners")} {...idNameMulti}>
                  <Select mode="multiple" labelInValue showSearch optionFilterProp="label" maxTagCount="responsive" placeholder="Select Partners" options={toIdOptions(ActivePartner)} />
                </Form.Item>
              </Col>
            )}
            <Col xs={24} md={12}>
              <Form.Item name="profileCAP" label="Profile Cap" rules={zodRules(PartnerCategoriesSchema, "profileCAP")}>
                <InputNumber className="w-full" min={1} max={10} precision={0} placeholder="Maximum number of profile allowed (only 10 per day)" />
              </Form.Item>
            </Col>
            <Col span={24}>
              <Form.Item name="comments" label="Comment" rules={zodRules(PartnerCategoriesSchema, "comments")}>
                <Input.TextArea rows={4} placeholder="Enter commnets here" />
              </Form.Item>
            </Col>
          </Row>

          <Flex justify="space-between" wrap gap={8}>
            <Button onClick={() => onPrevious?.()}>Previous</Button>
            <Space>
              <Button type="primary" htmlType="submit" loading={UpdateLoading || createPending}>
                {UpdateLoading || createPending ? (getPartnerCategories ? "Updating..." : "Saving...") : getPartnerCategories ? "Update" : "Save"}
              </Button>
              <Button onClick={onNext}>Next</Button>
            </Space>
          </Flex>
        </Flex>
      </Spin>
    </Form>
  );
}
