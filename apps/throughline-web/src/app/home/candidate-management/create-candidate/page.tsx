"use client";
import { Flex } from "antd";
import CandidateForm from "@/components/candidate/candidate-forms/candidateForm";

export default function CreateCandidate() {
  return (
    <Flex vertical gap={16} className="p-4">
      <CandidateForm />
    </Flex>
  );
}
