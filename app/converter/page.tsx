"use client";

import { useState, useCallback, useRef } from "react";
import { ConversionJob } from "@/types";
import { DropZone } from "@/components/converter/DropZone";
import { FileQueue } from "@/components/converter/FileQueue";
import { DownloadBar } from "@/components/converter/DownloadBar";
import { PreviewModal } from "@/components/converter/PreviewModal";
import { useUpload } from "@/hooks/useUpload";
import { useConversion } from "@/hooks/useConversion";
import { v4 as uuidv4 } from "uuid";
import { Loader2, Upload, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function ConverterPage() {
  const [jobs, setJobs] = useState<ConversionJob[]>([]);
  const [previewJob, setPreviewJob] = useState<ConversionJob | null>(null);

  const updateJob = useCallback(
    (jobId: string, updates: Partial<ConversionJob>) => {
      setJobs((prev) =>
        prev.map((j) =>
          j.jobId === jobId ? { ...j, ...updates, updatedAt: Date.now() } : j
        )
      );
    },
    []
  );

  // Replace optimistic jobs when real uploads complete
  const handleJobsAdded = useCallback((newJobs: ConversionJob[]) => {
    setJobs((prev) => {
      // If these are optimistic (uploading) entries, add them
      if (newJobs.length > 0 && newJobs.every((j) => j.status === "uploading")) {
        return [...prev, ...newJobs];
      }
      // Otherwise, remove any pending- entries and add real ones
      const withoutPending = prev.filter((j) => !j.jobId.startsWith("pending-"));
      const existingIds = new Set(withoutPending.map((j) => j.jobId));
      const fresh = newJobs.filter((j) => !existingIds.has(j.jobId));
      return [...withoutPending, ...fresh];
    });
  }, []);

  const { uploadFiles, isUploading, uploadProgress } = useUpload(handleJobsAdded);
  const { startConversion, downloadZip } = useConversion(jobs, updateJob);

  const handleFiles = useCallback(
    async (files: File[]) => {
      await uploadFiles(files);
    },
    [uploadFiles]
  );

  const handleRemove = useCallback((jobId: string) => {
    setJobs((prev) => prev.filter((j) => j.jobId !== jobId));
  }, []);

  const handleClearAll = useCallback(() => {
    setJobs([]);
  }, []);

  const handleConvertAll = useCallback(async () => {
    const convertibleIds = jobs
      .filter(
        (j) =>
          j.status === "uploaded" &&
          !j.jobId.startsWith("pending-") &&
          !j.jobId.startsWith("error-")
      )
      .map((j) => j.jobId);
    await startConversion(convertibleIds);
  }, [jobs, startConversion]);

  const isConverting = jobs.some(
    (j) => j.status === "processing" || j.status === "uploading"
  );

  const doneCount = jobs.filter((j) => j.status === "done").length;

  return (
    <>
      <div className="min-h-screen pt-24 pb-32 px-4">
        <div className="max-w-6xl mx-auto">

          {/* Page header */}
          <div className="mb-8 flex items-center justify-between flex-wrap gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Link href="/" className="text-white/30 hover:text-white/60 transition-colors">
                  <ArrowLeft className="w-4 h-4" />
                </Link>
                <span className="text-white/20 text-sm">/</span>
                <span className="text-white/50 text-sm">Converter</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-white">
                RAW → JPG Converter
              </h1>
              <p className="text-white/40 text-sm mt-1">
                Upload RAW files, convert, and download as JPG
              </p>
            </div>

            {isConverting && (
              <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 text-sm">
                <Loader2 className="w-4 h-4 animate-spin" />
                Converting…
              </div>
            )}

            {!isConverting && doneCount > 0 && (
              <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm">
                ✓ {doneCount} file{doneCount !== 1 ? "s" : ""} ready
              </div>
            )}
          </div>

          {/* Upload progress bar */}
          {isUploading && (
            <div className="mb-6 rounded-xl overflow-hidden bg-white/5 border border-white/10 p-4">
              <div className="flex items-center justify-between mb-2 text-sm">
                <span className="text-white/60 flex items-center gap-2">
                  <Upload className="w-4 h-4 animate-pulse text-violet-400" />
                  Uploading files…
                </span>
                <span className="text-violet-400 font-mono">{uploadProgress}%</span>
              </div>
              <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-violet-500 to-purple-400 transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}

          {/* Main layout */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            {/* Left panel: Drop zone + queue */}
            <div className="lg:col-span-3 flex flex-col gap-5">
              {/* Drop Zone */}
              <div className="rounded-2xl bg-white/[0.02] border border-white/8 p-5">
                <DropZone
                  onFiles={handleFiles}
                  isUploading={isUploading}
                  compact={jobs.length > 0}
                />
              </div>

              {/* File Queue */}
              {jobs.length > 0 && (
                <div className="rounded-2xl bg-white/[0.02] border border-white/8 p-5">
                  <FileQueue
                    jobs={jobs}
                    onRemove={handleRemove}
                    onClearAll={handleClearAll}
                    onConvertAll={handleConvertAll}
                    onPreview={setPreviewJob}
                    isConverting={isConverting}
                  />
                </div>
              )}
            </div>

            {/* Right panel: Stats + instructions */}
            <div className="lg:col-span-2 flex flex-col gap-5">

              {/* Stats card */}
              {jobs.length > 0 ? (
                <div className="rounded-2xl bg-white/[0.02] border border-white/8 p-5 flex flex-col gap-4">
                  <h2 className="text-white/60 text-xs font-semibold uppercase tracking-wider">
                    Session Summary
                  </h2>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { label: "Total files", value: jobs.length },
                      {
                        label: "Uploading",
                        value: jobs.filter(
                          (j) => j.status === "uploading" || j.status === "uploaded"
                        ).length,
                      },
                      {
                        label: "Converting",
                        value: jobs.filter((j) => j.status === "processing").length,
                      },
                      {
                        label: "Done",
                        value: jobs.filter((j) => j.status === "done").length,
                      },
                      {
                        label: "Errors",
                        value: jobs.filter((j) => j.status === "error").length,
                      },
                    ].map(({ label, value }) => (
                      <div
                        key={label}
                        className="flex flex-col gap-1 p-3 rounded-xl bg-white/5 border border-white/5"
                      >
                        <span className="text-2xl font-black text-white">{value}</span>
                        <span className="text-xs text-white/35">{label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                /* Instructions card */
                <div className="rounded-2xl bg-white/[0.02] border border-white/8 p-6 flex flex-col gap-5">
                  <h2 className="text-white font-bold text-base">How it works</h2>
                  {[
                    { step: "1", text: "Drag & drop or click to upload your RAW files" },
                    { step: "2", text: 'Click "Convert All" to start the conversion pipeline' },
                    { step: "3", text: "Preview thumbnails appear as each file completes" },
                    { step: "4", text: "Download files individually or all at once as a ZIP" },
                  ].map(({ step, text }) => (
                    <div key={step} className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-6 h-6 rounded-full bg-violet-600/30 border border-violet-500/30 flex items-center justify-center text-xs font-bold text-violet-300">
                        {step}
                      </div>
                      <p className="text-white/50 text-sm leading-relaxed">{text}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* Supported formats card */}
              <div className="rounded-2xl bg-white/[0.02] border border-white/8 p-5 flex flex-col gap-3">
                <h2 className="text-white/60 text-xs font-semibold uppercase tracking-wider">
                  Supported Formats
                </h2>
                <div className="flex flex-wrap gap-1.5">
                  {["CR2","CR3","NEF","ARW","RAF","ORF","RW2","DNG","PEF","SRW","X3F","RAW","3FR","MRW","NRW","DCR","KDC","IIQ","ERF","SR2","SRF","RWL"].map((fmt) => (
                    <span
                      key={fmt}
                      className="px-2 py-1 rounded-lg bg-white/5 border border-white/10 text-xs font-mono text-white/50"
                    >
                      {fmt}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Sticky download bar */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-30 w-full max-w-2xl px-4">
        <DownloadBar jobs={jobs} onDownloadZip={downloadZip} />
      </div>

      {/* Preview modal */}
      <PreviewModal job={previewJob} onClose={() => setPreviewJob(null)} />
    </>
  );
}
