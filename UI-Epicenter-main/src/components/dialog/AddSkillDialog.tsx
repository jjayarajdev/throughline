"use client";
import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { InputField } from "@/components/form-fields/InputField";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { addSkillPayload, hiringApi } from "@/services/api/hiring.api";
import { toast } from "sonner";
import axios from "axios";

const skillSchema = z.object({
  skillName: z.string().min(1, "Skill name is required"),
});

type SkillFormValues = z.infer<typeof skillSchema>;

interface AddSkillDialogProps {
  isOpen: boolean;
  onClose: () => void;
  isPrimary: boolean;
  masterType?:number;
}

export function AddSkillDialog({
  isOpen,
  onClose,
  isPrimary,masterType
}: AddSkillDialogProps) {
  const queryClient = useQueryClient();

  const form = useForm<SkillFormValues>({
    resolver: zodResolver(skillSchema),
    defaultValues: {
      skillName: "",
    },
  });

   const addSkills = useMutation({
      mutationKey: ["addSkills"],
      mutationFn: (data: addSkillPayload) => 
        hiringApi.addSkills(masterType || 0, data),
      onSuccess: (data) => {
        toast.success(data?.message || "Skill added successfully");
        queryClient.invalidateQueries({ queryKey: [ isPrimary ? "PrimarySkills" : "SecondarySkills"] });
        queryClient.invalidateQueries({ queryKey: ["skills"] });
        form.reset();
        onClose();
      },
      onError: (error) => {
         if (axios.isAxiosError(error)) {
          if (error.response?.status === 400) {
            const serverMessage = error.response.data?.message || "Bad Request";
            toast.error(serverMessage);
          } else {
            toast.error("baD request");
          }}
      },
    });
  const handleSubmit = (values: SkillFormValues) => {
    const payload = {
      isActive: true,
      name: values.skillName,
      isPrimary: isPrimary,
    };
    addSkills.mutate(payload);
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) {
          form.reset();
          onClose();
        }
      }}
    >
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add New Skill</DialogTitle>
              <DialogDescription>
             Please add only new skills that aren’t already listed.
              </DialogDescription>
        </DialogHeader>

        <div className="mt-4">
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(handleSubmit)}
              className="space-y-6"
            >
              <InputField
                control={form.control}
                name="skillName"
                label="Skill Name"
                placeholder="Enter skill name (e.g., React, Java, Project Management)"
                required
              />
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={onClose}
                  disabled={addSkills.isPending}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="bg-[#00b388] hover:bg-[#009e79]"
                  disabled={addSkills.isPending}
                >
                  {addSkills.isPending ? "Adding..." : "Add Skill"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
