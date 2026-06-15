"use client";
import { useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { UploadCloud, FolderOpen } from "lucide-react";
import { cn } from "@/lib/utils";
import { ACCEPTED_EXTENSIONS } from "@/types";

interface DropZoneProps {
  onFiles: (files: File[]) => void;
  isUploading: boolean;
  compact?: boolean;
}

const ACCEPTED_MIME: Record<string, string[]> = {
  "image/*": ACCEPTED_EXTENSIONS,
};

export function DropZone({ onFiles, isUploading, compact = false }: DropZoneProps) {
  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (acceptedFiles.length > 0) onFiles(acceptedFiles);
    },
    [onFiles]
  );

  const { getRootProps, getInputProps, isDragActive, isDragReject } =
    useDropzone({
      onDrop,
      accept: ACCEPTED_MIME,
      disabled: isUploading,
      multiple: true,
      maxFiles: 500,
    });

  return (
    <div
      {...getRootProps()}
      className={cn(
        "relative group rounded-2xl border-2 border-dashed transition-all duration-300 cursor-pointer overflow-hidden",
        compact ? "p-6" : "p-12",
        isDragActive && !isDragReject
          ? "border-violet-400 bg-violet-500/10 scale-[1.01]"
          : isDragReject
          ? "border-red-400 bg-red-500/10"
          : "border-white/20 hover:border-violet-400/60 hover:bg-violet-500/5 bg-white/[0.02]",
        isUploading && "opacity-60 cursor-not-allowed"
      )}
    >
      {/* Animated gradient background on hover */}
      <div
        className={cn(
          "absolute inset-0 bg-gradient-to-br from-violet-600/0 via-purple-600/0 to-fuchsia-600/0 transition-opacity duration-500",
          isDragActive ? "from-violet-600/5 via-purple-600/5 to-fuchsia-600/5 opacity-100" : "opacity-0 group-hover:opacity-100 group-hover:from-violet-600/3"
        )}
      />

      <input {...getInputProps()} aria-label="Upload RAW files" />

      <div className="relative flex flex-col items-center justify-center gap-4 text-center">
        {/* Icon */}
        <div
          className={cn(
            "relative flex items-center justify-center rounded-2xl transition-all duration-300",
            compact ? "w-14 h-14" : "w-20 h-20",
            isDragActive
              ? "bg-violet-500/20 scale-110"
              : "bg-white/5 group-hover:bg-violet-500/10"
          )}
        >
          <UploadCloud
            className={cn(
              "transition-all duration-300",
              compact ? "w-7 h-7" : "w-10 h-10",
              isDragActive
                ? "text-violet-300 animate-bounce"
                : "text-white/40 group-hover:text-violet-400"
            )}
          />
          {isDragActive && (
            <span className="absolute inset-0 rounded-2xl animate-ping bg-violet-500/20" />
          )}
        </div>

        {/* Text */}
        <div>
          {isDragReject ? (
            <p className="text-red-400 font-semibold">
              Unsupported file type — RAW formats only
            </p>
          ) : isDragActive ? (
            <p className={cn("font-semibold text-violet-300", compact ? "text-base" : "text-xl")}>
              Drop your RAW files here!
            </p>
          ) : (
            <>
              <p className={cn("font-semibold text-white/80", compact ? "text-sm" : "text-lg")}>
                Drag & drop RAW files here
              </p>
              <p className="text-white/40 mt-1 text-sm">or click to browse your computer</p>
            </>
          )}
        </div>

        {/* Browse button */}
        {!isDragActive && !isDragReject && (
          <div className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-violet-600/20 border border-violet-500/30 text-violet-300 text-sm font-medium hover:bg-violet-600/30 transition-colors">
            <FolderOpen className="w-4 h-4" />
            Browse Files
          </div>
        )}

        {/* Supported formats */}
        {!compact && (
          <p className="text-white/30 text-xs max-w-md">
            Supports CR2, CR3, NEF, ARW, RAF, ORF, RW2, DNG, PEF, SRW, X3F, RAW, 3FR, MRW, and more
          </p>
        )}
      </div>
    </div>
  );
}
