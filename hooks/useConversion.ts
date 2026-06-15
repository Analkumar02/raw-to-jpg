"use client";
import { useCallback, useRef } from "react";
import { ConversionJob } from "@/types";
import ClientLibRaw from "@/lib/clientConverter";
import { clientFileMap } from "./useUpload";
import JSZip from "jszip";

// Share converted blobs locally for downloadZip
const convertedBlobs = new Map<string, Blob>();

export function useConversion(
  jobs: ConversionJob[],
  onUpdate: (jobId: string, updates: Partial<ConversionJob>) => void
) {
  const isConvertingRef = useRef(false);

  const convertSingleJob = useCallback(
    async (jobId: string) => {
      const file = clientFileMap.get(jobId);
      if (!file) {
        onUpdate(jobId, { status: "error", error: "File not found in memory" });
        return;
      }

      try {
        onUpdate(jobId, { status: "processing", progress: 10 });

        // Read file as ArrayBuffer
        const buffer = await file.arrayBuffer();
        onUpdate(jobId, { progress: 30 });

        // Initialize ClientLibRaw (spawns Web Worker)
        const libraw = new ClientLibRaw();

        // Open/Decode the RAW file
        console.log(`[useConversion] Decoding ${file.name} in browser worker...`);
        await libraw.open(buffer, {
          useCameraWb: true,
          useAutoWb: false,
          useCameraMatrix: 1,
          highlight: 2,
          outputBps: 16,
          userQual: 3,
        });

        onUpdate(jobId, { progress: 60 });

        // Get processed pixel data
        const imageData = await libraw.imageData();
        if (!imageData) {
          throw new Error("LibRaw: Failed to extract image data");
        }

        const { width, height, bits, data } = imageData;
        console.log(`[useConversion] Decoded: ${width}x${height} (${bits}-bit)`);

        onUpdate(jobId, { progress: 80 });

        // Convert RGB pixels to RGBA Canvas ImageData
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          throw new Error("Browser Canvas context is not supported");
        }

        const canvasImgData = ctx.createImageData(width, height);
        const dst = canvasImgData.data;
        const len = width * height;

        let srcIdx = 0;
        let dstIdx = 0;

        if (bits === 16 && data instanceof Uint16Array) {
          // Convert 16-bit to 8-bit
          for (let i = 0; i < len; i++) {
            dst[dstIdx] = Math.min(255, Math.round(data[srcIdx] / 256));
            dst[dstIdx + 1] = Math.min(255, Math.round(data[srcIdx + 1] / 256));
            dst[dstIdx + 2] = Math.min(255, Math.round(data[srcIdx + 2] / 256));
            dst[dstIdx + 3] = 255; // Alpha
            srcIdx += 3;
            dstIdx += 4;
          }
        } else {
          // 8-bit
          for (let i = 0; i < len; i++) {
            dst[dstIdx] = data[srcIdx];
            dst[dstIdx + 1] = data[srcIdx + 1];
            dst[dstIdx + 2] = data[srcIdx + 2];
            dst[dstIdx + 3] = 255;
            srcIdx += 3;
            dstIdx += 4;
          }
        }

        ctx.putImageData(canvasImgData, 0, 0);

        // Export Canvas to JPEG blob
        const blob = await new Promise<Blob | null>((resolve) => {
          canvas.toBlob((b) => resolve(b), "image/jpeg", 0.95);
        });

        if (!blob) {
          throw new Error("Failed to encode Canvas image to JPEG blob");
        }

        // Save blob locally for ZIP generation
        convertedBlobs.set(jobId, blob);

        // Create Object URL for preview and download
        const url = URL.createObjectURL(blob);

        onUpdate(jobId, {
          status: "done",
          progress: 100,
          convertedSize: blob.size,
          width,
          height,
          thumbnailUrl: url,
          downloadUrl: url,
        });

        console.log(`[useConversion] Successfully converted ${file.name}!`);
      } catch (err) {
        console.error(`[useConversion] Error converting ${file.name}:`, err);
        const errorMsg = err instanceof Error ? err.message : String(err);
        onUpdate(jobId, {
          status: "error",
          error: errorMsg,
          progress: 0,
        });
      }
    },
    [onUpdate]
  );

  const startConversion = useCallback(
    async (jobIds: string[]) => {
      if (isConvertingRef.current) return;
      isConvertingRef.current = true;

      console.log(`[useConversion] Starting client-side batch conversion of ${jobIds.length} files...`);

      // Convert jobs sequentially to avoid locking the main thread with too many canvas allocations
      for (const jobId of jobIds) {
        const job = jobs.find((j) => j.jobId === jobId);
        if (!job || job.status === "done") continue;
        await convertSingleJob(jobId);
      }

      isConvertingRef.current = false;
    },
    [jobs, convertSingleJob]
  );

  const downloadZip = useCallback(async (jobIds: string[]) => {
    try {
      const zip = new JSZip();

      for (const jobId of jobIds) {
        const blob = convertedBlobs.get(jobId);
        const job = jobs.find((j) => j.jobId === jobId);
        if (blob && job) {
          const outName = job.filename.replace(/\.[^.]+$/, "") + ".jpg";
          zip.file(outName, blob);
        }
      }

      const zipBlob = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(zipBlob);

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
  }, [jobs]);

  return { startConversion, downloadZip };
}
