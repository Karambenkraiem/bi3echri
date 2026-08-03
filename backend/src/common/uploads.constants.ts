import { join } from 'path';

export const UPLOADS_ROOT = join(process.cwd(), 'uploads');
export const ARTICLES_UPLOADS_DIR = join(UPLOADS_ROOT, 'articles');
export const AVATARS_UPLOADS_DIR = join(UPLOADS_ROOT, 'avatars');
export const MESSAGES_UPLOADS_DIR = join(UPLOADS_ROOT, 'messages');

export const MAX_PHOTOS_PER_ARTICLE = 10;
export const MAX_IMAGE_SIZE_BYTES = 20 * 1024 * 1024; // 20 Mo (photos de téléphone récentes)
export const ALLOWED_IMAGE_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/heic',
  'image/heif',
];

export const ALLOWED_VIDEO_MIME_TYPES = ['video/mp4', 'video/webm', 'video/quicktime'];
export const ALLOWED_DOCUMENT_MIME_TYPES = ['application/pdf'];
export const MAX_MESSAGE_ATTACHMENT_SIZE_BYTES = 80 * 1024 * 1024; // 80 Mo brut (vidéo avant compression)
