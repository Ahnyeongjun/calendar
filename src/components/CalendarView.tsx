import { useState } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths } from 'date-fns';
import { ko } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Schedule } from '@/types/schedule';

interface CalendarViewProps {
  schedules: Schedule[];
  onScheduleClick: (schedule: Schedule) => void;
  onDateClick: (date: Date) => void;
}

const CalendarView = ({ schedules, onScheduleClick, onDateClick }: CalendarViewProps) => {
  const [currentDate, setCurrentDate] = useState(new Date());

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calendarDays = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const getSchedulesForDate = (date: Date) => {
    return schedules.filter(schedule => isSameDay(schedule.date, date));
  };

  const getCategoryColor = (category: string) => {
    const colors = {
      work: 'bg-blue-100 text-blue-800 border-blue-200',
      personal: 'bg-green-100 text-green-800 border-green-200',
      meeting: 'bg-purple-100 text-purple-800 border-purple-200',
      other: 'bg-gray-100 text-gray-800 border-gray-200'
    };
    return colors[category as keyof typeof colors] || colors.other;
  };

  const getStatusOpacity = (status: string) => {
    switch (status) {
      case 'completed':
        return 'opacity-60';
      case 'in-progress':
        return 'opacity-90';
      default:
        return 'opacity-100';
    }
  };

  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-semibold text-gray-900">
            {format(currentDate, 'yyyy년 M월', { locale: ko })}
          </h2>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentDate(subMonths(currentDate, 1))}
            >
              <ChevronLeft size={16} />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentDate(new Date())}
            >
              오늘
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentDate(addMonths(currentDate, 1))}
            >
              <ChevronRight size={16} />
            </Button>
          </div>
        </div>

        <Card className="overflow-hidden shadow-sm">
          <div className="grid grid-cols-7 gap-0 border-b">
            {['일', '월', '화', '수', '목', '금', '토'].map((day, index) => (
              <div
                key={day}
                className={`p-4 text-center font-medium text-gray-600 bg-gray-50 border-r last:border-r-0 ${
                  index === 0 ? 'text-red-600' : index === 6 ? 'text-blue-600' : ''
                }`}
              >
                {day}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-0">
            {calendarDays.map((day, index) => {
              const daySchedules = getSchedulesForDate(day);
              const isCurrentMonth = isSameMonth(day, currentDate);
              const isToday = isSameDay(day, new Date());

              return (
                <div
                  key={day.toString()}
                  className={`min-h-[120px] p-2 border-r border-b last:border-r-0 cursor-pointer hover:bg-gray-50 transition-colors ${
                    !isCurrentMonth ? 'bg-gray-50 text-gray-400' : ''
                  } ${isToday ? 'bg-blue-50' : ''}`}
                  onClick={() => onDateClick(day)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span
                      className={`text-sm font-medium ${
                        isToday ? 'bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center' : ''
                      } ${index % 7 === 0 ? 'text-red-600' : index % 7 === 6 ? 'text-blue-600' : ''}`}
                    >
                      {format(day, 'd')}
                    </span>
                    {daySchedules.length > 0 && (
                      <div className="text-xs text-gray-500">
                        {daySchedules.length}
                      </div>
                    )}
                  </div>

                  <div className="space-y-1">
                    {daySchedules.slice(0, 2).map((schedule) => (
                      <div
                        key={schedule.id}
                        className={`text-xs p-1 rounded border cursor-pointer hover:shadow-sm transition-shadow ${getCategoryColor(schedule.category)} ${getStatusOpacity(schedule.status)}`}
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
                    ))}
                    {daySchedules.length > 2 && (
                      <div className="text-xs text-gray-500 text-center">
                        +{daySchedules.length - 2} 더보기
                      </div>
                    )}
                  </div>

                  {daySchedules.length === 0 && (
                    <div className="flex items-center justify-center h-full opacity-0 hover:opacity-100 transition-opacity">
                      <Plus size={16} className="text-gray-400" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default CalendarView;
