"use client";

import { useState } from "react";
import Link from "next/link";
import { Leaf } from "lucide-react";

import SignInForm from "@/components/sign-in-form";
import SignUpForm from "@/components/sign-up-form";

export default function LoginPage() {
  const [showSignIn, setShowSignIn] = useState(true);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-green-50 to-emerald-100 dark:from-green-950 dark:to-emerald-900 px-4">
      <Link href="/" className="flex items-center gap-2 mb-8">
        <div className="size-10 rounded-lg bg-primary text-primary-foreground flex items-center justify-center">
          <Leaf className="size-5" />
        </div>
        <span className="text-2xl font-bold">AgriSmart</span>
      </Link>
      
      <div className="w-full max-w-md bg-background rounded-xl shadow-lg border p-8">
        {showSignIn ? (
          <SignInForm onSwitchToSignUp={() => setShowSignIn(false)} />
        ) : (
          <SignUpForm onSwitchToSignIn={() => setShowSignIn(true)} />
        )}
      </div>

      <p className="mt-8 text-sm text-muted-foreground text-center max-w-md">
        AI-powered cassava disease detection for farmers across Africa.
        Protect your crops with instant diagnosis.
      </p>
    </div>
  );
}
