// Centralized logging utility for the AkashChat API frontend

export interface LogData {
  [key: string]: any;
}

export interface LogContext {
  requestId?: string;
  userId?: string;
  email?: string;
  sessionId?: string;
  component?: string;
  action?: string;
  [key: string]: any;
}

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3
}

class Logger {
  private component: string;
  private logLevel: LogLevel;

  constructor(component: string) {
    this.component = component;
    this.logLevel = this.getLogLevel();
  }

  private getLogLevel(): LogLevel {
    const level = process.env.LOG_LEVEL?.toUpperCase() || 'INFO';
    switch (level) {
      case 'DEBUG': return LogLevel.DEBUG;
      case 'INFO': return LogLevel.INFO;
      case 'WARN': return LogLevel.WARN;
      case 'ERROR': return LogLevel.ERROR;
      default: return LogLevel.INFO;
    }
  }

  private shouldLog(level: LogLevel): boolean {
    return level >= this.logLevel;
  }

  private formatMessage(level: string, message: string, context?: LogContext, data?: LogData): string {
    const timestamp = new Date().toISOString();
    const baseLog = {
      timestamp,
      level,
      component: this.component,
      message,
      ...(context && { context }),
      ...(data && { data })
    };

    // In production, you might want to send this to a logging service
    if (process.env.NODE_ENV === 'production') {
      return JSON.stringify(baseLog);
    } else {
      // Pretty print for development
      return `[${timestamp}] [${level}] [${this.component}] ${message}${
        context || data ? '\n' + JSON.stringify({ context, data }, null, 2) : ''
      }`;
    }
  }

  debug(message: string, context?: LogContext, data?: LogData): void {
    if (!this.shouldLog(LogLevel.DEBUG)) return;
    console.debug(this.formatMessage('DEBUG', message, context, data));
  }

  info(message: string, context?: LogContext, data?: LogData): void {
    if (!this.shouldLog(LogLevel.INFO)) return;
    console.log(this.formatMessage('INFO', message, context, data));
  }

  warn(message: string, context?: LogContext, data?: LogData): void {
    if (!this.shouldLog(LogLevel.WARN)) return;
    console.warn(this.formatMessage('WARN', message, context, data));
  }

  error(message: string, context?: LogContext, data?: LogData, error?: Error): void {
    if (!this.shouldLog(LogLevel.ERROR)) return;
    const errorData = error ? {
      ...data,
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack
      }
    } : data;
    console.error(this.formatMessage('ERROR', message, context, errorData));
  }

  // Utility methods for common logging patterns
  apiRequest(method: string, path: string, context?: LogContext): void {
    this.info(`API ${method} ${path}`, { ...context, action: 'api_request' });
  }

  apiResponse(method: string, path: string, status: number, duration: number, context?: LogContext): void {
    this.info(`API ${method} ${path} - ${status}`, { 
      ...context, 
      action: 'api_response',
      status,
      duration 
    });
  }

  userAction(action: string, context?: LogContext, data?: LogData): void {
    this.info(`User action: ${action}`, { ...context, action: 'user_action' }, data);
  }

  systemEvent(event: string, context?: LogContext, data?: LogData): void {
    this.info(`System event: ${event}`, { ...context, action: 'system_event' }, data);
  }

  securityEvent(event: string, context?: LogContext, data?: LogData): void {
    this.warn(`Security event: ${event}`, { ...context, action: 'security_event' }, data);
  }

  performanceMetric(metric: string, value: number, unit: string, context?: LogContext): void {
    this.info(`Performance: ${metric}`, { 
      ...context, 
      action: 'performance_metric',
      metric,
      value,
      unit
    });
  }
}

// Factory function to create loggers
export function createLogger(component: string): Logger {
  return new Logger(component);
}

// Pre-configured loggers for common components
export const loggers = {
  litellm: createLogger('LiteLLM-Management'),
  auth: createLogger('Authentication'),
  api: createLogger('API'),
  frontend: createLogger('Frontend'),
  health: createLogger('Health-Check'),
  session: createLogger('Session-Management'),
  keys: createLogger('API-Keys')
};

// Middleware for request logging
export function createRequestLogger(component: string) {
  const logger = createLogger(component);
  
  return {
    logRequest: (req: any, requestId: string) => {
      logger.apiRequest(
        req.method || 'UNKNOWN',
        req.url || req.nextUrl?.pathname || 'unknown',
        { requestId }
      );
    },
    
    logResponse: (req: any, status: number, startTime: number, requestId: string, context?: LogContext) => {
      const duration = Date.now() - startTime;
      logger.apiResponse(
        req.method || 'UNKNOWN',
        req.url || req.nextUrl?.pathname || 'unknown',
        status,
        duration,
        { requestId, ...context }
      );
    },
    
    logError: (req: any, error: Error, requestId: string, context?: LogContext) => {
      logger.error(
        `Request failed: ${req.method || 'UNKNOWN'} ${req.url || req.nextUrl?.pathname || 'unknown'}`,
        { requestId, ...context },
        undefined,
        error
      );
    }
  };
}

// Export default logger for general use
export default createLogger('App'); 