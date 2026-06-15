import { NextRequest, NextResponse } from "next/server";
import { jobStore } from "@/lib/jobStore";

export const runtime = "nodejs";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
): Promise<NextResponse> {
  const { jobId } = await params;

  const job = jobStore.get(jobId);
  if (!job) {
    return NextResponse.json({ error: "Job not found" }, { status: 404 });
  }

  return NextResponse.json({
    jobId: job.jobId,
    status: job.status,
    progress: job.progress,
    originalSize: job.originalSize,
    convertedSize: job.convertedSize,
    width: job.width,
    height: job.height,
    error: job.error,
    thumbnailUrl: job.thumbnailPath ? `/api/download/${job.jobId}?type=thumbnail` : undefined,
  });
}
