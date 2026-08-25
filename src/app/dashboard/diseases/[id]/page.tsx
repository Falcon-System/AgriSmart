"use client";

import { useQuery } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import {
    ArrowLeft,
    Bug,
    AlertTriangle,
    Shield,
    Pill,
    TrendingDown,
    CheckCircle2,
    Info
} from "lucide-react";
import Image from "next/image";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { orpc } from "@/utils/orpc";
import { cn } from "@/lib/utils";

export default function DiseaseDetailPage() {
    const params = useParams();
    const router = useRouter();
    const id = params.id as string;

    const diseasesQuery = useQuery(orpc.diseases.list.queryOptions());
    const disease = diseasesQuery.data?.find((d: any) => d.id === id);

    if (diseasesQuery.isLoading) {
        return (
            <div className="space-y-8 pb-10">
                <Skeleton className="h-10 w-32" />
                <div className="grid gap-8 lg:grid-cols-3">
                    <Skeleton className="lg:col-span-2 h-[600px] rounded-2xl" />
                    <Skeleton className="h-[400px] rounded-2xl" />
                </div>
            </div>
        );
    }

    if (!disease) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
                <h2 className="text-2xl font-bold">Disease Not Found</h2>
                <Button onClick={() => router.back()}>Go Back</Button>
            </div>
        );
    }

    const getSeverityLevel = (yieldLoss: string) => {
        const loss = parseInt(yieldLoss);
        if (loss === 0) return { label: "None", color: "text-emerald-500", bg: "bg-emerald-500/10" };
        if (loss <= 30) return { label: "Low", color: "text-yellow-500", bg: "bg-yellow-500/10" };
        if (loss <= 60) return { label: "Moderate", color: "text-orange-500", bg: "bg-orange-500/10" };
        return { label: "Critical", color: "text-red-500", bg: "bg-red-500/10" };
    };

    const severity = getSeverityLevel(disease.yieldLoss);

    return (
        <div className="space-y-8 pb-10">
            <Button
                variant="ghost"
                className="gap-2 -ml-2 text-muted-foreground hover:text-primary"
                onClick={() => router.back()}
            >
                <ArrowLeft className="size-4" />
                Back to Catalog
            </Button>

            <div className="grid gap-8 lg:grid-cols-3">
                {/* Main Content */}
                <div className="lg:col-span-2 space-y-8">
                    <div className="relative h-[400px] w-full overflow-hidden rounded-3xl border shadow-xl">
                        <Image
                            src={disease.imageUrl || "/placeholder.svg"}
                            alt={disease.name}
                            fill
                            className="object-cover"
                            priority
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                        <div className="absolute bottom-8 left-8 right-8 text-white">
                            <div className="flex items-center gap-3 mb-4">
                                <Badge className={cn("px-3 py-1 text-sm font-bold border-none", severity.bg, severity.color)}>
                                    {severity.label} Impact
                                </Badge>
                                <span className="text-white/60 text-sm font-medium">ID: {disease.slug}</span>
                            </div>
                            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight underline decoration-primary/50 underline-offset-8">
                                {disease.name}
                            </h1>
                        </div>
                    </div>

                    <Card className="border-none bg-card/30 backdrop-blur-md shadow-none">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-2xl">
                                <Info className="size-6 text-primary" />
                                Overview
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="text-lg leading-relaxed text-muted-foreground">
                            {disease.description}
                        </CardContent>
                    </Card>

                    <div className="grid gap-6 md:grid-cols-2">
                        <Card className="border-border/40 shadow-sm overflow-hidden">
                            <CardHeader className="bg-amber-500/5 border-b border-amber-500/10">
                                <CardTitle className="flex items-center gap-2 text-amber-600">
                                    <AlertTriangle className="size-5" />
                                    Detailed Symptoms
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="pt-6">
                                <ul className="space-y-4">
                                    {disease.symptoms.map((symptom: string, i: number) => (
                                        <li key={i} className="flex items-start gap-3 text-muted-foreground">
                                            <div className="size-2 rounded-full bg-amber-500 mt-2 shrink-0" />
                                            <span>{symptom}</span>
                                        </li>
                                    ))}
                                </ul>
                            </CardContent>
                        </Card>

                        <Card className="border-border/40 shadow-sm overflow-hidden">
                            <CardHeader className="bg-blue-500/5 border-b border-blue-500/10">
                                <CardTitle className="flex items-center gap-2 text-blue-600">
                                    <Pill className="size-5" />
                                    Management & Treatment
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="pt-6">
                                <ul className="space-y-4">
                                    {disease.treatment.map((item: string, i: number) => (
                                        <li key={i} className="flex items-start gap-3 text-muted-foreground">
                                            <CheckCircle2 className="size-5 text-blue-500 shrink-0 mt-0.5" />
                                            <span>{item}</span>
                                        </li>
                                    ))}
                                </ul>
                            </CardContent>
                        </Card>
                    </div>
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                    <Card className="border-primary/20 bg-primary/5 sticky top-24 overflow-hidden">
                        <div className="h-2 bg-primary w-full" />
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-xl">
                                <Shield className="size-5 text-primary" />
                                Prevention Strategy
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="space-y-4">
                                {disease.prevention.map((item: string, i: number) => (
                                    <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-background/50 border border-border/50">
                                        <CheckCircle2 className="size-5 text-emerald-500 shrink-0" />
                                        <p className="text-sm font-medium leading-tight">{item}</p>
                                    </div>
                                ))}
                            </div>

                            <Separator />

                            <div className="bg-background/80 rounded-2xl p-6 border shadow-inner">
                                <div className="flex items-center justify-between mb-4">
                                    <span className="text-sm font-medium text-muted-foreground">Yield Impact</span>
                                    <div className="flex items-center gap-1 text-red-500 font-bold">
                                        <TrendingDown className="size-4" />
                                        {disease.yieldLoss}
                                    </div>
                                </div>
                                <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-red-500 transition-all duration-1000"
                                        style={{ width: disease.yieldLoss }}
                                    />
                                </div>
                                <p className="text-[10px] text-muted-foreground mt-2 text-center">
                                    Estimated decrease in total harvest weight
                                </p>
                            </div>

                            <Button className="w-full shadow-lg shadow-primary/20" size="lg">
                                Report Incidence
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
