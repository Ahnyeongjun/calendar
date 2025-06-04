/**
 * Style utility functions for calendar components
 */

interface ColorMap {
  [key: string]: string;
}

const PRIORITY_COLORS: ColorMap = {
  high: 'border-l-4 border-red-500 bg-red-50',
  medium: 'border-l-4 border-yellow-500 bg-yellow-50',
  low: 'border-l-4 border-green-500 bg-green-50',
};

const STATUS_COLORS: ColorMap = {
  todo: 'bg-gray-100 text-gray-800',
  'in-progress': 'bg-blue-100 text-blue-800',
  completed: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
};

const STATUS_OPACITY: ColorMap = {
  completed: 'opacity-60',
  cancelled: 'opacity-50',
  'in-progress': 'opacity-90',
  todo: 'opacity-100',
};

export const getPriorityStyles = (priority: string): string => {
  return PRIORITY_COLORS[priority] || '';
};

export const getStatusStyles = (status: string): string => {
  return STATUS_COLORS[status] || STATUS_COLORS.todo;
};

export const getStatusOpacity = (status: string): string => {
  return STATUS_OPACITY[status] || STATUS_OPACITY.todo;
};

export const getProjectColor = (color?: string): string => {
  if (!color) return 'bg-gray-500';
  
  // CSS 변수나 헥스 컬러 그대로 사용
  if (color.startsWith('#') || color.startsWith('rgb') || color.startsWith('var(')) {
    return color;
  }
  
  // Tailwind 클래스인 경우
  return color;
};

export const combinedStyles = (...classes: (string | undefined | false)[]): string => {
  return classes.filter(Boolean).join(' ');
};

export const getEventStyles = (priority: string, status: string): string => {
  return combinedStyles(
    getPriorityStyles(priority),
    getStatusOpacity(status),
    'transition-all duration-200 hover:shadow-md'
  );
};

export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
};
