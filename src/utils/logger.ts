/**
 * Logger utility for backend
 * Provides standardized logging for errors, requests, and system events
 */

import fs from 'fs';
import path from 'path';
import { Request, Response, NextFunction } from 'express';

// Log levels
enum LogLevel {
  INFO = 'INFO',
  WARNING = 'WARNING',
  ERROR = 'ERROR',
  DEBUG = 'DEBUG'
}

// Log entry interface
interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  meta?: any;
}

class Logger {
  private logDir: string;
  private errorLogPath: string;
  private accessLogPath: string;
  private systemLogPath: string;

  constructor() {
    // Create logs directory if it doesn't exist
    this.logDir = path.join(process.cwd(), 'logs');
    if (!fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true });
    }

    // Set log file paths
    this.errorLogPath = path.join(this.logDir, 'error.log');
    this.accessLogPath = path.join(this.logDir, 'access.log');
    this.systemLogPath = path.join(this.logDir, 'system.log');
  }

  /**
   * Format log entry
   */
  private formatLogEntry(entry: LogEntry): string {
    return `[${entry.timestamp}] [${entry.level}] ${entry.message} ${entry.meta ? JSON.stringify(entry.meta) : ''}`;
  }

  /**
   * Write to log file
   */
  private writeToLog(logPath: string, entry: LogEntry): void {
    const formattedEntry = this.formatLogEntry(entry) + '\n';
    fs.appendFileSync(logPath, formattedEntry);
    
    // Always log errors to console regardless of environment
    // For other log levels, only log to console in development environment
    if (entry.level === LogLevel.ERROR || process.env.NODE_ENV !== 'production') {
      // Use console.error for error logs and console.log for others
      if (entry.level === LogLevel.ERROR) {
        console.error(formattedEntry);
      } else {
        console.log(formattedEntry);
      }
    }
  }

  /**
   * Log info message
   */
  info(message: string, meta?: any): void {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level: LogLevel.INFO,
      message,
      meta
    };
    this.writeToLog(this.systemLogPath, entry);
  }

  /**
   * Log warning message
   */
  warn(message: string, meta?: any): void {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level: LogLevel.WARNING,
      message,
      meta
    };
    this.writeToLog(this.systemLogPath, entry);
  }

  /**
   * Log error message
   */
  error(message: string, meta?: any): void {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level: LogLevel.ERROR,
      message,
      meta
    };
    this.writeToLog(this.errorLogPath, entry);
  }

  /**
   * Log debug message
   */
  debug(message: string, meta?: any): void {
    // Only log debug messages in development environment
    if (process.env.NODE_ENV !== 'production') {
      const entry: LogEntry = {
        timestamp: new Date().toISOString(),
        level: LogLevel.DEBUG,
        message,
        meta
      };
      this.writeToLog(this.systemLogPath, entry);
    }
  }

  /**
   * Log HTTP request
   */
  logRequest(req: Request, res: Response, responseTime?: number): void {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level: LogLevel.INFO,
      message: `${req.method} ${req.originalUrl}`,
      meta: {
        method: req.method,
        url: req.originalUrl,
        ip: req.ip,
        statusCode: res.statusCode,
        userAgent: req.headers['user-agent'],
        responseTime: responseTime ? `${responseTime}ms` : undefined
      }
    };
    this.writeToLog(this.accessLogPath, entry);
  }

  /**
   * Express middleware for logging requests
   */
  requestLogger() {
    return (req: Request, res: Response, next: NextFunction) => {
      const start = Date.now();
      
      // Log once the response is finished
      res.on('finish', () => {
        const responseTime = Date.now() - start;
        this.logRequest(req, res, responseTime);
      });
      
      next();
    };
  }

  /**
   * Express middleware for error handling
   */
  errorHandler() {
    return (err: Error, req: Request, res: Response, next: NextFunction) => {
      this.error(`Unhandled error: ${err.message}`, {
        stack: err.stack,
        method: req.method,
        url: req.originalUrl,
        ip: req.ip
      });
      
      // Send error response
      res.status(500).json({
        success: false,
        message: 'Server Error',
        error: process.env.NODE_ENV === 'production' ? undefined : err.message
      });
    };
  }
}

// Export singleton instance
const logger = new Logger();
export default logger;