"use client";

import { useState, useEffect } from "react";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { DashboardHeader } from "@/components/layout/dashboard-header";
import { BottomTabs } from "@/components/layout/bottom-tabs";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null; // or a loading skeleton
  }

  return (
    <TooltipProvider>
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset className="overflow-hidden flex flex-col">
          <DashboardHeader />
          <main className="flex-1 min-h-0 flex flex-col p-4 pb-24 md:p-6 md:pb-6 overflow-auto">
            {children}
          </main>
        </SidebarInset>
        <BottomTabs />
      </SidebarProvider>
    </TooltipProvider>
  );
}
