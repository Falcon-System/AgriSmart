"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import {
  Camera,
  Smartphone,
  Shield,
  Zap,
  Globe,
  FileText,
  ArrowRight,
  CheckCircle2,
  Leaf,
  Lock,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const features = [
  {
    icon: Camera,
    title: "Instant Detection",
    description:
      "Snap a photo of any cassava leaf and get instant disease diagnosis powered by AI",
  },
  {
    icon: Shield,
    title: "Yield Protection",
    description:
      "Protect 40-70% of your crop yield through early disease detection and treatment",
  },
  {
    icon: Zap,
    title: "Offline Ready",
    description:
      "Works even in remote areas with limited connectivity using on-device AI",
  },
  {
    icon: Globe,
    title: "Multi-language",
    description:
      "Available in English, Amharic, Swahili, and French for farmers across Africa",
  },
  {
    icon: FileText,
    title: "Treatment Guide",
    description:
      "Get detailed treatment recommendations and prevention tips for each disease",
  },
  {
    icon: Smartphone,
    title: "Mobile First",
    description:
      "Optimized for mobile use in the field with camera-ready scanning",
  },
];

const stats = [
  { value: "800M+", label: "Farmers Growing Cassava" },
  { value: "$3B", label: "Annual Losses from Disease" },
  { value: "63%", label: "African Production" },
  { value: "95%+", label: "Detection Accuracy" },
];

const diseases = [
  {
    name: "CMD",
    fullName: "Cassava Mosaic Disease",
    loss: "80-100%",
    color: "bg-red-500",
  },
  {
    name: "CBSD",
    fullName: "Cassava Brown Streak",
    loss: "60-100%",
    color: "bg-orange-500",
  },
  {
    name: "CBB",
    fullName: "Bacterial Blight",
    loss: "20-75%",
    color: "bg-yellow-500",
  },
  {
    name: "GMD",
    fullName: "Green Mite Damage",
    loss: "30-80%",
    color: "bg-amber-500",
  },
];

export default function LandingPage() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const token = document.cookie.split('; ').find(row => row.startsWith('token='));
    setIsLoggedIn(!!token);
  }, []);

  return (
    <div className="min-h-screen font-sans">
      {/* Hero Section with Image Background */}
      <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden">
        {/* Background Image with Overlay */}
        <div className="absolute inset-0 z-0">
          <img
            src="/casavva.jpg"
            alt="Cassava Field"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-green-900/60 backdrop-blur-[2px]" />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-background" />
        </div>

        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-md border border-white/30 rounded-full px-6 py-2 animate-in fade-in slide-in-from-top-4 duration-1000">
              <Leaf className="size-4 text-green-300" />
              <span className="text-sm font-medium text-white tracking-wide uppercase">AI-Powered Agriculture</span>
            </div>

            <h1 className="max-w-5xl text-2xl md:text-4xl lg:text-6xl font-bold text-white tracking-tight leading-[1.1] animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-200">
              Protect Your <span className="text-green-400">Cassava</span> Crops with AI
            </h1>

            <p className="text-xl md:text-2xl text-white/90 max-w-2xl mx-auto font-light leading-relaxed animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-300">
              Instantly detect diseases, get treatment recommendations, and safeguard your yield with advanced mobile scanning technology.
            </p>

            <div className="flex flex-col sm:flex-row gap-6 justify-center pt-8 animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-500">
              <Button
                size="lg"
                className="bg-green-500 hover:bg-green-600 text-white rounded-full px-10 py-7 text-lg shadow-xl shadow-green-900/20 transition-all hover:scale-105 active:scale-95"
                render={
                  <Link href={isLoggedIn ? "/dashboard" : "/login"}>
                    {isLoggedIn ? (
                      <Camera className="mr-3 size-6" />
                    ) : (
                      <Lock className="mr-3 size-6" />
                    )}
                    {isLoggedIn ? "Try Now" : "Register to Scan"}
                  </Link>
                }
              />
              {!isLoggedIn && (
                <Button
                  size="lg"
                  variant="outline"
                  className="bg-white/10 hover:bg-white/20 text-white border-white/40 backdrop-blur-md rounded-full px-10 py-7 text-lg transition-all hover:scale-105 active:scale-95"
                  render={
                    <Link href="/login">
                      Get Started
                      <ArrowRight className="ml-3 size-6" />
                    </Link>
                  }
                />
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section with Modern Design */}
      <section className="relative z-20 -mt-16 pb-20">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {stats.map((stat, i) => (
              <Card key={stat.label} className="bg-background/80 backdrop-blur-xl border-green-100/20 shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-1 rounded-[5px]">
                <CardContent className="p-8 text-center">
                  <div className="text-4xl md:text-5xl font-bold text-green-600 mb-2 tracking-tight">
                    {stat.value}
                  </div>
                  <div className="text-sm font-medium text-muted-foreground uppercase tracking-widest">{stat.label}</div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">How It Works</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Three simple steps to protect your cassava crops from devastating diseases
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {[
              {
                step: "1",
                title: "Scan Leaf",
                description:
                  "Take a photo of any cassava leaf using your smartphone camera",
              },
              {
                step: "2",
                title: "AI Analysis",
                description:
                  "Our AI instantly analyzes the leaf for signs of disease and damage",
              },
              {
                step: "3",
                title: "Get Treatment",
                description:
                  "Receive detailed treatment recommendations and prevention tips",
              },
            ].map((item, index) => (
              <div key={item.step} className="text-center">
                <div className="size-16 rounded-full bg-primary/10 text-primary flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                  {item.step}
                </div>
                <h3 className="text-xl font-semibold mb-2">{item.title}</h3>
                <p className="text-muted-foreground">{item.description}</p>
                {index < 2 && (
                  <ArrowRight className="hidden md:block size-6 text-muted-foreground mx-auto mt-6" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Diseases Section */}
      <section className="py-20 bg-muted/50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Diseases We Detect</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Early detection of these devastating diseases can save up to 70% of your crop yield
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto">
            {diseases.map((disease) => (
              <Card key={disease.name}>
                <CardContent className="p-6">
                  <div
                    className={`size-12 rounded-lg ${disease.color} text-white flex items-center justify-center font-bold mb-4`}
                  >
                    {disease.name}
                  </div>
                  <h3 className="font-semibold mb-1">{disease.fullName}</h3>
                  <p className="text-sm text-muted-foreground">
                    Potential yield loss: <strong>{disease.loss}</strong>
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Powerful Features</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Everything you need to protect and manage your cassava crops effectively
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {features.map((feature) => (
              <Card key={feature.title}>
                <CardContent className="p-6">
                  <div className="size-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                    <feature.icon className="size-6 text-primary" />
                  </div>
                  <h3 className="font-semibold mb-2">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-32 relative overflow-hidden">
        <div className="absolute inset-0 bg-green-600" />
        <div className="absolute inset-0 bg-gradient-to-br from-green-600 via-green-700 to-emerald-800 opacity-90" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.1)_1px,transparent_0)] bg-[size:40px_40px]" />

        <div className="container mx-auto px-4 relative z-10 text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6 tracking-tight">
            Ready to Protect Your Crops?
          </h2>
          <p className="text-xl text-white/80 mb-12 max-w-2xl mx-auto font-light">
            Join thousands of farmers using AgriSmart to detect diseases early
            and protect their cassava yield.
          </p>
          <div className="flex flex-col sm:flex-row gap-6 justify-center">
            <Button
              size="lg"
              className="bg-white text-green-700 hover:bg-white/90 rounded-full px-10 py-7 text-lg shadow-xl shadow-black/10 transition-all hover:scale-105 active:scale-95"
              render={
                <Link href={isLoggedIn ? "/dashboard" : "/login"}>
                  {isLoggedIn ? (
                    <Smartphone className="mr-3 size-6" />
                  ) : (
                    <Lock className="mr-3 size-6" />
                  )}
                  {isLoggedIn ? "Go to App" : "Sign Up to Start"}
                </Link>
              }
            />
            <Button
              size="lg"
              variant="outline"
              className="bg-green-500/20 hover:bg-green-500/30 text-white border-white/40 rounded-full px-10 py-7 text-lg transition-all hover:scale-105 active:scale-95"
              render={
                <Link href={isLoggedIn ? "/dashboard" : "/login"}>
                  {isLoggedIn ? "Go to Dashboard" : "Get Started"}
                </Link>
              }
            />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="size-8 rounded-lg bg-primary text-primary-foreground flex items-center justify-center">
                <Leaf className="size-4" />
              </div>
              <span className="font-semibold">AgriSmart</span>
            </div>
            <nav className="flex gap-6 text-sm text-muted-foreground">
              <Link href="/dashboard" className="hover:text-foreground">
                Dashboard
              </Link>
              <Link href="/dashboard/diseases" className="hover:text-foreground">
                Diseases
              </Link>
              <Link href="/dashboard/chat" className="hover:text-foreground">
                AI Chat
              </Link>
              <Link href="/dashboard/scans" className="hover:text-foreground">
                Scan (Beta)
              </Link>
            </nav>
            <p className="text-sm text-muted-foreground">
              © 2024 AgriSmart. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
