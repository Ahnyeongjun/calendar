import { useState, useEffect } from 'react';
import { toast } from '@/hooks/use-toast';
import { useAuthStore } from '@/stores/useAuthStore';
import Header from '@/components/Header/Header';
import CalendarView from '@/components/CalendarView/CalendarView';
import TableView from '@/components/TableView/TableView';
import ScheduleModal from '@/components/ScheduleModal/ScheduleModal';
import { Schedule, ViewMode, ScheduleFormData } from '@/types/schedule';

const MainPage = () => {
  const { user } = useAuthStore();
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [currentView, setCurrentView] = useState<ViewMode>('calendar');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState<Schedule | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [projectFilter, setProjectFilter] = useState<string | undefined>();

  // 사용자별 로컬 스토리지 키 생성
  const getStorageKey = () => user ? `schedules_${user.id}` : 'schedules';

  // 기존 category를 projectId로 마이그레이션하는 함수
  const migrateScheduleData = (schedule: any): Schedule => {
    // 기존 category를 projectId로 변환
    let projectId: string | undefined;
    if (schedule.category) {
      switch (schedule.category) {
        case 'work':
          projectId = 'work';
          break;
        case 'personal':
          projectId = 'personal';
          break;
        case 'meeting':
          // meeting은 업무로 분류
          projectId = 'work';
          break;
        default:
          projectId = undefined;
      }
    }

    return {
      id: schedule.id,
      title: schedule.title,
      description: schedule.description || '',
      date: new Date(schedule.date),
      startTime: schedule.startTime || '09:00',
      endTime: schedule.endTime || '10:00',
      status: schedule.status || 'planned',
      priority: schedule.priority || 'medium',
      projectId: schedule.projectId || projectId, // 새 필드가 있으면 우선, 없으면 마이그레이션
      createdAt: new Date(schedule.createdAt),
      updatedAt: new Date(schedule.updatedAt)
    };
  };

  // 로컬 스토리지에서 사용자별 일정 데이터 로드
  useEffect(() => {
    if (user) {
      const storageKey = getStorageKey();
      const savedSchedules = localStorage.getItem(storageKey);
      if (savedSchedules) {
        const parsedSchedules = JSON.parse(savedSchedules).map(migrateScheduleData);
        setSchedules(parsedSchedules);
      } else {
        setSchedules([]);
      }
    }
  }, [user]);

  // 사용자별 일정 데이터 로컬 스토리지에 저장
  useEffect(() => {
    if (user && schedules.length > 0) {
      const storageKey = getStorageKey();
      localStorage.setItem(storageKey, JSON.stringify(schedules));
    }
  }, [schedules, user]);

  // 프로젝트 필터링된 일정들
  const filteredSchedules = schedules.filter(schedule => {
    if (!projectFilter) return true;
    if (projectFilter === 'none') return !schedule.projectId;
    return schedule.projectId === projectFilter;
  });

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

  const handleStatusChange = (id: string, status: 'planned' | 'in-progress' | 'completed') => {
    setSchedules(prev => prev.map(schedule =>
      schedule.id === id
        ? { ...schedule, status, updatedAt: new Date() }
        : schedule
    ));

    const schedule = schedules.find(s => s.id === id);
    if (schedule) {
      const statusText = status === 'planned' ? '계획' : status === 'in-progress' ? '진행' : '완료';
      toast({
        title: "일정 상태가 변경되었습니다",
        description: `"${schedule.title}" 일정이 ${statusText} 상태로 변경되었습니다.`,
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
            schedules={filteredSchedules}
            onScheduleClick={handleScheduleClick}
            onDateClick={handleDateClick}
            selectedProjectId={projectFilter}
            onProjectFilterChange={setProjectFilter}
          />
        ) : (
          <TableView
            schedules={filteredSchedules}
            onScheduleClick={handleScheduleClick}
            onStatusChange={handleStatusChange}
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

export default MainPage;
