import { Flag } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface ScheduleOptionsProps {
  priority: string;
  status: string;
  onPriorityChange: (value: string) => void;
  onStatusChange: (value: string) => void;
}

export const ScheduleOptions = ({
  priority,
  status,
  onPriorityChange,
  onStatusChange
}: ScheduleOptionsProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="space-y-2">
        <Label>우선순위</Label>
        <Select value={priority} onValueChange={onPriorityChange}>
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

      <div className="space-y-2">
        <Label>상태</Label>
        <Select value={status} onValueChange={onStatusChange}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="planned">계획</SelectItem>
            <SelectItem value="in-progress">진행</SelectItem>
            <SelectItem value="completed">완료</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};
