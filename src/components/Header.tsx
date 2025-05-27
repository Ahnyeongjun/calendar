
import { Calendar, Table, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ViewMode } from '@/types/schedule';
import { useAuth } from '@/contexts/AuthContext';
import { Link } from 'react-router-dom';

interface HeaderProps {
  currentView: ViewMode;
  onViewChange: (view: ViewMode) => void;
  onAddSchedule: () => void;
}

const Header = ({ currentView, onViewChange, onAddSchedule }: HeaderProps) => {
  const { user } = useAuth();

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            일정 관리
          </h1>
          {user && (
            <span className="text-sm text-gray-600">
              안녕하세요, {user.name}님
            </span>
          )}
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
        <div className="flex items-center space-x-3">
          <Button onClick={onAddSchedule} className="bg-blue-600 hover:bg-blue-700">
            새 일정 추가
          </Button>
          <Link to="/mypage">
            <Button variant="outline" size="sm">
              <User size={16} className="mr-2" />
              마이페이지
            </Button>
          </Link>
        </div>
      </div>
    </header>
  );
};

export default Header;
