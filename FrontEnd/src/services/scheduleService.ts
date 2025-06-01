import ApiService from './api';
import { Schedule, ScheduleFormData, ScheduleFilters, SchedulesResponse, ScheduleResponse } from '@/types/schedule';

export const scheduleService = {
  async getAllSchedules(filters?: ScheduleFilters): Promise<Schedule[]> {
    let endpoint = '/schedules';
    
    if (filters) {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, value.toString());
        }
      });
      
      const queryString = params.toString();
      if (queryString) {
        endpoint += `?${queryString}`;
      }
    }
    
    const response = await ApiService.get<SchedulesResponse>(endpoint);
    return response.schedules;
  },

  async getSchedule(id: string): Promise<Schedule> {
    const response = await ApiService.get<ScheduleResponse>(`/schedules/${id}`);
    return response.schedule;
  },

  async createSchedule(scheduleData: ScheduleFormData): Promise<Schedule> {
    // Backend API 형식에 맞게 데이터 변환
    const apiData = {
      title: scheduleData.title,
      description: scheduleData.description,
      date: scheduleData.date,
      start_time: scheduleData.startTime,
      end_time: scheduleData.endTime,
      status: scheduleData.status,
      priority: scheduleData.priority,
      project_id: scheduleData.projectId
    };
    
    const response = await ApiService.post<ScheduleResponse>('/schedules', apiData);
    return response.schedule;
  },

  async updateSchedule(id: string, scheduleData: Partial<ScheduleFormData>): Promise<Schedule> {
    // Backend API 형식에 맞게 데이터 변환
    const apiData = {
      ...(scheduleData.title && { title: scheduleData.title }),
      ...(scheduleData.description !== undefined && { description: scheduleData.description }),
      ...(scheduleData.date && { date: scheduleData.date }),
      ...(scheduleData.startTime !== undefined && { start_time: scheduleData.startTime }),
      ...(scheduleData.endTime !== undefined && { end_time: scheduleData.endTime }),
      ...(scheduleData.status && { status: scheduleData.status }),
      ...(scheduleData.priority && { priority: scheduleData.priority }),
      ...(scheduleData.projectId !== undefined && { project_id: scheduleData.projectId })
    };
    
    const response = await ApiService.put<ScheduleResponse>(`/schedules/${id}`, apiData);
    return response.schedule;
  },

  async deleteSchedule(id: string): Promise<void> {
    await ApiService.delete(`/schedules/${id}`);
  }
};
