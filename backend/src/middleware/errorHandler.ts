import { Request, Response, NextFunction } from 'express';
import ErrorResponse from '../utils/errorResponse';
const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  let error = { ...err };
  error.message = err.message;
  if (process.env.NODE_ENV === 'development') {
    if (error.statusCode !== 401 && error.statusCode !== 403 && error.statusCode !== 404) {
      console.error(err);
    }
  }
  if (err.code === 'P2002') {
    const fields = err.meta && err.meta.target ? (err.meta.target as string[]) : [];
    const message = `Duplicate value entered for field: ${fields.join(', ')}`;
    error = new ErrorResponse(message, 400);
  }
  if (err.code === 'P2025') {
    const message = err.meta && err.meta.cause ? (err.meta.cause as string) : 'Requested resource was not found';
    error = new ErrorResponse(message, 404);
  }
  if (err.name === 'JsonWebTokenError') {
    error = new ErrorResponse('Not authorized, token validation failed', 401);
  }
  if (err.name === 'TokenExpiredError') {
    error = new ErrorResponse('Not authorized, token has expired', 401);
  }
  res.status(error.statusCode || 500).json({
    success: false,
    error: error.message || 'Internal Server Error'
  });
};
export default errorHandler;
