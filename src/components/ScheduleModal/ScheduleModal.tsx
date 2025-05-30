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
    date: selectedDate || new Date(),
    startTime: '09:00',
    endTime: '10:00',
    category: 'other',
    priority: 'medium',
    status: 'planned'
  });

  useEffect(() => {
    if (schedule) {
      setFormData({
        title: schedule.title,
        description: schedule.description,
        date: schedule.date,
        startTime: schedule.startTime,
        endTime: schedule.endTime,
        category: schedule.category,
        priority: schedule.priority,
        status: schedule.status
      });
    } else if (selectedDate) {
      setFormData(prev => ({ ...prev, date: selectedDate }));
    }
  }, [schedule, selectedDate]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData, schedule?.id);
    onClose();
  };

  const handleClose = () => {
    setFormData({
      title: '',
      description: '',
      date: selectedDate || new Date(),
      startTime: '09:00',
      endTime: '10:00',
      category: 'other',
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
                date={formData.date}
                onDateChange={(date) => updateFormData({ date })}
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

          <ScheduleOptions
            category={formData.category}
            priority={formData.priority}
            status={formData.status}
            onCategoryChange={(category) => updateFormData({ category: category as any })}
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
