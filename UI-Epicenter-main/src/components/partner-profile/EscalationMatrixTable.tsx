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
import { StatusBadge } from "../status-badge";

interface EscalationMatrixTableProps {
  escalations: any[];
}

export function EscalationMatrixTable({ escalations }: EscalationMatrixTableProps) {
  return (
    <Card>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse table-auto">
          <thead>
            <tr className="bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
              <th className="px-4 py-2 text-left">Contact Type</th>
              <th className="px-4 py-2 text-left">Name</th>
              <th className="px-4 py-2 text-left">Email ID</th>
              <th className="px-4 py-2 text-left">Contact Number</th>
              <th className="px-4 py-2 text-left">Country</th>
              <th className="px-4 py-2 text-left">Designation</th>
              <th className="px-4 py-2 text-left">Status</th>
            </tr>
          </thead>
          <tbody>
            {escalations?.map((escalation: any) => (
              <tr key={escalation.id} className="border-b">
                <td className="px-4 py-2">{escalation.escalationMatrixTypeName}</td>
                <td className="px-4 py-2">{escalation.name}</td>
                <td className="px-4 py-2">{escalation.email}</td>
                <td className="px-4 py-2">{escalation.contactNumber}</td>
                <td className="px-4 py-2">{escalation.countryName}</td>
                <td className="px-4 py-2">{escalation.designation}</td>
                <td className="px-4 py-2">
                  <StatusBadge status={escalation.statusName as any} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}