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
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-muted-foreground">
        Loading AgriSmart...
      </div>
    );
  }

  return (
    <TooltipProvider>
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset className="overflow-hidden flex flex-col">
          <DashboardHeader />
          <main className="flex-1 min-h-0 flex flex-col p-4 pb-24 md:p-6 md:pb-6 overflow-y-auto">
            {children}
          </main>
        </SidebarInset>
        <BottomTabs />
      </SidebarProvider>
    </TooltipProvider>
  );
}
