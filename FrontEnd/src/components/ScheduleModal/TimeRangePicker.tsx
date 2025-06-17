import { Input } from '@/components/ui/input';

interface TimeRangePickerProps {
  startDate: string;
  endDate: string;
  onStartDateChange: (datetime: string) => void;
  onEndDateChange: (datetime: string) => void;
}

export const TimeRangePicker = ({
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange
}: TimeRangePickerProps) => {
  const handleInputClick = (e: React.MouseEvent) => {
    // input의 기본 클릭 동작을 막고 모달을 열도록 함
    e.preventDefault();
    (e.target as HTMLInputElement).showPicker?.();
  };

  const handleStartDateChange = (value: string) => {
    onStartDateChange(value);
    
    // 시작일자가 종료일자보다 늦으면 종료일자를 자동 조정
    if (value && endDate) {
      const start = new Date(value);
      const end = new Date(endDate);
      if (start > end) {
        onEndDateChange(value);
      }
    }
  };

  const handleEndDateChange = (value: string) => {
    // 종료일자가 시작일자보다 빠르면 업데이트 방지
    if (value && startDate) {
      const start = new Date(startDate);
      const end = new Date(value);
      if (end < start) {
        return; // 업데이트하지 않음
      }
    }
    onEndDateChange(value);
  };

  return (
    <div className="flex space-x-4">
      <div className="flex-1">
        <Input
          type="datetime-local"
          value={startDate}
          onChange={(e) => handleStartDateChange(e.target.value)}
          onClick={handleInputClick}
          className="w-full cursor-pointer"
          placeholder="시작 날짜 및 시간"
        />
      </div>
      <div className="flex-1">
        <Input
          type="datetime-local"
          value={endDate}
          onChange={(e) => handleEndDateChange(e.target.value)}
          onClick={handleInputClick}
          className="w-full cursor-pointer"
          placeholder="종료 날짜 및 시간"
        />
      </div>
    </div>
  );
};
