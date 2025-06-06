import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatMonth } from '@/util/dateUtils';
import { ProjectFilter } from '@/components/Header/ProjectFilter';

interface CalendarHeaderProps {
  currentDate: Date;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onToday: () => void;
  selectedProjectId?: string;
  onProjectFilterChange?: (projectId?: string) => void;
}

export const CalendarHeader = ({
  currentDate,
  onPrevMonth,
  onNextMonth,
  onToday,
  selectedProjectId,
  onProjectFilterChange
}: CalendarHeaderProps) => {
  return (
    <div className="flex items-center justify-between mb-6">
      <h2 className="text-2xl font-semibold text-gray-900">
        {formatMonth(currentDate)}
      </h2>
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" onClick={onPrevMonth}>
            <ChevronLeft size={16} />
          </Button>
          <Button variant="outline" size="sm" onClick={onToday}>
            오늘
          </Button>
          <Button variant="outline" size="sm" onClick={onNextMonth}>
            <ChevronRight size={16} />
          </Button>
        </div>
        {onProjectFilterChange && (
          <ProjectFilter
            selectedProjectId={selectedProjectId}
            onProjectChange={onProjectFilterChange}
          />
        )}
      </div>
    </div>
  );
};
