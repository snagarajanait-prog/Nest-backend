import { BadRequestException } from '@nestjs/common';
import { Request } from 'express';
import { diskStorage } from 'multer';
import type { FileFilterCallback, Options } from 'multer';
import { existsSync, mkdirSync } from 'fs';
import { extname } from 'path';
import { MESSAGES, UPLOAD } from '../constants/app.constants';

const uploadDir = process.env.UPLOAD_DIR ?? 'uploads';

/**
 * Multer options shared by every product image endpoint:
 *  - stores files on disk under UPLOAD_DIR with a collision-proof name
 *  - rejects anything that is not an allowed image type
 *  - caps file size at UPLOAD.MAX_FILE_SIZE_BYTES
 */
export const multerImageOptions: Options = {
  storage: diskStorage({
    destination: (_req, _file, cb) => {
      if (!existsSync(uploadDir)) {
        mkdirSync(uploadDir, { recursive: true });
      }
      cb(null, uploadDir);
    },
    filename: (_req, file, cb) => {
      const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
      cb(null, `product-${unique}${extname(file.originalname)}`);
    },
  }),
  fileFilter: (
    _req: Request,
    file: Express.Multer.File,
    cb: FileFilterCallback,
  ) => {
    if (
      (UPLOAD.ALLOWED_MIME_TYPES as readonly string[]).includes(file.mimetype)
    ) {
      cb(null, true);
    } else {
      cb(new BadRequestException(MESSAGES.UPLOAD.INVALID_TYPE));
    }
  },
  limits: { fileSize: UPLOAD.MAX_FILE_SIZE_BYTES },
};

/** Turn multer files into public web paths served by ServeStaticModule. */
export function filesToPaths(files?: Express.Multer.File[]): string[] {
  if (!files || files.length === 0) {
    return [];
  }
  return files.map((f) => `/uploads/${f.filename}`);
}
