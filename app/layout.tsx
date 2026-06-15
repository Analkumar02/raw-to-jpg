import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/Navbar";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "RAW to JPG Converter — Free Online RAW Image Converter",
    template: "%s | RAW to JPG Converter",
  },
  description:
    "Convert any RAW camera image (CR2, NEF, ARW, RAF, DNG and 18+ formats) to high-quality JPG online. Free, fast, batch processing with maximum quality output.",
  keywords: [
    "RAW to JPG",
    "RAW converter",
    "CR2 to JPG",
    "NEF to JPG",
    "ARW to JPG",
    "DNG to JPG",
    "RAW image converter",
    "batch RAW conversion",
    "free RAW converter",
  ],
  authors: [{ name: "RAW to JPG Converter" }],
  openGraph: {
    title: "RAW to JPG Converter — Free, Fast, Batch Processing",
    description:
      "Convert CR2, NEF, ARW, RAF, DNG and 18+ RAW formats to high-quality JPG. Free online tool.",
    type: "website",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  themeColor: "#080810",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} h-full`}>
      <body className="min-h-full flex flex-col bg-[#080810] text-white antialiased">
        <Navbar />
        <main className="flex-1">{children}</main>
        <footer className="border-t border-white/5 py-8 text-center text-white/25 text-sm">
          <p>RAW to JPG Converter · Free, private, and unlimited</p>
          <p className="mt-1 text-xs text-white/15">
            Files are auto-deleted after 1 hour · No data is stored permanently
          </p>
        </footer>
      </body>
    </html>
  );
}
