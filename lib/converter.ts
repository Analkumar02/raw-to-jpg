import fs from "fs";
import path from "path";
import os from "os";
import { execFile, exec, spawn } from "child_process";
import { promisify } from "util";
import { jobStore } from "./jobStore";
import sharp from "sharp";
// @ts-ignore
import initLibRaw from "libraw-wasm/dist/libraw.js";

const execFileAsync = promisify(execFile);
const execAsync = promisify(exec);

const TEMP_BASE = path.join(os.tmpdir(), "raw-converter");

export async function ensureTempDir(sessionId: string): Promise<string> {
  const dir = path.join(TEMP_BASE, sessionId);
  await fs.promises.mkdir(dir, { recursive: true });
  return dir;
}

export async function cleanupJob(jobId: string): Promise<void> {
  const job = jobStore.get(jobId);
  if (!job) return;
  try {
    if (job.inputPath && fs.existsSync(job.inputPath)) {
      await fs.promises.unlink(job.inputPath);
    }
  } catch {
    // ignore cleanup errors
  }
}

/**
 * Strategy 1: FFmpeg (handles virtually all RAW formats)
 * FFmpeg has excellent RAW format support and is widely available
 */
async function convertWithFFmpeg(
  inputPath: string,
  outputPath: string
): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    // FFmpeg command: read RAW, auto-detect format, output JPEG at quality 100
    const ffmpegProcess = spawn("ffmpeg", [
      "-i",
      inputPath,
      "-q:v",
      "2", // JPEG quality (2 = 95%, 1 = 100%)
      "-y", // Overwrite output
      outputPath,
    ]);

    let stderr = "";
    let stdout = "";

    ffmpegProcess.stderr.on("data", (data) => {
      stderr += data.toString();
    });

    ffmpegProcess.stdout?.on("data", (data) => {
      stdout += data.toString();
    });

    ffmpegProcess.on("close", (code) => {
      if (code !== 0) {
        reject(new Error(`FFmpeg exited with code ${code}: ${stderr.substring(0, 200)}`));
        return;
      }

      if (!fs.existsSync(outputPath)) {
        reject(new Error("FFmpeg did not produce output file"));
        return;
      }

      sharp(outputPath)
        .metadata()
        .then((metadata) => {
          if (!metadata.width || !metadata.height || metadata.width < 1000) {
            reject(
              new Error(`FFmpeg produced low-resolution: ${metadata.width}x${metadata.height}`)
            );
            return;
          }
          resolve({ width: metadata.width, height: metadata.height });
        })
        .catch(reject);
    });

    ffmpegProcess.on("error", (err) => {
      reject(new Error(`FFmpeg process error: ${err.message}`));
    });

    // Set timeout
    const timeout = setTimeout(() => {
      ffmpegProcess.kill();
      reject(new Error("FFmpeg conversion timeout (2 minutes)"));
    }, 120000);

    ffmpegProcess.on("close", () => {
      clearTimeout(timeout);
    });
  });
}

/**
 * Strategy 2: Use LibRaw WASM for universal RAW format support
 * LibRaw handles virtually all RAW formats (CR2, NEF, DNG, ARW, RAF, etc.)
 */
async function convertWithLibRaw(
  inputPath: string,
  outputPath: string
): Promise<{ width: number; height: number }> {
  try {
    console.log(`[converter] Initializing direct LibRaw WASM...`);
    const wasmPath = path.join(process.cwd(), "node_modules", "libraw-wasm", "dist", "libraw.wasm");
    const wasmBinary = await fs.promises.readFile(wasmPath);
    
    const Module = await initLibRaw({
      wasmBinary: wasmBinary,
    });
    
    const libraw = new Module.LibRaw();
    
    // Read the RAW file
    const rawBuffer = await fs.promises.readFile(inputPath);
    console.log(`[converter] LibRaw: Loaded file (${(rawBuffer.length / 1024 / 1024).toFixed(2)} MB)`);
    
    // Open and decode the RAW file
    await libraw.open(rawBuffer, {
      useCameraWb: true,           // Use embedded white balance
      useAutoWb: false,             // Don't override with auto WB
      useCameraMatrix: 1,           // Use embedded color matrix
      highlight: 2,                 // Clip highlights gradually
      outputBps: 16,                // 16-bit output for maximum quality
      userQual: 3,                  // High interpolation quality
    });
    console.log(`[converter] LibRaw: Opened and decoded RAW file`);
    
    // Get processed image data
    const imageData = await libraw.imageData();
    if (!imageData) {
      throw new Error("LibRaw: Failed to extract image data");
    }
    
    const { width, height, colors, bits, data } = imageData;
    console.log(`[converter] LibRaw: Image dimensions ${width}x${height} (${colors} colors, ${bits}-bit)`);
    
    if (width < 1000 || height < 1000) {
      throw new Error(`LibRaw: Low-resolution output (${width}x${height})`);
    }
    
    // Convert pixel data to 8-bit if necessary
    let pixelData: Uint8Array;
    
    if (bits === 16 && data instanceof Uint16Array) {
      // Convert 16-bit to 8-bit by dividing by 256
      console.log(`[converter] LibRaw: Converting 16-bit to 8-bit...`);
      pixelData = new Uint8Array(data.length);
      for (let i = 0; i < data.length; i++) {
        pixelData[i] = Math.min(255, Math.round(data[i] / 256));
      }
    } else {
      // Already 8-bit
      pixelData = data instanceof Uint8Array ? data : new Uint8Array(data);
    }
    
    console.log(`[converter] LibRaw: Converting to JPEG...`);
    
    // Create image from pixel data using Sharp
    const result = await sharp(pixelData, {
      raw: {
        width,
        height,
        channels: 3,  // LibRaw always outputs RGB
      },
    })
      .toColorspace("srgb")
      .jpeg({ quality: 100, mozjpeg: false, chromaSubsampling: "4:4:4", progressive: false })
      .toFile(outputPath);
    
    console.log(`[converter] LibRaw: Conversion complete (${result.width}x${result.height})`);
    
    return { width: result.width, height: result.height };
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error(`[converter] LibRaw conversion error: ${errorMsg}`);
    throw err;
  }
}

/**
 * Extract the largest embedded JPEG from a RAW file buffer.
 * Most modern RAW files embed a full-resolution JPEG preview.
 */
function extractEmbeddedJpeg(buffer: Buffer): Buffer | null {
  const SOI = Buffer.from([0xff, 0xd8]);
  const EOI = Buffer.from([0xff, 0xd9]);

  let bestJpeg: Buffer | null = null;
  let searchFrom = 0;

  while (searchFrom < buffer.length - 2) {
    const soiIdx = buffer.indexOf(SOI, searchFrom);
    if (soiIdx === -1) break;

    const eoiIdx = buffer.indexOf(EOI, soiIdx + 2);
    if (eoiIdx === -1) break;

    const candidate = buffer.slice(soiIdx, eoiIdx + 2);
    if (!bestJpeg || candidate.length > bestJpeg.length) {
      bestJpeg = candidate;
    }

    searchFrom = eoiIdx + 2;
  }

  return bestJpeg;
}

/**
 * Strategy 3: Try ImageMagick/convert command (fallback option)
 */
async function convertWithImageMagick(
  inputPath: string,
  outputPath: string
): Promise<{ width: number; height: number }> {
  try {
    // Try ImageMagick convert command
    // -quality 100 for maximum quality
    // -interlace none for no interlacing
    const { stdout, stderr } = await execAsync(
      `convert "${inputPath}" -quality 100 -interlace none "${outputPath}"`,
      { maxBuffer: 500 * 1024 * 1024, timeout: 120000 }
    );

    if (stderr) {
      console.warn(`[converter] ImageMagick stderr:`, stderr.substring(0, 200));
    }

    // Verify output exists and has reasonable size
    if (!fs.existsSync(outputPath)) {
      throw new Error("ImageMagick did not produce output file");
    }

    const result = await sharp(outputPath).metadata();

    if (!result.width || !result.height || result.width < 1000) {
      throw new Error(
        `ImageMagick produced low-resolution output: ${result.width}x${result.height}`
      );
    }

    return { width: result.width, height: result.height };
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    throw new Error(`ImageMagick conversion failed: ${errorMsg.substring(0, 150)}`);
  }
}

/**
 * Strategy 4: Try Sharp directly (works for DNG and some formats)
 * Sharp can handle DNG, TIFF, and other formats
 */
async function convertWithSharp(
  inputPath: string,
  outputPath: string
): Promise<{ width: number; height: number }> {
  const result = await sharp(inputPath, { failOn: "none", density: 300 })
    .toColorspace("srgb")
    .jpeg({ quality: 100, mozjpeg: false, chromaSubsampling: "4:4:4", progressive: false })
    .toFile(outputPath);

  // Validate that we got full resolution, not just an embedded preview
  if (!result.width || !result.height) {
    throw new Error(`Sharp produced no output dimensions`);
  }

  // Suspicious dimensions check - embedded JPEGs are typically very small (< 1000px)
  // Full resolution RAW files are typically 4000+ pixels
  if (result.width < 1000 || result.height < 1000) {
    throw new Error(
      `Sharp produced low-resolution output (${result.width}x${result.height}). This suggests it read an embedded preview instead of the full image.`
    );
  }

  return { width: result.width, height: result.height };
}

export async function convertRawToJpg(jobId: string): Promise<void> {
  const job = jobStore.get(jobId);
  if (!job) throw new Error(`Job ${jobId} not found`);

  jobStore.updateStatus(jobId, "processing", 5);

  const outputPath = job.inputPath.replace(/\.[^.]+$/, ".jpg");
  jobStore.update(jobId, { outputPath });

  console.log(`[converter] Starting conversion for: ${job.originalName}`);

  try {
    let dimensions: { width: number; height: number } | null = null;
    let strategy = "unknown";
    let lastError = "";

    jobStore.updateStatus(jobId, "processing", 15);

    // Strategy 1: LibRaw with WASM (universal RAW support)
    try {
      jobStore.updateStatus(jobId, "processing", 20);
      console.log(`[converter] [1/6] Trying LibRaw WASM...`);
      dimensions = await convertWithLibRaw(job.inputPath, outputPath);
      strategy = "libraw-wasm";
      console.log(`[converter] ✓ LibRaw WASM succeeded: ${dimensions.width}x${dimensions.height}`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      lastError = msg;
      console.warn(`[converter] ✗ LibRaw WASM failed: ${msg.substring(0, 150)}`);
    }

    // Strategy 2: FFmpeg (most compatible fallback, handles virtually all formats)
    if (!dimensions) {
      try {
        jobStore.updateStatus(jobId, "processing", 35);
        console.log(`[converter] [2/6] Trying FFmpeg (universal RAW support)...`);
        dimensions = await convertWithFFmpeg(job.inputPath, outputPath);
        strategy = "ffmpeg";
        console.log(`[converter] ✓ FFmpeg succeeded: ${dimensions.width}x${dimensions.height}`);
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        lastError = msg;
        console.warn(`[converter] ✗ FFmpeg failed: ${msg.substring(0, 150)}`);
      }
    }

    // Strategy 3: ImageMagick
    if (!dimensions) {
      try {
        jobStore.updateStatus(jobId, "processing", 50);
        console.log(`[converter] [3/4] Trying ImageMagick...`);
        dimensions = await convertWithImageMagick(job.inputPath, outputPath);
        strategy = "imagemagick";
        console.log(`[converter] ✓ ImageMagick succeeded: ${dimensions.width}x${dimensions.height}`);
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        lastError = msg;
        console.warn(`[converter] ✗ ImageMagick failed: ${msg.substring(0, 150)}`);
      }
    }

    // Strategy 4: Sharp directly
    if (!dimensions) {
      try {
        jobStore.updateStatus(jobId, "processing", 80);
        console.log(`[converter] [4/4] Trying Sharp...`);
        dimensions = await convertWithSharp(job.inputPath, outputPath);
        strategy = "sharp";
        console.log(`[converter] ✓ Sharp succeeded: ${dimensions.width}x${dimensions.height}`);
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        lastError = msg;
        console.warn(`[converter] ✗ Sharp failed: ${msg.substring(0, 150)}`);
      }
    }

    if (!dimensions) {
      const errorMsg = `All conversion strategies failed for ${job.originalName}.\n` +
        `Last error: ${lastError.substring(0, 250)}\n` +
        `Tried: FFmpeg, LibRaw WASM, ImageMagick, Sharp.\n` +
        `Please ensure the file is not corrupted and uses a standard RAW format.`;
      console.error(`[converter] ${errorMsg}`);
      throw new Error(errorMsg);
    }

    jobStore.updateStatus(jobId, "processing", 90);

    const outputStat = await fs.promises.stat(outputPath);
    const fileSizeMB = (outputStat.size / 1024 / 1024).toFixed(2);

    console.log(
      `[converter] ✓ Conversion complete: ${job.originalName} → ${dimensions.width}x${dimensions.height} (${fileSizeMB} MB via ${strategy})`
    );

    jobStore.update(jobId, {
      status: "done",
      progress: 100,
      outputPath,
      width: dimensions.width,
      height: dimensions.height,
      convertedSize: outputStat.size,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Conversion failed";
    console.error(`[converter] Job ${jobId} failed: ${message}`);
    jobStore.update(jobId, {
      status: "error",
      progress: 0,
      error: message,
    });
    throw err;
  }
}
