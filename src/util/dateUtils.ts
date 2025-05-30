// Date utility functions (replacing date-fns)
export const formatMonth = (date: Date) => {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  return `${year}년 ${month}월`;
};

export const formatDate = (date: Date) => {
  const month = date.getMonth() + 1;
  const day = date.getDate();
  return `${month}월 ${day}일 일정`;
};

export const isSameDay = (date1: Date, date2: Date) => {
  return date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate();
};

export const isSameMonth = (date1: Date, date2: Date) => {
  return date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth();
};

export const startOfMonth = (date: Date) => {
  return new Date(date.getFullYear(), date.getMonth(), 1);
};

export const endOfMonth = (date: Date) => {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0);
};

export const startOfWeek = (date: Date) => {
  const day = date.getDay();
  const diff = date.getDate() - day;
  return new Date(date.getFullYear(), date.getMonth(), diff);
};

export const endOfWeek = (date: Date) => {
  const day = date.getDay();
  const diff = date.getDate() + (6 - day);
  return new Date(date.getFullYear(), date.getMonth(), diff);
};

export const eachDayOfInterval = (start: Date, end: Date) => {
  const days: Date[] = [];
  const current = new Date(start);

  while (current <= end) {
    days.push(new Date(current));
    current.setDate(current.getDate() + 1);
  }

  return days;
};

export const addMonths = (date: Date, months: number) => {
  const result = new Date(date);
  result.setMonth(result.getMonth() + months);
  return result;
};

export const subMonths = (date: Date, months: number) => {
  const result = new Date(date);
  result.setMonth(result.getMonth() - months);
  return result;
};
