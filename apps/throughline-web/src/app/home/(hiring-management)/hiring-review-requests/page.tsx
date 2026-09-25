import { Flex } from "antd";
import BinPage from "@/components/hiring-forms/BinPage";

export default function HiringReviewRequestsPage() {
  return (
    <Flex vertical gap={16} className="p-4">
      <BinPage />
    </Flex>
  );
}
