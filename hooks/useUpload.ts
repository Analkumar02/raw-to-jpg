"use client";
import { useState, useCallback } from "react";
import { ConversionJob } from "@/types";
import { v4 as uuidv4 } from "uuid";

// Store file objects in memory mapped by jobId
export const clientFileMap = new Map<string, File>();

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

      const newJobs: ConversionJob[] = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const jobId = uuidv4();
        clientFileMap.set(jobId, file);

        newJobs.push({
          jobId,
          filename: file.name,
          originalName: file.name,
          status: "uploaded",
          progress: 0,
          originalSize: file.size,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        });

        setUploadProgress(Math.round(((i + 1) / files.length) * 100));
      }

      onJobsAdded(newJobs);
      setIsUploading(false);
    },
    [onJobsAdded]
  );

  return { uploadFiles, isUploading, uploadProgress };
}
