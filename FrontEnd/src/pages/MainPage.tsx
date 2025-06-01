import { useState, useEffect } from 'react';
import { toast } from '@/hooks/use-toast';
import { useAuthStore } from '@/stores/useAuthStore';
import { useProjectStore } from '@/stores/useProjectStore';
import { useScheduleStore } from '@/stores/useScheduleStore';
import { useUIStore } from '@/stores/useUIStore';
import Header from '@/components/Header/Header';
import CalendarView from '@/components/CalendarView/CalendarView';
import TableView from '@/components/TableView/TableView';
import ScheduleModal from '@/components/ScheduleModal/ScheduleModal';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { Schedule, ScheduleFormData } from '@/types/schedule';

const MainPage = () => {
  const { user } = useAuthStore();
  const {
    projects,
    isLoading: isProjectsLoading,
    fetchProjects
  } = useProjectStore();
  const {
    schedules,
    isLoading: isSchedulesLoading,
    fetchSchedules,
    addSchedule,
    updateSchedule,
    deleteSchedule
  } = useScheduleStore();

  // UI Store에서 상태 및 액션 가져오기
  const {
    currentView,
    setCurrentView,
    isScheduleModalOpen,
    openScheduleModal,
    closeScheduleModal
  } = useUIStore();

  const [selectedSchedule, setSelectedSchedule] = useState<Schedule | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [projectFilter, setProjectFilter] = useState<string | undefined>();

  // 초기 로딩 상태 처리 (최초 마운트시만)
  const [hasInitiallyLoaded, setHasInitiallyLoaded] = useState(false);

  useEffect(() => {
    if (!isProjectsLoading && !isSchedulesLoading && !hasInitiallyLoaded) {
      setHasInitiallyLoaded(true);
    }
  }, [isProjectsLoading, isSchedulesLoading, hasInitiallyLoaded]);

  // 초기 데이터 로드
  useEffect(() => {
    if (user) {
      fetchProjects();
      fetchSchedules();
    }
  }, [user]); // 함수 의존성 제거

  // 프로젝트 필터링된 일정들
  const filteredSchedules = schedules.filter(schedule => {
    if (!projectFilter) return true;
    if (projectFilter === 'none') return !schedule.projectId;
    return schedule.projectId === projectFilter;
  });

  const handleSaveSchedule = async (data: ScheduleFormData, scheduleId?: string) => {
    try {
      if (scheduleId) {
        // 기존 일정 수정
        await updateSchedule(scheduleId, data);
        toast({
          title: "일정이 수정되었습니다",
          description: `"${data.title}" 일정이 성공적으로 수정되었습니다.`,
        });
      } else {
        // 새 일정 추가
        await addSchedule(data);
        toast({
          title: "새 일정이 추가되었습니다",
          description: `"${data.title}" 일정이 성공적으로 추가되었습니다.`,
        });
      }
      setSelectedSchedule(null);
      setSelectedDate(undefined);
      closeScheduleModal();
    } catch (error) {
      toast({
        title: "오류가 발생했습니다",
        description: error instanceof Error ? error.message : "일정 저장에 실패했습니다.",
        variant: "destructive"
      });
    }
  };

  const handleScheduleClick = (schedule: Schedule) => {
    setSelectedSchedule(schedule);
    openScheduleModal();
  };

  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
    setSelectedSchedule(null);
    openScheduleModal();
  };

  const handleAddSchedule = () => {
    setSelectedSchedule(null);
    setSelectedDate(undefined);
    openScheduleModal();
  };

  const handleDeleteSchedule = async (id: string) => {
    try {
      const schedule = schedules.find(s => s.id === id);
      await deleteSchedule(id);

      if (schedule) {
        toast({
          title: "일정이 삭제되었습니다",
          description: `"${schedule.title}" 일정이 성공적으로 삭제되었습니다.`,
        });
      }
    } catch (error) {
      toast({
        title: "삭제 실패",
        description: error instanceof Error ? error.message : "일정 삭제에 실패했습니다.",
        variant: "destructive"
      });
    }
  };

  const handleStatusChange = async (id: string, status: 'planned' | 'in_progress' | 'completed') => {
    try {
      const schedule = schedules.find(s => s.id === id);
      await updateSchedule(id, { status });

      if (schedule) {
        const statusText = status === 'planned' ? '계획' : status === 'in_progress' ? '진행' : '완료';
        toast({
          title: "일정 상태가 변경되었습니다",
          description: `"${schedule.title}" 일정이 ${statusText} 상태로 변경되었습니다.`,
        });
      }
    } catch (error) {
      toast({
        title: "상태 변경 실패",
        description: error instanceof Error ? error.message : "일정 상태 변경에 실패했습니다.",
        variant: "destructive"
      });
    }
  };

  // 초기 로딩만 표시 (추가 데이터 로드시에는 전체 화면 로딩 안함)
  if (!hasInitiallyLoaded && (isProjectsLoading || isSchedulesLoading)) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

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
        isOpen={isScheduleModalOpen}
        onClose={() => {
          closeScheduleModal();
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
