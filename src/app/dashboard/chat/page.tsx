"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { useQuery } from "@tanstack/react-query";
import { Send, Loader2, RotateCcw, Leaf, X } from "lucide-react";
import { Streamdown } from "streamdown";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { orpc, client } from "@/utils/orpc";

const GENERAL_SUGGESTIONS = [
  "How do I treat cassava mosaic?",
  "My tomato leaves have dark spots",
  "What causes mango fruit spots?",
  "When should I remove infected plants?",
];

const SCAN_SUGGESTIONS = [
  "Explain this scan in simple words",
  "What should I do first?",
  "Should I remove infected plants?",
  "How do I stop it spreading?",
];

function farmerFacingText(text: string) {
  if (/API[_ ]?key not valid|API_KEY_INVALID|GOOGLE_GENERATIVE_AI|GEMINI_API_KEY/i.test(text)) {
    return "Google rejected this API key. Create a new Gemini Auth key at aistudio.google.com/apikey, restrict it to the Gemini API, then save it in Settings.";
  }
  return text;
}

function chatErrorMessage(error: unknown) {
  const raw = error instanceof Error ? error.message : String(error || "");
  try {
    const parsed = JSON.parse(raw) as { error?: string };
    if (parsed?.error) return farmerFacingText(parsed.error);
  } catch {
    // The transport may send plain text.
  }
  return farmerFacingText(raw) || "Could not get an answer. Check your connection, Gemini key, and try again.";
}

function scanLabel(scan: Record<string, unknown> | null | undefined) {
  if (!scan) return "Scan";
  return String(scan.disease || scan.diseaseDetected || "Scan");
}

function scanMeta(scan: Record<string, unknown> | null | undefined) {
  if (!scan) return "";
  return [scan.detectedCrop, scan.severityGrade || (scan.severity != null ? `${scan.severity}%` : "")]
    .map((part) => String(part || "").trim())
    .filter(Boolean)
    .join(" · ");
}

function ChatPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const scanId = searchParams.get("scanId");
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const scanIdRef = useRef(scanId);
  scanIdRef.current = scanId;

  const scansQuery = useQuery(orpc.scans.list.queryOptions());
  const healthQuery = useQuery({
    queryKey: ["setup-health"],
    queryFn: async () => {
      const response = await fetch("/api/health");
      if (!response.ok) throw new Error("Could not load setup status");
      return response.json() as Promise<{ gemini: { configured: boolean; hint?: string; googleAccepted?: boolean } }>;
    },
  });
  const geminiReady =
    healthQuery.data?.gemini.googleAccepted ?? healthQuery.data?.gemini.configured !== false;
  const scans = (scansQuery.data ?? []) as Array<Record<string, unknown>>;
  const selectedScan = scans.find((scan) => scan.id === scanId) ?? null;

  const scanQuery = useQuery({
    queryKey: ["scans", "get", scanId],
    queryFn: () => (client.scans.get as any)({ id: scanId }),
    enabled: Boolean(scanId) && !selectedScan,
  });
  const scan = (selectedScan || scanQuery.data) as Record<string, unknown> | null;

  const { messages, sendMessage, status, setMessages, error } = useChat({
    transport: new DefaultChatTransport({
      api: "/api/ai",
      body: () => ({ scanId: scanIdRef.current || undefined, scan_id: scanIdRef.current || undefined }),
      prepareSendMessagesRequest: ({ id, messages, body }) => ({
        body: {
          ...body,
          id,
          messages,
          scanId: scanIdRef.current || undefined,
          scan_id: scanIdRef.current || undefined,
        },
      }),
    }),
  });

  const isBusy = status === "submitted" || status === "streaming";

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isBusy]);

  useEffect(() => {
    inputRef.current?.focus();
  }, [scanId]);

  const ask = (text: string) => {
    const question = text.trim();
    if (!question || isBusy || !geminiReady) return;
    sendMessage({ text: question });
    setInput("");
    inputRef.current?.focus();
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    ask(input);
  };

  const startNewChat = () => {
    setMessages([]);
    setInput("");
    inputRef.current?.focus();
  };

  const chooseScan = (id: string) => {
    setMessages([]);
    router.replace(`/dashboard/chat?scanId=${id}`);
  };

  const clearScan = () => {
    setMessages([]);
    router.replace("/dashboard/chat");
  };

  const lastMessage = messages[messages.length - 1];
  const showTyping = isBusy && lastMessage?.role !== "assistant";
  const suggestions = scan ? SCAN_SUGGESTIONS : GENERAL_SUGGESTIONS;
  const recentScans = scans.slice(0, 4);

  return (
    <div className="flex flex-1 min-h-0 flex-col w-full max-w-2xl mx-auto">
      <div className="flex items-center justify-between gap-3 shrink-0 pb-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Ask AI</h1>
          <p className="text-sm text-muted-foreground">
            {scan ? "Gemini will use this scan from MongoDB" : "Pick a scan, or ask a crop question"}
          </p>
        </div>
        {messages.length > 0 && (
          <Button variant="ghost" size="sm" onClick={startNewChat} className="text-muted-foreground">
            <RotateCcw className="mr-2 size-4" />
            New chat
          </Button>
        )}
      </div>

      {healthQuery.data && !geminiReady && (
        <div className="mb-3 rounded-2xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-950 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-100">
          Gemini is not ready yet. {healthQuery.data.gemini.hint || "Create a Gemini Auth key at aistudio.google.com/apikey, set GEMINI_API_KEY in Vercel, then Redeploy."}
        </div>
      )}

      {scan ? (
        <div className="mb-3 flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm dark:border-emerald-900 dark:bg-emerald-950/40">
          <Leaf className="size-5 text-emerald-700 dark:text-emerald-400 shrink-0" />
          <div className="min-w-0 flex-1">
            <p className="font-semibold truncate">{scanLabel(scan)}</p>
            <p className="text-xs text-muted-foreground truncate">
              {scanMeta(scan) || "This scan is attached to the chat"}
            </p>
          </div>
          <Link href={`/dashboard/scans/${scanId}`} className="text-xs font-medium text-emerald-800 dark:text-emerald-300 shrink-0">
            Report
          </Link>
          <button type="button" onClick={clearScan} className="text-muted-foreground hover:text-foreground" aria-label="Remove scan">
            <X className="size-4" />
          </button>
        </div>
      ) : recentScans.length > 0 ? (
        <div className="mb-3 rounded-2xl border bg-muted/30 p-3">
          <p className="text-sm font-medium mb-2">Use a scan from MongoDB</p>
          <div className="grid gap-2 sm:grid-cols-2">
            {recentScans.map((item) => (
              <button
                key={String(item.id)}
                type="button"
                onClick={() => chooseScan(String(item.id))}
                className="text-left rounded-xl border bg-background px-3 py-2 hover:border-primary hover:bg-primary/5 transition-colors"
              >
                <p className="text-sm font-medium truncate">{scanLabel(item)}</p>
                <p className="text-xs text-muted-foreground truncate">{scanMeta(item) || "Open in Ask AI"}</p>
              </button>
            ))}
          </div>
        </div>
      ) : null}

      <div className="flex-1 min-h-0 overflow-y-auto rounded-3xl border bg-background">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col justify-center p-6 sm:p-8">
            <h2 className="text-lg font-semibold mb-1">
              {scan ? `Ask about ${scanLabel(scan)}` : "What do you want to know?"}
            </h2>
            <p className="text-sm text-muted-foreground mb-6">
              {scan ? "Tap a question. The answer uses your scan result." : "Tap a question or type your own."}
            </p>
            <div className="flex flex-col gap-2">
              {suggestions.map((suggestion) => (
                <button
                  key={suggestion}
                  type="button"
                  disabled={isBusy || !geminiReady}
                  onClick={() => ask(suggestion)}
                  className="text-left rounded-2xl border px-4 py-3 text-sm hover:border-primary hover:bg-primary/5 transition-colors disabled:opacity-50"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="p-4 sm:p-5 space-y-3">
            {messages.map((message) => (
              <div
                key={message.id}
                className={cn("flex", message.role === "user" ? "justify-end" : "justify-start")}
              >
                <div
                  className={cn(
                    "max-w-[90%] rounded-2xl px-4 py-3 text-sm leading-relaxed",
                    message.role === "user"
                      ? "bg-primary text-primary-foreground rounded-br-md"
                      : "bg-muted rounded-bl-md"
                  )}
                >
                  {message.parts?.map((part, index) => {
                    if (part.type !== "text") return null;
                    const text = farmerFacingText(part.text);
                    if (message.role === "user") {
                      return <p key={index}>{text}</p>;
                    }
                    return (
                      <div key={index} className="prose prose-sm dark:prose-invert max-w-none prose-p:my-2">
                        <Streamdown isAnimating={isBusy && message.role === "assistant"}>
                          {text}
                        </Streamdown>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
            {showTyping && (
              <div className="flex justify-start">
                <div className="bg-muted rounded-2xl rounded-bl-md px-4 py-3 text-sm text-muted-foreground">
                  Thinking…
                </div>
              </div>
            )}
            {error && (
              <p className="text-sm text-destructive px-1">
                {chatErrorMessage(error)}
              </p>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="pt-3 shrink-0">
        <div className="flex items-center gap-2 rounded-full border bg-background px-3 py-1.5 focus-within:border-primary">
          <input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={scan ? `Ask about ${scanLabel(scan)}` : "Type your question"}
            aria-label="Ask a crop health question"
            className="flex-1 h-11 bg-transparent px-2 text-sm outline-none placeholder:text-muted-foreground"
            disabled={isBusy || !geminiReady}
          />
          <Button
            type="submit"
            size="icon"
            className="size-10 rounded-full"
            disabled={isBusy || !geminiReady || !input.trim()}
            aria-label="Send"
          >
            {isBusy ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground text-center mt-2">
          Advice is a guide only. Confirm with a local agronomist before spraying.
        </p>
      </form>
    </div>
  );
}

export default function ChatPage() {
  return (
    <Suspense fallback={<div className="flex-1 min-h-0 flex items-center justify-center text-sm text-muted-foreground">Loading Ask AI…</div>}>
      <ChatPageInner />
    </Suspense>
  );
}
