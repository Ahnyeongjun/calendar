
export interface Schedule {
  id: string;
  title: string;
  description: string;
  date: Date;
  startTime: string;
  endTime: string;
  category: 'work' | 'personal' | 'meeting' | 'other';
  priority: 'low' | 'medium' | 'high';
  completed: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export type ViewMode = 'calendar' | 'table';

export interface ScheduleFormData {
  title: string;
  description: string;
  date: Date;
  startTime: string;
  endTime: string;
  category: 'work' | 'personal' | 'meeting' | 'other';
  priority: 'low' | 'medium' | 'high';
}
