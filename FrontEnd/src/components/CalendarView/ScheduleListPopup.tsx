import { Plus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Schedule } from '@/types/schedule';
import { formatDate } from '@/util/dateUtils';
import { useProject } from '@/hooks/useProject';

interface ScheduleListPopupProps {
  schedules: Schedule[];
  date: Date;
  onClose: () => void;
  onScheduleClick: (schedule: Schedule) => void;
  onDateClick?: (date: Date) => void;
}

export const ScheduleListPopup = ({
  schedules,
  date,
  onClose,
  onScheduleClick,
  onDateClick
}: ScheduleListPopupProps) => {
  const { getProjectColor, getProjectName, getProjectBadgeStyle } = useProject();

  const handleNewSchedule = () => {
    if (onDateClick) {
      onDateClick(date);
    }
    onClose();
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'planned': return '계획';
      case 'in-progress': return '진행';
      case 'completed': return '완료';
      default: return status;
    }
  };

  const getPriorityText = (priority: string) => {
    switch (priority) {
      case 'high': return '높음';
      case 'medium': return '보통';
      case 'low': return '낮음';
      default: return priority;
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 max-h-96 overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">
            {formatDate(date)}
          </h3>
          <Button variant="outline" size="sm" onClick={onClose}>
            <X size={16} />
          </Button>
        </div>

        <div className="mb-4">
          <Button
            onClick={handleNewSchedule}
            className="w-full flex items-center justify-center gap-2"
          >
            <Plus size={16} />
            새 일정 추가
          </Button>
        </div>

        <div className="space-y-3">
          {schedules.map((schedule) => (
            <div
              key={schedule.id}
              className="p-3 rounded-lg border cursor-pointer hover:shadow-md transition-all hover:scale-105 bg-white border-l-4"
              style={{ 
                borderLeftColor: getProjectColor(schedule.projectId),
                backgroundColor: getProjectColor(schedule.projectId) + '08'
              }}
              onClick={() => {
                onScheduleClick(schedule);
                onClose();
              }}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="font-medium flex-1">{schedule.title}</div>
                {schedule.priority === 'high' && (
                  <div className="w-2 h-2 bg-red-500 rounded-full ml-2" />
                )}
              </div>
              
              <div className="text-sm text-gray-600 mb-2">
                {schedule.startTime} - {schedule.endTime}
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  {schedule.projectId && (
                    <Badge 
                      variant="secondary" 
                      style={getProjectBadgeStyle(schedule.projectId)}
                      className="text-xs"
                    >
                      {getProjectName(schedule.projectId)}
                    </Badge>
                  )}
                </div>
                
                <div className="flex items-center space-x-2 text-xs text-gray-500">
                  <span>{getPriorityText(schedule.priority)}</span>
                  <span>•</span>
                  <span>{getStatusText(schedule.status)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
