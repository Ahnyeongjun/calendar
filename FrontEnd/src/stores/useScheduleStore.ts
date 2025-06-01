import { create } from 'zustand';
import { Schedule, ScheduleFormData, ScheduleFilters } from '@/types/schedule';
import { scheduleService } from '@/services/scheduleService';

interface ScheduleState {
  schedules: Schedule[];
  isLoading: boolean;
  error: string | null;
  
  // Actions
  fetchSchedules: (filters?: ScheduleFilters) => Promise<void>;
  addSchedule: (schedule: ScheduleFormData) => Promise<Schedule>;
  updateSchedule: (id: string, updates: Partial<ScheduleFormData>) => Promise<Schedule>;
  deleteSchedule: (id: string) => Promise<void>;
  getSchedule: (id: string) => Schedule | undefined;
  getSchedulesByDate: (date: string) => Schedule[];
  getSchedulesByProject: (projectId: string) => Schedule[];
  setSchedules: (schedules: Schedule[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useScheduleStore = create<ScheduleState>((set, get) => ({
  schedules: [],
  isLoading: false,
  error: null,
  
  setSchedules: (schedules) => set({ schedules }),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
  
  fetchSchedules: async (filters) => {
    try {
      set({ isLoading: true, error: null });
      const schedules = await scheduleService.getAllSchedules(filters);
      set({ schedules, isLoading: false });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '일정을 불러오는데 실패했습니다.';
      set({ error: errorMessage, isLoading: false });
      console.error('Failed to fetch schedules:', error);
    }
  },
  
  addSchedule: async (scheduleData) => {
    try {
      set({ isLoading: true, error: null });
      const newSchedule = await scheduleService.createSchedule(scheduleData);
      
      set((state) => ({
        schedules: [...state.schedules, newSchedule],
        isLoading: false
      }));
      
      return newSchedule;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '일정 생성에 실패했습니다.';
      set({ error: errorMessage, isLoading: false });
      console.error('Failed to create schedule:', error);
      throw error;
    }
  },
  
  updateSchedule: async (id, updates) => {
    try {
      set({ isLoading: true, error: null });
      const updatedSchedule = await scheduleService.updateSchedule(id, updates);
      
      set((state) => ({
        schedules: state.schedules.map(schedule =>
          schedule.id === id ? updatedSchedule : schedule
        ),
        isLoading: false
      }));
      
      return updatedSchedule;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '일정 수정에 실패했습니다.';
      set({ error: errorMessage, isLoading: false });
      console.error('Failed to update schedule:', error);
      throw error;
    }
  },
  
  deleteSchedule: async (id) => {
    try {
      set({ isLoading: true, error: null });
      await scheduleService.deleteSchedule(id);
      
      set((state) => ({
        schedules: state.schedules.filter(schedule => schedule.id !== id),
        isLoading: false
      }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '일정 삭제에 실패했습니다.';
      set({ error: errorMessage, isLoading: false });
      console.error('Failed to delete schedule:', error);
      throw error;
    }
  },
  
  getSchedule: (id) => {
    return get().schedules.find(schedule => schedule.id === id);
  },
  
  getSchedulesByDate: (date) => {
    return get().schedules.filter(schedule => 
      schedule.date.split('T')[0] === date.split('T')[0]
    );
  },
  
  getSchedulesByProject: (projectId) => {
    return get().schedules.filter(schedule => schedule.projectId === projectId);
  }
}));
