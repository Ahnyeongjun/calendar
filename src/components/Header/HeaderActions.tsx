import { User, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/useAuthStore';
import { toast } from '@/hooks/use-toast';

interface HeaderActionsProps {
  onAddSchedule: () => void;
}

export const HeaderActions = ({ onAddSchedule }: HeaderActionsProps) => {
  const navigate = useNavigate();
  const logout = useAuthStore((state) => state.logout);

  const handleLogout = () => {
    toast({
      title: "로그아웃",
      description: "성공적으로 로그아웃되었습니다.",
    });
    logout(); // Store에서 자동으로 navigate 처리
  };

  const handleMyPageClick = () => {
    navigate('/mypage');
  };

  return (
    <div className="flex items-center space-x-3">
      <Button onClick={onAddSchedule} className="bg-blue-600 hover:bg-blue-700">
        새 일정 추가
      </Button>
      <Button variant="outline" size="sm" onClick={handleMyPageClick}>
        <User size={16} className="mr-2" />
        마이페이지
      </Button>
      <Button variant="outline" size="sm" onClick={handleLogout}>
        <LogOut size={16} className="mr-2" />
        로그아웃
      </Button>
    </div>
  );
};
