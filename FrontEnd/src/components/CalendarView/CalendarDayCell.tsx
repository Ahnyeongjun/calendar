import { Schedule } from '@/types/schedule';
import { ScheduleItem } from './ScheduleItem';
import { MoreButton, AddScheduleButton } from './CalendarButtons';

interface CalendarDayCellProps {
  day: Date;
  dayIndex: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  daySchedules: Schedule[];
  onDateClick: (date: Date) => void;
  onScheduleClick: (schedule: Schedule) => void;
  onScheduleDelete?: (schedule: Schedule) => void;
  onMoreClick: (e: React.MouseEvent, date: Date, schedules: Schedule[]) => void;
}

export const CalendarDayCell = ({
  day,
  dayIndex,
  isCurrentMonth,
  isToday,
  daySchedules,
  onDateClick,
  onScheduleClick,
  onScheduleDelete,
  onMoreClick
}: CalendarDayCellProps) => {
  return (
    <div
      className={`h-[152px] p-2 border-r border-b last:border-r-0 cursor-pointer hover:bg-gray-50 transition-colors ${!isCurrentMonth ? 'bg-gray-50 text-gray-400' : ''
        } ${isToday ? 'bg-blue-50' : ''}`}
      onClick={() => onDateClick(day)}
    >
      <div className="flex items-center justify-between mb-2">
        <span
          className={`text-sm font-medium ${isToday ? 'bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center' : ''
            }  ${!isCurrentMonth ? 'text-gray-400' : `${dayIndex === 0 ? 'text-red-600' : dayIndex === 6 ? 'text-blue-600' : ''}`
            }`}
        >
          {day.getDate()}
        </span>
        {daySchedules.length > 0 && (
          <div className="text-xs text-gray-500">
            {daySchedules.length}
          </div>
        )}
      </div>

      <div className="h-[112px] space-y-1 overflow-hidden">
        {daySchedules.slice(0, 2).map((schedule) => (
          <ScheduleItem
            key={schedule.id}
            schedule={schedule}
            onScheduleClick={onScheduleClick}
            onScheduleDelete={onScheduleDelete}
          />
        ))}

        <div className="h-6 flex items-center justify-center">
          {daySchedules.length > 2 ? (
            <MoreButton
              count={daySchedules.length - 2}
              onClick={(e) => onMoreClick(e, day, daySchedules)}
            />
          ) : daySchedules.length === 0 ? (
            <AddScheduleButton />
          ) : null}
        </div>
      </div>
    </div>
  );
};
