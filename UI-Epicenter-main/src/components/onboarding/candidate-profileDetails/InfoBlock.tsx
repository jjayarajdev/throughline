import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

export default function InfoBlock({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="group p-3 rounded-xl border bg-green-50 hover:shadow-md transition duration-200">
      <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">{label}</p>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <p className="text-base font-medium text-foreground truncate max-w-[250px] cursor-default">
              {value || <span className="text-muted-foreground italic">N/A</span>}
            </p>
          </TooltipTrigger>
          <TooltipContent>
            <span>{value}</span>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
}
