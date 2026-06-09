import { validationResult } from 'express-validator';
import { HttpError } from '../utils/httpError.js';
import { sendError } from '../utils/response.js';
import { logger } from '../utils/logger.js';

export const validateRequest = (req, _res, next) => {
  const result = validationResult(req);
  if (result.isEmpty()) return next();
  return next(new HttpError(400, 'Validation failed', result.array()));
};

export const notFoundHandler = (req, _res, next) => {
  next(new HttpError(404, `Route not found: ${req.method} ${req.originalUrl}`));
};

export const errorHandler = (err, _req, res, _next) => {
  const statusCode = err.statusCode || 500;
  if (statusCode >= 500) {
    logger.error(err);
  }
  return sendError(
    res,
    statusCode,
    statusCode >= 500 ? 'Internal server error' : err.message,
    err.details,
  );
};
