import { BadRequestException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { existsSync, mkdirSync } from 'fs';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import {
  ALLOWED_DOCUMENT_MIME_TYPES,
  ALLOWED_IMAGE_MIME_TYPES,
  ALLOWED_VIDEO_MIME_TYPES,
  MAX_MESSAGE_ATTACHMENT_SIZE_BYTES,
  MESSAGES_UPLOADS_DIR,
} from '../common/uploads.constants';

const ALLOWED_MIME_TYPES = [
  ...ALLOWED_IMAGE_MIME_TYPES,
  ...ALLOWED_VIDEO_MIME_TYPES,
  ...ALLOWED_DOCUMENT_MIME_TYPES,
];

export const messageAttachmentUploadOptions = {
  storage: diskStorage({
    destination: (req, _file, callback) => {
      const orderId = String(req.params.id);
      const dir = join(MESSAGES_UPLOADS_DIR, orderId);
      if (!existsSync(dir)) {
        mkdirSync(dir, { recursive: true });
      }
      callback(null, dir);
    },
    filename: (_req, file, callback) => {
      callback(null, `${randomUUID()}${extname(file.originalname).toLowerCase()}`);
    },
  }),
  limits: { fileSize: MAX_MESSAGE_ATTACHMENT_SIZE_BYTES },
  fileFilter: (
    _req: unknown,
    file: Express.Multer.File,
    callback: (error: Error | null, accept: boolean) => void,
  ) => {
    if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      callback(
        new BadRequestException('Format de fichier non supporté (image, vidéo ou PDF uniquement)'),
        false,
      );
      return;
    }
    callback(null, true);
  },
};
