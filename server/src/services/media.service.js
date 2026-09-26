import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';
import { env } from '../config/env.js';
import { AppError } from '../utils/errors.js';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';

const uploadDir = path.resolve('uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

if (env.cloudinaryEnabled) {
  cloudinary.config({
    cloud_name: env.cloudinary.cloudName,
    api_key: env.cloudinary.apiKey,
    api_secret: env.cloudinary.apiSecret,
    secure: true,
  });
}

export const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 8 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) {
      return cb(new AppError(400, 'VALIDATION_ERROR', 'Only images allowed'));
    }
    return cb(null, true);
  },
});

/** Delivery URL with fashion-friendly crop defaults (3:4 packshot). */
export const cloudinaryUrl = (publicId, { width = 900, height = 1200, crop = 'fill' } = {}) => {
  if (!env.cloudinaryEnabled || !publicId) return null;
  return cloudinary.url(publicId, {
    secure: true,
    transformation: [
      { width, height, crop, gravity: 'auto', quality: 'auto', fetch_format: 'auto' },
    ],
  });
};

export const uploadMedia = async (file, { folder, tags } = {}) => {
  if (!file) throw new AppError(400, 'VALIDATION_ERROR', 'File required');

  if (env.cloudinaryEnabled) {
    const result = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder: folder || env.cloudinary.folder,
          tags: tags || ['theruux'],
          resource_type: 'image',
          transformation: [{ quality: 'auto', fetch_format: 'auto' }],
        },
        (err, res) => (err ? reject(err) : resolve(res)),
      );
      stream.end(file.buffer);
    });

    return {
      url: result.secure_url,
      publicId: result.public_id,
      width: result.width,
      height: result.height,
      format: result.format,
      bytes: result.bytes,
      // Optimized derivatives for storefront
      urlPackshot: cloudinaryUrl(result.public_id, { width: 900, height: 1200 }),
      urlThumb: cloudinaryUrl(result.public_id, { width: 240, height: 320 }),
      provider: 'cloudinary',
    };
  }

  if (env.nodeEnv === 'production') {
    throw new AppError(
      503,
      'MEDIA_UNAVAILABLE',
      'Cloudinary is required in production. Set CLOUDINARY_* env vars.',
    );
  }

  const ext = path.extname(file.originalname) || '.jpg';
  const name = `${Date.now()}-${crypto.randomBytes(4).toString('hex')}${ext}`;
  const dest = path.join(uploadDir, name);
  fs.writeFileSync(dest, file.buffer);
  return {
    url: `/uploads/${name}`,
    publicId: null,
    width: null,
    height: null,
    provider: 'local',
  };
};

export const getUploadSignature = (params = {}) => {
  if (!env.cloudinaryEnabled) {
    throw new AppError(503, 'MEDIA_UNAVAILABLE', 'Cloudinary not configured');
  }
  const timestamp = Math.round(Date.now() / 1000);
  const folder = params.folder || env.cloudinary.folder;
  const signature = cloudinary.utils.api_sign_request(
    { timestamp, folder },
    env.cloudinary.apiSecret,
  );
  return {
    timestamp,
    folder,
    signature,
    cloudName: env.cloudinary.cloudName,
    apiKey: env.cloudinary.apiKey,
  };
};
