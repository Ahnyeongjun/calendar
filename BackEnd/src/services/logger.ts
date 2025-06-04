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
}

class Logger {
  private isDevelopment = process.env.NODE_ENV === 'development';
  
  private formatLog(level: LogLevel, message: string, context?: string, data?: any): LogEntry {
    return {
      level,
      message,
      timestamp: new Date().toISOString(),
      context,
      data
    };
  }

  private shouldLog(level: LogLevel): boolean {
    if (this.isDevelopment) {
      return true; // 개발 환경에서는 모든 로그 출력
    }
    
    // 프로덕션에서는 ERROR, WARN만 출력
    return level === LogLevel.ERROR || level === LogLevel.WARN;
  }

  private output(logEntry: LogEntry): void {
    if (!this.shouldLog(logEntry.level)) return;

    const { level, message, timestamp, context, data } = logEntry;
    const contextStr = context ? `[${context}]` : '';
    const baseMessage = `${timestamp} ${level} ${contextStr} ${message}`;

    switch (level) {
      case LogLevel.ERROR:
        console.error(baseMessage, data ? data : '');
        break;
      case LogLevel.WARN:
        console.warn(baseMessage, data ? data : '');
        break;
      case LogLevel.INFO:
        console.info(baseMessage, data ? data : '');
        break;
      case LogLevel.DEBUG:
        console.debug(baseMessage, data ? data : '');
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

  // HTTP 요청 로깅을 위한 특별 메서드
  http(method: string, url: string, statusCode: number, responseTime?: number): void {
    const message = `${method} ${url} ${statusCode}${responseTime ? ` (${responseTime}ms)` : ''}`;
    
    if (statusCode >= 400) {
      this.error(message, 'HTTP');
    } else {
      this.info(message, 'HTTP');
    }
  }

  // 데이터베이스 쿼리 로깅
  db(query: string, duration?: number, error?: any): void {
    if (error) {
      this.error(`DB Query failed: ${query}`, 'DATABASE', error);
    } else {
      const message = `DB Query${duration ? ` (${duration}ms)` : ''}: ${query}`;
      this.debug(message, 'DATABASE');
    }
  }

  // Kafka 이벤트 로깅
  kafka(topic: string, action: string, success: boolean, error?: any): void {
    const message = `Kafka ${action} to ${topic}`;
    
    if (success) {
      this.debug(message, 'KAFKA');
    } else {
      this.warn(`${message} failed`, 'KAFKA', error);
    }
  }
}

export const logger = new Logger();
export { LogLevel };
