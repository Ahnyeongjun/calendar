import { LogLevel, LogEntry } from '../types/common';
import { randomUUID } from 'crypto';

export class Logger {
  private isDevelopment: boolean;
  private serviceName: string;

  constructor(serviceName: string = 'calendar-backend') {
    this.isDevelopment = process.env.NODE_ENV === 'development';
    this.serviceName = serviceName;
  }

  private formatLog(
    level: LogLevel, 
    message: string, 
    context?: string, 
    data?: any,
    requestId?: string,
    userId?: string
  ): LogEntry {
    return {
      level,
      message,
      timestamp: new Date().toISOString(),
      context,
      data: this.sanitizeData(data),
      requestId,
      userId
    };
  }

  private sanitizeData(data: any): any {
    if (!data) return data;
    
    // 민감한 정보 제거
    const sensitiveFields = ['password', 'token', 'secret', 'key'];
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

    const structuredLog = {
      service: this.serviceName,
      ...logEntry
    };

    const logString = JSON.stringify(structuredLog);

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

  error(message: string, context?: string, data?: any, requestId?: string, userId?: string): void {
    this.output(this.formatLog(LogLevel.ERROR, message, context, data, requestId, userId));
  }

  warn(message: string, context?: string, data?: any, requestId?: string, userId?: string): void {
    this.output(this.formatLog(LogLevel.WARN, message, context, data, requestId, userId));
  }

  info(message: string, context?: string, data?: any, requestId?: string, userId?: string): void {
    this.output(this.formatLog(LogLevel.INFO, message, context, data, requestId, userId));
  }

  debug(message: string, context?: string, data?: any, requestId?: string, userId?: string): void {
    this.output(this.formatLog(LogLevel.DEBUG, message, context, data, requestId, userId));
  }

  // 컨텍스트 기반 로거 생성
  createContext(context: string, requestId?: string, userId?: string) {
    return {
      error: (message: string, data?: any) => this.error(message, context, data, requestId, userId),
      warn: (message: string, data?: any) => this.warn(message, context, data, requestId, userId),
      info: (message: string, data?: any) => this.info(message, context, data, requestId, userId),
      debug: (message: string, data?: any) => this.debug(message, context, data, requestId, userId)
    };
  }

  // HTTP 요청 로깅을 위한 특별 메서드
  http(method: string, url: string, statusCode: number, responseTime?: number, requestId?: string, userId?: string): void {
    const message = `${method} ${url} ${statusCode}${responseTime ? ` (${responseTime}ms)` : ''}`;
    
    if (statusCode >= 500) {
      this.error(message, 'HTTP', undefined, requestId, userId);
    } else if (statusCode >= 400) {
      this.warn(message, 'HTTP', undefined, requestId, userId);
    } else {
      this.info(message, 'HTTP', undefined, requestId, userId);
    }
  }

  // 데이터베이스 쿼리 로깅
  db(operation: string, table: string, duration?: number, error?: any, requestId?: string): void {
    const message = `${operation} ${table}${duration ? ` (${duration}ms)` : ''}`;
    
    if (error) {
      this.error(`DB ${message} failed`, 'DATABASE', error, requestId);
    } else {
      this.debug(`DB ${message}`, 'DATABASE', undefined, requestId);
    }
  }

  // Kafka 이벤트 로깅
  kafka(topic: string, action: string, success: boolean, error?: any, requestId?: string): void {
    const message = `Kafka ${action} to ${topic}`;
    
    if (success) {
      this.debug(message, 'KAFKA', undefined, requestId);
    } else {
      this.warn(`${message} failed`, 'KAFKA', error, requestId);
    }
  }

  // 성능 측정을 위한 타이머 유틸리티
  startTimer(operation: string, requestId?: string) {
    const start = process.hrtime();
    
    return {
      end: (context?: string, data?: any) => {
        const [seconds, nanoseconds] = process.hrtime(start);
        const duration = Math.round((seconds * 1000) + (nanoseconds / 1000000));
        
        this.debug(`${operation} completed in ${duration}ms`, context, data, requestId);
        return duration;
      }
    };
  }
}

export const logger = new Logger();
export { LogLevel };
