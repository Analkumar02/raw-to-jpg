"use client";
import { ConversionJob } from "@/types";
import { Button } from "@/components/ui/button";
import { formatBytes } from "@/lib/utils";
import {
  Archive,
  Download,
  CheckCircle2,
  Loader2,
  X,
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface DownloadBarProps {
  jobs: ConversionJob[];
  onDownloadZip: (jobIds: string[]) => Promise<void>;
  onClose?: () => void;
}

export function DownloadBar({ jobs, onDownloadZip, onClose }: DownloadBarProps) {
  const [isDownloading, setIsDownloading] = useState(false);

  const doneJobs = jobs.filter((j) => j.status === "done");
  const totalConverted = doneJobs.reduce((sum, j) => sum + (j.convertedSize || 0), 0);

  if (doneJobs.length === 0) return null;

  const handleDownloadAll = async () => {
    setIsDownloading(true);
    try {
      await onDownloadZip(doneJobs.map((j) => j.jobId));
    } catch (err) {
      console.error("ZIP download failed:", err);
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div
      className={cn(
        "sticky bottom-0 z-10",
        "flex items-center justify-between gap-3 flex-wrap",
        "px-5 py-3.5 rounded-2xl",
        "bg-gradient-to-r from-emerald-950/90 to-teal-950/90 backdrop-blur-xl",
        "border border-emerald-500/20",
        "shadow-[0_-4px_40px_rgba(16,185,129,0.1)]",
        "animate-in slide-in-from-bottom-4 duration-300"
      )}
    >
      {/* Left: summary */}
      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-emerald-500/20">
          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
        </div>
        <div>
          <p className="text-white text-sm font-semibold">
            {doneJobs.length} file{doneJobs.length !== 1 ? "s" : ""} converted
          </p>
          <p className="text-emerald-300/60 text-xs">
            Total: {formatBytes(totalConverted)}
          </p>
        </div>
      </div>

      {/* Right: actions */}
      <div className="flex items-center gap-2">
        <Button
          size="sm"
          variant="outline"
          onClick={handleDownloadAll}
          disabled={isDownloading}
          aria-label="Download all converted images as ZIP"
          className="border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/10"
        >
          {isDownloading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Archive className="w-4 h-4" />
          )}
          {isDownloading ? "Preparing ZIP…" : "Download All as ZIP"}
        </Button>
      </div>
    </div>
  );
}
