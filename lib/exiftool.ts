import { execFile } from "child_process";
import { promisify } from "util";
import path from "path";
import fs from "fs";
import os from "os";

const execFileAsync = promisify(execFile);

/**
 * Locate the vendored exiftool binary for the current platform.
 */
function getExiftoolBinary(): string {
  // exiftool-vendored splits into platform packages
  const candidates = [
    // Windows
    path.join(process.cwd(), "node_modules", "exiftool-vendored.exe", "bin", "exiftool.exe"),
    // Unix/Mac (exiftool-vendored.pl)
    path.join(process.cwd(), "node_modules", "exiftool-vendored.pl", "bin", "exiftool"),
  ];
  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) return candidate;
  }
  // Fallback: system exiftool
  return "exiftool";
}

const EXIFTOOL_BIN = getExiftoolBinary();

/**
 * Read metadata from a file as a JSON object using exiftool -j.
 * Returns null on failure.
 */
export async function readRawMetadata(inputPath: string): Promise<Record<string, unknown> | null> {
  try {
    const { stdout } = await execFileAsync(EXIFTOOL_BIN, ["-j", inputPath], {
      timeout: 15000,
    });
    const list = JSON.parse(stdout) as Record<string, unknown>[];
    return list[0] ?? null;
  } catch {
    return null;
  }
}

/**
 * Extract the embedded PreviewImage (or ThumbnailImage) from a RAW file to disk.
 * Returns true if a preview was successfully written.
 * 
 * This function tries multiple strategies:
 * 1. Full-resolution embedded JPEG (PreviewImage)
 * 2. Camera-generated JPEG (JpgFromRaw)
 * 3. Fallback thumbnail (ThumbnailImage)
 */
export async function extractPreviewImage(
  inputPath: string,
  outputPath: string
): Promise<boolean> {
  console.log(`[exiftool] Attempting to extract preview from: ${path.basename(inputPath)}`);
  
  // Strategy order: PreviewImage first (usually highest res), then JpgFromRaw, then ThumbnailImage
  const strategies = [
    { tag: "-PreviewImage", name: "PreviewImage (full-res preview)" },
    { tag: "-JpgFromRaw", name: "JpgFromRaw (camera JPEG)" },
    { tag: "-ThumbnailImage", name: "ThumbnailImage (thumbnail)" }
  ];

  for (const { tag, name } of strategies) {
    try {
      console.log(`[exiftool] Trying ${name}...`);
      
      const { stdout, stderr } = await execFileAsync(
        EXIFTOOL_BIN,
        ["-b", tag, inputPath],
        { 
          encoding: "buffer", 
          maxBuffer: 50 * 1024 * 1024, 
          timeout: 15000 
        }
      );
      
      const buffer = stdout as unknown as Buffer;
      
      // Check if we got a valid buffer with reasonable size
      if (buffer && buffer.length > 5000) { // At least 5KB to be a real preview
        await fs.promises.writeFile(outputPath, buffer);
        const sizeKB = (buffer.length / 1024).toFixed(1);
        console.log(`[exiftool] ✓ Successfully extracted ${name} (${sizeKB} KB)`);
        return true;
      }
      
      if (buffer && buffer.length > 0) {
        console.warn(`[exiftool] ${name} is too small (${buffer.length} bytes), trying next strategy...`);
      }
      
      if (stderr) {
        console.warn(`[exiftool] ${name} stderr:`, stderr.toString().substring(0, 100));
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      console.warn(`[exiftool] ${name} failed: ${errorMsg.substring(0, 100)}`);
      // Continue to next strategy
    }
  }
  
  console.warn(`[exiftool] ✗ No usable preview image found in ${path.basename(inputPath)}`);
  return false;
}

/**
 * Parse the BlackLevel metadata string into a numeric array.
 * e.g. "1304 3270 3188" -> [1304, 3270, 3188]
 */
export function parseBlackLevels(blackLevelStr: unknown): number[] {
  if (!blackLevelStr) return [];
  return String(blackLevelStr)
    .trim()
    .split(/\s+/)
    .map(Number)
    .filter((n) => !isNaN(n));
}

/**
 * Build a 2x2 repeating pattern of black levels based on the CFA pattern.
 * CFAPattern examples: "[Red,Green][Green,Blue]" -> RGGB
 */
export function buildBayerBlackLevels(
  blackLevels: number[],
  cfaPattern: unknown
): [number, number, number, number] {
  const cfa = String(cfaPattern ?? "").toLowerCase();

  // Map: which index in [R,G1,G2,B] corresponds to each Bayer position
  // Bayer 2x2: position [row0col0, row0col1, row1col0, row1col1]
  let rIdx = 0, g1Idx = 1, g2Idx = 1, bIdx = 2;

  if (blackLevels.length === 4) {
    rIdx = 0; g1Idx = 1; g2Idx = 2; bIdx = 3;
  } else if (blackLevels.length === 3) {
    rIdx = 0; g1Idx = 1; g2Idx = 1; bIdx = 2;
  } else if (blackLevels.length === 1) {
    // Global black level
    return [blackLevels[0], blackLevels[0], blackLevels[0], blackLevels[0]];
  } else {
    return [0, 0, 0, 0];
  }

  const R = blackLevels[rIdx];
  const G1 = blackLevels[g1Idx];
  const G2 = blackLevels[g2Idx];
  const B = blackLevels[bIdx];

  // Determine Bayer layout from CFA pattern string
  if (cfa.includes("red,green") && cfa.includes("green,blue")) {
    // RGGB: [R, G1, G2, B]
    return [R, G1, G2, B];
  } else if (cfa.includes("blue,green") && cfa.includes("green,red")) {
    // BGGR: [B, G1, G2, R]
    return [B, G1, G2, R];
  } else if (cfa.includes("green,red") && cfa.includes("blue,green")) {
    // GRBG: [G1, R, B, G2]
    return [G1, R, B, G2];
  } else if (cfa.includes("green,blue") && cfa.includes("red,green")) {
    // GBRG: [G1, B, R, G2]
    return [G1, B, R, G2];
  }

  // Default RGGB
  return [R, G1, G2, B];
}

/**
 * Generate a 16-bit Big-Endian PGM dark frame file for use with raw processing engines (such as LibRaw or dcraw).
 * Returns the path to the created PGM file, or null on failure.
 */
export async function generateDarkFrame(
  width: number,
  height: number,
  bayerPattern: [number, number, number, number],
  outputPath: string
): Promise<boolean> {
  try {
    const header = Buffer.from(`P5\n${width} ${height}\n65535\n`);
    const dataSize = width * height * 2;
    const data = Buffer.allocUnsafe(dataSize);

    const [v00, v01, v10, v11] = bayerPattern;

    for (let row = 0; row < height; row++) {
      const rowMod = row % 2;
      for (let col = 0; col < width; col++) {
        const colMod = col % 2;
        let val: number;
        if (rowMod === 0 && colMod === 0) val = v00;
        else if (rowMod === 0 && colMod === 1) val = v01;
        else if (rowMod === 1 && colMod === 0) val = v10;
        else val = v11;

        const offset = (row * width + col) * 2;
        data.writeUInt16BE(val, offset);
      }
    }

    await fs.promises.writeFile(outputPath, Buffer.concat([header, data]));
    return true;
  } catch {
    return false;
  }
}

export { EXIFTOOL_BIN };
