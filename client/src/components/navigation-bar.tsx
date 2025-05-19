import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { Home, Star, MessageCircle, User } from "lucide-react";

type NavigationItem = {
  name: string;
  href: string;
  icon: React.ElementType;
};

type NavigationBarProps = {
  active: "home" | "matches" | "messages" | "profile";
};

export default function NavigationBar({ active }: NavigationBarProps) {
  const [location] = useLocation();

  const navigationItems: NavigationItem[] = [
    {
      name: "Home",
      href: "/",
      icon: Home,
    },
    {
      name: "Matches",
      href: "/matches",
      icon: Star,
    },
    {
      name: "Messages",
      href: "/messages",
      icon: MessageCircle,
    },
    {
      name: "Profile",
      href: "/profile",
      icon: User,
    },
  ];

  return (
    <nav className="flex justify-around items-center p-4 border-t border-border bg-background">
      {navigationItems.map((item) => {
        const isActive = active === item.name.toLowerCase() || location === item.href;
        return (
          <Link key={item.name} href={item.href}>
            <div className={cn(
              "flex flex-col items-center cursor-pointer",
              isActive ? "text-primary" : "text-muted-foreground"
            )}>
              <item.icon className="h-6 w-6" />
              <span className="text-xs mt-1">{item.name}</span>
              {isActive && (
                <div className="h-1 w-1 rounded-full bg-primary mt-1" />
              )}
            </div>
          </Link>
        );
      })}
    </nav>
  );
}
