import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import os from "os";
import { v4 as uuidv4 } from "uuid";
import { jobStore } from "@/lib/jobStore";
import {
  validateExtension,
  validateFileSize,
  sanitizeFilename,
} from "@/lib/validation";
import { JobState } from "@/types";
import { extractPreviewImage } from "@/lib/exiftool";

export const runtime = "nodejs";

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const contentType = req.headers.get("content-type") || "";
    if (!contentType.includes("multipart/form-data")) {
      return NextResponse.json(
        { error: "Content-Type must be multipart/form-data" },
        { status: 400 }
      );
    }

    const formData = await req.formData();
    const files = formData.getAll("files");

    if (files.length === 0) {
      return NextResponse.json({ error: "No files uploaded" }, { status: 400 });
    }

    const responses = [];

    for (const fileEntry of files) {
      if (!(fileEntry instanceof File)) {
        continue;
      }

      const file = fileEntry as File;
      const originalName = file.name || "unknown.raw";
      const sanitized = sanitizeFilename(originalName);

      // Validate extension
      if (!validateExtension(originalName)) {
        responses.push({
          error: `Unsupported file format: ${originalName}`,
          filename: originalName,
        });
        continue;
      }

      // Validate file size
      if (!validateFileSize(file.size)) {
        responses.push({
          error: `File too large or empty: ${originalName} (${(file.size / 1024 / 1024).toFixed(1)} MB)`,
          filename: originalName,
        });
        continue;
      }

      const jobId = uuidv4();
      const sessionDir = path.join(os.tmpdir(), "raw-converter", jobId);
      await fs.promises.mkdir(sessionDir, { recursive: true });

      const ext = originalName.split(".").pop()?.toLowerCase() || "raw";
      const inputPath = path.join(sessionDir, `input.${ext}`);

      // Read file content as Buffer and write it
      const buffer = Buffer.from(await file.arrayBuffer());
      await fs.promises.writeFile(inputPath, buffer);

      // Extract embedded preview using stateless execFile (avoids daemon hang)
      const thumbnailPath = path.join(sessionDir, "thumbnail.jpg");
      console.log(`[upload] Extracting preview for ${originalName} (${(file.size / 1024 / 1024).toFixed(1)} MB)...`);
      const hasThumbnail = await extractPreviewImage(inputPath, thumbnailPath);
      
      if (!hasThumbnail) {
        console.warn(`[upload] Warning: No preview image extracted for ${originalName}. Preview will be unavailable until conversion completes.`);
      }

      const jobState: JobState = {
        jobId,
        originalName: sanitized,
        inputPath,
        thumbnailPath: hasThumbnail ? thumbnailPath : undefined,
        status: "uploaded",
        progress: 0,
        originalSize: file.size,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      jobStore.set(jobId, jobState);

      responses.push({
        jobId,
        filename: sanitized,
        originalName,
        size: file.size,
        status: "uploaded",
        thumbnailUrl: hasThumbnail ? `/api/download/${jobId}?type=thumbnail` : undefined,
      });
    }

    return NextResponse.json({ uploads: responses }, { status: 200 });
  } catch (err) {
    console.error("[upload] Error:", err);
    return NextResponse.json(
      { error: "Upload failed. Please try again." },
      { status: 500 }
    );
  }
}
