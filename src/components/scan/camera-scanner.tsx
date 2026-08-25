"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import { Camera, ImageIcon, X, Loader2, RotateCcw } from "lucide-react";
import Webcam from "react-webcam";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

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

interface CameraScannerProps {
    onScanComplete?: (result: PredictionResult, imageData: string) => void;
    hideResult?: boolean;
}

export function CameraScanner({ onScanComplete, hideResult }: CameraScannerProps) {
    const webcamRef = useRef<Webcam>(null);
    const [capturedImage, setCapturedImage] = useState<string | null>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [result, setResult] = useState<PredictionResult | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [cameraActive, setCameraActive] = useState(false);

    const videoConstraints = {
        width: 1280,
        height: 720,
        facingMode: "environment"
    };

    const startCamera = useCallback(() => {
        setCameraActive(true);
        setError(null);
    }, []);

    const stopCamera = useCallback(() => {
        setCameraActive(false);
    }, []);

    const captureImage = useCallback(() => {
        const imageSrc = webcamRef.current?.getScreenshot();
        if (imageSrc) {
            if (hideResult) {
                onScanComplete?.(undefined as any, imageSrc);
                return;
            }
            setCapturedImage(imageSrc);
            setCameraActive(false);
        }
    }, [webcamRef, hideResult, onScanComplete]);

    const analyzeImage = useCallback(async () => {
        if (!capturedImage) return;

        setIsAnalyzing(true);
        setError(null);

        try {
            const response = await fetch("/api/predict", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ image: capturedImage }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Analysis failed");
            }

            setResult(data);
            onScanComplete?.(data, capturedImage);
        } catch (err: any) {
            console.error("Analysis error:", err);
            setError(err.message || "Failed to analyze image. Please try again.");
        } finally {
            setIsAnalyzing(false);
        }
    }, [capturedImage, onScanComplete]);

    const reset = useCallback(() => {
        setCapturedImage(null);
        setResult(null);
        setError(null);
        setIsAnalyzing(false);
        setCameraActive(true);
    }, []);

    // Show result view
    if (result && !hideResult) {
        return (
            <div className="flex flex-col h-full bg-background">
                <div className="flex-1 overflow-auto p-4 space-y-4">
                    {capturedImage && (
                        <div className="relative aspect-square w-full max-w-sm mx-auto rounded-xl overflow-hidden">
                            <img
                                src={capturedImage}
                                alt="Scanned leaf"
                                className="w-full h-full object-cover"
                            />
                        </div>
                    )}

                    <div className="space-y-4">
                        <div className="text-center">
                            <h2 className="text-2xl font-bold">{result.disease}</h2>
                            <div className="flex items-center justify-center gap-4 mt-2">
                                {typeof result.severity === 'number' && (
                                    <div className="text-center">
                                        <div className="text-3xl font-bold text-primary">
                                            {result.severity}%
                                        </div>
                                        <div className="text-xs text-muted-foreground">Severity</div>
                                    </div>
                                )}
                                {typeof result.confidence === 'number' && (
                                    <div className="text-center">
                                        <div className="text-3xl font-bold text-green-600">
                                            {result.confidence}%
                                        </div>
                                        <div className="text-xs text-muted-foreground">Confidence</div>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="bg-muted rounded-lg p-4 space-y-3">
                            {result.symptoms && result.symptoms.length > 0 && (
                                <div>
                                    <h3 className="font-semibold text-sm mb-1">Symptoms Observed</h3>
                                    <ul className="text-sm text-muted-foreground list-disc list-inside">
                                        {result.symptoms.map((symptom: string, i: number) => (
                                            <li key={`${symptom}-${i}`}>{symptom}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {result.treatment && (
                                <div>
                                    <h3 className="font-semibold text-sm mb-1">Treatment</h3>
                                    <p className="text-sm text-muted-foreground">{result.treatment}</p>
                                </div>
                            )}

                            {result.prevention && (
                                <div>
                                    <h3 className="font-semibold text-sm mb-1">Prevention</h3>
                                    <p className="text-sm text-muted-foreground">{result.prevention}</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="p-4 border-t">
                    <Button onClick={reset} className="w-full" size="lg">
                        <Camera className="mr-2 size-5" />
                        Scan Another
                    </Button>
                </div>
            </div>
        );
    }

    // Show captured image with analyze button
    if (capturedImage) {
        return (
            <div className="flex flex-col h-full bg-background">
                <div className="flex-1 relative">
                    <img
                        src={capturedImage}
                        alt="Captured"
                        className="w-full h-full object-cover"
                    />
                    {isAnalyzing && (
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                            <div className="text-center text-white">
                                <Loader2 className="size-12 animate-spin mx-auto mb-2" />
                                <p className="text-lg font-medium">Analyzing leaf...</p>
                            </div>
                        </div>
                    )}
                    <Button
                        variant="ghost"
                        size="icon"
                        className="absolute top-4 right-4 bg-black/50 text-white hover:bg-black/70 rounded-full"
                        onClick={reset}
                    >
                        <X className="size-5" />
                    </Button>
                </div>

                {error && (
                    <div className="p-4 mx-4 mb-2 bg-destructive/10 text-destructive rounded-xl border border-destructive/20 flex items-start gap-3 animate-in fade-in slide-in-from-top-1">
                        <div className="size-5 rounded-full bg-destructive flex-shrink-0 flex items-center justify-center text-white mt-0.5">
                            <span className="text-[10px] font-bold">!</span>
                        </div>
                        <div className="text-left">
                            <p className="text-xs font-semibold">Scanning Issue</p>
                            <p className="text-[11px] opacity-90 leading-tight">{error}</p>
                        </div>
                    </div>
                )}

                <div className="p-4 space-y-2 border-t bg-background">
                    <Button
                        onClick={analyzeImage}
                        className="w-full"
                        size="lg"
                        disabled={isAnalyzing}
                    >
                        {isAnalyzing ? (
                            <>
                                <Loader2 className="mr-2 size-5 animate-spin" />
                                Analyzing...
                            </>
                        ) : (
                            "Analyze Leaf"
                        )}
                    </Button>
                    <Button
                        variant="outline"
                        onClick={reset}
                        className="w-full"
                        disabled={isAnalyzing}
                    >
                        <RotateCcw className="mr-2 size-4" />
                        Retake
                    </Button>
                </div>
            </div>
        );
    }

    // Show camera view or start options
    return (
        <div className="flex flex-col h-full bg-background">
            {cameraActive ? (
                <>
                    <div className="flex-1 relative bg-black flex items-center justify-center">
                        <Webcam
                            audio={false}
                            ref={webcamRef}
                            screenshotFormat="image/jpeg"
                            videoConstraints={videoConstraints}
                            onUserMediaError={() => setError("Unable to access camera. Please check permissions.")}
                            className="w-full h-full object-cover"
                        />

                        {/* Viewfinder overlay */}
                        <div className="absolute inset-0 pointer-events-none">
                            <div className="absolute inset-8 border-2 border-white/30 rounded-2xl" />
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                                <div className="w-48 h-48 border-2 border-white/50 rounded-lg" />
                            </div>
                        </div>

                        <Button
                            variant="ghost"
                            size="icon"
                            className="absolute top-4 right-4 bg-black/50 text-white hover:bg-black/70 rounded-full"
                            onClick={stopCamera}
                        >
                            <X className="size-5" />
                        </Button>
                    </div>

                    <div className="p-6 bg-background border-t">
                        <div className="flex items-center justify-center">
                            <Button
                                size="icon"
                                className="size-20 rounded-full shadow-2xl shadow-primary/40 ring-4 ring-background transition-transform active:scale-90"
                                onClick={captureImage}
                            >
                                <Camera className="size-8" />
                            </Button>
                        </div>
                    </div>
                </>
            ) : (
                <div className="flex-1 flex flex-col items-center justify-center p-8 space-y-6">
                    <div className="text-center space-y-2">
                        <div className="size-24 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
                            <Camera className="size-12 text-primary" />
                        </div>
                        <h2 className="text-2xl font-bold">Scan Cassava Leaf</h2>
                        <p className="text-muted-foreground text-sm max-w-xs">
                            Take a photo of a cassava leaf to detect diseases and get treatment recommendations
                        </p>
                    </div>

                    {error && (
                        <div className="p-4 bg-destructive/10 text-destructive text-center text-sm rounded-2xl max-w-xs border border-destructive/20 animate-in fade-in slide-in-from-top-2">
                            <p className="font-semibold mb-1">Camera Access Issue</p>
                            <p className="text-xs opacity-80">{error}</p>
                            <p className="text-[10px] mt-2 italic text-muted-foreground">Note: Camera access requires a secure HTTPS connection.</p>
                        </div>
                    )}

                    <div className="space-y-3 w-full max-w-xs">
                        <Button onClick={startCamera} className="w-full h-14 rounded-2xl text-lg font-bold shadow-lg shadow-primary/10" size="lg">
                            <Camera className="mr-2 size-5" />
                            Open Camera
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}
