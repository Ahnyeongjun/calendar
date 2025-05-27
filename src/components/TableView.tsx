
import { useState } from 'react';
import { format, isSameMonth, startOfMonth, endOfMonth, addMonths, subMonths } from 'date-fns';
import { ko } from 'date-fns/locale';
import { Calendar, Clock, Flag, CheckCircle2, Circle, Trash2, Edit, ChevronLeft, ChevronRight, PlayCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Schedule } from '@/types/schedule';

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

  const getCategoryColor = (category: string) => {
    const colors = {
      work: 'bg-blue-100 text-blue-800',
      personal: 'bg-green-100 text-green-800',
      meeting: 'bg-purple-100 text-purple-800',
      other: 'bg-gray-100 text-gray-800'
    };
    return colors[category as keyof typeof colors] || colors.other;
  };

  const getPriorityColor = (priority: string) => {
    const colors = {
      high: 'bg-red-100 text-red-800',
      medium: 'bg-yellow-100 text-yellow-800',
      low: 'bg-green-100 text-green-800'
    };
    return colors[priority as keyof typeof colors] || colors.low;
  };

  const getStatusColor = (status: string) => {
    const colors = {
      planned: 'bg-gray-100 text-gray-800',
      'in-progress': 'bg-blue-100 text-blue-800',
      completed: 'bg-green-100 text-green-800'
    };
    return colors[status as keyof typeof colors] || colors.planned;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'planned':
        return <Circle size={14} />;
      case 'in-progress':
        return <PlayCircle size={14} />;
      case 'completed':
        return <CheckCircle2 size={14} />;
      default:
        return <Circle size={14} />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'planned':
        return '계획';
      case 'in-progress':
        return '진행';
      case 'completed':
        return '완료';
      default:
        return '계획';
    }
  };

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

  const handleStatusChange = (scheduleId: string, newStatus: 'planned' | 'in-progress' | 'completed') => {
    onStatusChange(scheduleId, newStatus);
  };

  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <h2 className="text-2xl font-semibold text-gray-900">일정 목록</h2>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
              >
                <ChevronLeft size={16} />
              </Button>
              <div className="px-4 py-2 text-sm font-medium bg-gray-100 rounded-md min-w-[120px] text-center">
                {format(currentMonth, 'yyyy년 M월', { locale: ko })}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
              >
                <ChevronRight size={16} />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentMonth(new Date())}
              >
                이번 달
              </Button>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <select
              value={filterBy}
              onChange={(e) => setFilterBy(e.target.value as any)}
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
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">전체 상태</option>
              <option value="planned">계획</option>
              <option value="in-progress">진행</option>
              <option value="completed">완료</option>
            </select>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="date">날짜순</option>
              <option value="priority">우선순위순</option>
              <option value="category">카테고리순</option>
              <option value="status">상태순</option>
            </select>
          </div>
        </div>

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
                  <tr
                    key={schedule.id}
                    className={`hover:bg-gray-50 transition-colors cursor-pointer ${
                      schedule.status === 'completed' ? 'opacity-60' : ''
                    }`}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <select
                        value={schedule.status}
                        onChange={(e) => handleStatusChange(schedule.id, e.target.value as any)}
                        className={`text-sm px-2 py-1 rounded border-0 focus:outline-none focus:ring-2 focus:ring-blue-500 ${getStatusColor(schedule.status)}`}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <option value="planned">계획</option>
                        <option value="in-progress">진행</option>
                        <option value="completed">완료</option>
                      </select>
                    </td>
                    <td 
                      className="px-6 py-4 whitespace-nowrap"
                      onClick={() => onScheduleClick(schedule)}
                    >
                      <div className="text-sm font-medium text-gray-900">
                        {schedule.title}
                      </div>
                      {schedule.description && (
                        <div className="text-sm text-gray-500 truncate max-w-xs">
                          {schedule.description}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div className="flex items-center space-x-1">
                        <Calendar size={14} className="text-gray-400" />
                        <span>{format(schedule.date, 'M월 d일 (E)', { locale: ko })}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div className="flex items-center space-x-1">
                        <Clock size={14} className="text-gray-400" />
                        <span>{schedule.startTime} - {schedule.endTime}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge className={getCategoryColor(schedule.category)}>
                        {schedule.category === 'work' ? '업무' : 
                         schedule.category === 'personal' ? '개인' :
                         schedule.category === 'meeting' ? '회의' : '기타'}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge className={getPriorityColor(schedule.priority)}>
                        <Flag size={12} className="mr-1" />
                        {schedule.priority === 'high' ? '높음' :
                         schedule.priority === 'medium' ? '보통' : '낮음'}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            onScheduleClick(schedule);
                          }}
                        >
                          <Edit size={14} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteSchedule(schedule.id);
                          }}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 size={14} />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        {sortedSchedules.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-500 text-lg mb-2">선택한 월에 일정이 없습니다</div>
            <div className="text-gray-400 text-sm">새 일정을 추가해보세요!</div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TableView;
