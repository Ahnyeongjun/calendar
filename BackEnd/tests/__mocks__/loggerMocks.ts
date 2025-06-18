export const logger = {
  createContext: jest.fn().mockReturnValue({
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn()
  }),
  startTimer: jest.fn().mockReturnValue({
    end: jest.fn().mockReturnValue(100)
  }),
  db: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  debug: jest.fn(),
  http: jest.fn(),
  kafka: jest.fn()
};

export const LogLevel = {
  ERROR: 'ERROR',
  WARN: 'WARN', 
  INFO: 'INFO',
  DEBUG: 'DEBUG'
};

export default { logger, LogLevel };

