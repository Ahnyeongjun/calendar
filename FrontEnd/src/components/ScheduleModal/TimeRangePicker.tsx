import { Input } from '@/components/ui/input';

interface TimeRangePickerProps {
  startTime: string;
  endTime: string;
  onStartTimeChange: (time: string) => void;
  onEndTimeChange: (time: string) => void;
}

export const TimeRangePicker = ({
  startTime,
  endTime,
  onStartTimeChange,
  onEndTimeChange
}: TimeRangePickerProps) => {
  return (
    <div className="flex items-center space-x-2">
      <Input
        type="time"
        value={startTime}
        onChange={(e) => onStartTimeChange(e.target.value)}
        className="flex-1"
      />
      <span className="text-gray-500">-</span>
      <Input
        type="time"
        value={endTime}
        onChange={(e) => onEndTimeChange(e.target.value)}
        className="flex-1"
      />
    </div>
  );
};
