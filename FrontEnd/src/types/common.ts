// 공통 API 응답 타입
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  errors?: Record<string, string[]>;
  timestamp: string;
  requestId?: string;
}

// 페이지네이션 관련 타입
export interface PaginationParams {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  items: T[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// 필터링 파라미터
export interface FilterParams {
  search?: string;
  startDate?: string;
  endDate?: string;
  status?: string;
  priority?: string;
  projectId?: string;
}

// 로딩 상태
export type LoadingState = 'idle' | 'loading' | 'success' | 'error';

// 폼 상태
export interface FormState<T = any> {
  data: T;
  errors: Record<string, string[]>;
  isSubmitting: boolean;
  isDirty: boolean;
  isValid: boolean;
}

// 선택 옵션
export interface SelectOption<T = string> {
  value: T;
  label: string;
  disabled?: boolean;
  description?: string;
  icon?: string;
}

// 모달 Props
export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  closeOnOverlay?: boolean;
  closeOnEscape?: boolean;
}

// 폼 Props
export interface FormProps<T = any> {
  initialData?: Partial<T>;
  onSubmit: (data: T) => void | Promise<void>;
  onCancel?: () => void;
  isLoading?: boolean;
  disabled?: boolean;
  mode?: 'create' | 'edit' | 'view';
}

// 컴포넌트 기본 Props
export interface BaseComponentProps {
  className?: string;
  children?: React.ReactNode;
  id?: string;
  'data-testid'?: string;
}

// 우선순위와 상태
export type Priority = 'low' | 'medium' | 'high' | 'urgent';
export type Status = 'todo' | 'in-progress' | 'completed' | 'cancelled' | 'on-hold';

// 기본 엔티티
export interface BaseEntity {
  id: string;
  createdAt: string;
  updatedAt: string;
}

// 에러 타입
export interface AppError {
  message: string;
  code?: string;
  field?: string;
  details?: any;
}

// HTTP 메서드
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

// 컴포넌트 크기
export type ComponentSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

// 색상 변형
export type ColorVariant = 
  | 'primary' 
  | 'secondary' 
  | 'success' 
  | 'warning' 
  | 'error' 
  | 'info' 
  | 'neutral';

// 테마 모드
export type ThemeMode = 'light' | 'dark' | 'system';

// 언어 설정
export type Language = 'ko' | 'en' | 'ja' | 'zh';

// 알림 타입
export interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
  duration?: number;
  actions?: NotificationAction[];
  timestamp: string;
}

export interface NotificationAction {
  label: string;
  action: () => void;
  variant?: 'primary' | 'secondary';
}

// 유틸리티 타입들
export type Without<T, U> = { [P in Exclude<keyof T, keyof U>]?: never };
export type XOR<T, U> = T | U extends object 
  ? (Without<T, U> & U) | (Without<U, T> & T) 
  : T | U;

export type Optional<T, K extends keyof T> = Pick<Partial<T>, K> & Omit<T, K>;
export type RequiredKeys<T, K extends keyof T> = T & Required<Pick<T, K>>;

export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type DeepRequired<T> = {
  [P in keyof T]-?: T[P] extends object ? DeepRequired<T[P]> : T[P];
};

// 키보드 이벤트 핸들러
export type KeyboardEventHandler = (event: KeyboardEvent) => void;

// 마우스 이벤트 핸들러
export type MouseEventHandler<T = Element> = (event: React.MouseEvent<T>) => void;

// 변경 이벤트 핸들러
export type ChangeEventHandler<T = Element> = (event: React.ChangeEvent<T>) => void;

// 폼 이벤트 핸들러
export type FormEventHandler<T = Element> = (event: React.FormEvent<T>) => void;

// 환경 설정
export interface AppConfig {
  apiUrl: string;
  environment: 'development' | 'staging' | 'production';
  features: {
    notifications: boolean;
    darkMode: boolean;
    analytics: boolean;
    debugging: boolean;
  };
  limits: {
    maxFileSize: number;
    maxFilesPerUpload: number;
    requestTimeout: number;
  };
}

// 디바이스 정보
export interface DeviceInfo {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  userAgent: string;
  screenWidth: number;
  screenHeight: number;
}

// 브라우저 정보
export interface BrowserInfo {
  name: string;
  version: string;
  supportsWebGL: boolean;
  supportsNotifications: boolean;
  cookiesEnabled: boolean;
}

// 위치 정보
export interface LocationInfo {
  latitude?: number;
  longitude?: number;
  timezone: string;
  locale: string;
}

// 날짜 범위
export interface DateRange {
  startDate: Date;
  endDate: Date;
}

// 시간 범위
export interface TimeRange {
  startTime: string; // HH:mm 형식
  endTime: string;   // HH:mm 형식
}

// 검색 결과
export interface SearchResult<T> {
  items: T[];
  totalCount: number;
  searchTerm: string;
  suggestions?: string[];
  facets?: SearchFacet[];
}

export interface SearchFacet {
  field: string;
  values: Array<{
    value: string;
    count: number;
    selected: boolean;
  }>;
}

// 업로드 상태
export interface UploadState {
  file: File;
  progress: number;
  status: 'pending' | 'uploading' | 'success' | 'error';
  error?: string;
  url?: string;
}

// 드래그 앤 드롭
export interface DragDropState {
  isDragging: boolean;
  draggedItem?: any;
  dropZone?: string;
}

// 정렬 옵션
export interface SortOption<T = string> {
  field: T;
  direction: 'asc' | 'desc';
  label: string;
}

// 뷰 모드
export type ViewMode = 'list' | 'grid' | 'card' | 'table' | 'calendar';

// 툴팁 설정
export interface TooltipConfig {
  content: string;
  placement?: 'top' | 'bottom' | 'left' | 'right';
  delay?: number;
  maxWidth?: number;
}

// 애니메이션 설정
export interface AnimationConfig {
  duration: number;
  easing: string;
  delay?: number;
  fillMode?: 'forwards' | 'backwards' | 'both' | 'none';
}
