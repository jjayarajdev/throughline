import { Flex } from "antd";
import CartPage from "@/components/hiring-forms/CartTable";

export default function HiringRequestsPage() {
  return (
    <Flex vertical gap={16} className="p-4">
      <CartPage />
    </Flex>
  );
}
