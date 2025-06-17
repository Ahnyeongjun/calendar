/**
 * Date utility functions
 * Replaces date-fns for better bundle size and performance
 */

export const formatMonth = (date: Date): string => {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  return `${year}년 ${month}월`;
};

export const formatDate = (date: Date): string => {
  const month = date.getMonth() + 1;
  const day = date.getDate();
  return `${month}월 ${day}일`;
};

export const isSameDay = (date1: Date, date2: Date): boolean => {
  return date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate();
};

export const isSameMonth = (date1: Date, date2: Date): boolean => {
  return date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth();
};

export const startOfMonth = (date: Date): Date => {
  return new Date(date.getFullYear(), date.getMonth(), 1);
};

export const endOfMonth = (date: Date): Date => {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0);
};

export const startOfWeek = (date: Date): Date => {
  const day = date.getDay();
  const diff = date.getDate() - day;
  return new Date(date.getFullYear(), date.getMonth(), diff);
};

export const endOfWeek = (date: Date): Date => {
  const day = date.getDay();
  const diff = date.getDate() + (6 - day);
  return new Date(date.getFullYear(), date.getMonth(), diff);
};

export const eachDayOfInterval = (start: Date, end: Date): Date[] => {
  const days: Date[] = [];
  const current = new Date(start);

  while (current <= end) {
    days.push(new Date(current));
    current.setDate(current.getDate() + 1);
  }

  return days;
};

export const addMonths = (date: Date, months: number): Date => {
  const result = new Date(date);
  result.setMonth(result.getMonth() + months);
  return result;
};

export const subMonths = (date: Date, months: number): Date => {
  const result = new Date(date);
  result.setMonth(result.getMonth() - months);
  return result;
};

export const toDateString = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const fromDateString = (dateString: string): Date => {
  const [year, month, day] = dateString.split('-').map(Number);
  return new Date(year, month - 1, day);
};

export const formatDateForDisplay = (date: Date | string): string => {
  const dateObj = typeof date === 'string' ? fromDateString(date) : date;
  const year = dateObj.getFullYear();
  const month = dateObj.getMonth() + 1;
  const day = dateObj.getDate();
  return `${year}년 ${month}월 ${day}일`;
};

export const isToday = (date: Date): boolean => {
  return isSameDay(date, new Date());
};

export const formatTime = (time: string | null): string => {
  if (!time) return '';
  const date = new Date(time);
  return date.toLocaleTimeString('ko-KR', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });
};

export const formatTimeForInput = (time: string | null): string => {
  if (!time) return '';
  const date = new Date(time);
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
};

// Date 객체에서 시간 부분만 추출하는 헬퍼
export const getTimeFromDate = (date: Date): string => {
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
};

export const isValidDate = (date: any): date is Date => {
  return date instanceof Date && !isNaN(date.getTime());
};

export const getWeekDays = (): string[] => {
  return ['일', '월', '화', '수', '목', '금', '토'];
};

// datetime-local input을 위한 헬퍼 함수들
export const toDateTimeString = (date: Date, time?: string): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const timeStr = time || '00:00';
  return `${year}-${month}-${day}T${timeStr}`;
};

export const fromDateTimeString = (dateTimeString: string): { date: Date; time: string } => {
  const [datePart, timePart] = dateTimeString.split('T');
  const date = fromDateString(datePart);
  const time = timePart || '00:00';
  return { date, time };
};

export const formatDateTimeForDisplay = (dateTimeString: string): string => {
  const [datePart, timePart] = dateTimeString.split('T');
  const dateObj = fromDateString(datePart);
  const year = dateObj.getFullYear();
  const month = dateObj.getMonth() + 1;
  const day = dateObj.getDate();
  const [hours, minutes] = timePart.split(':');
  return `${year}년 ${month}월 ${day}일 ${hours}:${minutes}`;
};

// datetime-local input에서 사용할 현재 날짜 시간 문자열 생성
export const getCurrentDateTimeString = (): string => {
  const now = new Date();
  return toDateTimeString(now, formatTimeForInput(now.toISOString()));
};

// 스케줄의 시작일과 종료일 사이의 모든 날짜 배열 생성
export const getDateRangeFromSchedule = (startDate?: string, endDate?: string): string[] => {
  if (!startDate || !endDate) return [];
  
  try {
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    if (isNaN(start.getTime()) || isNaN(end.getTime())) return [];
    
    const dates: string[] = [];
    const current = new Date(start);
    
    // 시작날짜부터 종료날짜까지 모든 날짜 추가
    while (current <= end) {
      dates.push(toDateString(current));
      current.setDate(current.getDate() + 1);
    }
    
    return dates;
  } catch {
    return [];
  }
};

// 스케줄이 특정 날짜에 포함되는지 확인
export const isDateInScheduleRange = (date: Date, schedule: { startDate?: string; endDate?: string }): boolean => {
  if (!schedule.startDate || !schedule.endDate) return false;
  
  try {
    const checkDate = toDateString(date);
    const dateRange = getDateRangeFromSchedule(schedule.startDate, schedule.endDate);
    return dateRange.includes(checkDate);
  } catch {
    return false;
  }
};

// 백엔드 API용: datetime-local 형식을 ISO string으로 변환 (날짜 + 시간 포함)
export const formatDateTimeForAPI = (dateTimeString: string): string => {
  if (!dateTimeString) return '';
  // datetime-local 형식 (YYYY-MM-DDTHH:MM)을 ISO string으로 변환
  const date = new Date(dateTimeString);
  return date.toISOString();
};

// 백엔드에서 받은 ISO string을 datetime-local 형식으로 변환
export const formatDateTimeFromAPI = (isoString: string, fallbackTime?: string): string => {
  if (!isoString) {
    const today = new Date();
    return toDateTimeString(today, fallbackTime || '09:00');
  }
  
  try {
    const date = new Date(isoString);
    if (isNaN(date.getTime())) {
      const today = new Date();
      return toDateTimeString(today, fallbackTime || '09:00');
    }
    
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  } catch {
    const today = new Date();
    return toDateTimeString(today, fallbackTime || '09:00');
  }
};

// 백엔드에서 받은 startDate/endDate ISO string을 datetime-local 형식으로 변환
export const formatStartEndDateFromAPI = (startDate?: string, endDate?: string) => {
  const today = new Date();
  
  return {
    startDateTime: startDate ? formatDateTimeFromAPI(startDate) : toDateTimeString(today, '09:00'),
    endDateTime: endDate ? formatDateTimeFromAPI(endDate) : toDateTimeString(today, '10:00')
  };
};
