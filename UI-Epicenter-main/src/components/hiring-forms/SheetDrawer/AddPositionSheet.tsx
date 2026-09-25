"use client";
import { Button, Form, InputNumber, Space } from "antd";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import * as z from "zod";
import { toast } from "@/lib/toast";
import { validateWithZod, zodRules } from "@/lib/zodRules";
import { HiringDetailSheet } from "@/components/shared/HiringDetailsSheet";
import { hiringApi, type Hiring } from "@/services/api/hiring.api";

interface AddPositionSheetProps {
  isOpen: boolean;
  onClose: () => void;
  selectedCandidate: Hiring | null;
}

const formSchema = z.object({
  positions: z.number({ invalid_type_error: "Enter the number of positions" }).int().min(1, "At least one position is required").max(500, "Too many positions"),
});
type FormValues = z.infer<typeof formSchema>;

/** Add child positions to a parent HRQ, inside the hiring-details drawer. */
export function AddPositionSheet({ isOpen, onClose, selectedCandidate }: AddPositionSheetProps) {
  const queryClient = useQueryClient();
  const [form] = Form.useForm<FormValues>();

  const { mutate: addHiringPositions, isPending } = useMutation({
    mutationKey: ["addHiringPositions"],
    mutationFn: hiringApi.addHiringPositions,
    onSuccess: (data) => {
      toast.success(data?.message || "Positions added successfully");
      queryClient.invalidateQueries({ queryKey: ["hiringBin"] });
      queryClient.invalidateQueries({ queryKey: ["hiringCart"] });
      form.resetFields();
      onClose();
    },
    onError: (error: any) => toast.error(error?.response?.data?.message || error?.message || "Something went wrong"),
  });

  const onFinish = (values: FormValues) => {
    const data = validateWithZod(formSchema, form, values);
    if (!data || !selectedCandidate?.id) return;
    addHiringPositions({ parentHiringRequestId: selectedCandidate.id, noOfPositions: data.positions });
  };

  return (
    <HiringDetailSheet
      isOpen={isOpen}
      onClose={() => {
        form.resetFields();
        onClose();
      }}
      candidate={selectedCandidate}
      title="Add positions"
      footer={
        <Space style={{ display: "flex", justifyContent: "flex-end" }}>
          <Button onClick={onClose} disabled={isPending}>
            Cancel
          </Button>
          <Button type="primary" loading={isPending} onClick={() => form.submit()}>
            Add positions
          </Button>
        </Space>
      }
    >
      <Form form={form} layout="vertical" onFinish={onFinish} className="mt-6" initialValues={{ positions: 1 }}>
        <Form.Item name="positions" label="Number of positions" rules={zodRules(formSchema, "positions")}>
          <InputNumber min={1} max={500} precision={0} className="w-full" placeholder="How many positions to add" />
        </Form.Item>
      </Form>
    </HiringDetailSheet>
  );
}
