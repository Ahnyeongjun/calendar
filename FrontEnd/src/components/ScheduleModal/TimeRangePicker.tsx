import { Input } from '@/components/ui/input';

interface TimeRangePickerProps {
  start_date: string;
  end_date: string;
  onStart_dateChange: (datetime: string) => void;
  onEnd_dateChange: (datetime: string) => void;
}

export const TimeRangePicker = ({
  start_date,
  end_date,
  onStart_dateChange,
  onEnd_dateChange
}: TimeRangePickerProps) => {
  const handleInputClick = (e: React.MouseEvent) => {
    // input의 기본 클릭 동작을 막고 모달을 열도록 함
    e.preventDefault();
    (e.target as HTMLInputElement).showPicker?.();
  };

  const handleStartDateChange = (value: string) => {
    onStart_dateChange(value);
    
    // 시작일자가 종료일자보다 늦으면 종료일자를 자동 조정
    if (value && end_date) {
      const start = new Date(value);
      const end = new Date(end_date);
      if (start > end) {
        onEnd_dateChange(value);
      }
    }
  };

  const handleEndDateChange = (value: string) => {
    // 종료일자가 시작일자보다 빠르면 업데이트 방지
    if (value && start_date) {
      const start = new Date(start_date);
      const end = new Date(value);
      if (end < start) {
        return; // 업데이트하지 않음
      }
    }
    onEnd_dateChange(value);
  };

  return (
    <div className="flex space-x-4">
      <div className="flex-1">
        <Input
          type="datetime-local"
          value={start_date}
          onChange={(e) => handleStartDateChange(e.target.value)}
          onClick={handleInputClick}
          className="w-full cursor-pointer"
          placeholder="시작 날짜 및 시간"
        />
      </div>
      <div className="flex-1">
        <Input
          type="datetime-local"
          value={end_date}
          onChange={(e) => handleEndDateChange(e.target.value)}
          onClick={handleInputClick}
          className="w-full cursor-pointer"
          placeholder="종료 날짜 및 시간"
        />
      </div>
    </div>
  );
};
