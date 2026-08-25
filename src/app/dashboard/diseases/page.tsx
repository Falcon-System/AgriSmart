"use client";

import { useQuery } from "@tanstack/react-query";
import { Bug, AlertTriangle, Shield, Pill, Info, ChevronRight } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { orpc } from "@/utils/orpc";
import { cn } from "@/lib/utils";

export default function DiseasesPage() {
  const router = useRouter();
  const diseasesQuery = useQuery(orpc.diseases.list.queryOptions());
  const diseases = diseasesQuery.data ?? [];

  const getSeverityColor = (yieldLoss: string) => {
    const loss = parseInt(yieldLoss);
    if (loss === 0) return "bg-emerald-500/10 text-emerald-500 border-emerald-500/20";
    if (loss <= 30) return "bg-yellow-500/10 text-yellow-500 border-yellow-500/20";
    if (loss <= 60) return "bg-orange-500/10 text-orange-500 border-orange-500/20";
    return "bg-red-500/10 text-red-500 border-red-500/20";
  };

  return (
    <div className="space-y-8 pb-10">
      <div className="flex flex-col gap-2">
        <h1 className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
          Disease Catalog
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl">
          Comprehensive reference guide for identifying cassava diseases, understanding their impact, and implementing effective treatments.
        </p>
      </div>

      {diseasesQuery.isLoading ? (
        <div className="grid gap-8 md:grid-cols-2">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-[500px] w-full rounded-2xl" />
          ))}
        </div>
      ) : (
        <div className="grid gap-8 md:grid-cols-1 lg:grid-cols-2">
          {diseases.map((disease: any) => (
            <Card
              key={disease.id}
              className="group overflow-hidden border-border/40 bg-card/50 backdrop-blur-sm transition-all duration-300 hover:shadow-2xl hover:shadow-primary/5 hover:-translate-y-1 rounded-2xl"
            >
              <div className="relative h-64 w-full overflow-hidden">
                <Image
                  src={disease.imageUrl || "/placeholder.svg"}
                  alt={disease.name}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/20 to-transparent" />
                <div className="absolute bottom-4 left-6 right-6">
                  <div className="flex items-center justify-between">
                    <Badge
                      variant="outline"
                      className={cn("font-semibold backdrop-blur-md", getSeverityColor(disease.yieldLoss))}
                    >
                      {disease.yieldLoss} Potential Yield Loss
                    </Badge>
                    <div className="flex items-center gap-1 text-white/80 text-xs font-medium bg-black/40 backdrop-blur-md px-2 py-1 rounded-full">
                      <Info className="size-3" />
                      {disease.slug}
                    </div>
                  </div>
                </div>
              </div>

              <CardHeader className="px-6 pt-6 pb-2">
                <div className="flex items-center gap-4">
                  <div className={cn(
                    "size-12 rounded-xl flex items-center justify-center transition-colors duration-300",
                    disease.id === "healthy"
                      ? "bg-emerald-500/10 text-emerald-500 group-hover:bg-emerald-500 group-hover:text-white"
                      : "bg-red-500/10 text-red-500 group-hover:bg-red-500 group-hover:text-white"
                  )}>
                    {disease.id === "healthy" ? <Shield className="size-6" /> : <Bug className="size-6" />}
                  </div>
                  <div>
                    <CardTitle className="text-2xl font-bold tracking-tight">{disease.name}</CardTitle>
                    <CardDescription className="text-base mt-1 line-clamp-2">
                      {disease.description}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="px-6 pb-6 space-y-6">
                <div className="grid gap-6 py-4">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground/80">
                      <AlertTriangle className="size-4 text-amber-500" />
                      Key Symptoms
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {disease.symptoms.map((symptom: string, i: number) => (
                        <span key={i} className="text-sm bg-secondary/50 px-3 py-1 rounded-full border border-border/50">
                          {symptom}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground/80">
                        <Pill className="size-4 text-blue-500" />
                        Treatment
                      </div>
                      <ul className="space-y-2">
                        {disease.treatment.slice(0, 3).map((item: string, i: number) => (
                          <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                            <ChevronRight className="size-3 mt-1 text-primary shrink-0" />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground/80">
                        <Shield className="size-4 text-emerald-500" />
                        Prevention
                      </div>
                      <ul className="space-y-2">
                        {disease.prevention.slice(0, 3).map((item: string, i: number) => (
                          <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                            <ChevronRight className="size-3 mt-1 text-primary shrink-0" />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>

                <Separator className="opacity-50" />

                <button
                  onClick={() => router.push(`/dashboard/diseases/${disease.id}`)}
                  className="w-full py-3 text-sm font-semibold text-primary transition-all hover:bg-primary/5 rounded-xl flex items-center justify-center gap-2"
                >
                  View Full Details
                  <ChevronRight className="size-4" />
                </button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

