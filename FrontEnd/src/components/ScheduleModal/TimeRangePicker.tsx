import { Input } from '@/components/ui/input';

interface TimeRangePickerProps {
  start_date: string;
  end_date: string;
  onStart_dateChange: (time: string) => void;
  onEnd_dateChange: (time: string) => void;
}

export const TimeRangePicker = ({
  start_date,
  end_date,
  onStart_dateChange,
  onEnd_dateChange
}: TimeRangePickerProps) => {
  return (
    <div className="flex items-center space-x-2">
      <Input
        type="time"
        value={start_date}
        onChange={(e) => onStart_dateChange(e.target.value)}
        className="flex-1"
      />
      <span className="text-gray-500">-</span>
      <Input
        type="time"
        value={end_date}
        onChange={(e) => onEnd_dateChange(e.target.value)}
        className="flex-1"
      />
    </div>
  );
};
