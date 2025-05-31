import { Plus } from 'lucide-react';

interface MoreButtonProps {
  count: number;
  onClick: (e: React.MouseEvent) => void;
}

export const MoreButton = ({ 
  count, 
  onClick 
}: MoreButtonProps) => {
  return (
    <div
      className="text-xs text-gray-500 text-center cursor-pointer hover:text-gray-700 hover:bg-gray-100 rounded p-1 w-full"
      onClick={onClick}
    >
      +{count} 더보기
    </div>
  );
};

// Add Schedule Button Component
export const AddScheduleButton = () => {
  return (
    <div className="opacity-0 hover:opacity-100 transition-opacity">
      <Plus size={16} className="text-gray-400" />
    </div>
  );
};
