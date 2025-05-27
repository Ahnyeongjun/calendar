
import { Calendar, Table } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ViewMode } from '@/types/schedule';

interface HeaderProps {
  currentView: ViewMode;
  onViewChange: (view: ViewMode) => void;
  onAddSchedule: () => void;
}

const Header = ({ currentView, onViewChange, onAddSchedule }: HeaderProps) => {
  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            일정 관리
          </h1>
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
        </div>
        <Button onClick={onAddSchedule} className="bg-blue-600 hover:bg-blue-700">
          새 일정 추가
        </Button>
      </div>
    </header>
  );
};

export default Header;
