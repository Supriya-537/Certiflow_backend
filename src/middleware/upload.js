import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import multer from 'multer';
import { randomUUID } from 'node:crypto';

const defaultUploadDirectory = fileURLToPath(new URL('../../uploads/', import.meta.url));
export const uploadDirectory = path.resolve(process.env.UPLOAD_DIR || defaultUploadDirectory);
fs.mkdirSync(uploadDirectory, { recursive: true });

const allowedTypes = {
  'application/pdf': ['.pdf'],
  'application/msword': ['.doc'],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/png': ['.png'],
  'image/webp': ['.webp'],
};

const storage = multer.diskStorage({
  destination: (_req, _file, callback) => callback(null, uploadDirectory),
  filename: (_req, file, callback) => {
    callback(null, `${randomUUID()}${path.extname(file.originalname).toLowerCase()}`);
  },
});

export const supportingDocumentUpload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024, files: 5 },
  fileFilter: (_req, file, callback) => {
    const extension = path.extname(file.originalname).toLowerCase();
    if (allowedTypes[file.mimetype]?.includes(extension)) {
      callback(null, true);
      return;
    }

    const error = new Error('Upload a PDF, DOC, DOCX, JPG, PNG, or WEBP file.');
    error.status = 400;
    callback(error);
  },
});
