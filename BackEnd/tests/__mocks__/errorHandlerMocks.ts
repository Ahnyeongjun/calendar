export const errorHandlerMocks = {
  asyncHandler: (fn: Function) => {
    return async (req: any, res: any, next: any) => {
      try {
        await fn(req, res, next);
      } catch (error) {
        next(error);
      }
    };
  },
  // 다른 에러 클래스들도 다시 export
  AppError: class AppError extends Error {
    constructor(message: string, public statusCode: number = 500) {
      super(message);
    }
  },
  ValidationError: class ValidationError extends Error {
    constructor(message: string, public errors: Record<string, string[]> = {}) {
      super(message);
      this.errors = errors;
    }
  },
  UnauthorizedError: class UnauthorizedError extends Error {
    constructor(message: string = 'Unauthorized') {
      super(message);
    }
  },
  NotFoundError: class NotFoundError extends Error {
    constructor(message: string = 'Resource not found') {
      super(message);
    }
  },
  ConflictError: class ConflictError extends Error {
    constructor(message: string = 'Resource conflict') {
      super(message);
    }
  }
}

export default errorHandlerMocks;