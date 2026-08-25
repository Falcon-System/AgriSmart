"use client";

import { useForm } from "@tanstack/react-form";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { z } from "zod";
import { useState } from "react";
import Loader from "./loader";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";

export default function SignUpForm({ onSwitchToSignIn }: { onSwitchToSignIn: () => void }) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm({
    defaultValues: {
      username: "",
      email: "",
      firstName: "",
      lastName: "",
      phoneNumber: "",
      organization: "",
      password: "",
    },
    onSubmit: async ({ value }) => {
      setIsLoading(true);
      try {
        const response = await fetch("/api/auth/register", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(value),
        });
        const data = await response.json();
        if (response.ok) {
          toast.success("Account created successfully!");
          router.push("/dashboard");
        } else {
          toast.error(data.message || "Something went wrong!");
        }
      } catch (error) {
        toast.error("Something went wrong!");
      } finally {
        setIsLoading(false);
      }
    },
    validators: {
      onSubmit: z.object({
        username: z.string().min(2, "Username must be at least 2 characters"),
        email: z.string().email("Invalid email address"),
        firstName: z.string().min(2, "First name must be at least 2 characters"),
        lastName: z.string().min(2, "Last name must be at least 2 characters"),
        phoneNumber: z.string().min(10, "Phone number must be at least 10 digits"),
        organization: z.string().optional(),
        password: z.string().min(8, "Password must be at least 8 characters"),
      }),
    },
  });

  if (isLoading) {
    return <Loader />;
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold">Create Account</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Join AgriSmart to protect your crops
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
              <Label htmlFor={field.name}>Username</Label>
              <Input
                id={field.name}
                name={field.name}
                placeholder="Your username"
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
              />
              {field.state.meta.errors.map((error, i) => (
                <p key={`${error.message || error}-${i}`} className="text-sm text-destructive">
                  {typeof error === 'string' ? error : error.message || 'Invalid input'}
                </p>
              ))}
            </div>
          )}
        </form.Field>

        <form.Field name="email">
          {(field) => (
            <div className="space-y-2">
              <Label htmlFor={field.name}>Email</Label>
              <Input
                id={field.name}
                name={field.name}
                type="email"
                placeholder="your@email.com"
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
              />
              {field.state.meta.errors.map((error, i) => (
                <p key={`${error.message || error}-${i}`} className="text-sm text-destructive">
                  {typeof error === 'string' ? error : error.message || 'Invalid input'}
                </p>
              ))}
            </div>
          )}
        </form.Field>

        <form.Field name="firstName">
          {(field) => (
            <div className="space-y-2">
              <Label htmlFor={field.name}>First Name</Label>
              <Input
                id={field.name}
                name={field.name}
                placeholder="Your first name"
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
              />
              {field.state.meta.errors.map((error, i) => (
                <p key={`${error.message || error}-${i}`} className="text-sm text-destructive">
                  {typeof error === 'string' ? error : error.message || 'Invalid input'}
                </p>
              ))}
            </div>
          )}
        </form.Field>

        <form.Field name="lastName">
          {(field) => (
            <div className="space-y-2">
              <Label htmlFor={field.name}>Last Name</Label>
              <Input
                id={field.name}
                name={field.name}
                placeholder="Your last name"
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
              />
              {field.state.meta.errors.map((error, i) => (
                <p key={`${error.message || error}-${i}`} className="text-sm text-destructive">
                  {typeof error === 'string' ? error : error.message || 'Invalid input'}
                </p>
              ))}
            </div>
          )}
        </form.Field>

        <form.Field name="phoneNumber">
          {(field) => (
            <div className="space-y-2">
              <Label htmlFor={field.name}>Phone Number</Label>
              <Input
                id={field.name}
                name={field.name}
                placeholder="Your phone number"
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
              />
              {field.state.meta.errors.map((error, i) => (
                <p key={`${error.message || error}-${i}`} className="text-sm text-destructive">
                  {typeof error === 'string' ? error : error.message || 'Invalid input'}
                </p>
              ))}
            </div>
          )}
        </form.Field>

        <form.Field name="organization">
          {(field) => (
            <div className="space-y-2">
              <Label htmlFor={field.name}>Organization / Company</Label>
              <Input
                id={field.name}
                name={field.name}
                placeholder="Your organization name"
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
              />
              {field.state.meta.errors.map((error, i) => (
                <p key={`${error.message || error}-${i}`} className="text-sm text-destructive">
                  {typeof error === 'string' ? error : error.message || 'Invalid input'}
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
                placeholder="••••••••"
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
              />
              {field.state.meta.errors.map((error, i) => (
                <p key={`${error.message || error}-${i}`} className="text-sm text-destructive">
                  {typeof error === 'string' ? error : error.message || 'Invalid input'}
                </p>
              ))}
            </div>
          )}
        </form.Field>

        <form.Subscribe>
          {(state) => (
            <Button
              type="submit"
              className="w-full"
              disabled={!state.canSubmit || state.isSubmitting}
            >
              {state.isSubmitting ? "Creating account..." : "Sign Up"}
            </Button>
          )}
        </form.Subscribe>
      </form>

      <div className="text-center">
        <Button
          variant="link"
          onClick={onSwitchToSignIn}
          className="text-sm"
        >
          Already have an account? Sign In
        </Button>
      </div>
    </div>
  );
}