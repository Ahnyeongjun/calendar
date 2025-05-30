import { format, addMonths, subMonths } from 'date-fns';
import { ko } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Grid3x3, List } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

interface TableHeaderProps {
  currentMonth: Date;
  filterBy: string;
  statusFilter: string;
  sortBy: string;
  groupByProject: boolean;
  projectOptions: { value: string; label: string }[];
  onMonthChange: (date: Date) => void;
  onFilterChange: (filter: string) => void;
  onStatusFilterChange: (filter: string) => void;
  onSortChange: (sort: string) => void;
  onGroupByProjectChange: (group: boolean) => void;
}

export const TableHeader = ({
  currentMonth,
  filterBy,
  statusFilter,
  sortBy,
  groupByProject,
  projectOptions,
  onMonthChange,
  onFilterChange,
  onStatusFilterChange,
  onSortChange,
  onGroupByProjectChange
}: TableHeaderProps) => {
  return (
    <div className="space-y-4 mb-6">
      {/* 첫 번째 행: 제목과 월 네비게이션 */}
      <div className="flex items-center justify-between">
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

        {/* 프로젝트 그룹핑 토글 */}
        <div className="flex items-center space-x-2">
          <Label htmlFor="group-toggle" className="text-sm">
            프로젝트별 그룹핑
          </Label>
          <Switch
            id="group-toggle"
            checked={groupByProject}
            onCheckedChange={onGroupByProjectChange}
          />
          {groupByProject ? <Grid3x3 size={16} /> : <List size={16} />}
        </div>
      </div>

      {/* 두 번째 행: 필터와 정렬 옵션 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <select
            value={filterBy}
            onChange={(e) => onFilterChange(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {projectOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
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
        </div>

        <div className="flex items-center space-x-4">
          <Label className="text-sm text-gray-600">정렬:</Label>
          <select
            value={sortBy}
            onChange={(e) => onSortChange(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="date">날짜순</option>
            <option value="priority">우선순위순</option>
            <option value="project">프로젝트순</option>
            <option value="status">상태순</option>
          </select>
        </div>
      </div>
    </div>
  );
};
