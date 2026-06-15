import { NextRequest, NextResponse } from "next/server";
import { jobStore } from "@/lib/jobStore";
import fs from "fs";
import path from "path";

export const runtime = "nodejs";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
): Promise<NextResponse> {
  const { jobId } = await params;
  const type = req.nextUrl.searchParams.get("type");

  const job = jobStore.get(jobId);
  if (!job) {
    return NextResponse.json({ error: "Job not found" }, { status: 404 });
  }

  // Serve thumbnail immediately — no status check required
  if (type === "thumbnail") {
    if (!job.thumbnailPath || !fs.existsSync(job.thumbnailPath)) {
      return NextResponse.json({ error: "Thumbnail not available" }, { status: 404 });
    }
    try {
      const fileBuffer = await fs.promises.readFile(job.thumbnailPath);
      return new NextResponse(fileBuffer, {
        status: 200,
        headers: {
          "Content-Type": "image/jpeg",
          "Content-Length": fileBuffer.length.toString(),
          "Cache-Control": "public, max-age=3600",
        },
      });
    } catch {
      return NextResponse.json({ error: "Failed to read thumbnail" }, { status: 500 });
    }
  }

  // Full download — requires job to be done
  if (job.status !== "done" || !job.outputPath) {
    return NextResponse.json(
      { error: "File not ready for download" },
      { status: 409 }
    );
  }

  if (!fs.existsSync(job.outputPath)) {
    return NextResponse.json(
      { error: "Output file missing from server" },
      { status: 404 }
    );
  }

  const filename =
    path.basename(job.originalName, path.extname(job.originalName)) + ".jpg";

  try {
    const fileBuffer = await fs.promises.readFile(job.outputPath);

    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        "Content-Type": "image/jpeg",
        "Content-Disposition": `attachment; filename="${encodeURIComponent(filename)}"`,
        "Content-Length": fileBuffer.length.toString(),
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    console.error("[download] Error reading file:", err);
    return NextResponse.json(
      { error: "Failed to read output file" },
      { status: 500 }
    );
  }
}
