
import { useState, useEffect } from 'react';
import { toast } from '@/hooks/use-toast';
import Header from '@/components/Header';
import CalendarView from '@/components/CalendarView';
import TableView from '@/components/TableView';
import ScheduleModal from '@/components/ScheduleModal';
import { Schedule, ViewMode, ScheduleFormData } from '@/types/schedule';

const Index = () => {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [currentView, setCurrentView] = useState<ViewMode>('calendar');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState<Schedule | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();

  // 로컬 스토리지에서 일정 데이터 로드
  useEffect(() => {
    const savedSchedules = localStorage.getItem('schedules');
    if (savedSchedules) {
      const parsedSchedules = JSON.parse(savedSchedules).map((schedule: any) => ({
        ...schedule,
        date: new Date(schedule.date),
        createdAt: new Date(schedule.createdAt),
        updatedAt: new Date(schedule.updatedAt)
      }));
      setSchedules(parsedSchedules);
    }
  }, []);

  // 일정 데이터 로컬 스토리지에 저장
  useEffect(() => {
    localStorage.setItem('schedules', JSON.stringify(schedules));
  }, [schedules]);

  const handleSaveSchedule = (data: ScheduleFormData, scheduleId?: string) => {
    if (scheduleId) {
      // 기존 일정 수정
      setSchedules(prev => prev.map(schedule => 
        schedule.id === scheduleId 
          ? { ...schedule, ...data, updatedAt: new Date() }
          : schedule
      ));
      toast({
        title: "일정이 수정되었습니다",
        description: `"${data.title}" 일정이 성공적으로 수정되었습니다.`,
      });
    } else {
      // 새 일정 추가
      const newSchedule: Schedule = {
        id: Date.now().toString(),
        ...data,
        completed: false,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      setSchedules(prev => [...prev, newSchedule]);
      toast({
        title: "새 일정이 추가되었습니다",
        description: `"${data.title}" 일정이 성공적으로 추가되었습니다.`,
      });
    }
    setSelectedSchedule(null);
    setSelectedDate(undefined);
  };

  const handleScheduleClick = (schedule: Schedule) => {
    setSelectedSchedule(schedule);
    setIsModalOpen(true);
  };

  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
    setSelectedSchedule(null);
    setIsModalOpen(true);
  };

  const handleAddSchedule = () => {
    setSelectedSchedule(null);
    setSelectedDate(undefined);
    setIsModalOpen(true);
  };

  const handleToggleComplete = (id: string) => {
    setSchedules(prev => prev.map(schedule => 
      schedule.id === id 
        ? { ...schedule, completed: !schedule.completed, updatedAt: new Date() }
        : schedule
    ));
    
    const schedule = schedules.find(s => s.id === id);
    if (schedule) {
      toast({
        title: schedule.completed ? "일정이 미완료로 변경되었습니다" : "일정이 완료되었습니다",
        description: `"${schedule.title}" 일정의 상태가 변경되었습니다.`,
      });
    }
  };

  const handleDeleteSchedule = (id: string) => {
    const schedule = schedules.find(s => s.id === id);
    setSchedules(prev => prev.filter(schedule => schedule.id !== id));
    
    if (schedule) {
      toast({
        title: "일정이 삭제되었습니다",
        description: `"${schedule.title}" 일정이 성공적으로 삭제되었습니다.`,
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <Header
        currentView={currentView}
        onViewChange={setCurrentView}
        onAddSchedule={handleAddSchedule}
      />

      <main className="flex-1">
        {currentView === 'calendar' ? (
          <CalendarView
            schedules={schedules}
            onScheduleClick={handleScheduleClick}
            onDateClick={handleDateClick}
          />
        ) : (
          <TableView
            schedules={schedules}
            onScheduleClick={handleScheduleClick}
            onToggleComplete={handleToggleComplete}
            onDeleteSchedule={handleDeleteSchedule}
          />
        )}
      </main>

      <ScheduleModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedSchedule(null);
          setSelectedDate(undefined);
        }}
        onSave={handleSaveSchedule}
        schedule={selectedSchedule}
        selectedDate={selectedDate}
      />
    </div>
  );
};

export default Index;
