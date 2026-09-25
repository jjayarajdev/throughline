"use client";
import { Button, Form, Input, Modal, Space, Typography } from "antd";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import * as z from "zod";
import axios from "axios";
import { toast } from "@/lib/toast";
import { validateWithZod, zodRules } from "@/lib/zodRules";
import { addSkillPayload, hiringApi } from "@/services/api/hiring.api";

const skillSchema = z.object({
  skillName: z.string().min(1, "Skill name is required"),
});

type SkillFormValues = z.infer<typeof skillSchema>;

interface AddSkillDialogProps {
  isOpen: boolean;
  onClose: () => void;
  isPrimary: boolean;
  masterType?: number;
}

/** Add a new primary / secondary skill to the master list. */
export function AddSkillDialog({ isOpen, onClose, isPrimary, masterType }: AddSkillDialogProps) {
  const queryClient = useQueryClient();
  const [form] = Form.useForm<SkillFormValues>();

  const addSkills = useMutation({
    mutationKey: ["addSkills"],
    mutationFn: (data: addSkillPayload) => hiringApi.addSkills(masterType || 0, data),
    onSuccess: (data) => {
      toast.success(data?.message || "Skill added successfully");
      queryClient.invalidateQueries({ queryKey: [isPrimary ? "PrimarySkills" : "SecondarySkills"] });
      queryClient.invalidateQueries({ queryKey: ["skills"] });
      form.resetFields();
      onClose();
    },
    onError: (error) => {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 400) {
          toast.error(error.response.data?.message || "Bad Request");
        } else {
          toast.error("baD request");
        }
      }
    },
  });

  const handleClose = () => {
    form.resetFields();
    onClose();
  };

  const onFinish = (values: SkillFormValues) => {
    const data = validateWithZod(skillSchema, form, values);
    if (!data) return;
    addSkills.mutate({ isActive: true, name: data.skillName, isPrimary });
  };

  return (
    <Modal
      open={isOpen}
      onCancel={handleClose}
      title="Add New Skill"
      destroyOnHidden
      footer={
        <Space>
          <Button onClick={onClose} disabled={addSkills.isPending}>
            Cancel
          </Button>
          <Button type="primary" loading={addSkills.isPending} onClick={() => form.submit()}>
            {addSkills.isPending ? "Adding..." : "Add Skill"}
          </Button>
        </Space>
      }
    >
      <Typography.Paragraph type="secondary">Please add only new skills that aren&apos;t already listed.</Typography.Paragraph>
      <Form form={form} layout="vertical" onFinish={onFinish} initialValues={{ skillName: "" }}>
        <Form.Item name="skillName" label="Skill Name" rules={zodRules(skillSchema, "skillName")}>
          <Input placeholder="Enter skill name (e.g., React, Java, Project Management)" />
        </Form.Item>
      </Form>
    </Modal>
  );
}
