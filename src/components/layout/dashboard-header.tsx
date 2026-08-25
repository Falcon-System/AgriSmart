"use client";

import { usePathname } from "next/navigation";

import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { ModeToggle } from "@/components/mode-toggle";
import UserMenu from "@/components/user-menu";

const pageTitles: Array<{ match: (path: string) => boolean; title: string }> = [
  { match: (path) => path.startsWith("/dashboard/chat"), title: "Ask AI" },
  { match: (path) => path.startsWith("/dashboard/scans"), title: "Scans" },
  { match: (path) => path.startsWith("/dashboard/fields"), title: "Community" },
  { match: (path) => path.startsWith("/dashboard/farms"), title: "Farms" },
  { match: (path) => path.startsWith("/dashboard/diseases"), title: "Diseases" },
  { match: (path) => path.startsWith("/dashboard/settings"), title: "Settings" },
  { match: (path) => path === "/dashboard", title: "Dashboard" },
];

export function DashboardHeader() {
  const pathname = usePathname();
  const title = pageTitles.find((item) => item.match(pathname))?.title;

  return (
    <header className="flex h-14 shrink-0 items-center gap-2 border-b px-4">
      <SidebarTrigger className="-ml-1" />
      <Separator orientation="vertical" className="mr-2 h-4" />
      {title && <h1 className="text-lg font-semibold">{title}</h1>}
      <div className="ml-auto flex items-center gap-2">
        <ModeToggle />
        <UserMenu />
      </div>
    </header>
  );
}
