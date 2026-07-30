import { BadRequestException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { existsSync, mkdirSync } from 'fs';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import {
  ALLOWED_IMAGE_MIME_TYPES,
  AVATARS_UPLOADS_DIR,
  MAX_IMAGE_SIZE_BYTES,
} from '../common/uploads.constants';

export const avatarUploadOptions = {
  storage: diskStorage({
    destination: (req, _file, callback) => {
      const userId = (req as unknown as { user: { userId: string } }).user.userId;
      const dir = join(AVATARS_UPLOADS_DIR, userId);
      if (!existsSync(dir)) {
        mkdirSync(dir, { recursive: true });
      }
      callback(null, dir);
    },
    filename: (_req, file, callback) => {
      callback(null, `${randomUUID()}${extname(file.originalname).toLowerCase()}`);
    },
  }),
  limits: { fileSize: MAX_IMAGE_SIZE_BYTES },
  fileFilter: (
    _req: unknown,
    file: Express.Multer.File,
    callback: (error: Error | null, accept: boolean) => void,
  ) => {
    if (!ALLOWED_IMAGE_MIME_TYPES.includes(file.mimetype)) {
      callback(new BadRequestException('Format de fichier non supporté (image uniquement)'), false);
      return;
    }
    callback(null, true);
  },
};
