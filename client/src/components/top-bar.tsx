import { Link } from "wouter";
import { Flame, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import CreditDisplay from "@/components/credit-display";

type TopBarProps = {
  credits: number;
};

export default function TopBar({ credits }: TopBarProps) {
  return (
    <div className="flex justify-between items-center p-4 border-b border-border bg-background">
      <CreditDisplay credits={credits} />
      
      <Link href="/">
        <div className="flex items-center cursor-pointer">
          <Flame className="h-6 w-6 text-primary" />
          <span className="font-heading font-bold text-lg ml-1">DateTheory</span>
        </div>
      </Link>
      
      <Link href="/profile">
        <Button variant="ghost" size="icon" className="rounded-full">
          <User className="h-5 w-5 text-muted-foreground" />
        </Button>
      </Link>
    </div>
  );
}
