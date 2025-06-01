import { Calendar, Table } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ViewMode } from '@/types/schedule';

interface ViewToggleProps {
  currentView: 'calendar' | 'table';
  onViewChange: (view: 'calendar' | 'table') => void;
}

export const ViewToggle = ({ currentView, onViewChange }: ViewToggleProps) => {
  return (
    <div className="flex items-center space-x-2 bg-gray-100 rounded-lg p-1">
      <Button
        variant={currentView === 'calendar' ? 'default' : 'ghost'}
        size="sm"
        onClick={() => onViewChange('calendar')}
        className="flex items-center space-x-2"
      >
        <Calendar size={16} />
        <span>캘린더</span>
      </Button>
      <Button
        variant={currentView === 'table' ? 'default' : 'ghost'}
        size="sm"
        onClick={() => onViewChange('table')}
        className="flex items-center space-x-2"
      >
        <Table size={16} />
        <span>테이블</span>
      </Button>
    </div>
  );
};
