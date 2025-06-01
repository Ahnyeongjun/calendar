import { useState, useEffect } from 'react';
import { Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Schedule, ScheduleFormData } from '@/types/schedule';
import { DatePicker } from './DatePicker';
import { TimeRangePicker } from './TimeRangePicker';
import { ScheduleOptions } from './ScheduleOptions';
import { ProjectSelector } from './ProjectSelector';
import { toDateString, fromDateString } from '@/util/dateUtils';

interface ScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: ScheduleFormData, scheduleId?: string) => void;
  schedule?: Schedule | null;
  selectedDate?: Date;
}

const ScheduleModal = ({ isOpen, onClose, onSave, schedule, selectedDate }: ScheduleModalProps) => {
  const [formData, setFormData] = useState<ScheduleFormData>({
    title: '',
    description: '',
    date: selectedDate ? toDateString(selectedDate) : toDateString(new Date()),
    startTime: '09:00',
    endTime: '10:00',
    projectId: undefined,
    priority: 'medium',
    status: 'planned'
  });

  useEffect(() => {
    if (schedule) {
      // Backend에서 받은 데이터를 폼 데이터로 변환
      const scheduleDate = new Date(schedule.date);
      const startTime = schedule.startTime ? new Date(schedule.startTime).toTimeString().slice(0, 5) : undefined;
      const endTime = schedule.endTime ? new Date(schedule.endTime).toTimeString().slice(0, 5) : undefined;
      
      setFormData({
        title: schedule.title,
        description: schedule.description || '',
        date: toDateString(scheduleDate),
        startTime: startTime || '09:00',
        endTime: endTime || '10:00',
        projectId: schedule.projectId,
        priority: schedule.priority,
        status: schedule.status
      });
    } else if (selectedDate) {
      setFormData(prev => ({ 
        ...prev, 
        date: toDateString(selectedDate)
      }));
    } else {
      // 기본값으로 리셋
      setFormData({
        title: '',
        description: '',
        date: toDateString(new Date()),
        startTime: '09:00',
        endTime: '10:00',
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
    
    if (!formData.date) {
      alert('날짜를 선택해주세요.');
      return;
    }
    
    onSave(formData, schedule?.id);
  };

  const handleClose = () => {
    setFormData({
      title: '',
      description: '',
      date: toDateString(new Date()),
      startTime: '09:00',
      endTime: '10:00',
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>날짜</Label>
              <DatePicker
                date={fromDateString(formData.date)}
                onDateChange={(date) => updateFormData({ 
                  date: toDateString(date)
                })}
              />
            </div>

            <div className="space-y-2">
              <Label>시간</Label>
              <TimeRangePicker
                startTime={formData.startTime}
                endTime={formData.endTime}
                onStartTimeChange={(startTime) => updateFormData({ startTime })}
                onEndTimeChange={(endTime) => updateFormData({ endTime })}
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

          <div className="flex justify-end space-x-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={handleClose}>
              취소
            </Button>
            <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
              {schedule ? '수정하기' : '추가하기'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ScheduleModal;
