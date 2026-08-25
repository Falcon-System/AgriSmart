"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  ScanLine,
  Layers,
  Warehouse,
  Bug,
  Users,
  MessageCircle,
  Settings,
  Smartphone,
  LogOut,
} from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";

const mainNavItems = [
  {
    title: "Dashboard",
    url: "/dashboard",
    icon: Home,
  },
  {
    title: "Scans",
    url: "/dashboard/scans",
    icon: ScanLine,
  },
  {
    title: "Community",
    url: "/dashboard/fields",
    icon: Users,
  },
  {
    title: "Farms",
    url: "/dashboard/farms",
    icon: Warehouse,
  },
  {
    title: "Diseases",
    url: "/dashboard/diseases",
    icon: Bug,
  },
];

const toolsNavItems = [
  {
    title: "Ask AI",
    url: "/dashboard/chat",
    icon: MessageCircle,
  },
  {
    title: "Settings",
    url: "/dashboard/settings",
    icon: Settings,
  },
];

export function AppSidebar() {
  const pathname = usePathname();

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <Link href="/dashboard" className="flex items-center gap-2 px-2 py-1">
          <div className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="size-5"
            >
              <path d="M12 2L2 7l10 5 10-5-10-5z" />
              <path d="M2 17l10 5 10-5" />
              <path d="M2 12l10 5 10-5" />
            </svg>
          </div>
          <span className="font-semibold text-lg group-data-[collapsible=icon]:hidden">
            AgriSmart
          </span>
        </Link>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Main</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainNavItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    render={<Link href={item.url as any} />}
                    isActive={pathname === item.url}
                    tooltip={item.title}
                  >
                    <item.icon className="size-4" />
                    <span>{item.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator />

        <SidebarGroup>
          <SidebarGroupLabel>Tools</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {toolsNavItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    render={<Link href={item.url as any} />}
                    isActive={pathname === item.url}
                    tooltip={item.title}
                  >
                    <item.icon className="size-4" />
                    <span>{item.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              render={<Link href="/dashboard/scans" />}
              tooltip="New Scan"
            >
              <Smartphone className="size-4" />
              <span>New Scan</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton
              render={<Link href="/login" />}
              tooltip="Logout"
            >
              <LogOut className="size-4" />
              <span>Logout</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
