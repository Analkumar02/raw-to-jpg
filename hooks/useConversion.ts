"use client";
import { useEffect, useRef, useCallback } from "react";
import { ConversionJob, StatusResponse } from "@/types";

const POLL_INTERVAL = 800; // ms

export function useConversion(
  jobs: ConversionJob[],
  onUpdate: (jobId: string, updates: Partial<ConversionJob>) => void
) {
  const pollingRef = useRef<NodeJS.Timeout | null>(null);

  const pollStatus = useCallback(async () => {
    const pendingJobs = jobs.filter(
      (j) =>
        (j.status === "processing" ||
          j.status === "uploaded" ||
          j.status === "queued") &&
        !j.jobId.startsWith("pending-") &&
        !j.jobId.startsWith("error-")
    );

    if (pendingJobs.length === 0) return;

    await Promise.allSettled(
      pendingJobs.map(async (job) => {
        try {
          const res = await fetch(`/api/status/${job.jobId}`);
          if (!res.ok) return;

          const data: StatusResponse = await res.json();

          const updates: Partial<ConversionJob> = {
            status: data.status,
            progress: data.progress,
          };

          if (data.convertedSize !== undefined)
            updates.convertedSize = data.convertedSize;
          if (data.width !== undefined) updates.width = data.width;
          if (data.height !== undefined) updates.height = data.height;
          if (data.error !== undefined) updates.error = data.error;

          // Pick up thumbnail from status if we don't have one yet
          if (data.thumbnailUrl && !job.thumbnailUrl) {
            updates.thumbnailUrl = data.thumbnailUrl;
          }

          if (data.status === "done") {
            updates.downloadUrl = `/api/download/${job.jobId}`;
            // Use the full converted image for preview when done
            updates.thumbnailUrl = `/api/download/${job.jobId}`;
          }

          onUpdate(job.jobId, updates);
        } catch {
          // ignore transient errors
        }
      })
    );
  }, [jobs, onUpdate]);

  useEffect(() => {
    const hasPending = jobs.some(
      (j) =>
        (j.status === "processing" ||
          j.status === "uploaded" ||
          j.status === "queued") &&
        !j.jobId.startsWith("pending-") &&
        !j.jobId.startsWith("error-")
    );

    if (hasPending) {
      if (!pollingRef.current) {
        pollingRef.current = setInterval(pollStatus, POLL_INTERVAL);
      }
    } else {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
    }

    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
    };
  }, [jobs, pollStatus]);

  const startConversion = useCallback(
    async (jobIds: string[]) => {
      const validIds = jobIds.filter(
        (id) => !id.startsWith("pending-") && !id.startsWith("error-")
      );
      if (validIds.length === 0) return;

      try {
        await fetch("/api/convert", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ jobIds: validIds }),
        });
      } catch (err) {
        console.error("[useConversion] startConversion error:", err);
      }
    },
    []
  );

  const downloadZip = useCallback(async (jobIds: string[]) => {
    try {
      const res = await fetch("/api/zip", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobIds }),
      });

      if (!res.ok) throw new Error("ZIP generation failed");

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `converted-images-${new Date().toISOString().slice(0, 10)}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("[useConversion] downloadZip error:", err);
      throw err;
    }
  }, []);

  return { startConversion, downloadZip };
}
