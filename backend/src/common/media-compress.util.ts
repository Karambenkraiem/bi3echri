import { Logger } from '@nestjs/common';
import { existsSync, unlinkSync } from 'fs';
import { rename } from 'fs/promises';
import { basename, dirname, extname, join } from 'path';
import ffmpeg from 'fluent-ffmpeg';
import sharp from 'sharp';

const logger = new Logger('MediaCompress');

/**
 * Re-encodes an image to JPEG, auto-rotated (EXIF) and capped to maxDimension.
 * Always overwrites the original with a `.jpg` file and returns its filename.
 * Falls back to the original, untouched file if sharp can't decode it (e.g. an
 * exotic HEIC variant) so an upload never fails because of compression.
 */
export async function compressImageFile(
  filePath: string,
  maxDimension = 1600,
  quality = 82,
): Promise<string> {
  const dir = dirname(filePath);
  const original = basename(filePath);
  const jpgName = `${basename(filePath, extname(filePath))}.jpg`;
  const outPath = join(dir, jpgName);
  const tmpPath = join(dir, `${jpgName}.tmp`);

  try {
    await sharp(filePath)
      .rotate()
      .resize({ width: maxDimension, height: maxDimension, fit: 'inside', withoutEnlargement: true })
      .jpeg({ quality, mozjpeg: true })
      .toFile(tmpPath);

    if (existsSync(outPath) && outPath !== filePath) {
      unlinkSync(outPath);
    }
    if (filePath !== outPath && existsSync(filePath)) {
      unlinkSync(filePath);
    }
    await rename(tmpPath, outPath);
    return jpgName;
  } catch (err) {
    logger.warn(`Image compression failed for ${original}, keeping original file: ${err}`);
    if (existsSync(tmpPath)) {
      unlinkSync(tmpPath);
    }
    return original;
  }
}

/**
 * Transcodes a video to a small, web-friendly H.264/AAC MP4 (max 720p height).
 * Deletes the raw upload once the compressed version is ready. Falls back to
 * keeping the original file untouched if ffmpeg is unavailable or fails.
 */
export function compressVideoFile(filePath: string): Promise<string> {
  const dir = dirname(filePath);
  const original = basename(filePath);
  const mp4Name = `${basename(filePath, extname(filePath))}.mp4`;
  const outPath = join(dir, mp4Name);
  const tmpPath = join(dir, `${mp4Name}.tmp.mp4`);

  return new Promise((resolve) => {
    ffmpeg(filePath)
      .videoFilters("scale='min(1280,iw)':-2")
      .outputOptions(['-crf 28', '-preset veryfast', '-movflags +faststart', '-c:a aac', '-b:a 128k'])
      .on('end', async () => {
        try {
          if (existsSync(outPath) && outPath !== filePath) {
            unlinkSync(outPath);
          }
          if (filePath !== outPath && existsSync(filePath)) {
            unlinkSync(filePath);
          }
          await rename(tmpPath, outPath);
          resolve(mp4Name);
        } catch (err) {
          logger.warn(`Finalizing compressed video failed for ${original}, keeping original file: ${err}`);
          resolve(original);
        }
      })
      .on('error', (err) => {
        logger.warn(`Video compression failed for ${original}, keeping original file: ${err.message}`);
        if (existsSync(tmpPath)) {
          unlinkSync(tmpPath);
        }
        resolve(original);
      })
      .save(tmpPath);
  });
}
