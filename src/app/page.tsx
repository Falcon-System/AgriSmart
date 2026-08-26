"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import {
  Camera,
  Zap,
  Globe,
  FileText,
  ArrowRight,
  Leaf,
  Lock,
  MessageCircle,
  Map,
  Sprout,
  Apple,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const stats = [
  {
    value: "$220B+",
    label: "Annual global economic losses from crop diseases (FAO)",
  },
  {
    value: "20%–40%",
    label: "Average annual crop yield saved through early AI detection",
  },
  {
    value: "3",
    label: "Major categories: Root & Tuber, Solanaceous, and Tree Fruits",
  },
  {
    value: "95%+",
    label: "Diagnostic accuracy across leaf, fruit, stem, and root lesions",
  },
];

const cropGroups = [
  {
    icon: Sprout,
    title: "Root & Tuber Crops",
    crops: "Cassava",
    diseases:
      "Cassava Mosaic Disease (CMD), Cassava Brown Streak Disease (CBSD), Bacterial Blight (CBB), Green Mite Damage",
    color: "bg-amber-500",
  },
  {
    icon: Leaf,
    title: "Solanaceous Vegetables",
    crops: "Tomato, Potato, Bell Pepper & Eggplant",
    diseases:
      "Early Blight (Alternaria), Late Blight (Phytophthora), Bacterial Spot, Yellow Leaf Curl Virus (TYLCV), Fusarium Wilt",
    color: "bg-red-500",
  },
  {
    icon: Apple,
    title: "Tree Fruits",
    crops: "Mango, Apple, Citrus, Avocado & Peach",
    diseases: "Anthracnose, Citrus Greening (HLB), Apple Scab, Powdery Mildew, Black Spot",
    color: "bg-emerald-500",
  },
];

const features = [
  {
    icon: Camera,
    title: "Multi-Crop Diagnostic Engine",
    description:
      "Seamlessly switch between root crops, solanaceous vegetables, and fruit orchards with unified image analysis.",
  },
  {
    icon: MessageCircle,
    title: "AgriSmart Horticultural AI Advisor",
    description:
      "An intelligent conversational assistant that answers follow-up agronomic questions tailored directly to your scan history.",
  },
  {
    icon: Map,
    title: "Comprehensive Field Management",
    description:
      "Group and monitor farm health by zones, fields, or specific orchards to track disease spread and recovery over time.",
  },
  {
    icon: FileText,
    title: "Actionable Treatment Protocols",
    description:
      "Get clear, step-by-step guidance covering organic bio-pesticides, safe chemical applications, and cultural sanitation practices.",
  },
  {
    icon: Zap,
    title: "Offline-Ready Field Architecture",
    description:
      "Designed for rural and remote field conditions—capture images offline and sync analysis once reconnected.",
  },
  {
    icon: Globe,
    title: "Multilingual Support",
    description:
      "Available in English, Amharic, Swahili, French, and local regional languages to support growers globally.",
  },
];

export default function LandingPage() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const token = document.cookie.split("; ").find((row) => row.startsWith("token="));
    setIsLoggedIn(!!token);
  }, []);

  const scanHref = isLoggedIn ? "/dashboard/scans" : "/login";
  const dashboardHref = isLoggedIn ? "/dashboard" : "/login";

  return (
    <div className="min-h-screen font-sans">
      <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img
            src="/casavva.jpg"
            alt="Horticultural crops in the field"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-green-900/60 backdrop-blur-[2px]" />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-background" />
        </div>

        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-md border border-white/30 rounded-full px-6 py-2 animate-in fade-in slide-in-from-top-4 duration-1000">
              <Leaf className="size-4 text-green-300" />
              <span className="text-sm font-medium text-white tracking-wide uppercase">
                Multi-Crop Horticultural AI
              </span>
            </div>

            <h1 className="max-w-5xl mx-auto text-3xl md:text-5xl lg:text-6xl font-bold text-white tracking-tight leading-[1.1] animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-200">
              Protect Your <span className="text-green-400">Horticultural Crops</span> with AI-Powered Intelligence
            </h1>

            <p className="text-lg md:text-2xl text-white/90 max-w-3xl mx-auto font-light leading-relaxed animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-300">
              Instantly diagnose crop diseases, access targeted treatment protocols, and optimize yield across{" "}
              <strong className="font-semibold text-white">Cassava, Solanaceous Vegetables, and Tree Fruits</strong>{" "}
              using advanced computer vision and AgriSmart agronomy.
            </p>

            <div className="flex flex-col sm:flex-row gap-6 justify-center pt-8 animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-500">
              <Button
                size="lg"
                className="bg-green-500 hover:bg-green-600 text-white rounded-full px-10 py-7 text-lg shadow-xl shadow-green-900/20 transition-all hover:scale-105 active:scale-95"
                render={
                  <Link href={scanHref}>
                    {isLoggedIn ? <Camera className="mr-3 size-6" /> : <Lock className="mr-3 size-6" />}
                    Start Free Scan
                  </Link>
                }
              />
              <Button
                size="lg"
                variant="outline"
                className="bg-white/10 hover:bg-white/20 text-white border-white/40 backdrop-blur-md rounded-full px-10 py-7 text-lg transition-all hover:scale-105 active:scale-95"
                render={
                  <Link href={dashboardHref}>
                    Explore Enterprise Dashboard
                    <ArrowRight className="ml-3 size-6" />
                  </Link>
                }
              />
            </div>
          </div>
        </div>
      </section>

      <section className="relative z-20 -mt-16 pb-20">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {stats.map((stat) => (
              <Card
                key={stat.label}
                className="bg-background/80 backdrop-blur-xl border-green-100/20 shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-1 rounded-[5px]"
              >
                <CardContent className="p-8 text-center">
                  <div className="text-4xl md:text-5xl font-bold text-green-600 mb-2 tracking-tight">
                    {stat.value}
                  </div>
                  <div className="text-xs md:text-sm font-medium text-muted-foreground leading-snug">
                    {stat.label}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">How It Works</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Three simple steps to diagnose diseases and protect your crop yields in real time.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {[
              {
                step: "1",
                title: "Select Crop & Scan",
                description:
                  "Choose your crop category (Root, Solanaceous, or Tree Fruit) and upload a photo of the affected leaf, fruit, or stem using your smartphone camera.",
              },
              {
                step: "2",
                title: "AI Precision Analysis",
                description:
                  "Our multi-crop computer vision engine scans for pathogen visual indicators, evaluating lesion coverage to provide instant severity grading and confidence scores.",
              },
              {
                step: "3",
                title: "Get Targeted Treatment",
                description:
                  "Receive localized chemical, biological, and cultural treatment protocols, then Ask AI for simple next steps in the field.",
              },
            ].map((item) => (
              <div key={item.step} className="text-center">
                <div className="size-16 rounded-full bg-primary/10 text-primary flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                  {item.step}
                </div>
                <h3 className="text-xl font-semibold mb-2">{item.title}</h3>
                <p className="text-muted-foreground">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="supported-crops" className="py-20 bg-muted/50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Diseases & Crops We Detect</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Early detection prevents disease proliferation and safeguards up to 70% of threatened farm yields.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {cropGroups.map((group) => (
              <Card key={group.title} className="h-full">
                <CardContent className="p-6 space-y-4">
                  <div className={`size-12 rounded-lg ${group.color} text-white flex items-center justify-center`}>
                    <group.icon className="size-6" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">{group.title}</h3>
                    <p className="text-sm font-medium text-primary mt-1">{group.crops}</p>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">{group.diseases}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Platform Core Features</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Everything you need to manage crop health and optimize farm profitability.
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
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="py-32 relative overflow-hidden">
        <div className="absolute inset-0 bg-green-600" />
        <div className="absolute inset-0 bg-gradient-to-br from-green-600 via-green-700 to-emerald-800 opacity-90" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.1)_1px,transparent_0)] bg-[size:40px_40px]" />

        <div className="container mx-auto px-4 relative z-10 text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6 tracking-tight">
            Ready to Safeguard Your Harvest?
          </h2>
          <p className="text-xl text-white/80 mb-12 max-w-2xl mx-auto font-light">
            Join commercial growers, agronomic advisors, and smallholder farmers using AgriSmart to detect diseases
            early, minimize pesticide waste, and secure high-value crop yields.
          </p>
          <div className="flex flex-col sm:flex-row gap-6 justify-center">
            <Button
              size="lg"
              className="bg-white text-green-700 hover:bg-white/90 rounded-full px-10 py-7 text-lg shadow-xl shadow-black/10 transition-all hover:scale-105 active:scale-95"
              render={<Link href={scanHref}>Get Started Free</Link>}
            />
            <Button
              size="lg"
              variant="outline"
              className="bg-green-500/20 hover:bg-green-500/30 text-white border-white/40 rounded-full px-10 py-7 text-lg transition-all hover:scale-105 active:scale-95"
              render={<Link href={dashboardHref}>Request Demo</Link>}
            />
          </div>
        </div>
      </section>

      <footer className="py-12 border-t">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="size-8 rounded-lg bg-primary text-primary-foreground flex items-center justify-center">
                <Leaf className="size-4" />
              </div>
              <span className="font-semibold">AgriSmart</span>
            </div>
            <nav className="flex flex-wrap justify-center gap-6 text-sm text-muted-foreground">
              <Link href="/dashboard" className="hover:text-foreground">
                Dashboard
              </Link>
              <Link href="/dashboard/scans" className="hover:text-foreground">
                Multi-Crop Diagnostics
              </Link>
              <Link href="/dashboard/chat" className="hover:text-foreground">
                AI Advisor
              </Link>
              <Link href="/#supported-crops" className="hover:text-foreground">
                Supported Crops
              </Link>
              <Link href="/dashboard/scans" className="hover:text-foreground">
                Scan (Beta)
              </Link>
            </nav>
            <p className="text-sm text-muted-foreground text-center md:text-right">
              © 2026 AgriSmart. All rights reserved. Empowering sustainable agriculture through intelligent diagnostics.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
