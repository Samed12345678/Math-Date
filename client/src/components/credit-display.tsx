import { ZapIcon } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

type CreditDisplayProps = {
  credits: number;
  className?: string;
};

export default function CreditDisplay({ credits, className }: CreditDisplayProps) {
  const isLow = credits <= 3;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div 
          className={cn(
            "flex items-center justify-center px-3 py-1 rounded-full font-heading font-medium text-sm",
            isLow 
              ? "bg-warning/20 text-warning" 
              : "bg-warning/10 text-foreground",
            className
          )}
        >
          <ZapIcon className="h-4 w-4 mr-1 text-warning" />
          <span>{credits}</span>
        </div>
      </TooltipTrigger>
      <TooltipContent>
        <p>{credits} credits left today</p>
        <p className="text-xs text-muted-foreground">
          {credits === 0 
            ? "Credits refresh tomorrow" 
            : "Use them to like profiles"}
        </p>
      </TooltipContent>
    </Tooltip>
  );
}
