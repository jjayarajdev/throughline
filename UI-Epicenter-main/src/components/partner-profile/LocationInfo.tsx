import { Card } from "@/components/ui/card";
import { MapPin } from "lucide-react";

interface LocationInfoProps {
  partner: any;
}

export function LocationInfo({ partner }: LocationInfoProps) {
  return (
    <Card className="p-4 mb-6">
      <div className="space-y-4">
        <div className="flex gap-3">
          <div className="mt-1">
            <MapPin className="h-6 w-6 text-gray-600" />
          </div>
          <div>
            <div className="font-medium">
              {partner?.countryName}, {partner?.stateName}, {partner?.cityName}
            </div>
            <div className="text-sm text-gray-500">{partner?.address}</div>
          </div>
        </div>
      </div>
    </Card>
  );
}