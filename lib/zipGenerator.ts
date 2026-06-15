import type { Archiver } from "archiver";
import fs from "fs";
import { Readable } from "stream";

// eslint-disable-next-line @typescript-eslint/no-require-imports
const createArchiver: (format: string, options?: object) => Archiver =
  require("archiver");

export async function createZipBuffer(
  files: Array<{ filePath: string; filename: string }>
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];

    const archive = createArchiver("zip", {
      zlib: { level: 6 },
    });

    archive.on("data", (chunk: Buffer) => chunks.push(chunk));
    archive.on("error", reject);
    archive.on("end", () => resolve(Buffer.concat(chunks)));

    for (const { filePath, filename } of files) {
      if (fs.existsSync(filePath)) {
        archive.file(filePath, { name: filename });
      }
    }

    archive.finalize();
  });
}

export function createZipStream(
  files: Array<{ filePath: string; filename: string }>
): { stream: Readable; archive: Archiver } {
  const archive = createArchiver("zip", {
    zlib: { level: 6 },
  });

  for (const { filePath, filename } of files) {
    if (fs.existsSync(filePath)) {
      archive.file(filePath, { name: filename });
    }
  }

  archive.finalize();

  return { stream: archive as unknown as Readable, archive };
}
