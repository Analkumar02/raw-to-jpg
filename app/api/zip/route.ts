import { NextRequest, NextResponse } from "next/server";
import { jobStore } from "@/lib/jobStore";
import { createZipBuffer } from "@/lib/zipGenerator";
import path from "path";
import fs from "fs";

export const runtime = "nodejs";

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const body = await req.json();
    const { jobIds } = body as { jobIds?: string[] };

    if (!jobIds || !Array.isArray(jobIds) || jobIds.length === 0) {
      return NextResponse.json(
        { error: "jobIds array is required" },
        { status: 400 }
      );
    }

    const files: Array<{ filePath: string; filename: string }> = [];

    for (const jobId of jobIds) {
      const job = jobStore.get(jobId);
      if (!job || job.status !== "done" || !job.outputPath) continue;
      if (!fs.existsSync(job.outputPath)) continue;

      const baseName = path.basename(
        job.originalName,
        path.extname(job.originalName)
      );
      files.push({
        filePath: job.outputPath,
        filename: `${baseName}.jpg`,
      });
    }

    if (files.length === 0) {
      return NextResponse.json(
        { error: "No converted files available for download" },
        { status: 404 }
      );
    }

    const zipBuffer = await createZipBuffer(files);

    const timestamp = new Date()
      .toISOString()
      .slice(0, 10)
      .replace(/-/g, "");
    const zipFilename = `converted-images-${timestamp}.zip`;

    return new NextResponse(new Uint8Array(zipBuffer), {
      status: 200,
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="${zipFilename}"`,
        "Content-Length": zipBuffer.length.toString(),
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    console.error("[zip] Error:", err);
    return NextResponse.json(
      { error: "Failed to generate ZIP archive" },
      { status: 500 }
    );
  }
}
