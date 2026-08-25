"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Camera, MessageCircle, Users, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

const tabs = [
  {
    name: "Scan",
    href: "/dashboard/scans",
    icon: Camera,
  },
  {
    name: "Chat",
    href: "/dashboard/chat",
    icon: MessageCircle,
  },
  {
    name: "Community",
    href: "/dashboard/fields",
    icon: Users,
  },
  {
    name: "Settings",
    href: "/dashboard/settings",
    icon: Settings,
  },
];

export function BottomTabs() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background pb-safe md:hidden">
      <div className="flex h-16 items-center justify-around">
        {tabs.map((tab) => {
          const isActive = pathname === tab.href;
          return (
            <Link
              key={tab.name}
              href={tab.href as any}
              className={cn(
                "flex flex-1 flex-col items-center justify-center gap-1 py-2 transition-colors",
                isActive
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <tab.icon className={cn("size-6", isActive && "stroke-[2.5]")} />
              <span className="text-xs font-medium">{tab.name}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
