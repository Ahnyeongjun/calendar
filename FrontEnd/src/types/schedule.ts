export interface Project {
  id: string;
  name: string;
  description?: string;
  color: string;
  createdAt: string;
  updatedAt: string;
}

export interface Schedule {
  id: string;
  title: string;
  description?: string;
  date: string; // ISO date string
  start_date?: string; // HH:mm format
  end_date?: string; // HH:mm format
  status: 'planned' | 'in_progress' | 'completed';
  priority: 'low' | 'medium' | 'high';
  projectId?: string;
  userId: string;
  project?: Project; // populated from backend
  createdAt: string;
  updatedAt: string;
}

export interface ScheduleWithProject extends Schedule {
  project?: Project | null;
}

export type ViewMode = 'calendar' | 'table';

export interface ScheduleFormData {
  title: string;
  description?: string;
  date: string; // ISO date string
  start_date?: string; // HH:mm format
  end_date?: string; // HH:mm format
  status: 'planned' | 'in_progress' | 'completed';
  priority: 'low' | 'medium' | 'high';
  projectId?: string;
}

export interface ScheduleFilters {
  date?: string;
  startDate?: string;
  endDate?: string;
  status?: 'planned' | 'in_progress' | 'completed';
  priority?: 'low' | 'medium' | 'high';
  projectId?: string;
}

// API Response types
export interface ApiResponse<T> {
  message?: string;
  error?: string;
}

export interface ProjectsResponse extends ApiResponse<Project[]> {
  projects: Project[];
}

export interface ProjectResponse extends ApiResponse<Project> {
  project: Project;
}

export interface SchedulesResponse extends ApiResponse<Schedule[]> {
  schedules: Schedule[];
}

export interface ScheduleResponse extends ApiResponse<Schedule> {
  schedule: Schedule;
}
