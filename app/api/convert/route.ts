import { NextRequest, NextResponse } from "next/server";
import { jobStore } from "@/lib/jobStore";
import { convertRawToJpg } from "@/lib/converter";

export const runtime = "nodejs";

// Simple in-process queue using promises
const processingQueue: Set<string> = new Set();
const MAX_CONCURRENT =
  parseInt(process.env.MAX_CONCURRENT_CONVERSIONS || "4", 10);
const waitingQueue: Array<() => void> = [];

async function acquireSlot(): Promise<void> {
  if (processingQueue.size < MAX_CONCURRENT) return;
  return new Promise((resolve) => waitingQueue.push(resolve));
}

function releaseSlot(jobId: string): void {
  processingQueue.delete(jobId);
  const next = waitingQueue.shift();
  if (next) next();
}

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

    const results: Array<{ jobId: string; status: string; error?: string }> =
      [];

    for (const jobId of jobIds) {
      const job = jobStore.get(jobId);
      if (!job) {
        results.push({ jobId, status: "error", error: "Job not found" });
        continue;
      }

      if (job.status === "processing" || job.status === "done") {
        results.push({ jobId, status: job.status });
        continue;
      }

      // Fire-and-forget conversion
      jobStore.updateStatus(jobId, "processing", 0);

      (async () => {
        await acquireSlot();
        processingQueue.add(jobId);
        try {
          await convertRawToJpg(jobId);
        } catch (err) {
          console.error(`[convert] Job ${jobId} failed:`, err);
        } finally {
          releaseSlot(jobId);
        }
      })();

      results.push({ jobId, status: "processing" });
    }

    return NextResponse.json({ results }, { status: 200 });
  } catch (err) {
    console.error("[convert] Error:", err);
    return NextResponse.json(
      { error: "Failed to start conversion" },
      { status: 500 }
    );
  }
}
