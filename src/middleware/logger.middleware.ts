/**
 * Logger middleware
 * Integrates the logger utility with Express application
 */

import { Request, Response, NextFunction } from 'express';
import logger from '../utils/logger';

/**
 * Apply logger middleware to Express application
 * @param app Express application
 */
export const applyLoggerMiddleware = (app: any) => {
  // Request logging middleware
  app.use(logger.requestLogger());
  
  // Error handling middleware (should be applied last)
  app.use(logger.errorHandler());
};

/**
 * Log API requests middleware
 */
export const logApiRequest = (req: Request, res: Response, next: NextFunction) => {
  logger.info(`API Request: ${req.method} ${req.originalUrl}`, {
    body: req.body,
    params: req.params,
    query: req.query,
    ip: req.ip,
    userAgent: req.headers['user-agent']
  });
  next();
};