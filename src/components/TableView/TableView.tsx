import { useState } from 'react';
import { startOfMonth, endOfMonth } from 'date-fns';
import { Card } from '@/components/ui/card';
import { Schedule } from '@/types/schedule';
import { TableHeader } from './TableHeader';
import { ScheduleTableRow } from './ScheduleTableRow';
import { EmptyState } from './EmptyState';

interface TableViewProps {
  schedules: Schedule[];
  onScheduleClick: (schedule: Schedule) => void;
  onStatusChange: (id: string, status: 'planned' | 'in-progress' | 'completed') => void;
  onDeleteSchedule: (id: string) => void;
}

const TableView = ({ schedules, onScheduleClick, onStatusChange, onDeleteSchedule }: TableViewProps) => {
  const [sortBy, setSortBy] = useState<'date' | 'priority' | 'category' | 'status'>('date');
  const [filterBy, setFilterBy] = useState<'all' | 'work' | 'personal' | 'meeting' | 'other'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'planned' | 'in-progress' | 'completed'>('all');
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);

  const filteredSchedules = schedules.filter(schedule => {
    const isInCurrentMonth = schedule.date >= monthStart && schedule.date <= monthEnd;
    const matchesCategory = filterBy === 'all' || schedule.category === filterBy;
    const matchesStatus = statusFilter === 'all' || schedule.status === statusFilter;
    return isInCurrentMonth && matchesCategory && matchesStatus;
  });

  const sortedSchedules = [...filteredSchedules].sort((a, b) => {
    switch (sortBy) {
      case 'date':
        return new Date(a.date).getTime() - new Date(b.date).getTime();
      case 'priority':
        const priorityOrder = { high: 3, medium: 2, low: 1 };
        return priorityOrder[b.priority] - priorityOrder[a.priority];
      case 'category':
        return a.category.localeCompare(b.category);
      case 'status':
        const statusOrder = { planned: 1, 'in-progress': 2, completed: 3 };
        return statusOrder[a.status] - statusOrder[b.status];
      default:
        return 0;
    }
  });

  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto">
        <TableHeader
          currentMonth={currentMonth}
          filterBy={filterBy}
          statusFilter={statusFilter}
          sortBy={sortBy}
          onMonthChange={setCurrentMonth}
          onFilterChange={setFilterBy as any}
          onStatusFilterChange={setStatusFilter as any}
          onSortChange={setSortBy as any}
        />

        <Card className="overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    상태
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    제목
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    날짜
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    시간
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    카테고리
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    우선순위
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    액션
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {sortedSchedules.map((schedule) => (
                  <ScheduleTableRow
                    key={schedule.id}
                    schedule={schedule}
                    onScheduleClick={onScheduleClick}
                    onStatusChange={onStatusChange}
                    onDeleteSchedule={onDeleteSchedule}
                  />
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        {sortedSchedules.length === 0 && <EmptyState />}
      </div>
    </div>
  );
};

export default TableView;
