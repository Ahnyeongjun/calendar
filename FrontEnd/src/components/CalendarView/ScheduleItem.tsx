import { Schedule } from '@/types/schedule';
import { useProject } from '@/hooks/useProject';
import { Badge } from '@/components/ui/badge';

interface ScheduleItemProps {
  schedule: Schedule;
  onScheduleClick: (schedule: Schedule) => void;
}

export const ScheduleItem = ({
  schedule,
  onScheduleClick
}: ScheduleItemProps) => {
  const { getProjectColor, getProjectName } = useProject();
  const projectColor = getProjectColor(schedule.projectId);

  const formatTime = (timeString?: string) => {
    if (!timeString) return '';

    try {
      const date = new Date(timeString);

      // 유효한 날짜인지 확인 (1970년 방지)
      if (isNaN(date.getTime()) || date.getFullYear() < 2000) {
        // HH:mm 형태라면 그대로 반환
        if (/^\d{2}:\d{2}$/.test(timeString)) {
          return timeString;
        }
        return '--:--';
      }

      return date.toLocaleTimeString('ko-KR', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      });
    } catch {
      // HH:mm 형태라면 그대로 반환
      if (/^\d{2}:\d{2}$/.test(timeString)) {
        return timeString;
      }
      return '--:--';
    }
  };

  const getTimeDisplay = () => {
    console.log(schedule);
    if (schedule.start_date && schedule.end_date) {
      return `${formatTime(schedule.start_date)} - ${formatTime(schedule.end_date)}`;
    } else if (schedule.start_date) {
      return formatTime(schedule.start_date);
    } else {
      return '시간 미설정';
    }
  };

  return (
    <div
      className="text-xs p-2 rounded border cursor-pointer hover:shadow-sm transition-all hover:scale-105 bg-white border-l-4"
      style={{
        borderLeftColor: projectColor,
        backgroundColor: projectColor + '08'
      }}
      onClick={(e) => {
        e.stopPropagation();
        onScheduleClick(schedule);
      }}
    >
      <div className="flex items-center justify-between mb-1">
        <div className="font-medium truncate flex-1">{schedule.title}</div>
        {schedule.priority === 'high' && (
          <div className="w-2 h-2 bg-red-500 rounded-full ml-1 flex-shrink-0" />
        )}
      </div>

      <div className="flex items-center justify-between text-xs opacity-75">
        <span>{getTimeDisplay()}</span>
        {schedule.projectId && (
          <div
            className="w-2 h-2 rounded-full flex-shrink-0"
            style={{ backgroundColor: projectColor }}
            title={getProjectName(schedule.projectId)}
          />
        )}
      </div>
    </div>
  );
};
