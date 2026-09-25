import { Badge } from "@/components/ui/badge";

interface PartnerHeaderProps {
  partner: any;
}

export function PartnerHeader({ partner }: PartnerHeaderProps) {
  return (
    <div className="flex items-center gap-4 mb-8">
      <div className="w-20 h-20 bg-[#00b388] rounded-lg flex items-center justify-center">
        <span className="text-white text-2xl font-bold">
          {partner?.partnerDetails?.nickname?.slice(0, 2) || "N/A"}
        </span>
      </div>
      <div>
        <h1 className="text-2xl font-bold mb-1">{partner?.partnerDetails?.partnerName}</h1>
        <div className="flex items-center gap-6">
          <div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Total Profile Submitted
            </div>
            <div className="text-xl font-semibold">{partner?.totalProfileSubmitted}</div>
          </div>
          <div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Total Closures
            </div>
            <div className="text-xl font-semibold">{partner?.totalClosures}</div>
          </div>
          <div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Conversion Rate
            </div>
            <div className="text-xl font-semibold">{partner?.conversionRate}</div>
          </div>
          <div>
            <div className="text-sm text-gray-500 dark:text-gray-400">Score</div>
            <div className="text-xl font-semibold">{Math.floor(partner?.score)}</div>
          </div>
          <div>
            <div className="text-sm text-gray-500 dark:text-gray-400">Rank</div>
            <div className="text-xl font-semibold">{Math.floor(partner?.rank)}</div>
          </div>
        </div>
      </div>
    </div>
  );
}