"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { useQuery } from "@tanstack/react-query";
import { Send, Loader2, RotateCcw, Leaf } from "lucide-react";
import { Streamdown } from "streamdown";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { client } from "@/utils/orpc";

const SUGGESTIONS = [
  "How do I treat cassava mosaic?",
  "My tomato leaves have dark spots",
  "What causes mango fruit spots?",
  "When should I remove infected plants?",
];

function farmerFacingText(text: string) {
  if (/API[_ ]?key not valid|API_KEY_INVALID|GOOGLE_GENERATIVE_AI|GEMINI_API_KEY/i.test(text)) {
    return "Ask AI is not available yet. Please try again later.";
  }
  return text;
}

function ChatPageInner() {
  const searchParams = useSearchParams();
  const scanId = searchParams.get("scanId");
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const scanIdRef = useRef(scanId);
  scanIdRef.current = scanId;

  const scanQuery = useQuery({
    queryKey: ["scans", "get", scanId],
    queryFn: () => (client.scans.get as any)({ id: scanId }),
    enabled: Boolean(scanId),
  });
  const scan = scanQuery.data;

  const { messages, sendMessage, status, setMessages, error } = useChat({
    transport: new DefaultChatTransport({
      api: "/api/ai",
      prepareSendMessagesRequest: ({ id, messages, body }) => ({
        body: {
          ...body,
          id,
          messages,
          scanId: scanIdRef.current,
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
  }, []);

  useEffect(() => {
    if (!scanId || !scan?.disease) return;
    const key = `agrismart-scan-chat:${scanId}`;
    if (sessionStorage.getItem(key)) return;
    sessionStorage.setItem(key, "1");
    sendMessage({
      text: "Explain this scan in simple words and tell me what to do first.",
    });
  }, [scanId, scan, sendMessage]);

  const ask = (text: string) => {
    const question = text.trim();
    if (!question || isBusy) return;
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

  const lastMessage = messages[messages.length - 1];
  const showTyping = isBusy && lastMessage?.role !== "assistant";

  return (
    <div className="flex flex-1 min-h-0 flex-col w-full max-w-2xl mx-auto">
      <div className="flex items-center justify-between gap-3 shrink-0 pb-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Ask AI</h1>
          <p className="text-sm text-muted-foreground">
            {scan ? "Advice for your latest scan" : "Ask a crop health question"}
          </p>
        </div>
        {messages.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={startNewChat}
            className="text-muted-foreground"
          >
            <RotateCcw className="mr-2 size-4" />
            New chat
          </Button>
        )}
      </div>

      {scan && (
        <Link
          href={`/dashboard/scans/${scanId}`}
          className="mb-3 flex items-center gap-3 rounded-2xl border bg-muted/40 px-4 py-3 text-sm hover:bg-muted/70 transition-colors"
        >
          <Leaf className="size-4 text-primary shrink-0" />
          <div className="min-w-0">
            <p className="font-medium truncate">{scan.disease}</p>
            <p className="text-xs text-muted-foreground truncate">
              {[scan.detectedCrop, scan.severityGrade].filter(Boolean).join(" · ") || "Open scan report"}
            </p>
          </div>
          <span className="ml-auto text-xs text-primary font-medium shrink-0">View</span>
        </Link>
      )}

      <div className="flex-1 min-h-0 overflow-y-auto rounded-3xl border bg-background">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col justify-center p-6 sm:p-8">
            <h2 className="text-lg font-semibold mb-1">What do you want to know?</h2>
            <p className="text-sm text-muted-foreground mb-6">
              Tap a question or type your own.
            </p>
            <div className="flex flex-col gap-2">
              {SUGGESTIONS.map((suggestion) => (
                <button
                  key={suggestion}
                  type="button"
                  disabled={isBusy}
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
                Could not get an answer. Check your connection and try again.
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
            placeholder="Type your question"
            aria-label="Ask a crop health question"
            className="flex-1 h-11 bg-transparent px-2 text-sm outline-none placeholder:text-muted-foreground"
            disabled={isBusy}
          />
          <Button
            type="submit"
            size="icon"
            className="size-10 rounded-full"
            disabled={isBusy || !input.trim()}
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
    <Suspense fallback={<div className="flex-1 min-h-0 flex items-center justify-center text-sm text-muted-foreground">Loading chat…</div>}>
      <ChatPageInner />
    </Suspense>
  );
}
