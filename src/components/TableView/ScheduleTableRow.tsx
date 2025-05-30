import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { Calendar, Clock, Flag, Edit, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Schedule } from '@/types/schedule';

interface ScheduleTableRowProps {
  schedule: Schedule;
  onScheduleClick: (schedule: Schedule) => void;
  onStatusChange: (id: string, status: 'planned' | 'in-progress' | 'completed') => void;
  onDeleteSchedule: (id: string) => void;
}

export const ScheduleTableRow = ({
  schedule,
  onScheduleClick,
  onStatusChange,
  onDeleteSchedule
}: ScheduleTableRowProps) => {
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

  const handleStatusChange = (newStatus: 'planned' | 'in-progress' | 'completed') => {
    onStatusChange(schedule.id, newStatus);
  };

  return (
    <tr
      className={`hover:bg-gray-50 transition-colors cursor-pointer ${
        schedule.status === 'completed' ? 'opacity-60' : ''
      }`}
    >
      <td className="px-6 py-4 whitespace-nowrap">
        <select
          value={schedule.status}
          onChange={(e) => handleStatusChange(e.target.value as any)}
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
  );
};
