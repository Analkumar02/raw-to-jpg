"use client";
import { ConversionJob } from "@/types";
import { FileCard } from "./FileCard";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Play,
  Trash2,
  Filter,
  Files,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Clock,
} from "lucide-react";
import { useState, useMemo } from "react";

type FilterTab = "all" | "processing" | "done" | "error";

interface FileQueueProps {
  jobs: ConversionJob[];
  onRemove: (jobId: string) => void;
  onClearAll: () => void;
  onConvertAll: () => void;
  onPreview: (job: ConversionJob) => void;
  isConverting: boolean;
}

const TAB_CONFIG: Array<{ key: FilterTab; label: string; icon: React.ElementType }> = [
  { key: "all", label: "All", icon: Files },
  { key: "processing", label: "Active", icon: Loader2 },
  { key: "done", label: "Done", icon: CheckCircle2 },
  { key: "error", label: "Errors", icon: AlertCircle },
];

export function FileQueue({
  jobs,
  onRemove,
  onClearAll,
  onConvertAll,
  onPreview,
  isConverting,
}: FileQueueProps) {
  const [activeFilter, setActiveFilter] = useState<FilterTab>("all");

  const counts = useMemo(() => ({
    all: jobs.length,
    processing: jobs.filter((j) => j.status === "processing" || j.status === "uploading" || j.status === "uploaded" || j.status === "queued").length,
    done: jobs.filter((j) => j.status === "done").length,
    error: jobs.filter((j) => j.status === "error").length,
  }), [jobs]);

  const filteredJobs = useMemo(() => {
    switch (activeFilter) {
      case "processing":
        return jobs.filter((j) =>
          ["processing", "uploading", "uploaded", "queued"].includes(j.status)
        );
      case "done":
        return jobs.filter((j) => j.status === "done");
      case "error":
        return jobs.filter((j) => j.status === "error");
      default:
        return jobs;
    }
  }, [jobs, activeFilter]);

  const hasConvertible = jobs.some(
    (j) => j.status === "uploaded" && !j.jobId.startsWith("pending-")
  );

  if (jobs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
        <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center">
          <Clock className="w-8 h-8 text-white/20" />
        </div>
        <p className="text-white/30 text-sm">No files in queue yet</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-white/60 text-sm">{jobs.length} file{jobs.length !== 1 ? "s" : ""}</span>
        </div>
        <div className="flex items-center gap-2">
          {hasConvertible && (
            <Button
              size="sm"
              onClick={onConvertAll}
              disabled={isConverting}
              aria-label="Convert all uploaded files"
            >
              <Play className="w-3.5 h-3.5" />
              Convert All
            </Button>
          )}
          <Button
            size="sm"
            variant="destructive"
            onClick={onClearAll}
            aria-label="Clear all files from queue"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Clear All
          </Button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-1 p-1 rounded-xl bg-white/5 border border-white/10">
        {TAB_CONFIG.map(({ key, label, icon: Icon }) => {
          const count = counts[key];
          const isActive = activeFilter === key;
          return (
            <button
              key={key}
              onClick={() => setActiveFilter(key)}
              className={cn(
                "flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-xs font-medium transition-all duration-200 cursor-pointer",
                isActive
                  ? "bg-white/10 text-white shadow-sm"
                  : "text-white/40 hover:text-white/70"
              )}
              aria-label={`Filter by ${label}`}
            >
              <Icon className={cn("w-3 h-3", isActive && key === "processing" && "animate-spin")} />
              <span className="hidden sm:inline">{label}</span>
              {count > 0 && (
                <span
                  className={cn(
                    "text-xs px-1.5 py-0.5 rounded-full min-w-[20px] text-center",
                    isActive ? "bg-white/20" : "bg-white/5"
                  )}
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* File list */}
      <div className="flex flex-col gap-2 max-h-[540px] overflow-y-auto pr-1 scrollbar-thin">
        {filteredJobs.length === 0 ? (
          <div className="py-8 text-center text-white/30 text-sm">
            No files in this category
          </div>
        ) : (
          filteredJobs.map((job) => (
            <FileCard
              key={job.jobId}
              job={job}
              onRemove={onRemove}
              onPreview={onPreview}
            />
          ))
        )}
      </div>
    </div>
  );
}
