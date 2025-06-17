import { ApiResponse } from '@/types/common';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

interface ApiConfig {
  baseURL: string;
  timeout: number;
  retries: number;
  retryDelay: number;
}

interface RequestConfig extends RequestInit {
  timeout?: number;
  retries?: number;
  retryDelay?: number;
}

interface ApiError extends Error {
  status?: number;
  code?: string;
  errors?: Record<string, string[]>;
  requestId?: string;
  response?: Response;
}

class ApiService {
  private config: ApiConfig;
  private requestInterceptors: Array<(config: RequestConfig) => RequestConfig | Promise<RequestConfig>> = [];
  private responseInterceptors: Array<(response: Response) => Response | Promise<Response>> = [];
  private errorInterceptors: Array<(error: ApiError) => Promise<never>> = [];

  constructor(config: Partial<ApiConfig> = {}) {
    this.config = {
      baseURL: API_BASE_URL,
      timeout: 30000, // 30초
      retries: 3,
      retryDelay: 1000,
      ...config
    };

    this.setupDefaultInterceptors();
  }

  /**
   * 기본 인터셉터 설정
   */
  private setupDefaultInterceptors(): void {
    // 요청 인터셉터: 인증 헤더 추가
    this.addRequestInterceptor((config) => {
      const token = this.getToken();
      const headers = new Headers(config.headers);

      headers.set('Content-Type', 'application/json');

      if (token) {
        headers.set('Authorization', `Bearer ${token}`);
      }

      // Request ID 추가 (디버깅용)
      const requestId = this.generateRequestId();
      headers.set('X-Request-ID', requestId);

      return {
        ...config,
        headers
      };
    });

    // 응답 인터셉터: 새 토큰 처리
    this.addResponseInterceptor((response) => {
      const newToken = response.headers.get('X-New-Token');
      if (newToken) {
        this.setToken(newToken);
      }
      return response;
    });

    // 에러 인터셉터: 401 처리
    this.addErrorInterceptor(async (error) => {
      if (error.status === 401) {
        this.clearToken();
        // 로그인 페이지로 리디렉션 (AuthLayout에서 처리됨)
        window.dispatchEvent(new CustomEvent('auth:unauthorized'));
      }
      throw error;
    });
  }

  /**
   * 토큰 관리
   */
  private getToken(): string | null {
    return localStorage.getItem('auth-token');
  }

  private setToken(token: string): void {
    localStorage.setItem('auth-token', token);
  }

  private clearToken(): void {
    localStorage.removeItem('auth-token');
  }

  /**
   * Request ID 생성
   */
  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * 인터셉터 관리
   */
  addRequestInterceptor(interceptor: (config: RequestConfig) => RequestConfig | Promise<RequestConfig>): void {
    this.requestInterceptors.push(interceptor);
  }

  addResponseInterceptor(interceptor: (response: Response) => Response | Promise<Response>): void {
    this.responseInterceptors.push(interceptor);
  }

  addErrorInterceptor(interceptor: (error: ApiError) => Promise<never>): void {
    this.errorInterceptors.push(interceptor);
  }

  /**
   * 응답 처리
   */
  private async handleResponse<T>(response: Response): Promise<T> {
    // 응답 인터셉터 실행
    let processedResponse = response;
    for (const interceptor of this.responseInterceptors) {
      processedResponse = await interceptor(processedResponse);
    }

    if (!processedResponse.ok) {
      await this.handleError(processedResponse);
    }

    const contentType = processedResponse.headers.get('Content-Type') || '';

    if (contentType.includes('application/json')) {
      return processedResponse.json();
    }

    if (contentType.includes('text/')) {
      return processedResponse.text() as unknown as T;
    }

    return processedResponse.blob() as unknown as T;
  }

  /**
   * 에러 처리
   */
  private async handleError(response: Response): Promise<never> {
    let errorData: any = {};

    try {
      const contentType = response.headers.get('Content-Type') || '';
      if (contentType.includes('application/json')) {
        errorData = await response.json();
      } else {
        errorData = { message: await response.text() };
      }
    } catch {
      errorData = { message: '서버 오류가 발생했습니다.' };
    }

    const error: ApiError = new Error(errorData.error || errorData.message || `HTTP ${response.status}`) as ApiError;
    error.status = response.status;
    error.code = errorData.code;
    error.errors = errorData.errors;
    error.requestId = errorData.requestId;
    error.response = response;

    // 에러 인터셉터 실행
    for (const interceptor of this.errorInterceptors) {
      await interceptor(error);
    }

    throw error;
  }

  /**
   * 재시도 로직
   */
  private async retryRequest<T>(
    url: string,
    config: RequestConfig,
    attempt: number = 1
  ): Promise<T> {
    try {
      return await this.executeRequest<T>(url, config);
    } catch (error) {
      const maxRetries = config.retries ?? this.config.retries;
      const shouldRetry = this.shouldRetry(error as ApiError, attempt, maxRetries);

      if (shouldRetry) {
        const delay = config.retryDelay ?? this.config.retryDelay;
        await this.sleep(delay * Math.pow(2, attempt - 1)); // 지수 백오프
        return this.retryRequest<T>(url, config, attempt + 1);
      }

      throw error;
    }
  }

  /**
   * 재시도 여부 결정
   */
  private shouldRetry(error: ApiError, attempt: number, maxRetries: number): boolean {
    if (attempt >= maxRetries) return false;

    // 네트워크 에러나 5xx 에러만 재시도
    const retryableErrors = [408, 429, 500, 502, 503, 504];
    const isRetryableError = !error.status || retryableErrors.includes(error.status);

    return isRetryableError;
  }

  /**
   * 딜레이 함수
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * 실제 요청 실행
   */
  private async executeRequest<T>(url: string, config: RequestConfig): Promise<T> {
    const controller = new AbortController();
    const timeout = config.timeout ?? this.config.timeout;

    const timeoutId = setTimeout(() => {
      controller.abort();
    }, timeout);

    try {
      const response = await fetch(url, {
        ...config,
        signal: controller.signal
      });

      clearTimeout(timeoutId);
      return this.handleResponse<T>(response);
    } catch (error) {
      clearTimeout(timeoutId);

      if (error instanceof Error && error.name === 'AbortError') {
        const timeoutError: ApiError = new Error('요청 시간이 초과되었습니다.') as ApiError;
        timeoutError.code = 'TIMEOUT';
        throw timeoutError;
      }

      throw error;
    }
  }

  /**
   * 기본 요청 메서드
   */
  private async request<T>(
    endpoint: string,
    config: RequestConfig = {}
  ): Promise<T> {
    const url = `${this.config.baseURL}${endpoint}`;

    // 요청 인터셉터 실행
    let processedConfig = config;
    for (const interceptor of this.requestInterceptors) {
      processedConfig = await interceptor(processedConfig);
    }

    return this.retryRequest<T>(url, processedConfig);
  }

  /**
   * HTTP 메서드들
   */
  async get<T>(endpoint: string, config: RequestConfig = {}): Promise<T> {
    return this.request<T>(endpoint, {
      ...config,
      method: 'GET'
    });
  }

  async post<T>(endpoint: string, data?: any, config: RequestConfig = {}): Promise<T> {
    return this.request<T>(endpoint, {
      ...config,
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined
    });
  }

  async put<T>(endpoint: string, data?: any, config: RequestConfig = {}): Promise<T> {
    return this.request<T>(endpoint, {
      ...config,
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined
    });
  }

  async patch<T>(endpoint: string, data?: any, config: RequestConfig = {}): Promise<T> {
    return this.request<T>(endpoint, {
      ...config,
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined
    });
  }

  async delete<T>(endpoint: string, config: RequestConfig = {}): Promise<T> {
    return this.request<T>(endpoint, {
      ...config,
      method: 'DELETE'
    });
  }

  /**
   * 파일 업로드
   */
  async upload<T>(
    endpoint: string,
    file: File,
    options: {
      fieldName?: string;
      additionalData?: Record<string, any>;
      onProgress?: (progress: number) => void;
    } = {}
  ): Promise<T> {
    const { fieldName = 'file', additionalData = {}, onProgress } = options;

    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      const formData = new FormData();

      // 파일 추가
      formData.append(fieldName, file);

      // 추가 데이터 추가
      Object.entries(additionalData).forEach(([key, value]) => {
        formData.append(key, String(value));
      });

      // 진행률 추적
      if (onProgress) {
        xhr.upload.addEventListener('progress', (e) => {
          if (e.lengthComputable) {
            const progress = Math.round((e.loaded / e.total) * 100);
            onProgress(progress);
          }
        });
      }

      // 완료 처리
      xhr.addEventListener('load', () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const response = JSON.parse(xhr.responseText);
            resolve(response);
          } catch {
            resolve(xhr.responseText as unknown as T);
          }
        } else {
          reject(new Error(`Upload failed with status ${xhr.status}`));
        }
      });

      // 에러 처리
      xhr.addEventListener('error', () => {
        reject(new Error('Upload failed'));
      });

      // 요청 전송
      const token = this.getToken();
      if (token) {
        xhr.setRequestHeader('Authorization', `Bearer ${token}`);
      }

      xhr.open('POST', `${this.config.baseURL}${endpoint}`);
      xhr.send(formData);
    });
  }

  /**
   * 요청 취소를 위한 AbortController 생성
   */
  createCancelToken(): AbortController {
    return new AbortController();
  }

  /**
   * 베이스 URL 변경
   */
  setBaseURL(baseURL: string): void {
    this.config.baseURL = baseURL;
  }

  /**
   * 타임아웃 설정
   */
  setTimeout(timeout: number): void {
    this.config.timeout = timeout;
  }

  /**
   * 헬스 체크
   */
  async healthCheck(): Promise<boolean> {
    try {
      await this.get('/health', { timeout: 5000 });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * API 상태 조회
   */
  async getApiStatus(): Promise<any> {
    return this.get('/status');
  }
}

// 싱글톤 인스턴스 생성
export const apiService = new ApiService();

// 기본 내보내기 (기존 호환성)
export default apiService;

// 타입 내보내기
export type { ApiError, RequestConfig, ApiConfig };
