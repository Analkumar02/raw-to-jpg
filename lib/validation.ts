import { SUPPORTED_RAW_FORMATS } from "@/types";

const MAX_FILE_SIZE_MB = parseInt(
  process.env.MAX_FILE_SIZE_MB || "500",
  10
);

export const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

export const ALLOWED_EXTENSIONS = new Set(
  SUPPORTED_RAW_FORMATS.map((f) => f.extension.toLowerCase())
);

// Magic bytes for common RAW formats
const MAGIC_BYTES: Record<string, number[][]> = {
  // TIFF-based RAW files (CR2, NEF, ARW, DNG, ORF, PEF, etc.)
  tiff_le: [[0x49, 0x49, 0x2a, 0x00]], // Little-endian TIFF
  tiff_be: [[0x4d, 0x4d, 0x00, 0x2a]], // Big-endian TIFF
  // RAF (Fujifilm)
  raf: [[0x46, 0x55, 0x4a, 0x49, 0x46, 0x49, 0x4c, 0x4d]],
  // X3F (Sigma)
  x3f: [[0x46, 0x4f, 0x56, 0x62]],
  // MRW (Minolta)
  mrw: [[0x00, 0x4d, 0x52, 0x4d]],
  // ERF (Epson)
  erf: [[0x49, 0x49, 0x52, 0x4f]],
};

export function validateExtension(filename: string): boolean {
  const ext = filename.split(".").pop()?.toLowerCase() || "";
  return ALLOWED_EXTENSIONS.has(ext);
}

export function validateFileSize(sizeBytes: number): boolean {
  return sizeBytes > 0 && sizeBytes <= MAX_FILE_SIZE_BYTES;
}

export function validateMagicBytes(buffer: Buffer): boolean {
  // Check for TIFF-based (covers CR2, NEF, ARW, DNG, ORF, PEF, RW2, SRW, etc.)
  if (
    (buffer[0] === 0x49 && buffer[1] === 0x49 && buffer[2] === 0x2a) ||
    (buffer[0] === 0x4d && buffer[1] === 0x4d && buffer[2] === 0x00)
  ) {
    return true;
  }
  // Fujifilm RAF
  if (buffer.slice(0, 8).toString("ascii") === "FUJIFILM") {
    return true;
  }
  // Sigma X3F
  if (
    buffer[0] === 0x46 &&
    buffer[1] === 0x4f &&
    buffer[2] === 0x56 &&
    buffer[3] === 0x62
  ) {
    return true;
  }
  // Minolta MRW
  if (
    buffer[0] === 0x00 &&
    buffer[1] === 0x4d &&
    buffer[2] === 0x52 &&
    buffer[3] === 0x4d
  ) {
    return true;
  }
  // KDC / generic
  if (buffer[0] === 0x4b && buffer[1] === 0x44) {
    return true;
  }
  return false;
}

export function sanitizeFilename(filename: string): string {
  return filename
    .replace(/[^a-zA-Z0-9._-]/g, "_")
    .replace(/\.{2,}/g, ".")
    .slice(0, 255);
}

export function getExtension(filename: string): string {
  return filename.split(".").pop()?.toLowerCase() || "";
}
