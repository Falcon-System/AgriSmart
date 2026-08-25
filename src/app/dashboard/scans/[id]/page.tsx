"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import {
    ArrowLeft,
    Calendar,
    CheckCircle2,
    AlertTriangle,
    Info,
    Printer,
    Share2,
    Clock,
    ShieldCheck,
    Zap,
    Leaf,
    Trash2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { orpc, client } from "@/utils/orpc";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
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
import { findDisease, reliabilityFromConfidence, isPlaceholderAdvice } from "@/lib/diseases";

export default function ScanResultPage() {
    const params = useParams();
    const id = params?.id;
    const scanId = Array.isArray(id) ? id[0] : id;
    const router = useRouter();
    const queryClient = useQueryClient();

    const deleteMutation = useMutation({
        mutationFn: (id: string) => (client.scans.delete as any)({ id }),
        onSuccess: async () => {
            await queryClient.invalidateQueries({ queryKey: ["scans"] });
            toast.success("Scan deleted");
            router.push("/dashboard/scans");
        },
        onError: () => {
            toast.error("Failed to delete scan");
        },
    });

    const {
        data: scan,
        isLoading,
        error
    } = useQuery(
        {
            queryKey: ["scans", "get", scanId],
            queryFn: async () => {
                if (typeof scanId !== "string" || scanId.length === 0) {
                    throw new Error("Invalid scan ID");
                }
                return await (client.scans.get as any)({ id: scanId });
            },
            enabled: typeof scanId === "string" && scanId.length > 0,
        }
    );

    const diseaseData = scan ? findDisease(scan.disease) : null;
    const reliability = reliabilityFromConfidence(Number(scan?.confidence) || 0);

    if (isLoading) {
        return (
            <div className="container max-w-5xl py-8 space-y-8 animate-pulse">
                <Skeleton className="h-10 w-32" />
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <Skeleton className="lg:col-span-2 aspect-video rounded-3xl" />
                    <div className="space-y-6">
                        <Skeleton className="h-40 rounded-3xl" />
                        <Skeleton className="h-60 rounded-3xl" />
                    </div>
                </div>
            </div>
        );
    }

    if (error || !scan) {
        return (
            <div className="container max-w-5xl py-20 text-center space-y-4">
                <div className="size-20 bg-destructive/10 rounded-full flex items-center justify-center mx-auto text-destructive">
                    <AlertTriangle className="size-10" />
                </div>
                <h1 className="text-2xl font-bold">Scan Not Found</h1>
                <p className="text-muted-foreground">The scan result you're looking for doesn't exist or has been deleted.</p>
                <Button onClick={() => router.push("/dashboard/scans")} variant="outline">
                    <ArrowLeft className="mr-2 size-4" />
                    Back to Scans
                </Button>
            </div>
        );
    }

    const isHealthy = scan.isHealthy === true || scan.disease.toLowerCase().includes("healthy");
    const severityColor = scan.severity > 60 ? "text-red-500" : scan.severity > 30 ? "text-yellow-500" : "text-green-500";
    const severityBg = scan.severity > 60 ? "bg-red-500/10" : scan.severity > 30 ? "bg-yellow-500/10" : "bg-green-500/10";
    const treatmentPlanSections = [
        { title: "Chemical control", items: scan.treatmentPlan?.chemical_control },
        { title: "Organic / biological", items: scan.treatmentPlan?.organic_biological },
        { title: "Cultural practices", items: scan.treatmentPlan?.cultural_practices },
    ].filter((section) => section.items?.length);
    const hasTreatmentPlan = treatmentPlanSections.length > 0;
    const engineLabel = scan.source === "gemini" ? "Gemini Vision" : scan.source === "model" ? "Local cassava model" : null;

    return (
        <div className="container max-w-6xl py-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => router.push("/dashboard/scans")}
                        className="rounded-full hover:bg-muted"
                    >
                        <ArrowLeft className="size-5" />
                    </Button>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Scan Report</h1>
                        <div className="flex items-center gap-2 text-muted-foreground text-sm mt-1">
                            <Calendar className="size-3.5" />
                            <span>{new Date(scan.createdAt).toLocaleDateString(undefined, { dateStyle: 'long' })}</span>
                            <span className="mx-1">•</span>
                            <Clock className="size-3.5" />
                            <span>{new Date(scan.createdAt).toLocaleTimeString(undefined, { timeStyle: 'short' })}</span>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" className="rounded-full">
                        <Share2 className="mr-2 size-4" />
                        Share
                    </Button>
                    <Button variant="outline" size="sm" className="rounded-full">
                        <Printer className="mr-2 size-4" />
                        Print
                    </Button>
                    <Button size="sm" className="rounded-full bg-primary hover:bg-primary/90">
                        Export JSON
                    </Button>
                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="sm" className="rounded-full text-destructive hover:bg-destructive/10 hover:text-destructive">
                                <Trash2 className="mr-2 size-4" />
                                Delete
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="rounded-[2rem] border-none">
                            <AlertDialogHeader>
                                <AlertDialogTitle>Delete this scan?</AlertDialogTitle>
                                <AlertDialogDescription>
                                    This will permanently remove this scan report and its associated analysis. This action cannot be undone.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                    onClick={() => scanId && deleteMutation.mutate(scanId)}
                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded-xl"
                                    disabled={deleteMutation.isPending}
                                >
                                    {deleteMutation.isPending ? "Deleting..." : "Delete Permanently"}
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Left Column: Image and Main Status */}
                <div className="lg:col-span-7 space-y-8">
                    <Card className="border-none bg-muted/30 overflow-hidden rounded-[2rem] shadow-2xl shadow-primary/5">
                        <CardContent className="p-0 relative aspect-[4/3]">
                            <img
                                src={scan.imageUrl}
                                alt={scan.disease}
                                className="w-full h-full object-cover transition-transform duration-700 hover:scale-105"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
                            <div className="absolute bottom-6 left-6 right-6 flex items-end justify-between text-white">
                                <div className="space-y-1">
                                    <Badge className={cn("mb-2 backdrop-blur-md border-white/20", isHealthy ? "bg-green-500/80" : "bg-red-500/80")}>
                                        {isHealthy ? <CheckCircle2 className="size-3 mr-1" /> : <AlertTriangle className="size-3 mr-1" />}
                                        {isHealthy ? "Verified Healthy" : "Infection Detected"}
                                    </Badge>
                                    <h2 className="text-3xl font-bold">{scan.disease}</h2>
                                    {(scan.detectedCrop || scan.cropCategory || engineLabel) && (
                                        <p className="text-sm text-white/80">
                                            {[scan.detectedCrop, scan.cropCategory, engineLabel].filter(Boolean).join(" · ")}
                                        </p>
                                    )}
                                </div>
                                <div className="text-right">
                                    <div className="text-sm font-medium opacity-80 mb-1">Confidence Score</div>
                                    <div className="text-4xl font-black">{scan.confidence}%</div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Quick Stats Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <Card className="rounded-3xl border-none bg-background shadow-sm overflow-hidden group hover:shadow-md transition-all">
                            <CardContent className="p-6 flex items-center gap-4">
                                <div className={cn("size-14 rounded-2xl flex items-center justify-center shrink-0", severityBg, severityColor)}>
                                    <Zap className="size-6" />
                                </div>
                                <div className="flex-1">
                                    <div className="text-sm text-muted-foreground font-medium">Severity Level</div>
                                    <div className="text-2xl font-bold">{scan.severityGrade || `${scan.severity}%`}</div>
                                    <Progress value={scan.severity} className={cn("h-1.5 mt-2", severityBg)} />
                                </div>
                            </CardContent>
                        </Card>
                        <Card className="rounded-3xl border-none bg-background shadow-sm overflow-hidden group hover:shadow-md transition-all">
                            <CardContent className="p-6 flex items-center gap-4">
                                <div className="size-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                                    <ShieldCheck className="size-6" />
                                </div>
                                <div className="flex-1">
                                    <div className="text-sm text-muted-foreground font-medium">AI Reliability</div>
                                    <div className="text-2xl font-bold">{reliability.label}</div>
                                    <div className="flex gap-1 mt-2">
                                        {[1, 2, 3, 4, 5].map(i => (
                                            <div key={i} className={cn("h-1.5 flex-1 rounded-full", i <= reliability.bars ? "bg-primary" : "bg-primary/20")} />
                                        ))}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    <Card className="rounded-[2rem] border-none bg-gradient-to-br from-primary/5 to-primary/10 shadow-sm">
                        <CardContent className="p-8">
                            <div className="flex items-center gap-2 mb-6 text-primary">
                                <Leaf className="size-5" />
                                <h3 className="text-xl font-bold">Botanical Analysis</h3>
                            </div>
                            <div className="space-y-4">
                                <p className="text-muted-foreground leading-relaxed">
                                    Our AI model has analyzed the morphological patterns on the leaf surface. The symptoms observed are highly consistent with <strong>{scan?.disease}</strong>.
                                </p>

                                {((scan.symptoms && scan.symptoms.length > 0) || diseaseData?.symptoms) && (
                                    <div className="space-y-3">
                                        <h4 className="text-sm font-bold uppercase tracking-wider text-primary/70">Observed Characteristics</h4>
                                        <div className="flex flex-wrap gap-2">
                                            {(scan.symptoms?.length ? scan.symptoms : diseaseData?.symptoms || []).map((symptom: string, idx: number) => (
                                                <Badge key={idx} variant="secondary" className="bg-primary/10 text-primary border-none py-1 px-3 rounded-full text-xs">
                                                    {symptom}
                                                </Badge>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                <p className="text-muted-foreground leading-relaxed">
                                    We recommend following the treatment protocol outlined to ensure the health of your field.
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Right Column: Treatment and Prevention */}
                <div className="lg:col-span-5 space-y-6">
                    <Card className="rounded-[2.5rem] border-none bg-white dark:bg-zinc-900 shadow-xl overflow-hidden">
                        <CardContent className="p-8 space-y-8">
                            {hasTreatmentPlan && (
                                <div className="space-y-6">
                                    <h3 className="text-xl font-bold">Treatment protocol</h3>
                                    {treatmentPlanSections.map((section) => (
                                        <div key={section.title} className="space-y-2">
                                            <h4 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">{section.title}</h4>
                                            <ul className="list-disc list-inside text-sm text-zinc-700 dark:text-zinc-300 space-y-1">
                                                {section.items.map((item: string) => (
                                                    <li key={item}>{item}</li>
                                                ))}
                                            </ul>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Treatment Section */}
                            {!hasTreatmentPlan && (
                            <div className="space-y-4">
                                <div className="flex items-center gap-3">
                                    <div className="size-10 rounded-full bg-blue-500/10 text-blue-500 flex items-center justify-center shrink-0">
                                        <Zap className="size-5" />
                                    </div>
                                    <h3 className="text-xl font-bold">Recommended Treatment</h3>
                                </div>
                                <div className="bg-blue-500/5 rounded-3xl p-6 border border-blue-500/10">
                                    <p className="text-zinc-700 dark:text-zinc-300 leading-relaxed font-medium">
                                        {(!isPlaceholderAdvice(scan.treatment) && scan.treatment) || diseaseData?.treatment?.join(". ") || "No treatment required for healthy plants. Continue regular monitoring and irrigation."}
                                    </p>
                                </div>
                            </div>
                            )}

                            {/* Prevention Section */}
                            {!hasTreatmentPlan && (
                            <div className="space-y-4">
                                <div className="flex items-center gap-3">
                                    <div className="size-10 rounded-full bg-green-500/10 text-green-500 flex items-center justify-center shrink-0">
                                        <ShieldCheck className="size-5" />
                                    </div>
                                    <h3 className="text-xl font-bold">Prevention Strategy</h3>
                                </div>
                                <div className="bg-green-500/5 rounded-3xl p-6 border border-green-500/10">
                                    <p className="text-zinc-700 dark:text-zinc-300 leading-relaxed">
                                        {(!isPlaceholderAdvice(scan.prevention) && scan.prevention) || diseaseData?.prevention?.join(". ") || "Maintain good field hygiene and use disease-free planting materials for future cycles."}
                                    </p>
                                </div>
                            </div>
                            )}

                            <div className="pt-4">
                                <Button
                                    className="w-full rounded-2xl h-14 text-lg font-bold shadow-lg shadow-primary/20 transition-transform active:scale-95"
                                    onClick={() => router.push(scanId ? `/dashboard/chat?scanId=${scanId}` : "/dashboard/chat")}
                                >
                                    Ask AI about this scan
                                </Button>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="rounded-[2rem] border-none bg-muted/40 shadow-sm">
                        <CardContent className="p-6">
                            <div className="flex items-center gap-2 mb-4">
                                <Info className="size-4 text-muted-foreground" />
                                <h4 className="font-bold text-sm uppercase tracking-wider text-muted-foreground">About this disease</h4>
                            </div>
                            <p className="text-sm text-muted-foreground leading-relaxed">
                                {diseaseData?.recommendation || "This analysis is powered by AgriSmart. Gemini Vision is the launch diagnosis engine; a local cassava classifier is used when no API key is configured. While highly accurate, we recommend consulting with a local agricultural expert for confirmed diagnosis and specific chemical applications."}
                            </p>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
