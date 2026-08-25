"use client";

import { useEffect, useRef, useState } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { Send, ImageIcon, Loader2, Trash2 } from "lucide-react";
import { Streamdown } from "streamdown";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export default function ChatPage() {
  const [input, setInput] = useState("");
  const [imageAttachment, setImageAttachment] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { messages, sendMessage, status, setMessages } = useChat({
    transport: new DefaultChatTransport({
      api: "/api/ai",
    }),
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      setImageAttachment(ev.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const text = input.trim();
    if (!text && !imageAttachment) return;

    sendMessage({ text: text || "Analyze this cassava leaf image" });
    setInput("");
    setImageAttachment(null);
  };

  const clearChat = () => {
    setMessages([]);
  };

  const isStreaming = status === "streaming";

  return (
    <div className="flex-1 min-h-0 flex flex-col max-w-5xl mx-auto w-full">
      <div className="flex items-center justify-between mb-3 shrink-0 px-1">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              AI Agronomist
            </h1>
            <Badge variant="secondary" className="bg-primary/10 text-primary border-none text-[10px] uppercase tracking-widest font-bold">
              Beta
            </Badge>
          </div>
          <div className="text-muted-foreground text-sm flex items-center gap-1.5">
            <div className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Your expert assistant for cassava health
          </div>
        </div>
        {messages.length > 0 && (
          <Button variant="ghost" size="sm" onClick={clearChat} className="text-muted-foreground hover:text-destructive hover:bg-destructive/10">
            <Trash2 className="mr-2 size-4" />
            Reset Session
          </Button>
        )}
      </div>

      <Card className="flex-1 flex flex-col overflow-hidden border-border/40 bg-card/30 backdrop-blur-xl rounded-[2.5rem] shadow-2xl shadow-primary/5">
        <ScrollArea className="flex-1 px-4 py-8">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-8 mt-12">
              <div className="size-24 rounded-[2rem] bg-gradient-to-br from-primary to-primary/40 flex items-center justify-center mb-8 shadow-xl shadow-primary/20 rotate-3">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="size-10 text-white"
                >
                  <path d="M12 2L2 7l10 5 10-5-10-5z" />
                  <path d="M2 17l10 5 10-5" />
                  <path d="M2 12l10 5 10-5" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold mb-3 tracking-tight">How can I help you today?</h2>
              <p className="text-muted-foreground max-w-sm text-sm leading-relaxed mb-10">
                I'm specialized in cassava farming and disease management. Ask me about symptoms, varieties, or treatments.
              </p>
              <div className="grid gap-3 sm:grid-cols-2 max-w-xl w-full">
                {[
                  "How to identify Cassava Mosaic Disease?",
                  "Best organic treatments for Green Mites",
                  "Explain CBSD symptoms on roots",
                  "Fertilization schedule for cassava",
                ].map((suggestion) => (
                  <Button
                    key={suggestion}
                    variant="outline"
                    className="text-left h-auto py-4 px-5 justify-start border-border/40 bg-background/50 hover:bg-primary/5 hover:border-primary/30 rounded-2xl transition-all group"
                    onClick={() => setInput(suggestion)}
                  >
                    <span className="text-sm font-medium">{suggestion}</span>
                    <Send className="size-3.5 ml-auto opacity-0 group-hover:opacity-100 transition-opacity text-primary" />
                  </Button>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-8 max-w-4xl mx-auto">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={cn(
                    "flex gap-4 animate-in fade-in slide-in-from-bottom-2",
                    message.role === "user" ? "flex-row-reverse" : "flex-row"
                  )}
                >
                  <div className={cn(
                    "size-10 rounded-full flex items-center justify-center shrink-0 border-4 border-background shadow-sm",
                    message.role === "user" ? "bg-secondary" : "bg-primary"
                  )}>
                    {message.role === "assistant" ? (
                      <span className="text-[10px] font-black text-white">AI</span>
                    ) : (
                      <span className="text-[10px] font-black text-secondary-foreground">ME</span>
                    )}
                  </div>
                  <div
                    className={cn(
                      "max-w-[85%] rounded-[1.5rem] px-5 py-3.5 shadow-sm",
                      message.role === "user"
                        ? "bg-primary text-primary-foreground rounded-tr-none"
                        : "bg-muted/80 backdrop-blur-md rounded-tl-none border border-border/20"
                    )}
                  >
                    {message.parts?.map((part, index) => {
                      if (part.type === "text") {
                        return (
                          <div key={index} className="prose prose-sm dark:prose-invert max-w-none prose-p:leading-relaxed prose-strong:text-inherit">
                            <Streamdown isAnimating={isStreaming && message.role === "assistant"}>
                              {part.text}
                            </Streamdown>
                          </div>
                        );
                      }
                      return null;
                    })}
                  </div>
                </div>
              ))}
              {isStreaming && (
                <div className="flex gap-4">
                  <div className="size-10 rounded-full bg-primary flex items-center justify-center shrink-0 border-4 border-background shadow-sm">
                    <span className="text-[10px] font-black text-white">AI</span>
                  </div>
                  <div className="bg-muted/80 backdrop-blur-md rounded-[1.5rem] rounded-tl-none border border-border/20 px-5 py-4">
                    <div className="flex gap-1">
                      <div className="size-1.5 rounded-full bg-primary/40 animate-bounce" />
                      <div className="size-1.5 rounded-full bg-primary/40 animate-bounce [animation-delay:0.2s]" />
                      <div className="size-1.5 rounded-full bg-primary/40 animate-bounce [animation-delay:0.4s]" />
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} className="h-4" />
            </div>
          )}
        </ScrollArea>

        {imageAttachment && (
          <div className="px-6 py-4 border-t border-border/20 bg-muted/20 backdrop-blur-md">
            <div className="relative inline-block group">
              <img
                src={imageAttachment}
                alt="Attachment"
                className="h-24 w-24 rounded-2xl object-cover ring-4 ring-background shadow-lg"
              />
              <button
                type="button"
                className="absolute -top-3 -right-3 size-8 bg-destructive text-white rounded-full flex items-center justify-center shadow-lg transform group-hover:scale-110 transition-transform"
                onClick={() => setImageAttachment(null)}
              >
                <Trash2 className="size-4" />
              </button>
            </div>
          </div>
        )}

        <div className="p-4 sm:p-6 border-t border-border/20 bg-background/50 backdrop-blur-xl">
          <form
            onSubmit={handleSubmit}
            className="flex items-center gap-3 max-w-4xl mx-auto"
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageSelect}
              className="hidden"
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => fileInputRef.current?.click()}
              className="size-12 rounded-2xl hover:bg-primary/10 hover:text-primary transition-colors shrink-0"
            >
              <ImageIcon className="size-6" />
            </Button>
            <div className="relative flex-1 group">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about cassava health..."
                className="h-12 flex-1 bg-muted/40 border-border/40 rounded-2xl px-5 focus-visible:ring-primary/20 focus-visible:border-primary/30 transition-all pr-12"
                disabled={isStreaming}
              />
              <Button
                type="submit"
                size="icon"
                disabled={isStreaming || (!input.trim() && !imageAttachment)}
                className="absolute right-1.5 top-1.5 size-9 rounded-xl shadow-lg transition-all active:scale-95"
              >
                {isStreaming ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Send className="size-4" />
                )}
              </Button>
            </div>
          </form>
          <p className="text-[10px] text-center text-muted-foreground mt-3 uppercase tracking-tighter">
            AgriSmart AI may provide inaccurate information. Always verify with local experts.
          </p>
        </div>
      </Card>
    </div>
  );
}
