"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
    Camera,
    ImageIcon,
    Loader2,
    Leaf,
    Scan,
    Sparkles,
    ArrowLeft
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { CameraScanner } from "@/components/scan/camera-scanner";
import { orpc, client } from "@/utils/orpc";
import { CROP_CATEGORIES } from "@/lib/crop-scan";
import { prepareLeafImage } from "@/lib/image-file";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";

import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from "@/components/ui/tabs";

interface PredictionResult {
    disease: string;
    diseaseId: string;
    severity: number;
    confidence: number;
    treatment: string;
    prevention: string;
    symptoms: string[];
    [key: string]: any;
}

export function ScanDialog({ trigger }: { trigger: React.ReactElement }) {
    const router = useRouter();
    const queryClient = useQueryClient();
    const [open, setOpen] = useState(false);
    const [step, setStep] = useState<"capture" | "confirming">("capture");
    const [image, setImage] = useState<string | null>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [analysisError, setAnalysisError] = useState<string | null>(null);
    const [cropCategory, setCropCategory] = useState<string>("Root & Tuber");
    const [isDesktop, setIsDesktop] = useState(false);
    const ignoreDismissUntil = useRef(0);
    const capturePending = useRef(false);
    const cameraInputRef = useRef<HTMLInputElement>(null);
    const galleryInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        const media = window.matchMedia("(min-width: 768px)");
        const update = () => setIsDesktop(media.matches);
        update();
        media.addEventListener("change", update);
        return () => media.removeEventListener("change", update);
    }, []);

    const armFilePickerGuard = useCallback(() => {
        // Native camera/gallery apps steal focus; keep the scanner open until the photo returns.
        capturePending.current = true;
        ignoreDismissUntil.current = Date.now() + 10 * 60 * 1000;
    }, []);

    const createMutation = useMutation({
        mutationFn: (data: Record<string, unknown>) => (client.scans.create as any)(data),
        onSuccess: async (data: any) => {
            // Use broad invalidation as a safer alternative to queryFilter
            await queryClient.invalidateQueries({ queryKey: ["scans"] });
            toast.success("Analysis complete!");
            setOpen(false);
            router.push(`/dashboard/scans/${data.id}`);
        },
        onError: (error: any) => {
            console.error("Mutation Error:", error);
            toast.error("Failed to save scan results");
            setIsAnalyzing(false);
        },
    });

    const useSelectedImage = useCallback(async (file: File) => {
        try {
            const dataUrl = await prepareLeafImage(file);
            setImage(dataUrl);
            setStep("confirming");
            setAnalysisError(null);
        } catch (error: any) {
            toast.error(error?.message || "Could not open that photo.");
        }
    }, []);

    const handleImageSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        e.target.value = "";
        capturePending.current = false;
        ignoreDismissUntil.current = Date.now() + 1000;
        if (!file) return;
        void useSelectedImage(file);
    }, [useSelectedImage]);

    const handleOpenChange = useCallback((nextOpen: boolean, details?: { reason?: string; cancel?: () => void }) => {
        const pickingPhoto =
            capturePending.current ||
            document.hidden ||
            Date.now() < ignoreDismissUntil.current;
        if (!nextOpen && (details?.reason === "focus-out" || pickingPhoto)) {
            details?.cancel?.();
            return;
        }
        setOpen(nextOpen);
        if (!nextOpen) reset();
    }, []);

    const startAnalysis = useCallback(async () => {
        if (!image) return;

        setIsAnalyzing(true);
        setAnalysisError(null);
        try {
            const response = await fetch("/api/predict", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ image, cropCategory }),
            });

            const data = await response.json();

            if (!response.ok) throw new Error(data.error || "Analysis failed");

            console.log("AI Prediction Data:", data);

            createMutation.mutate({
                fieldId: null,
                imageUrl: image,
                disease: data.disease || "Unknown",
                severity: typeof data.severity === 'number' ? data.severity : 50,
                confidence: typeof data.confidence === 'number' ? data.confidence : 0,
                treatment: data.treatment,
                prevention: data.prevention,
                cropCategory: data.cropCategory || cropCategory,
                detectedCrop: data.detectedCrop,
                isHealthy: data.isHealthy,
                severityGrade: data.severityGrade,
                symptoms: data.symptoms,
                source: data.source,
                treatmentPlan: data.treatmentPlan,
            });
        } catch (err: any) {
            console.error("Analysis or Saving Error:", err);
            const message = err.message || "AI Analysis failed. Please try again.";
            setAnalysisError(message);
            toast.error(message);
            setIsAnalyzing(false);
        }
    }, [image, cropCategory, createMutation]);

    const reset = () => {
        setStep("capture");
        setImage(null);
        setIsAnalyzing(false);
        setAnalysisError(null);
        capturePending.current = false;
    };

    return (
        <Dialog
            open={open}
            disablePointerDismissal
            onOpenChange={handleOpenChange}
        >
            <DialogTrigger render={trigger as any} />
            <DialogContent
                showCloseButton
                className="p-0 overflow-hidden rounded-none border-none shadow-2xl h-[100dvh] max-h-[100dvh] max-w-none w-screen sm:max-w-[500px] sm:h-[85vh] sm:max-h-[85vh] sm:rounded-[2.5rem] sm:w-full flex flex-col"
            >
                <div className="flex flex-col bg-zinc-50 dark:bg-zinc-950 flex-1 overflow-hidden">
                    <div className="p-5 border-b bg-white dark:bg-zinc-900 flex items-center justify-between shrink-0">
                        <div className="flex items-center gap-3">
                            <div className="size-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
                                <Leaf className="size-5" />
                            </div>
                            <div>
                                <DialogTitle className="text-xl font-bold">AI Leaf Scanner</DialogTitle>
                                <p className="text-xs text-muted-foreground font-medium">{step === 'capture' ? 'Capture or Upload' : 'Confirm Analysis'}</p>
                            </div>
                        </div>
                        {step !== "capture" && !isAnalyzing && (
                            <Button variant="ghost" size="icon" onClick={() => setStep("capture")} className="rounded-full">
                                <ArrowLeft className="size-4" />
                            </Button>
                        )}
                    </div>

                    <div className="p-4 flex-1 flex flex-col items-center justify-center overflow-hidden">
                        {step === "capture" && (
                            <Tabs defaultValue="camera" className="w-full h-full flex flex-col space-y-4 overflow-hidden">
                                <Select value={cropCategory} onValueChange={setCropCategory}>
                                    <SelectTrigger className="w-full rounded-2xl h-11 bg-muted border-none shrink-0">
                                        <SelectValue placeholder="Crop category" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {CROP_CATEGORIES.filter((category) => category !== "Unknown").map((category) => (
                                            <SelectItem key={category} value={category}>{category}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <TabsList className="grid w-full grid-cols-2 rounded-2xl h-11 p-1 bg-muted shrink-0">
                                    <TabsTrigger value="camera" className="rounded-xl data-[state=active]:bg-background data-[state=active]:shadow-sm text-xs">
                                        <Camera className="size-4 mr-2" />
                                        Camera
                                    </TabsTrigger>
                                    <TabsTrigger value="file" className="rounded-xl data-[state=active]:bg-background data-[state=active]:shadow-sm text-xs">
                                        <ImageIcon className="size-4 mr-2" />
                                        Upload
                                    </TabsTrigger>
                                </TabsList>
                                <TabsContent value="camera" className="mt-0 flex-1 relative overflow-hidden min-h-0">
                                    <div className="w-full h-full min-h-0 rounded-2xl overflow-hidden border bg-black relative shadow-lg flex flex-col">
                                        <div className="flex-1 min-h-0 p-4 flex flex-col items-center justify-center gap-4 bg-zinc-950">
                                            <div className="size-16 rounded-full bg-primary/15 flex items-center justify-center text-primary">
                                                <Camera className="size-8" />
                                            </div>
                                            <div className="text-center px-4">
                                                <h3 className="font-bold text-white">Take a leaf photo</h3>
                                                <p className="text-xs text-zinc-400 mt-1">
                                                    Opens your phone camera. Point it at the leaf, then tap the shutter.
                                                </p>
                                            </div>
                                            <label
                                                htmlFor="leaf-camera-capture"
                                                className="w-full max-w-xs h-14 rounded-2xl text-lg font-bold inline-flex items-center justify-center bg-primary text-primary-foreground shadow-xl shadow-primary/20 active:scale-[0.98]"
                                                onClick={armFilePickerGuard}
                                                onPointerDown={armFilePickerGuard}
                                            >
                                                <Camera className="mr-2 size-5" />
                                                Take Photo
                                            </label>
                                            <p className="text-[10px] text-zinc-500">On a computer, this can also open a file picker.</p>
                                        </div>
                                        {isDesktop && (
                                        <div className="flex-1 min-h-[220px] border-t border-zinc-800">
                                            <CameraScanner
                                                onScanComplete={(_res, img) => {
                                                    setImage(img);
                                                    setStep("confirming");
                                                }}
                                                hideResult={true}
                                            />
                                        </div>
                                        )}
                                        <input
                                            id="leaf-camera-capture"
                                            ref={cameraInputRef}
                                            type="file"
                                            accept="image/*"
                                            capture="environment"
                                            className="sr-only"
                                            onClick={armFilePickerGuard}
                                            onPointerDown={armFilePickerGuard}
                                            onChange={handleImageSelect}
                                        />
                                    </div>
                                </TabsContent>
                                <TabsContent value="file" className="mt-0 flex-1 relative overflow-hidden min-h-0">
                                    <div className="w-full h-full relative group">
                                        <Card className="w-full h-full border-2 border-dashed border-zinc-200 dark:border-zinc-800 hover:border-primary/50 transition-all rounded-[1.5rem] flex flex-col items-center justify-center bg-white/50 dark:bg-zinc-900/50 p-4">
                                            <CardContent className="p-0 flex flex-col items-center gap-4">
                                                <div className="size-14 bg-primary/10 rounded-full flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                                                    <ImageIcon className="size-6" />
                                                </div>
                                                <div className="text-center">
                                                    <h3 className="font-bold text-sm">Choose Image</h3>
                                                    <p className="text-[10px] text-muted-foreground mt-1 px-4 leading-tight">Select a clear photo of the leaf from your gallery</p>
                                                </div>
                                                <label
                                                    htmlFor="leaf-gallery-capture"
                                                    className="rounded-full mt-2 inline-flex h-9 items-center justify-center border border-border bg-background px-4 text-sm font-medium"
                                                    onClick={armFilePickerGuard}
                                                    onPointerDown={armFilePickerGuard}
                                                >
                                                    Select File
                                                </label>
                                            </CardContent>
                                        </Card>
                                        <input
                                            id="leaf-gallery-capture"
                                            ref={galleryInputRef}
                                            type="file"
                                            accept="image/*"
                                            className="sr-only"
                                            onClick={armFilePickerGuard}
                                            onPointerDown={armFilePickerGuard}
                                            onChange={handleImageSelect}
                                        />
                                    </div>
                                </TabsContent>
                            </Tabs>
                        )}

                        {step === "confirming" && (
                            <div className="w-full h-full flex flex-col space-y-4 animate-in fade-in zoom-in-95 duration-300 overflow-hidden">
                                <div className="flex-1 relative rounded-3xl overflow-hidden border shadow-xl ring-1 ring-zinc-200 dark:ring-zinc-800 bg-black/5">
                                    {image && <img src={image} alt="Leaf" className="w-full h-full object-contain" />}

                                    {isAnalyzing && (
                                        <div className="absolute inset-0 bg-black/60 backdrop-blur-md flex flex-col items-center justify-center text-white p-6 text-center">
                                            <div className="relative mb-4">
                                                <Loader2 className="size-16 animate-spin text-primary" />
                                                <Sparkles className="absolute -top-1 -right-1 size-6 text-yellow-400 animate-pulse" />
                                            </div>
                                            <h3 className="text-2xl font-black mb-2 tracking-tight">Analyzing with AgriSmart...</h3>
                                            <p className="text-sm text-zinc-300">Reading the leaf image and preparing a crop health report</p>
                                            <div className="absolute left-0 right-0 h-1 bg-primary/50 shadow-[0_0_15px_rgba(var(--primary),1)] animate-scan-line top-0" />
                                        </div>
                                    )}
                                </div>

                                {!isAnalyzing && (
                                    <div className="space-y-2 shrink-0">
                                        {analysisError && (
                                            <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/70 dark:text-red-200">
                                                {analysisError}
                                            </div>
                                        )}
                                        <Button
                                            className="w-full h-14 rounded-2xl text-lg font-bold shadow-xl shadow-primary/20 active:scale-[0.98] transition-all bg-primary hover:bg-primary/90 text-primary-foreground"
                                            onClick={startAnalysis}
                                            disabled={isAnalyzing}
                                        >
                                            {analysisError ? "Try Analysis Again" : "Start AI Analysis"}
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            className="w-full rounded-xl text-muted-foreground h-9 text-xs"
                                            onClick={() => { setImage(null); setStep("capture"); }}
                                        >
                                            Retake Photo
                                        </Button>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    <div className="p-3 bg-white dark:bg-zinc-900 border-t flex justify-center shrink-0">
                        <div className="flex items-center gap-2 px-3 py-1 bg-zinc-100 dark:bg-zinc-800 rounded-full text-[10px] font-medium text-muted-foreground">
                            <Scan className="size-3" />
                            <span>Powered by AgriSmart AI</span>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
