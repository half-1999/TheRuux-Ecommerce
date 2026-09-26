import { AppError } from '../utils/errors.js';

export const notFound = (_req, _res, next) => {
  next(new AppError(404, 'NOT_FOUND', 'Route not found'));
};
