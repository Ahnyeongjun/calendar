export interface Project {
  id: string;
  name: string;
  description?: string;
  color: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Schedule {
  id: string;
  title: string;
  description?: string;
  date: Date;
  startTime?: string;
  endTime?: string;
  status: 'planned' | 'in-progress' | 'completed';
  priority: 'low' | 'medium' | 'high';
  projectId?: string; // 프로젝트 연결
  createdAt: Date;
  updatedAt: Date;
}

export type ViewMode = 'calendar' | 'table';

export interface ScheduleFormData {
  title: string;
  description?: string;
  date: Date;
  startTime?: string;
  endTime?: string;
  status: 'planned' | 'in-progress' | 'completed';
  priority: 'low' | 'medium' | 'high';
  projectId?: string;
}
