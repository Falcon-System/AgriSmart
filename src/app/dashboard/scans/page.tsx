"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Search, Trash2, Eye, Camera } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { ScanDialog } from "@/components/scan/scan-dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { orpc, client } from "@/utils/orpc";

export default function ScansPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");

  const scansQuery = useQuery(orpc.scans.list.queryOptions());

  const deleteMutation = useMutation({
    mutationFn: (id: string) => (client.scans.delete as any)({ id }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["scans"] });
      toast.success("Scan deleted");
    },
    onError: () => {
      toast.error("Failed to delete scan");
    },
  });

  const scans = scansQuery.data ?? [];

  const filteredScans = scans.filter(
    (scan) =>
      scan.disease?.toLowerCase().includes(search.toLowerCase()) ||
      scan.treatment?.toLowerCase().includes(search.toLowerCase())
  );

  const getSeverityColor = (severity: number) => {
    if (severity < 30) return "bg-green-500";
    if (severity < 60) return "bg-yellow-500";
    return "bg-red-500";
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Scans</h1>
          <p className="text-muted-foreground">Disease scan history and analysis</p>
        </div>
        <ScanDialog
          trigger={
            <Button>
              <Plus className="mr-2 size-4" />
              New Scan
            </Button>
          }
        />
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                placeholder="Search scans..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {scansQuery.isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : filteredScans.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Camera className="size-12 mx-auto mb-2 opacity-50" />
              <p>No scans found</p>
              <ScanDialog
                trigger={
                  <Button variant="link" className="mt-2">
                    Create your first Scan
                  </Button>
                }
              />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Disease</TableHead>
                  <TableHead>Severity</TableHead>
                  <TableHead>Confidence</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredScans.map((scan) => (
                  <TableRow key={scan.id}>
                    <TableCell>
                      {new Date(scan.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <span className="font-medium">{scan.disease}</span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className={`size-2 rounded-full ${getSeverityColor(scan.severity)}`} />
                        <span>{scan.severity}%</span>
                      </div>
                    </TableCell>
                    <TableCell>{scan.confidence}%</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => router.push(`/dashboard/scans/${scan.id}`)}
                        >
                          <Eye className="size-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                            >
                              <Trash2 className="size-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This action cannot be undone. This will permanently delete the scan
                                record and the associated image.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => deleteMutation.mutate(scan.id)}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                disabled={deleteMutation.isPending}
                              >
                                {deleteMutation.isPending ? "Deleting..." : "Delete"}
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
