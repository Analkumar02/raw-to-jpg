export type ConversionStatus =
  | "queued"
  | "uploading"
  | "uploaded"
  | "processing"
  | "done"
  | "error";

export interface ConversionJob {
  jobId: string;
  filename: string;
  originalName: string;
  status: ConversionStatus;
  progress: number;
  originalSize: number;
  convertedSize?: number;
  width?: number;
  height?: number;
  thumbnailUrl?: string;
  downloadUrl?: string;
  error?: string;
  createdAt: number;
  updatedAt: number;
}

export interface JobState {
  jobId: string;
  originalName: string;
  inputPath: string;
  outputPath?: string;
  thumbnailPath?: string;
  status: ConversionStatus;
  progress: number;
  originalSize: number;
  convertedSize?: number;
  width?: number;
  height?: number;
  error?: string;
  createdAt: number;
  updatedAt: number;
}

export interface UploadResponse {
  jobId: string;
  filename: string;
  originalName: string;
  size: number;
  status: ConversionStatus;
  thumbnailUrl?: string;
}

export interface ConvertResponse {
  jobId: string;
  status: ConversionStatus;
}

export interface StatusResponse {
  jobId: string;
  status: ConversionStatus;
  progress: number;
  originalSize: number;
  convertedSize?: number;
  width?: number;
  height?: number;
  error?: string;
  thumbnailUrl?: string;
}

export interface ZipRequest {
  jobIds: string[];
}

export interface FileCardProps {
  job: ConversionJob;
  onRemove: (jobId: string) => void;
  onPreview: (job: ConversionJob) => void;
}

export interface RAWFormat {
  extension: string;
  brand: string;
  description: string;
}

export const SUPPORTED_RAW_FORMATS: RAWFormat[] = [
  { extension: "cr2", brand: "Canon", description: "Canon RAW 2" },
  { extension: "cr3", brand: "Canon", description: "Canon RAW 3" },
  { extension: "nef", brand: "Nikon", description: "Nikon Electronic Format" },
  { extension: "arw", brand: "Sony", description: "Sony Alpha RAW" },
  { extension: "raf", brand: "Fujifilm", description: "Fujifilm RAW" },
  { extension: "orf", brand: "Olympus", description: "Olympus RAW" },
  { extension: "rw2", brand: "Panasonic", description: "Panasonic RAW 2" },
  { extension: "dng", brand: "Adobe", description: "Digital Negative" },
  { extension: "pef", brand: "Pentax", description: "Pentax Electronic File" },
  { extension: "srw", brand: "Samsung", description: "Samsung RAW" },
  { extension: "x3f", brand: "Sigma", description: "Sigma X3F" },
  { extension: "raw", brand: "Various", description: "Generic RAW" },
  { extension: "3fr", brand: "Hasselblad", description: "Hasselblad 3F RAW" },
  { extension: "mef", brand: "Mamiya", description: "Mamiya Electronic Format" },
  { extension: "mrw", brand: "Minolta", description: "Minolta RAW" },
  { extension: "nrw", brand: "Nikon", description: "Nikon RAW (compact)" },
  { extension: "rwl", brand: "Leica", description: "Leica RAW" },
  { extension: "iiq", brand: "Phase One", description: "Phase One IIQ" },
  { extension: "erf", brand: "Epson", description: "Epson RAW" },
  { extension: "kdc", brand: "Kodak", description: "Kodak Digital Camera" },
  { extension: "dcr", brand: "Kodak", description: "Kodak Digital Camera RAW" },
  { extension: "sr2", brand: "Sony", description: "Sony RAW 2" },
  { extension: "srf", brand: "Sony", description: "Sony RAW Format" },
];

export const ACCEPTED_EXTENSIONS = SUPPORTED_RAW_FORMATS.map(
  (f) => `.${f.extension}`
);
