import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';
import { env } from '../config/env.js';
import { AppError } from '../utils/errors.js';

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
  limits: { fileSize: 30 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const video = file.mimetype === 'video/mp4' || file.mimetype === 'video/webm';
    if (!file.mimetype.startsWith('image/') && !video) {
      return cb(new AppError(400, 'VALIDATION_ERROR', 'Upload a JPG, PNG, WebP, MP4 or WebM file'));
    }
    return cb(null, true);
  },
});

const segment = (value, fallback = '') => {
  const cleaned = String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(cleaned) ? cleaned : fallback;
};

const masterFolder = () => segment(env.cloudinary.folder, 'theruux');

/** theruux/{products|categories|collections|homepage}/{category-or-section} */
export const resolveMediaFolder = (raw) => {
  const master = masterFolder();
  const scopes = new Set(['products', 'categories', 'collections', 'homepage']);
  const parts = String(raw || '')
    .split('/')
    .map((part) => segment(part))
    .filter((part) => part && part !== master);
  const scope = scopes.has(parts[0]) ? parts.shift() : 'products';
  if (scope === 'homepage') return `${master}/homepage/${parts[0] || 'general'}`;
  return `${master}/${scope}/${parts[0] || 'uncategorized'}`;
};

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
    const target = resolveMediaFolder(folder);
    const isVideo = file.mimetype.startsWith('video/');
    if (!isVideo && file.size > 8 * 1024 * 1024) {
      throw new AppError(400, 'VALIDATION_ERROR', 'Images must be under 8 MB');
    }
    const result = await new Promise((resolve, reject) => {
      const options = {
        folder: target,
        tags: tags || ['theruux', target.split('/').pop()],
        resource_type: isVideo ? 'video' : 'image',
        unique_filename: true,
        overwrite: false,
        use_filename: false,
      };
      // Store one size-capped image. Storefront crops are delivery URLs, not extra files.
      if (!isVideo) options.transformation = [{ width: 2000, height: 2600, crop: 'limit', quality: 'auto:good' }];
      const stream = cloudinary.uploader.upload_stream(options, (err, res) => (err ? reject(err) : resolve(res)));
      stream.end(file.buffer);
    });

    const videoUrl = result.secure_url;
    return {
      url: videoUrl,
      publicId: result.public_id,
      width: result.width,
      height: result.height,
      format: result.format,
      bytes: result.bytes,
      urlPackshot: isVideo ? videoUrl : cloudinaryUrl(result.public_id, { width: 900, height: 1200 }),
      urlThumb: isVideo ? videoUrl : cloudinaryUrl(result.public_id, { width: 240, height: 320 }),
      provider: 'cloudinary',
    };
  }

  throw new AppError(
    503,
    'MEDIA_UNAVAILABLE',
    'Cloudinary is required. Set CLOUDINARY_* env vars. Images are not saved on the server.',
  );
};

export const destroyMedia = async (publicId) => {
  if (!env.cloudinaryEnabled || !publicId) return;
  if (!String(publicId).startsWith(`${masterFolder()}/`)) return;
  try {
    await cloudinary.uploader.destroy(publicId, { resource_type: 'image', invalidate: true });
  } catch (err) {
    console.warn(`[cloudinary] could not delete ${publicId}: ${err.message}`);
  }
};

export const getUploadSignature = (params = {}) => {
  if (!env.cloudinaryEnabled) {
    throw new AppError(503, 'MEDIA_UNAVAILABLE', 'Cloudinary not configured');
  }
  const timestamp = Math.round(Date.now() / 1000);
  const folder = resolveMediaFolder(params.folder);
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
