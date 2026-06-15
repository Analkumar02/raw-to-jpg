"use client";
import { useState, useCallback } from "react";
import { ConversionJob, UploadResponse } from "@/types";
import { v4 as uuidv4 } from "uuid";

interface UseUploadReturn {
  uploadFiles: (files: File[]) => Promise<void>;
  isUploading: boolean;
  uploadProgress: number;
}

export function useUpload(
  onJobsAdded: (jobs: ConversionJob[]) => void
): UseUploadReturn {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const uploadFiles = useCallback(
    async (files: File[]) => {
      if (files.length === 0) return;
      setIsUploading(true);
      setUploadProgress(0);

      // Add optimistic entries
      const optimisticJobs: ConversionJob[] = files.map((f) => ({
        jobId: `pending-${uuidv4()}`,
        filename: f.name,
        originalName: f.name,
        status: "uploading",
        progress: 0,
        originalSize: f.size,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      }));
      onJobsAdded(optimisticJobs);

      // Upload in batches of 10
      const BATCH_SIZE = 10;
      const allResults: ConversionJob[] = [];

      for (let i = 0; i < files.length; i += BATCH_SIZE) {
        const batch = files.slice(i, i + BATCH_SIZE);
        const formData = new FormData();
        batch.forEach((f) => formData.append("files", f));

        try {
          const response = await fetch("/api/upload", {
            method: "POST",
            body: formData,
          });

          if (!response.ok) {
            let errorMsg = "Upload failed";
            try {
              const err = await response.json();
              errorMsg = err.error || errorMsg;
            } catch {}
            console.error("[upload] Batch error:", errorMsg);
            batch.forEach((f) => {
              allResults.push({
                jobId: `error-${uuidv4()}`,
                filename: f.name,
                originalName: f.name,
                status: "error",
                progress: 0,
                originalSize: f.size,
                error: errorMsg,
                createdAt: Date.now(),
                updatedAt: Date.now(),
              });
            });
            continue;
          }

          const data = await response.json();
          const uploads: UploadResponse[] = data.uploads || [];

          for (const upload of uploads) {
            if ("error" in upload) {
              allResults.push({
                jobId: `error-${uuidv4()}`,
                filename: (upload as { filename: string }).filename,
                originalName: (upload as { filename: string }).filename,
                status: "error",
                progress: 0,
                originalSize: 0,
                error: (upload as { error: string }).error,
                createdAt: Date.now(),
                updatedAt: Date.now(),
              });
            } else {
              allResults.push({
                jobId: upload.jobId,
                filename: upload.filename,
                originalName: upload.originalName,
                status: "uploaded",
                progress: 0,
                originalSize: upload.size,
                // Map thumbnailUrl from server response — shows preview before conversion
                thumbnailUrl: upload.thumbnailUrl,
                createdAt: Date.now(),
                updatedAt: Date.now(),
              });
            }
          }
        } catch (err) {
          console.error("[upload] Fetch error:", err);
          const errorMsg = err instanceof Error ? err.message : "Network error";
          batch.forEach((f) => {
            allResults.push({
              jobId: `error-${uuidv4()}`,
              filename: f.name,
              originalName: f.name,
              status: "error",
              progress: 0,
              originalSize: f.size,
              error: errorMsg,
              createdAt: Date.now(),
              updatedAt: Date.now(),
            });
          });
        }

        setUploadProgress(Math.round(((i + batch.length) / files.length) * 100));
      }

      // Replace optimistic jobs with real jobs
      onJobsAdded(allResults);
      setIsUploading(false);
      setUploadProgress(100);
    },
    [onJobsAdded]
  );

  return { uploadFiles, isUploading, uploadProgress };
}
