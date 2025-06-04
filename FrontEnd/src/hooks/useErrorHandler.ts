import { useCallback } from 'react';
import { toast } from 'sonner';
import { ApiError } from '@/services/api';

interface UseErrorHandlerOptions {
  showToast?: boolean;
  defaultMessage?: string;
}

export const useErrorHandler = (options: UseErrorHandlerOptions = {}) => {
  const { showToast = true, defaultMessage = '오류가 발생했습니다.' } = options;

  const handleError = useCallback((error: unknown, customMessage?: string) => {
    let message = customMessage || defaultMessage;

    if (error instanceof Error) {
      message = error.message;
    } else if (typeof error === 'string') {
      message = error;
    } else if (error && typeof error === 'object' && 'message' in error) {
      message = (error as ApiError).message;
    }

    if (showToast) {
      toast.error(message);
    }

    // 개발 환경에서는 콘솔에도 출력
    if (import.meta.env.DEV) {
      console.error('Error handled:', error);
    }

    return message;
  }, [defaultMessage, showToast]);

  const handleAsyncError = useCallback(async <T>(
    asyncFn: () => Promise<T>,
    errorMessage?: string
  ): Promise<T | null> => {
    try {
      return await asyncFn();
    } catch (error) {
      handleError(error, errorMessage);
      return null;
    }
  }, [handleError]);

  return {
    handleError,
    handleAsyncError
  };
};
