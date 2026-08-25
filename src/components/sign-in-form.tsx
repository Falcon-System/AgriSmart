"use client";

import { useForm } from "@tanstack/react-form";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import z from "zod";
import { useState } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";

export default function SignInForm({ onSwitchToSignUp }: { onSwitchToSignUp: () => void }) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm({
    defaultValues: {
      username: "",
      password: "",
    },
    onSubmit: async ({ value }) => {
      setIsLoading(true);
      try {
        const response = await fetch("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            username: value.username.trim(),
            password: value.password,
          }),
        });
        const data = await response.json();
        if (response.ok) {
          toast.success("Welcome back!");
          router.push("/dashboard");
          router.refresh();
        } else {
          toast.error(data.message || "Could not sign in. Check username and password.");
        }
      } catch {
        toast.error("Could not reach the server. Is pnpm dev running?");
      } finally {
        setIsLoading(false);
      }
    },
    validators: {
      onSubmit: z.object({
        username: z.string().min(2, "Enter your username, email, or phone number"),
        password: z.string().min(8, "Password must be at least 8 characters"),
      }),
    },
  });

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold">Welcome Back</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Sign in to your AgriSmart account
        </p>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          e.stopPropagation();
          form.handleSubmit();
        }}
        className="space-y-4"
      >
        <form.Field name="username">
          {(field) => (
            <div className="space-y-2">
              <Label htmlFor={field.name}>Username, email, or phone</Label>
              <Input
                id={field.name}
                name={field.name}
                autoComplete="username"
                placeholder="farmer"
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
              />
              {field.state.meta.errors.map((error, i) => (
                <p key={`${error.message || error}-${i}`} className="text-sm text-destructive">
                  {typeof error === "string" ? error : error.message || "Invalid input"}
                </p>
              ))}
            </div>
          )}
        </form.Field>

        <form.Field name="password">
          {(field) => (
            <div className="space-y-2">
              <Label htmlFor={field.name}>Password</Label>
              <Input
                id={field.name}
                name={field.name}
                type="password"
                autoComplete="current-password"
                placeholder="FarmDemo123"
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
              />
              {field.state.meta.errors.map((error, i) => (
                <p key={`${error.message || error}-${i}`} className="text-sm text-destructive">
                  {typeof error === "string" ? error : error.message || "Invalid input"}
                </p>
              ))}
            </div>
          )}
        </form.Field>

        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? "Signing in..." : "Sign In"}
        </Button>
      </form>

      <div className="rounded-xl bg-muted/60 p-3 text-xs text-muted-foreground space-y-1">
        <p className="font-semibold text-foreground">Demo farmer login</p>
        <p>Username: <span className="font-mono text-foreground">farmer</span></p>
        <p>Password: <span className="font-mono text-foreground">FarmDemo123</span></p>
      </div>

      <div className="text-center">
        <Button variant="link" onClick={onSwitchToSignUp} className="text-sm">
          Don&apos;t have an account? Sign Up
        </Button>
      </div>
    </div>
  );
}
