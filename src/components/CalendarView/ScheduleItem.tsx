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
        <span>{schedule.startTime} - {schedule.endTime}</span>
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
