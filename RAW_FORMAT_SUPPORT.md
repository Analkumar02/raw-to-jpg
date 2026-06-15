# RAW Format Support Guide

This app now supports **virtually all RAW formats** through a comprehensive 5-strategy conversion pipeline.

## Supported RAW Formats

✅ **Canon**: CR2, CRW, CRF, CR3
✅ **Nikon**: NEF, NRW, NRW
✅ **Sony**: ARW, SRF, SR2
✅ **Pentax**: PEF, DNG
✅ **Olympus**: ORF, ORI
✅ **Fujifilm**: RAF, RW2
✅ **Panasonic**: RW2, RWL
✅ **Leica**: DNG, LUX
✅ **Adobe**: DNG
✅ **And many others**

## Installation for Maximum Compatibility

### 1. FFmpeg (Primary - Recommended)

FFmpeg is the most compatible tool for RAW format conversion. Install it:

**Windows:**
```bash
# Using Chocolatey
choco install ffmpeg

# Or download from https://ffmpeg.org/download.html
```

**macOS:**
```bash
brew install ffmpeg
```

**Linux (Ubuntu/Debian):**
```bash
sudo apt-get update
sudo apt-get install ffmpeg
```

### 2. ImageMagick (Optional Fallback)

**Windows:**
```bash
choco install imagemagick
```

**macOS:**
```bash
brew install imagemagick
```

**Linux:**
```bash
sudo apt-get install imagemagick
```

## Conversion Pipeline

The app tries these strategies in order:

1. **LibRaw WASM** ← Universal built-in WebAssembly decoder, primary strategy
2. **FFmpeg** ← Secondary fallback with excellent RAW format support
3. **ImageMagick** ← Fallback option
4. **Sharp** ← Quick fallback for DNG / basic metadata
5. **Error** ← Detailed diagnostics

## Testing

1. Ensure FFmpeg is installed: `ffmpeg -version`
2. Upload a RAW file (DNG, CR2, NEF, etc.)
3. Check terminal output to see which strategy was used:
   - `✓ FFmpeg succeeded` = Everything is working
   - Other strategies = Fallback (still works)
   - Error = Check installation

## Troubleshooting

### "Unable to convert - all strategies failed"

**Solution 1**: Install FFmpeg
```bash
# Check if FFmpeg is installed
ffmpeg -version

# If not, install via your package manager (see above)
```

**Solution 2**: Check file integrity
- Ensure the RAW file is not corrupted
- Try opening it in the camera's software first

**Solution 3**: Check permissions
- Ensure temporary directory is writable: `echo $TEMP` (Windows) or `echo $TMPDIR` (macOS/Linux)

### "Sharp produced low-resolution output"

This means all strategies failed or produced embedded previews only. Install FFmpeg to get full-resolution conversion.

### Terminal Output Shows Strategy Used

Example:
```
[converter] [1/6] Trying LibRaw WASM...
[converter] ✓ LibRaw WASM succeeded: 5568x3712
```

## Performance Notes

- **LibRaw WASM**: ~2-15 seconds
- **FFmpeg**: ~5-30 seconds (depending on file size and CPU)
- **ImageMagick**: ~5-20 seconds
- **Sharp**: ~1-5 seconds

Quality is maximum (100) for all strategies.

## Advanced Configuration

To modify conversion strategies, edit `lib/converter.ts`:

- Adjust quality: Change `"2"` in FFmpeg command (2 = 95% quality, 1 = 100%)
- Timeout: Increase from 120000ms (2 min) if needed
- Resolution check: Modify `result.width < 1000` threshold

## Support

If you encounter issues:

1. Check terminal output for the exact error message
2. Verify the strategy that failed
3. Check if the required tool is installed
4. Ensure the RAW file is valid
5. Try converting in the camera's native software first to verify the file

---

**Last Updated**: 2026-06-15
