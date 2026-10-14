import { AppError } from '../utils/errors.js';
import { captureException } from '../config/sentry.js';

export const errorHandler = (err, _req, res, _next) => {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      error: {
        code: err.code,
        message: err.message,
        details: err.details,
      },
    });
  }

  if (err?.name === 'ZodError') {
    const first = err.errors?.[0];
    return res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: first ? `${first.path.join('.') || 'Request'}: ${first.message}` : 'Invalid request',
        details: err.errors,
      },
    });
  }

  if (err?.name === 'CastError') {
    return res.status(400).json({
      error: { code: 'VALIDATION_ERROR', message: `Invalid ${err.path || 'id'}` },
    });
  }

  if (err?.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || 'value';
    return res.status(409).json({
      error: { code: 'DUPLICATE', message: `That ${field} is already in use` },
    });
  }

  if (err?.name === 'ValidationError') {
    return res.status(400).json({
      error: { code: 'VALIDATION_ERROR', message: err.message },
    });
  }

  console.error(err);
  captureException(err);
  return res.status(500).json({
    error: {
      code: 'INTERNAL_ERROR',
      message: 'Something went wrong',
    },
  });
};
