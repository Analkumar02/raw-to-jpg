import { Hero } from "@/components/landing/Hero";
import { Features } from "@/components/landing/Features";
import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

export const metadata: Metadata = {
  title: "RAW to JPG Converter — Free Online RAW Image Converter",
  description:
    "Convert CR2, NEF, ARW, RAF, DNG and 18+ RAW formats to maximum-quality JPG. Free, batch processing, no signup required.",
};

export default function HomePage() {
  return (
    <>
      <Hero />
      <Features />

      {/* Final CTA section */}
      <section className="relative px-4 py-24 text-center overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-violet-600/10 rounded-full blur-[100px]" />
        </div>
        <div className="max-w-2xl mx-auto">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-white mb-6">
            Ready to convert your
            <br />
            <span className="bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-transparent">
              RAW files?
            </span>
          </h2>
          <p className="text-white/40 text-lg mb-10">
            No signup. No limits. Just fast, high-quality conversions.
          </p>
          <Link href="/converter" id="footer-cta">
            <Button size="xl" className="group">
              Open Converter
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Button>
          </Link>
        </div>
      </section>
    </>
  );
}
