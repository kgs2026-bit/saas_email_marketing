import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

export interface ApiError extends Error {
  statusCode?: number;
  code?: string;
}

export function errorHandler(
  err: ApiError,
  req: Request,
  res: Response,
  _next: NextFunction
) {
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal server error';

  // Log the error
  logger.error({
    message,
    statusCode,
    method: req.method,
    url: req.url,
    ip: req.ip,
    stack: err.stack
  });

  // Don't leak error details in production
  const responseMessage = process.env.NODE_ENV === 'production' && statusCode === 500
    ? 'Internal server error'
    : message;

  res.status(statusCode).json({
    error: responseMessage,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
}

export function createError(message: string, statusCode: number = 500): ApiError {
  const error: ApiError = new Error(message);
  error.statusCode = statusCode;
  return error;
}

export function NotFoundError(message: string = 'Resource not found'): ApiError {
  return createError(message, 404);
}

export function ValidationError(message: string = 'Validation failed'): ApiError {
  return createError(message, 400);
}

export function UnauthorizedError(message: string = 'Unauthorized'): ApiError {
  return createError(message, 401);
}

export function ForbiddenError(message: string = 'Forbidden'): ApiError {
  return createError(message, 403);
}
