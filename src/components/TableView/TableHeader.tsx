import { format, addMonths, subMonths } from 'date-fns';
import { ko } from 'date-fns/locale';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface TableHeaderProps {
  currentMonth: Date;
  filterBy: string;
  statusFilter: string;
  sortBy: string;
  onMonthChange: (date: Date) => void;
  onFilterChange: (filter: string) => void;
  onStatusFilterChange: (filter: string) => void;
  onSortChange: (sort: string) => void;
}

export const TableHeader = ({
  currentMonth,
  filterBy,
  statusFilter,
  sortBy,
  onMonthChange,
  onFilterChange,
  onStatusFilterChange,
  onSortChange
}: TableHeaderProps) => {
  return (
    <div className="flex items-center justify-between mb-6">
      <div className="flex items-center space-x-4">
        <h2 className="text-2xl font-semibold text-gray-900">일정 목록</h2>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onMonthChange(subMonths(currentMonth, 1))}
          >
            <ChevronLeft size={16} />
          </Button>
          <div className="px-4 py-2 text-sm font-medium bg-gray-100 rounded-md min-w-[120px] text-center">
            {format(currentMonth, 'yyyy년 M월', { locale: ko })}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onMonthChange(addMonths(currentMonth, 1))}
          >
            <ChevronRight size={16} />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onMonthChange(new Date())}
          >
            이번 달
          </Button>
        </div>
      </div>
      <div className="flex items-center space-x-4">
        <select
          value={filterBy}
          onChange={(e) => onFilterChange(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">전체 카테고리</option>
          <option value="work">업무</option>
          <option value="personal">개인</option>
          <option value="meeting">회의</option>
          <option value="other">기타</option>
        </select>
        <select
          value={statusFilter}
          onChange={(e) => onStatusFilterChange(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">전체 상태</option>
          <option value="planned">계획</option>
          <option value="in-progress">진행</option>
          <option value="completed">완료</option>
        </select>
        <select
          value={sortBy}
          onChange={(e) => onSortChange(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="date">날짜순</option>
          <option value="priority">우선순위순</option>
          <option value="category">카테고리순</option>
          <option value="status">상태순</option>
        </select>
      </div>
    </div>
  );
};
