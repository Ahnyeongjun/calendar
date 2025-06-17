import { useState } from 'react';
import { Schedule } from '@/types/schedule';
import { useProject } from '@/hooks/useProject';
import { Badge } from '@/components/ui/badge';
import { Trash2 } from 'lucide-react';

interface ScheduleItemProps {
  schedule: Schedule;
  onScheduleClick: (schedule: Schedule) => void;
  onScheduleDelete?: (schedule: Schedule) => void;
}

export const ScheduleItem = ({
  schedule,
  onScheduleClick,
  onScheduleDelete
}: ScheduleItemProps) => {
  const { getProjectColor, getProjectName } = useProject();
  const projectColor = getProjectColor(schedule.projectId);
  const [showTooltip, setShowTooltip] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });

  const formatTime = (timeString?: string) => {
    if (!timeString) return '';

    try {
      const date = new Date(timeString);

      // 유효한 날짜인지 확인
      if (isNaN(date.getTime())) {
        return '--:--';
      }

      return date.toLocaleTimeString('ko-KR', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      });
    } catch {
      return '--:--';
    }
  };

  const formatDateTime = (timeString?: string) => {
    if (!timeString) return '';

    try {
      const date = new Date(timeString);
      if (isNaN(date.getTime())) return '--:--';

      const month = date.getMonth() + 1;
      const day = date.getDate();
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      
      return `${month}/${day} ${hours}:${minutes}`;
    } catch {
      return '--:--';
    }
  };

  const isSameDate = (date1: string, date2: string): boolean => {
    try {
      const d1 = new Date(date1);
      const d2 = new Date(date2);
      return d1.toDateString() === d2.toDateString();
    } catch {
      return false;
    }
  };

  const getTimeDisplay = () => {
    console.log('Schedule data:', schedule);
    if (!schedule.startDate) {
      return '시간 미설정';
    }

    const scheduleDate = schedule.date;
    const today = new Date().toISOString().split('T')[0];
    const isToday = scheduleDate === today;
    
    // 당일 일정인 경우 시간만 표시
    if (isToday && schedule.startDate && schedule.endDate && isSameDate(schedule.startDate, schedule.endDate)) {
      return `${formatTime(schedule.startDate)} - ${formatTime(schedule.endDate)}`;
    }
    
    // 다른 날짜이거나 여러 날에 걸쳐있는 경우 날짜+시간 표시
    if (schedule.startDate && schedule.endDate) {
      return `${formatDateTime(schedule.startDate)} - ${formatDateTime(schedule.endDate)}`;
    } else if (schedule.startDate) {
      return isToday ? formatTime(schedule.startDate) : formatDateTime(schedule.startDate);
    }
    
    return '시간 미설정';
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onScheduleDelete && confirm('이 일정을 삭제하시겠습니까?')) {
      onScheduleDelete(schedule);
    }
  };

  const handleMouseEnter = (e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setTooltipPosition({
      x: rect.left + rect.width / 2, // 요소 중앙
      y: rect.top - 10 // 요소 바로 위
    });
    setShowTooltip(true);
  };

  const handleMouseLeave = () => {
    setShowTooltip(false);
  };

  return (
    <>
      <div
        className="group text-xs p-2 rounded border cursor-pointer hover:shadow-sm transition-all hover:scale-105 bg-white border-l-4 relative"
        style={{
          borderLeftColor: projectColor,
          backgroundColor: projectColor + '08'
        }}
        onClick={(e) => {
          e.stopPropagation();
          onScheduleClick(schedule);
        }}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {/* 기본 상태: 제목만 표시 */}
        <div className="flex items-center justify-between">
          <div className="font-medium truncate flex-1">{schedule.title}</div>
          <div className="flex items-center space-x-1 ml-2">
            {schedule.priority === 'high' && (
              <div className="w-1.5 h-1.5 bg-red-500 rounded-full flex-shrink-0" title="높은 우선순위" />
            )}
            {onScheduleDelete && (
              <button
                onClick={handleDelete}
                className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 hover:bg-red-100 rounded"
                title="일정 삭제"
              >
                <Trash2 size={8} className="text-red-500" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 호버한 요소 바로 위에 나타나는 툴팁 */}
      {showTooltip && (
        <div 
          className="fixed bg-black text-white text-xs rounded-lg px-3 py-2 shadow-2xl z-[99999] pointer-events-none transform -translate-x-1/2 -translate-y-full"
          style={{
            left: tooltipPosition.x,
            top: tooltipPosition.y
          }}
        >
          <div className="space-y-1 whitespace-nowrap">
            <div><strong>제목:</strong> {schedule.title}</div>
            <div><strong>시간:</strong> {getTimeDisplay()}</div>
            {schedule.projectId && (
              <div><strong>프로젝트:</strong> {getProjectName(schedule.projectId)}</div>
            )}
            {schedule.description && (
              <div><strong>메모:</strong> {schedule.description.length > 30 ? schedule.description.substring(0, 30) + '...' : schedule.description}</div>
            )}
          </div>
          {/* 툴팁 화살표 */}
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-black"></div>
        </div>
      )}
    </>
  );
};
