import { Schedule } from '@/types/schedule';
import { getCategoryColor, getStatusOpacity, getPriorityIndicator } from '@/util/styleUtils';

interface ScheduleItemProps {
  schedule: Schedule;
  onScheduleClick: (schedule: Schedule) => void;
}

export const ScheduleItem = ({
  schedule,
  onScheduleClick
}: ScheduleItemProps) => {
  return (
    <div
      className={`text-xs p-1 rounded border cursor-pointer hover:shadow-sm transition-shadow ${getCategoryColor(schedule.category)} ${getStatusOpacity(schedule.status)} ${getPriorityIndicator(schedule.priority)}`}
      onClick={(e) => {
        e.stopPropagation();
        onScheduleClick(schedule);
      }}
    >
      <div className="font-medium truncate">{schedule.title}</div>
      <div className="text-xs opacity-75">
        {schedule.startTime} - {schedule.endTime}
      </div>
    </div>
  );
};
