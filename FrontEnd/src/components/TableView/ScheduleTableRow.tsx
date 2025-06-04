import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { Calendar, Clock, Flag, Edit, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Schedule } from '@/types/schedule';
import { useProject } from '@/hooks/useProject';

interface ScheduleTableRowProps {
  schedule: Schedule;
  onScheduleClick: (schedule: Schedule) => void;
  onStatusChange: (id: string, status: 'planned' | 'in_progress' | 'completed') => Promise<void>;
  onDeleteSchedule: (id: string) => Promise<void>;
  hideProject?: boolean; // 프로젝트 그룹핑 시 프로젝트 컬럼 숨김
}

export const ScheduleTableRow = ({
  schedule,
  onScheduleClick,
  onStatusChange,
  onDeleteSchedule,
  hideProject = false
}: ScheduleTableRowProps) => {
  const { getProjectName, getProjectBadgeStyle, getProjectColor } = useProject();

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
      'in_progress': 'bg-blue-100 text-blue-800',
      completed: 'bg-green-100 text-green-800'
    };
    return colors[status as keyof typeof colors] || colors.planned;
  };

  const getStatusText = (status: string) => {
    const statusText = {
      planned: '계획',
      'in_progress': '진행',
      completed: '완료'
    };
    return statusText[status as keyof typeof statusText] || '계획';
  };

  const handleStatusChange = async (newStatus: 'planned' | 'in_progress' | 'completed') => {
    await onStatusChange(schedule.id, newStatus);
  };

  const handleDelete = async () => {
    if (window.confirm('이 일정을 삭제하시겠습니까?')) {
      await onDeleteSchedule(schedule.id);
    }
  };

  const formatTime = (timeString?: string) => {
    if (!timeString) return '';
    
    try {
      // ISO datetime string에서 시간만 추출
      const date = new Date(timeString);
      
      // 유효한 날짜인지 확인 (1970년 방지)
      if (isNaN(date.getTime()) || date.getFullYear() < 2000) {
        // HH:mm 형태라면 그대로 반환
        if (/^\d{2}:\d{2}$/.test(timeString)) {
          return timeString;
        }
        return '시간 오류';
      }
      
      return format(date, 'HH:mm');
    } catch {
      // HH:mm 형태라면 그대로 반환
      if (/^\d{2}:\d{2}$/.test(timeString)) {
        return timeString;
      }
      return '시간 오류';
    }
  };

  return (
    <tr
      className={`hover:bg-gray-50 transition-colors cursor-pointer border-l-4 ${
        schedule.status === 'completed' ? 'opacity-60' : ''
      }`}
      style={{ borderLeftColor: getProjectColor(schedule.projectId) }}
    >
      <td className="px-6 py-4 whitespace-nowrap">
        <select
          value={schedule.status}
          onChange={(e) => handleStatusChange(e.target.value as any)}
          className={`text-sm px-2 py-1 rounded border-0 focus:outline-none focus:ring-2 focus:ring-blue-500 ${getStatusColor(schedule.status)}`}
          onClick={(e) => e.stopPropagation()}
        >
          <option value="planned">계획</option>
          <option value="in_progress">진행</option>
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
          <span>{format(new Date(schedule.date), 'M월 d일 (E)', { locale: ko })}</span>
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
        <div className="flex items-center space-x-1">
          <Clock size={14} className="text-gray-400" />
          <span>
            {schedule.startTime && schedule.endTime 
              ? `${formatTime(schedule.startTime)} - ${formatTime(schedule.endTime)}`
              : '시간 미설정'
            }
          </span>
        </div>
      </td>
      {!hideProject && (
        <td className="px-6 py-4 whitespace-nowrap">
          {schedule.projectId ? (
            <Badge 
              variant="secondary" 
              style={getProjectBadgeStyle(schedule.projectId)}
            >
              {getProjectName(schedule.projectId)}
            </Badge>
          ) : (
            <Badge variant="outline" className="text-gray-500">
              프로젝트 없음
            </Badge>
          )}
        </td>
      )}
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
              handleDelete();
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
