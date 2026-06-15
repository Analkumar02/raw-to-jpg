"use client";
import { ConversionJob } from "@/types";
import { cn, formatBytes, formatDimensions } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Download,
  X,
  CheckCircle2,
  AlertCircle,
  Clock,
  Loader2,
  ImageIcon,
  ArrowUpRight,
} from "lucide-react";
import Image from "next/image";

interface FileCardProps {
  job: ConversionJob;
  onRemove: (jobId: string) => void;
  onPreview: (job: ConversionJob) => void;
}

const STATUS_CONFIG = {
  queued: {
    label: "Queued",
    color: "text-white/50",
    bg: "bg-white/5 border-white/10",
    icon: Clock,
  },
  uploading: {
    label: "Uploading…",
    color: "text-blue-400",
    bg: "bg-blue-500/5 border-blue-500/20",
    icon: Loader2,
  },
  uploaded: {
    label: "Ready",
    color: "text-cyan-400",
    bg: "bg-cyan-500/5 border-cyan-500/20",
    icon: Clock,
  },
  processing: {
    label: "Converting…",
    color: "text-amber-400",
    bg: "bg-amber-500/5 border-amber-500/20",
    icon: Loader2,
  },
  done: {
    label: "Done",
    color: "text-emerald-400",
    bg: "bg-emerald-500/5 border-emerald-500/20",
    icon: CheckCircle2,
  },
  error: {
    label: "Error",
    color: "text-red-400",
    bg: "bg-red-500/5 border-red-500/20",
    icon: AlertCircle,
  },
};

export function FileCard({ job, onRemove, onPreview }: FileCardProps) {
  const cfg = STATUS_CONFIG[job.status];
  const StatusIcon = cfg.icon;
  const isAnimating = job.status === "uploading" || job.status === "processing";
  const isDone = job.status === "done";
  const isError = job.status === "error";
  const isPending = job.jobId.startsWith("pending-");

  const handleDownload = () => {
    if (!job.downloadUrl) return;
    const a = document.createElement("a");
    a.href = job.downloadUrl;
    const baseName = job.originalName.replace(/\.[^.]+$/, "");
    a.download = `${baseName}.jpg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div
      className={cn(
        "group relative flex gap-3 p-3 rounded-xl border transition-all duration-300",
        cfg.bg,
        isDone && "hover:border-emerald-500/40 hover:bg-emerald-500/8"
      )}
    >
      {/* Thumbnail */}
      <div
        className="relative flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden bg-white/5 border border-white/10 cursor-pointer"
        onClick={() => isDone && onPreview(job)}
      >
        {isDone && job.thumbnailUrl ? (
          <>
            <Image
              src={job.thumbnailUrl}
              alt={job.originalName}
              fill
              className="object-cover"
              unoptimized
              sizes="64px"
            />
            <div className="absolute inset-0 bg-black/0 hover:bg-black/20 transition-colors flex items-center justify-center opacity-0 hover:opacity-100">
              <ArrowUpRight className="w-4 h-4 text-white" />
            </div>
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <ImageIcon
              className={cn(
                "w-6 h-6 transition-all",
                isAnimating ? "text-amber-400/50 animate-pulse" : "text-white/20"
              )}
            />
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        {/* Filename */}
        <p className="text-white/90 text-sm font-medium truncate pr-8" title={job.originalName}>
          {job.originalName}
        </p>

        {/* Status badge */}
        <div className="flex items-center gap-1.5 mt-1">
          <StatusIcon
            className={cn("w-3 h-3 flex-shrink-0", cfg.color, isAnimating && "animate-spin")}
          />
          <span className={cn("text-xs font-medium", cfg.color)}>{cfg.label}</span>
          {isError && job.error && (
            <span className="text-xs text-red-400/70 truncate" title={job.error}>
              — {job.error}
            </span>
          )}
        </div>

        {/* Progress bar */}
        {(job.status === "processing" || job.status === "uploading") && (
          <div className="mt-2 h-1 rounded-full bg-white/10 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-violet-500 to-purple-400 transition-all duration-500"
              style={{ width: `${job.progress || 0}%` }}
            />
          </div>
        )}

        {/* File info */}
        <div className="flex items-center gap-3 mt-1.5 text-xs text-white/35">
          {!isPending && (
            <span>{formatBytes(job.originalSize)}</span>
          )}
          {isDone && job.convertedSize && (
            <>
              <span className="text-white/20">→</span>
              <span className="text-emerald-400/70">{formatBytes(job.convertedSize)}</span>
            </>
          )}
          {isDone && job.width && job.height && (
            <>
              <span className="text-white/20">·</span>
              <span>{formatDimensions(job.width, job.height)}</span>
            </>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="absolute right-2 top-2 flex items-center gap-1">
        {isDone && job.downloadUrl && (
          <Button
            size="icon-sm"
            variant="success"
            onClick={handleDownload}
            title="Download JPG"
            aria-label={`Download ${job.originalName} as JPG`}
          >
            <Download className="w-3.5 h-3.5" />
          </Button>
        )}
        <Button
          size="icon-sm"
          variant="ghost"
          onClick={() => onRemove(job.jobId)}
          title="Remove file"
          aria-label={`Remove ${job.originalName}`}
          className="opacity-0 group-hover:opacity-100 text-white/30 hover:text-red-400"
        >
          <X className="w-3.5 h-3.5" />
        </Button>
      </div>
    </div>
  );
}
