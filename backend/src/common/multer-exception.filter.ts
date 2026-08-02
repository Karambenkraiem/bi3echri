import { ArgumentsHost, Catch, ExceptionFilter, HttpStatus } from '@nestjs/common';
import { Response } from 'express';
import { MulterError } from 'multer';
import { MAX_IMAGE_SIZE_BYTES } from './uploads.constants';

const MESSAGES: Record<string, string> = {
  LIMIT_FILE_SIZE: `Fichier trop volumineux (max ${Math.round(MAX_IMAGE_SIZE_BYTES / (1024 * 1024))} Mo)`,
  LIMIT_FILE_COUNT: 'Trop de fichiers envoyés en une fois',
  LIMIT_UNEXPECTED_FILE: 'Trop de fichiers envoyés en une fois',
};

@Catch(MulterError)
export class MulterExceptionFilter implements ExceptionFilter {
  catch(exception: MulterError, host: ArgumentsHost) {
    const response = host.switchToHttp().getResponse<Response>();
    response.status(HttpStatus.PAYLOAD_TOO_LARGE).json({
      statusCode: HttpStatus.PAYLOAD_TOO_LARGE,
      message: MESSAGES[exception.code] ?? exception.message,
    });
  }
}
