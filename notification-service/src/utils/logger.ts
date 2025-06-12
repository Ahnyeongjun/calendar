enum LogLevel {
  ERROR = 'ERROR',
  WARN = 'WARN',
  INFO = 'INFO',
  DEBUG = 'DEBUG'
}

interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  context?: string;
  data?: any;
  service: string;
}

export class Logger {
  private service: string;
  private isDevelopment: boolean;

  constructor(service: string = 'notification-service') {
    this.service = service;
    this.isDevelopment = process.env.NODE_ENV === 'development';
  }

  private formatLog(
    level: LogLevel,
    message: string,
    context?: string,
    data?: any
  ): LogEntry {
    return {
      level,
      message,
      timestamp: new Date().toISOString(),
      context,
      data: this.sanitizeData(data),
      service: this.service
    };
  }

  private sanitizeData(data: any): any {
    if (!data) return data;
    
    // 민감한 정보 제거
    const sensitiveFields = ['password', 'token', 'secret', 'key', 'auth'];
    const sanitized = { ...data };
    
    Object.keys(sanitized).forEach(key => {
      if (sensitiveFields.some(field => key.toLowerCase().includes(field))) {
        sanitized[key] = '[REDACTED]';
      }
    });
    
    return sanitized;
  }

  private shouldLog(level: LogLevel): boolean {
    if (this.isDevelopment) {
      return true; // 개발 환경에서는 모든 로그 출력
    }
    
    // 프로덕션에서는 ERROR, WARN, INFO만 출력
    return level !== LogLevel.DEBUG;
  }

  private output(logEntry: LogEntry): void {
    if (!this.shouldLog(logEntry.level)) return;

    const logString = JSON.stringify(logEntry);

    switch (logEntry.level) {
      case LogLevel.ERROR:
        console.error(logString);
        break;
      case LogLevel.WARN:
        console.warn(logString);
        break;
      case LogLevel.INFO:
        console.info(logString);
        break;
      case LogLevel.DEBUG:
        console.debug(logString);
        break;
    }
  }

  error(message: string, context?: string, data?: any): void {
    this.output(this.formatLog(LogLevel.ERROR, message, context, data));
  }

  warn(message: string, context?: string, data?: any): void {
    this.output(this.formatLog(LogLevel.WARN, message, context, data));
  }

  info(message: string, context?: string, data?: any): void {
    this.output(this.formatLog(LogLevel.INFO, message, context, data));
  }

  debug(message: string, context?: string, data?: any): void {
    this.output(this.formatLog(LogLevel.DEBUG, message, context, data));
  }

  // 컨텍스트 기반 로거 생성
  createContext(context: string) {
    return {
      error: (message: string, data?: any) => this.error(message, context, data),
      warn: (message: string, data?: any) => this.warn(message, context, data),
      info: (message: string, data?: any) => this.info(message, context, data),
      debug: (message: string, data?: any) => this.debug(message, context, data)
    };
  }
}

export { LogLevel };
