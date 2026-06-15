import { JobState, ConversionStatus } from "@/types";

class JobStore {
  private jobs: Map<string, JobState> = new Map();
  private cleanupTimers: Map<string, NodeJS.Timeout> = new Map();
  private readonly CLEANUP_DELAY =
    parseInt(process.env.CLEANUP_INTERVAL_MS || "3600000", 10);

  set(jobId: string, state: JobState): void {
    this.jobs.set(jobId, { ...state, updatedAt: Date.now() });
    this.scheduleCleanup(jobId);
  }

  get(jobId: string): JobState | undefined {
    return this.jobs.get(jobId);
  }

  update(jobId: string, partial: Partial<JobState>): void {
    const existing = this.jobs.get(jobId);
    if (!existing) return;
    this.jobs.set(jobId, { ...existing, ...partial, updatedAt: Date.now() });
  }

  updateStatus(
    jobId: string,
    status: ConversionStatus,
    progress?: number
  ): void {
    this.update(jobId, {
      status,
      ...(progress !== undefined ? { progress } : {}),
    });
  }

  delete(jobId: string): void {
    this.jobs.delete(jobId);
    const timer = this.cleanupTimers.get(jobId);
    if (timer) {
      clearTimeout(timer);
      this.cleanupTimers.delete(jobId);
    }
  }

  has(jobId: string): boolean {
    return this.jobs.has(jobId);
  }

  getAll(): JobState[] {
    return Array.from(this.jobs.values());
  }

  private scheduleCleanup(jobId: string): void {
    const existing = this.cleanupTimers.get(jobId);
    if (existing) clearTimeout(existing);

    const timer = setTimeout(() => {
      this.jobs.delete(jobId);
      this.cleanupTimers.delete(jobId);
    }, this.CLEANUP_DELAY);

    this.cleanupTimers.set(jobId, timer);
  }
}

// Singleton store (survives across requests in same Node process)
const globalForJobStore = global as typeof globalThis & {
  jobStore: JobStore | undefined;
};

if (!globalForJobStore.jobStore) {
  globalForJobStore.jobStore = new JobStore();
}

export const jobStore = globalForJobStore.jobStore;
