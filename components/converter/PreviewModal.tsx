"use client";
import { ConversionJob } from "@/types";
import { formatBytes, formatDimensions } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { X, Download, ZoomIn, ZoomOut, RotateCcw } from "lucide-react";
import Image from "next/image";
import { useEffect, useState, useCallback } from "react";

interface PreviewModalProps {
  job: ConversionJob | null;
  onClose: () => void;
}

export function PreviewModal({ job, onClose }: PreviewModalProps) {
  const [zoom, setZoom] = useState(1);

  const handleClose = useCallback(() => {
    setZoom(1);
    onClose();
  }, [onClose]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [handleClose]);

  useEffect(() => {
    if (job) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [job]);

  if (!job) return null;

  const baseName = job.originalName.replace(/\.[^.]+$/, "");

  const handleDownload = () => {
    if (!job.downloadUrl) return;
    const a = document.createElement("a");
    a.href = job.downloadUrl;
    a.download = `${baseName}.jpg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col"
      role="dialog"
      aria-modal="true"
      aria-label={`Preview ${job.originalName}`}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/90 backdrop-blur-md"
        onClick={handleClose}
      />

      {/* Modal content */}
      <div className="relative z-10 flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-black/60 backdrop-blur-sm border-b border-white/10">
          <div className="flex flex-col">
            <p className="text-white font-semibold truncate max-w-[60vw]">{baseName}.jpg</p>
            <div className="flex items-center gap-3 text-xs text-white/40 mt-0.5">
              {job.width && job.height && (
                <span>{formatDimensions(job.width, job.height)} px</span>
              )}
              {job.originalSize > 0 && (
                <span>Original: {formatBytes(job.originalSize)}</span>
              )}
              {job.convertedSize && (
                <span>Converted: {formatBytes(job.convertedSize)}</span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Zoom controls */}
            <Button
              size="icon-sm"
              variant="outline"
              onClick={() => setZoom((z) => Math.max(0.25, z - 0.25))}
              aria-label="Zoom out"
              title="Zoom out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </Button>
            <span className="text-white/60 text-xs w-12 text-center">
              {Math.round(zoom * 100)}%
            </span>
            <Button
              size="icon-sm"
              variant="outline"
              onClick={() => setZoom((z) => Math.min(4, z + 0.25))}
              aria-label="Zoom in"
              title="Zoom in"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </Button>
            <Button
              size="icon-sm"
              variant="outline"
              onClick={() => setZoom(1)}
              aria-label="Reset zoom"
              title="Reset zoom"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </Button>

            <div className="w-px h-6 bg-white/10 mx-1" />

            <Button
              size="sm"
              variant="success"
              onClick={handleDownload}
              aria-label="Download JPG"
            >
              <Download className="w-3.5 h-3.5" />
              Download
            </Button>

            <Button
              size="icon-sm"
              variant="ghost"
              onClick={handleClose}
              aria-label="Close preview"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Image area */}
        <div className="flex-1 overflow-auto flex items-center justify-center p-6">
          {job.thumbnailUrl ? (
            <div
              className="relative transition-transform duration-200 origin-center"
              style={{ transform: `scale(${zoom})` }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={job.thumbnailUrl}
                alt={`Converted ${job.originalName}`}
                className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
                style={{ maxHeight: "calc(100vh - 160px)" }}
              />
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3 text-white/30">
              <p>No preview available</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
