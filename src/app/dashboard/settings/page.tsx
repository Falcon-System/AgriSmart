"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Save, Loader2, Check, CircleAlert } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { orpc, client } from "@/utils/orpc";
import { ModeToggle } from "@/components/mode-toggle";

export default function SettingsPage() {
  const queryClient = useQueryClient();
  const [orgName, setOrgName] = useState("");
  const [locale, setLocale] = useState("en-US");
  const [currency, setCurrency] = useState("ETB");

  const settingsQuery = useQuery(orpc.settings.get.queryOptions());
  const healthQuery = useQuery({
    queryKey: ["setup-health"],
    queryFn: async () => {
      const response = await fetch("/api/health");
      if (!response.ok) throw new Error("Could not load setup status");
      return response.json() as Promise<{
        mongo: { connected: boolean; database?: string };
        gemini: { configured: boolean; hint?: string };
      }>;
    },
  });

  useEffect(() => {
    if (settingsQuery.data) {
      setOrgName(settingsQuery.data.orgName || "");
      setLocale(settingsQuery.data.locale || "en-US");
      setCurrency(settingsQuery.data.currency || "ETB");
    }
  }, [settingsQuery.data]);

  const updateMutation = useMutation({
    mutationFn: (data: { orgName: string; locale: string; currency: string }) =>
      client.settings.update(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["settings"] });
      toast.success("Settings saved");
    },
    onError: () => {
      toast.error("Failed to save settings");
    },
  });

  const handleSave = () => {
    updateMutation.mutate({
      orgName,
      locale,
      currency,
    });
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">
          Manage your organization and application preferences
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Organization</CardTitle>
          <CardDescription>
            Basic information about your organization
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="orgName">Organization Name</Label>
            <Input
              id="orgName"
              placeholder="e.g., AgriSmart Farm Cooperative"
              value={orgName}
              onChange={(e) => setOrgName(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Preferences</CardTitle>
          <CardDescription>
            Customize how the application works for you
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Language</Label>
              <Select value={locale} onValueChange={setLocale}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en-US">English (US)</SelectItem>
                  <SelectItem value="am-ET">Amharic (Ethiopia)</SelectItem>
                  <SelectItem value="sw-TZ">Swahili (Tanzania)</SelectItem>
                  <SelectItem value="fr-CD">French (Congo)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Currency</Label>
              <Select value={currency} onValueChange={setCurrency}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ETB">Ethiopian Birr (ETB)</SelectItem>
                  <SelectItem value="USD">US Dollar (USD)</SelectItem>
                  <SelectItem value="TZS">Tanzanian Shilling (TZS)</SelectItem>
                  <SelectItem value="NGN">Nigerian Naira (NGN)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div>
              <Label>Theme</Label>
              <p className="text-sm text-muted-foreground">
                Toggle between light and dark mode
              </p>
            </div>
            <ModeToggle />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Local setup</CardTitle>
          <CardDescription>
            MongoDB and Gemini must be ready before you scan or use Ask AI
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <SetupStatusRow
            title="MongoDB"
            ok={healthQuery.data?.mongo.connected}
            loading={healthQuery.isLoading}
            readyText={`Connected to ${healthQuery.data?.mongo.database || "agrismart_local"}`}
            missingText="Not connected. On your computer run: docker compose up -d"
          />
          <SetupStatusRow
            title="Google Gemini"
            ok={healthQuery.data?.gemini.configured}
            loading={healthQuery.isLoading}
            readyText="API key is set. Scans and Ask AI can use Gemini."
            missingText={healthQuery.data?.gemini.hint || "Add GOOGLE_GENERATIVE_AI_API_KEY to .env.local, then run pnpm dev:clean."}
          />
          <p className="text-xs text-muted-foreground">
            Create a key at aistudio.google.com/apikey. Do not put the key in the browser or commit it.
          </p>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button
          onClick={handleSave}
          disabled={updateMutation.isPending}
        >
          {updateMutation.isPending ? (
            <Loader2 className="mr-2 size-4 animate-spin" />
          ) : (
            <Save className="mr-2 size-4" />
          )}
          Save Changes
        </Button>
      </div>
    </div>
  );
}

function SetupStatusRow({
  title,
  ok,
  loading,
  readyText,
  missingText,
}: {
  title: string;
  ok?: boolean;
  loading: boolean;
  readyText: string;
  missingText: string;
}) {
  const ready = Boolean(ok);
  return (
    <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
      <div
        className={`size-10 rounded-full flex items-center justify-center ${
          loading
            ? "bg-muted-foreground/10"
            : ready
              ? "bg-green-100 dark:bg-green-900"
              : "bg-amber-100 dark:bg-amber-900"
        }`}
      >
        {loading ? (
          <Loader2 className="size-5 animate-spin text-muted-foreground" />
        ) : ready ? (
          <Check className="size-5 text-green-600 dark:text-green-400" />
        ) : (
          <CircleAlert className="size-5 text-amber-600 dark:text-amber-400" />
        )}
      </div>
      <div className="flex-1">
        <p className="font-medium">{title}</p>
        <p className="text-sm text-muted-foreground">
          {loading ? "Checking…" : ready ? readyText : missingText}
        </p>
      </div>
    </div>
  );
}
