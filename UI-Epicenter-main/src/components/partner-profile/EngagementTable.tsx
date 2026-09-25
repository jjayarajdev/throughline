import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface EngagementTableProps {
  engagements: any[];
}

export function EngagementTable({ engagements }: EngagementTableProps) {
  return (
    <Card>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse table-auto">
          <thead>
            <tr className="bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
              <th className="px-4 py-2 text-left">Type</th>
              <th className="px-4 py-2 text-left">Business Unit Name</th>
              <th className="px-4 py-2 text-left">Engagement status</th>
              <th className="px-4 py-2 text-left">Evaluated By</th>
              <th className="px-4 py-2 text-left">Evalutaion Status</th>
            </tr>
          </thead>
          <tbody>
            {engagements?.map((engagement: any) => (
              <tr key={engagement.id} className="border-b">
                <td className="px-4 py-2">{engagement.engagementTypeName}</td>
                <td className="px-4 py-2">{engagement.businessUnitName}</td>
                <td className="px-4 py-2">{engagement.engagementStatusName}</td>
                <td className="px-4 py-2">{engagement.evaluatedBy}</td>
                <td className="px-4 py-2">{engagement.evaluationStatusName}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}