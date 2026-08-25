"use client";

import { useQuery } from "@tanstack/react-query";
import { ScanLine, Layers, Warehouse, Bug, TrendingUp, ArrowRight } from "lucide-react";
import Link from "next/link";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { orpc } from "@/utils/orpc";

export default function DashboardPage() {
  const scansQuery = useQuery({
    ...orpc.scans.list.queryOptions(),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
  const fieldsQuery = useQuery({
    ...orpc.fields.list.queryOptions(),
    staleTime: 1000 * 60 * 5,
  });
  const farmsQuery = useQuery({
    ...orpc.farms.list.queryOptions(),
    staleTime: 1000 * 60 * 5,
  });
  const diseasesQuery = useQuery({
    ...orpc.diseases.list.queryOptions(),
    staleTime: 1000 * 60 * 60, // 1 hour
  });

  const scans = scansQuery.data ?? [];
  const fields = fieldsQuery.data ?? [];
  const farms = farmsQuery.data ?? [];
  const diseases = diseasesQuery.data ?? [];

  const isLoading = scansQuery.isLoading || fieldsQuery.isLoading || farmsQuery.isLoading;

  // Calculate disease distribution
  const diseaseStats = scans.reduce((acc, scan) => {
    const disease = scan.disease || "Unknown";
    acc[disease] = (acc[disease] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Calculate average severity
  const avgSeverity = scans.length > 0
    ? Math.round(scans.reduce((sum, s) => sum + (s.severity || 0), 0) / scans.length)
    : 0;

  const recentScans = scans.slice(0, 5);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome to AgriSmart — multi-crop horticultural AI diagnostics and farm management
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Scans</CardTitle>
            <ScanLine className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <div className="text-2xl font-bold">{scans.length}</div>
            )}
            <p className="text-xs text-muted-foreground">Disease analyses performed</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Fields</CardTitle>
            <Layers className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <div className="text-2xl font-bold">{fields.length}</div>
            )}
            <p className="text-xs text-muted-foreground">Active cultivation areas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Farms</CardTitle>
            <Warehouse className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <div className="text-2xl font-bold">{farms.length}</div>
            )}
            <p className="text-xs text-muted-foreground">Registered properties</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Avg. Severity</CardTitle>
            <TrendingUp className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <div className="text-2xl font-bold">{avgSeverity}%</div>
            )}
            <Progress value={avgSeverity} className="mt-2" />
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Disease Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Disease Distribution</CardTitle>
            <CardDescription>Breakdown of detected diseases</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-8 w-full" />
                ))}
              </div>
            ) : Object.keys(diseaseStats).length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Bug className="size-12 mx-auto mb-2 opacity-50" />
                <p>No scans yet</p>
                <Link href="/dashboard/scans" className="mt-2 text-primary underline-offset-4 hover:underline">
                  Start scanning
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {Object.entries(diseaseStats).map(([disease, count]) => {
                  const percentage = Math.round((count / scans.length) * 100);
                  return (
                    <div key={disease} className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span>{disease}</span>
                        <span className="text-muted-foreground">{count} ({percentage}%)</span>
                      </div>
                      <Progress value={percentage} />
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Scans */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Recent Scans</CardTitle>
              <CardDescription>Latest disease analyses</CardDescription>
            </div>
            <Link
              href="/dashboard/scans"
              className="inline-flex items-center justify-center h-7 gap-1 rounded-none px-2.5 text-xs font-medium hover:bg-muted hover:text-foreground transition-all"
            >
              View all
              <ArrowRight className="ml-1 size-4" />
            </Link>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : recentScans.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <ScanLine className="size-12 mx-auto mb-2 opacity-50" />
                <p>No scans yet</p>
                <Link href="/dashboard/scans" className="mt-2 text-primary underline-offset-4 hover:underline">
                  Scan your first leaf
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {recentScans.map((scan) => (
                  <div
                    key={scan.id}
                    className="flex items-center gap-3 p-2 rounded-lg bg-muted/50"
                  >
                    <div className="size-10 rounded-lg bg-muted flex items-center justify-center">
                      <Bug className="size-5 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{scan.disease}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(scan.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium">{scan.severity}%</div>
                      <div className="text-xs text-muted-foreground">severity</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="rounded-[5px]">
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Link
              href="/dashboard/scans"
              className="group border-border bg-background hover:bg-green-50 hover:border-green-200 dark:hover:bg-green-950 dark:hover:border-green-900 rounded-[5px] border h-auto py-6 flex flex-col items-center justify-center gap-3 transition-all shadow-sm hover:shadow-md"
            >
              <div className="size-12 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center group-hover:scale-110 transition-transform">
                <ScanLine className="size-6 text-green-600 dark:text-green-400" />
              </div>
              <span className="font-medium">New Scan</span>
            </Link>
            <Link
              href="/dashboard/fields"
              className="group border-border bg-background hover:bg-blue-50 hover:border-blue-200 dark:hover:bg-blue-950 dark:hover:border-blue-900 rounded-[5px] border h-auto py-6 flex flex-col items-center justify-center gap-3 transition-all shadow-sm hover:shadow-md"
            >
              <div className="size-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Layers className="size-6 text-blue-600 dark:text-blue-400" />
              </div>
              <span className="font-medium">Add Field</span>
            </Link>
            <Link
              href="/dashboard/farms"
              className="group border-border bg-background hover:bg-amber-50 hover:border-amber-200 dark:hover:bg-amber-950 dark:hover:border-amber-900 rounded-[5px] border h-auto py-6 flex flex-col items-center justify-center gap-3 transition-all shadow-sm hover:shadow-md"
            >
              <div className="size-12 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Warehouse className="size-6 text-amber-600 dark:text-amber-400" />
              </div>
              <span className="font-medium">Add Farm</span>
            </Link>
            <Link
              href="/dashboard/chat"
              className="group border-border bg-background hover:bg-purple-50 hover:border-blue-200 dark:hover:bg-purple-950 dark:hover:border-purple-900 rounded-[5px] border h-auto py-6 flex flex-col items-center justify-center gap-3 transition-all shadow-sm hover:shadow-md"
            >
              <div className="size-12 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Bug className="size-6 text-purple-600 dark:text-purple-400" />
              </div>
              <span className="font-medium">Ask AI</span>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
