import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Schedule } from '@/types/schedule';

// Component imports
import { CalendarHeader } from './CalendarHeader';
import { DayHeaders } from './DayHeaders';
import { CalendarDayCell } from './CalendarDayCell';
import { ScheduleListPopup } from './ScheduleListPopup';

// Utility imports
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameDay,
  isSameMonth,
  addMonths,
  subMonths,
  toDateString,
  isDateInScheduleRange
} from '@/util/dateUtils';

interface CalendarViewProps {
  schedules: Schedule[];
  onScheduleClick: (schedule: Schedule) => void;
  onScheduleDelete?: (schedule: Schedule) => void;
  onDateClick: (date: Date) => void;
  selectedProjectId?: string;
  onProjectFilterChange?: (projectId?: string) => void;
}

// Main Calendar View Component
const CalendarView = ({
  schedules = [],
  onScheduleClick = () => { },
  onScheduleDelete,
  onDateClick = () => { },
  selectedProjectId,
  onProjectFilterChange
}: CalendarViewProps) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [popupDate, setPopupDate] = useState<Date | null>(null);
  const [popupSchedules, setPopupSchedules] = useState<Schedule[]>([]);

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calendarStart = startOfWeek(monthStart);
  const calendarEnd = endOfWeek(monthEnd);
  const calendarDays = eachDayOfInterval(calendarStart, calendarEnd);

  const getSchedulesForDate = (date: Date) => {
    const dateString = toDateString(date);
    return schedules.filter(schedule => {
      // 기존 방식: schedule.date와 비교
      const scheduleDate = typeof schedule.date === 'string' 
        ? schedule.date.split('T')[0] // ISO string에서 날짜 부분만 추출
        : toDateString(new Date(schedule.date));
      
      const isOnScheduleDate = scheduleDate === dateString;
      
      // 새로운 방식: startDate와 endDate 범위 확인
      const isInDateRange = isDateInScheduleRange(date, schedule);
      
      return isOnScheduleDate || isInDateRange;
    });
  };

  const handleMoreClick = (e: React.MouseEvent, date: Date, daySchedules: Schedule[]) => {
    e.stopPropagation();
    setPopupDate(date);
    setPopupSchedules(daySchedules);
  };

  const closePopup = () => {
    setPopupDate(null);
    setPopupSchedules([]);
  };

  const handlePrevMonth = () => setCurrentDate(subMonths(currentDate, 1));
  const handleNextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const handleToday = () => setCurrentDate(new Date());

  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto">
        <CalendarHeader
          currentDate={currentDate}
          onPrevMonth={handlePrevMonth}
          onNextMonth={handleNextMonth}
          onToday={handleToday}
          selectedProjectId={selectedProjectId}
          onProjectFilterChange={onProjectFilterChange}
        />

        <Card className="overflow-hidden shadow-sm">
          <DayHeaders />

          <div className="grid grid-cols-7 gap-0">
            {calendarDays.map((day, index) => {
              const daySchedules = getSchedulesForDate(day);
              const isCurrentMonth = isSameMonth(day, currentDate);
              const isToday = isSameDay(day, new Date());
              const dayIndex = index % 7;

              return (
                <CalendarDayCell
                  key={day.toString()}
                  day={day}
                  dayIndex={dayIndex}
                  isCurrentMonth={isCurrentMonth}
                  isToday={isToday}
                  daySchedules={daySchedules}
                  onDateClick={onDateClick}
                  onScheduleClick={onScheduleClick}
                  onScheduleDelete={onScheduleDelete}
                  onMoreClick={handleMoreClick}
                />
              );
            })}
          </div>
        </Card>

        {popupDate && (
          <ScheduleListPopup
            schedules={popupSchedules}
            date={popupDate}
            onClose={closePopup}
            onScheduleClick={onScheduleClick}
            onScheduleDelete={onScheduleDelete}
            onDateClick={onDateClick}
          />
        )}
      </div>
    </div>
  );
};

export default CalendarView;
