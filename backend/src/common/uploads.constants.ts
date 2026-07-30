import { join } from 'path';

export const UPLOADS_ROOT = join(process.cwd(), 'uploads');
export const ARTICLES_UPLOADS_DIR = join(UPLOADS_ROOT, 'articles');
export const AVATARS_UPLOADS_DIR = join(UPLOADS_ROOT, 'avatars');

export const MAX_PHOTOS_PER_ARTICLE = 10;
export const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024; // 5 Mo
export const ALLOWED_IMAGE_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
