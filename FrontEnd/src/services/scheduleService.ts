import ApiService from './api';
import { Schedule, ScheduleFormData, ScheduleFilters, SchedulesResponse, ScheduleResponse } from '@/types/schedule';

interface ScheduleApiData {
  title: string;
  description?: string;
  date: string;
  start_date?: string;
  end_date?: string;
  status: string;
  priority: string;
  project_id?: string;
}

class ScheduleService {
  private buildQueryString(filters: ScheduleFilters): string {
    const params = new URLSearchParams();
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, value.toString());
      }
    });
    
    return params.toString();
  }

  private transformToApiData(scheduleData: ScheduleFormData): ScheduleApiData {
    return {
      title: scheduleData.title,
      description: scheduleData.description,
      date: scheduleData.date,
      start_date: scheduleData.start_date,
      end_date: scheduleData.end_date,
      status: scheduleData.status,
      priority: scheduleData.priority,
      project_id: scheduleData.projectId
    };
  }

  private transformToPartialApiData(scheduleData: Partial<ScheduleFormData>): Partial<ScheduleApiData> {
    const apiData: Partial<ScheduleApiData> = {};
    
    if (scheduleData.title !== undefined) apiData.title = scheduleData.title;
    if (scheduleData.description !== undefined) apiData.description = scheduleData.description;
    if (scheduleData.date !== undefined) apiData.date = scheduleData.date;
    if (scheduleData.start_date !== undefined) apiData.start_date = scheduleData.start_date;
    if (scheduleData.end_date !== undefined) apiData.end_date = scheduleData.end_date;
    if (scheduleData.status !== undefined) apiData.status = scheduleData.status;
    if (scheduleData.priority !== undefined) apiData.priority = scheduleData.priority;
    if (scheduleData.projectId !== undefined) apiData.project_id = scheduleData.projectId;
    
    return apiData;
  }

  async getAllSchedules(filters?: ScheduleFilters): Promise<Schedule[]> {
    let endpoint = '/schedules';
    
    if (filters) {
      const queryString = this.buildQueryString(filters);
      if (queryString) {
        endpoint += `?${queryString}`;
      }
    }
    
    const response = await ApiService.get<SchedulesResponse>(endpoint);
    return response.schedules || [];
  }

  async getSchedule(id: string): Promise<Schedule> {
    const response = await ApiService.get<ScheduleResponse>(`/schedules/${id}`);
    return response.schedule;
  }

  async createSchedule(scheduleData: ScheduleFormData): Promise<Schedule> {
    const apiData = this.transformToApiData(scheduleData);
    const response = await ApiService.post<ScheduleResponse>('/schedules', apiData);
    return response.schedule;
  }

  async updateSchedule(id: string, scheduleData: Partial<ScheduleFormData>): Promise<Schedule> {
    const apiData = this.transformToPartialApiData(scheduleData);
    const response = await ApiService.put<ScheduleResponse>(`/schedules/${id}`, apiData);
    return response.schedule;
  }

  async deleteSchedule(id: string): Promise<void> {
    await ApiService.delete(`/schedules/${id}`);
  }
}

export const scheduleService = new ScheduleService();
