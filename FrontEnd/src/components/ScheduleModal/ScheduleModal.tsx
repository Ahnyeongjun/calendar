import { useState, useEffect } from 'react';
import { Calendar, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Schedule, ScheduleFormData } from '@/types/schedule';
import { TimeRangePicker } from './TimeRangePicker';
import { ScheduleOptions } from './ScheduleOptions';
import { ProjectSelector } from './ProjectSelector';
import { toDateTimeString, formatDateTimeForAPI, formatStartEndDateFromAPI } from '@/util/dateUtils';

interface ScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: ScheduleFormData, scheduleId?: string) => void;
  onDelete?: (schedule: Schedule) => void;
  schedule?: Schedule | null;
  selectedDate?: Date;
}

const ScheduleModal = ({ isOpen, onClose, onSave, onDelete, schedule, selectedDate }: ScheduleModalProps) => {
  const [formData, setFormData] = useState<ScheduleFormData>({
    title: '',
    description: '',
    date: '', // 내부적으로만 사용, start_date에서 추출
    start_date: toDateTimeString(new Date(), '09:00'),
    end_date: toDateTimeString(new Date(), '10:00'),
    projectId: undefined,
    priority: 'medium',
    status: 'planned'
  });

  useEffect(() => {
    if (schedule) {
      // Backend에서 받은 데이터를 폼 데이터로 변환
      const { startDateTime, endDateTime } = formatStartEndDateFromAPI(
        schedule.startDate, 
        schedule.endDate
      );
      
      setFormData({
        title: schedule.title,
        description: schedule.description || '',
        date: '', // start_date에서 추출되므로 비우기
        start_date: startDateTime,
        end_date: endDateTime,
        projectId: schedule.projectId,
        priority: schedule.priority,
        status: schedule.status
      });
    } else if (selectedDate) {
      setFormData(prev => ({ 
        ...prev, 
        start_date: toDateTimeString(selectedDate, '09:00'),
        end_date: toDateTimeString(selectedDate, '10:00')
      }));
    } else {
      // 기본값으로 리셋
      const today = new Date();
      setFormData({
        title: '',
        description: '',
        date: '',
        start_date: toDateTimeString(today, '09:00'),
        end_date: toDateTimeString(today, '10:00'),
        projectId: undefined,
        priority: 'medium',
        status: 'planned'
      });
    }
  }, [schedule, selectedDate, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // 입력 검증
    if (!formData.title.trim()) {
      alert('제목을 입력해주세요.');
      return;
    }
    
    if (!formData.start_date || !formData.end_date) {
      alert('시작일자와 종료일자를 설정해주세요.');
      return;
    }
    
    // 날짜 순서 검증
    const startDate = new Date(formData.start_date);
    const endDate = new Date(formData.end_date);
    
    if (startDate > endDate) {
      alert('시작일자가 종료일자보다 늦을 수 없습니다.');
      return;
    }
    
    // start_date에서 날짜 추출하여 date 필드 설정
    const dateStr = startDate.toISOString().split('T')[0];
    
    // 백엔드로 보낼 때 ISO string 형식으로 변환 (날짜 + 시간 포함)
    const apiData = {
      ...formData,
      date: dateStr, // start_date에서 추출한 날짜
      start_date: formatDateTimeForAPI(formData.start_date),
      end_date: formatDateTimeForAPI(formData.end_date)
    };
    
    onSave(apiData, schedule?.id);
  };

  const handleDelete = () => {
    if (schedule && onDelete && confirm('이 일정을 삭제하시겠습니까?')) {
      onDelete(schedule);
      onClose();
    }
  };

  const handleClose = () => {
    const today = new Date();
    setFormData({
      title: '',
      description: '',
      date: '',
      start_date: toDateTimeString(today, '09:00'),
      end_date: toDateTimeString(today, '10:00'),
      projectId: undefined,
      priority: 'medium',
      status: 'planned'
    });
    onClose();
  };

  const updateFormData = (updates: Partial<ScheduleFormData>) => {
    setFormData(prev => ({ ...prev, ...updates }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Calendar size={20} />
            <span>{schedule ? '일정 수정' : '새 일정 추가'}</span>
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="title">제목 *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => updateFormData({ title: e.target.value })}
              placeholder="일정 제목을 입력하세요"
              required
              className="text-lg font-medium"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">설명</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => updateFormData({ description: e.target.value })}
              placeholder="일정에 대한 상세 설명을 입력하세요"
              rows={3}
            />
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>시작일자 ~ 종료일자</Label>
              <TimeRangePicker
                start_date={formData.start_date}
                end_date={formData.end_date}
                onStart_dateChange={(start_date) => updateFormData({ start_date })}
                onEnd_dateChange={(end_date) => updateFormData({ end_date })}
              />
            </div>
          </div>

          {/* 프로젝트 선택 */}
          <div className="space-y-2">
            <Label>프로젝트</Label>
            <ProjectSelector
              selectedProjectId={formData.projectId}
              onProjectChange={(projectId) => updateFormData({ projectId })}
            />
          </div>

          <ScheduleOptions
            priority={formData.priority}
            status={formData.status}
            onPriorityChange={(priority) => updateFormData({ priority: priority as any })}
            onStatusChange={(status) => updateFormData({ status: status as any })}
          />

          <div className="flex justify-between pt-4 border-t">
            <Button type="button" variant="outline" onClick={handleClose}>
              취소
            </Button>
            <div className="flex space-x-3">
              {schedule && onDelete && (
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={handleDelete}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                >
                  삭제
                </Button>
              )}
              <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                {schedule ? '수정' : '추가하기'}
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ScheduleModal;
