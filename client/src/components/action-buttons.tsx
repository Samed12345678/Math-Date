import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { X, Info, Heart } from "lucide-react";

type ActionButtonsProps = {
  onLike: () => void;
  onDislike: () => void;
  onInfo: () => void;
  disableLike?: boolean;
};

export default function ActionButtons({ onLike, onDislike, onInfo, disableLike }: ActionButtonsProps) {
  return (
    <div className="flex items-center justify-center gap-4 mt-6">
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              size="lg"
              variant="outline"
              className="h-14 w-14 rounded-full"
              onClick={onDislike}
            >
              <X className="h-6 w-6 text-destructive" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Pass</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              size="lg"
              variant="outline"
              className="h-14 w-14 rounded-full"
              onClick={onInfo}
            >
              <Info className="h-6 w-6 text-secondary" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>View Profile</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              size="lg"
              className="h-14 w-14 rounded-full bg-primary hover:bg-primary/90"
              onClick={onLike}
              disabled={disableLike}
            >
              <Heart className="h-6 w-6" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            {disableLike ? "No credits left" : "Like"}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
}
