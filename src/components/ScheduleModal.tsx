
import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Calendar, Clock, Tag, Flag, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { Schedule, ScheduleFormData } from '@/types/schedule';

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
    priority: 'medium'
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
        priority: schedule.priority
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
      priority: 'medium'
    });
    onClose();
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
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
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
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="일정에 대한 상세 설명을 입력하세요"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>날짜</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !formData.date && "text-muted-foreground"
                    )}
                  >
                    <Calendar className="mr-2 h-4 w-4" />
                    {formData.date ? format(formData.date, "yyyy년 M월 d일") : "날짜 선택"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <CalendarComponent
                    mode="single"
                    selected={formData.date}
                    onSelect={(date) => date && setFormData({ ...formData, date })}
                    initialFocus
                    className="p-3 pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label>시간</Label>
              <div className="flex items-center space-x-2">
                <Input
                  type="time"
                  value={formData.startTime}
                  onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                  className="flex-1"
                />
                <span className="text-gray-500">-</span>
                <Input
                  type="time"
                  value={formData.endTime}
                  onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                  className="flex-1"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>카테고리</Label>
              <Select
                value={formData.category}
                onValueChange={(value: any) => setFormData({ ...formData, category: value })}
              >
                <SelectTrigger>
                  <Tag className="mr-2 h-4 w-4" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="work">업무</SelectItem>
                  <SelectItem value="personal">개인</SelectItem>
                  <SelectItem value="meeting">회의</SelectItem>
                  <SelectItem value="other">기타</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>우선순위</Label>
              <Select
                value={formData.priority}
                onValueChange={(value: any) => setFormData({ ...formData, priority: value })}
              >
                <SelectTrigger>
                  <Flag className="mr-2 h-4 w-4" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="high">높음</SelectItem>
                  <SelectItem value="medium">보통</SelectItem>
                  <SelectItem value="low">낮음</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

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
