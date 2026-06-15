"use client";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, Zap, Shield, Layers, Download, Globe, Star } from "lucide-react";
import { SUPPORTED_RAW_FORMATS } from "@/types";

export function Hero() {
  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center px-4 pt-20 pb-16 overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-violet-600/20 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-1/3 right-1/4 w-80 h-80 bg-purple-600/15 rounded-full blur-[100px] animate-pulse [animation-delay:1s]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-fuchsia-600/5 rounded-full blur-[140px]" />
      </div>

      {/* Grid overlay */}
      <div
        className="absolute inset-0 -z-10 opacity-[0.03]"
        style={{
          backgroundImage:
            "linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />

      {/* Badge */}
      <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-violet-500/30 bg-violet-500/10 text-violet-300 text-sm font-medium mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <Star className="w-3.5 h-3.5 fill-current" />
        Free · No signup · Unlimited conversions
      </div>

      {/* Headline */}
      <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-black text-center leading-[1.05] tracking-tight max-w-5xl animate-in fade-in slide-in-from-bottom-6 duration-700 [animation-delay:100ms]">
        <span className="text-white">Convert </span>
        <span className="bg-gradient-to-r from-violet-400 via-purple-400 to-fuchsia-400 bg-clip-text text-transparent">
          RAW
        </span>
        <span className="text-white"> to </span>
        <span className="bg-gradient-to-r from-amber-400 via-orange-400 to-rose-400 bg-clip-text text-transparent">
          JPG
        </span>
        <br />
        <span className="text-white/70 text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold">
          Instantly.
        </span>
      </h1>

      {/* Subheadline */}
      <p className="mt-6 text-lg sm:text-xl text-white/50 text-center max-w-2xl leading-relaxed animate-in fade-in slide-in-from-bottom-6 duration-700 [animation-delay:200ms]">
        Batch convert any RAW camera format — CR2, NEF, ARW, RAF, DNG and more — to
        maximum-quality JPG. No quality loss. Full resolution preserved.
      </p>

      {/* CTA Buttons */}
      <div className="flex flex-wrap items-center justify-center gap-4 mt-10 animate-in fade-in slide-in-from-bottom-6 duration-700 [animation-delay:300ms]">
        <Link href="/converter" id="hero-cta-primary">
          <Button size="xl" className="group">
            Start Converting
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Button>
        </Link>
        <a
          href="#features"
          className="flex items-center gap-2 px-6 py-3.5 rounded-2xl text-white/60 hover:text-white text-base font-medium transition-colors"
        >
          Learn more
        </a>
      </div>

      {/* Format pills */}
      <div className="mt-14 flex flex-wrap justify-center gap-2 max-w-3xl animate-in fade-in duration-700 [animation-delay:500ms]">
        {SUPPORTED_RAW_FORMATS.slice(0, 12).map((fmt) => (
          <div
            key={fmt.extension}
            className="group flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 hover:border-violet-500/40 hover:bg-violet-500/10 transition-all duration-200 cursor-default"
            title={`${fmt.brand} — ${fmt.description}`}
          >
            <span className="text-xs font-mono font-bold text-white/70 uppercase group-hover:text-violet-300 transition-colors">
              .{fmt.extension}
            </span>
            <span className="hidden sm:inline text-xs text-white/30 group-hover:text-white/50">
              {fmt.brand}
            </span>
          </div>
        ))}
        <div className="flex items-center px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs text-white/30">
          +{SUPPORTED_RAW_FORMATS.length - 12} more
        </div>
      </div>

      {/* Stats row */}
      <div className="mt-16 grid grid-cols-3 gap-8 sm:gap-16 animate-in fade-in duration-700 [animation-delay:600ms]">
        {[
          { value: "22+", label: "RAW formats" },
          { value: "100%", label: "JPEG quality" },
          { value: "Batch", label: "processing" },
        ].map(({ value, label }) => (
          <div key={label} className="text-center">
            <div className="text-2xl sm:text-3xl font-black text-white">{value}</div>
            <div className="text-xs text-white/40 mt-1 uppercase tracking-wider">{label}</div>
          </div>
        ))}
      </div>
    </section>
  );
}
