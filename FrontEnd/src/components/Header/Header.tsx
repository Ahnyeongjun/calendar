import { ViewMode } from '@/types/schedule';
import { ViewToggle } from './ViewToggle';
import { UserWelcome } from './UserWelcome';
import { HeaderActions } from './HeaderActions';

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
          <UserWelcome />
          <ViewToggle currentView={currentView} onViewChange={onViewChange} />
        </div>
        <HeaderActions onAddSchedule={onAddSchedule} />
      </div>
    </header>
  );
};

export default Header;
