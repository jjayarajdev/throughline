import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

interface PartnerInfoProps {
  partner: any;
}

export function PartnerInfo({ partner }: PartnerInfoProps) {
  return (
    <Card className="p-6 mb-6">
      <div className="grid grid-cols-2 gap-6">
        <div>
          <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">
            Partner ID:
          </div>
          <div className="font-medium">{partner?.partnerCode}</div>
        </div>
        <div>
          <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">
            Partner Name:
          </div>
          <div className="font-medium">{partner?.partnerName}</div>
        </div>
        <div>
          <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">
            Start Date
          </div>
          <div className="font-medium">{partner?.startDate?.split("T")[0]}</div>
        </div>
        <div>
          <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">
            Status
          </div>
          <Badge
            variant="default"
            className="bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400"
          >
            {partner?.partnerStatusName}
          </Badge>
        </div>
        <div>
          <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">
            Partner Tenure in the System (In Days)
          </div>
          <div className="font-medium">{partner?.partnerTenureInDays || "N/A"}</div>
        </div>
        <div>
          <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">City</div>
          <div className="font-medium">{partner?.cityName}</div>
        </div>
      </div>
    </Card>
  );
}