import { Plus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Schedule } from '@/types/schedule';
import { formatDate } from '@/util/dateUtils';
import { getCategoryColor, getStatusOpacity, getPriorityIndicator } from '@/util/styleUtils';

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
  const handleNewSchedule = () => {
    if (onDateClick) {
      onDateClick(date);
    }
    onClose();
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

        <div className="space-y-2">
          {schedules.map((schedule) => (
            <div
              key={schedule.id}
              className={`p-3 rounded border cursor-pointer hover:shadow-sm transition-shadow ${getCategoryColor(schedule.category)} ${getStatusOpacity(schedule.status)} ${getPriorityIndicator(schedule.priority)}`}
              onClick={() => {
                onScheduleClick(schedule);
                onClose();
              }}
            >
              <div className="font-medium">{schedule.title}</div>
              <div className="text-sm opacity-75 mt-1">
                {schedule.startTime} - {schedule.endTime}
              </div>
              <div className="text-xs mt-1 opacity-60 capitalize">
                {schedule.category} • {schedule.priority} • {schedule.status}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
