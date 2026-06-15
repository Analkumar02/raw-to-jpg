"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Camera, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export function Navbar() {
  const pathname = usePathname();

  return (
    <header className="fixed top-0 left-0 right-0 z-40">
      <div className="mx-auto max-w-6xl px-4 py-4">
        <nav
          className="flex items-center justify-between px-5 py-3 rounded-2xl bg-black/40 backdrop-blur-xl border border-white/10 shadow-xl"
          aria-label="Main navigation"
        >
          {/* Logo */}
          <Link
            href="/"
            className="flex items-center gap-2.5 group"
            aria-label="RAW to JPG — Home"
          >
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-violet-600 to-purple-700 shadow-lg shadow-violet-500/30 group-hover:shadow-violet-500/50 transition-all">
              <Camera className="w-4 h-4 text-white" />
            </div>
            <span className="text-white font-bold text-base tracking-tight">
              RAW<span className="text-violet-400">→</span>JPG
            </span>
          </Link>

          {/* Nav links */}
          <div className="hidden sm:flex items-center gap-1">
            {[
              { href: "/", label: "Home" },
              { href: "#features", label: "Features" },
              { href: "/converter", label: "Converter" },
            ].map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200",
                  pathname === href
                    ? "text-white bg-white/10"
                    : "text-white/50 hover:text-white hover:bg-white/5"
                )}
              >
                {label}
              </Link>
            ))}
          </div>

          {/* CTA */}
          <Link href="/converter" id="nav-cta">
            <Button size="sm">
              Convert Now
              <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </Link>
        </nav>
      </div>
    </header>
  );
}
