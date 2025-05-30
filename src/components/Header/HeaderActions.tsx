import { useState } from 'react';
import { User, LogOut, Folder, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/useAuthStore';
import { toast } from '@/hooks/use-toast';
import { ProjectManageModal } from '@/components/ProjectManageModal';

interface HeaderActionsProps {
  onAddSchedule: () => void;
}

export const HeaderActions = ({ onAddSchedule }: HeaderActionsProps) => {
  const navigate = useNavigate();
  const logout = useAuthStore((state) => state.logout);
  const [isProjectManageOpen, setIsProjectManageOpen] = useState(false);

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
    <TooltipProvider>
      <div className="flex items-center space-x-2 h-10">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button onClick={onAddSchedule} className="bg-blue-600 hover:bg-blue-700 h-10 w-10 p-0">
              <Plus size={16} />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>새로운 일정을 추가합니다</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsProjectManageOpen(true)}
              className="w-10 h-10 p-0"
            >
              <Folder size={16} />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>프로젝트 관리</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              onClick={handleMyPageClick}
              className="w-10 h-10 p-0"
            >
              <User size={16} />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>마이페이지</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              onClick={handleLogout}
              className="w-10 h-10 p-0"
            >
              <LogOut size={16} />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>로그아웃</p>
          </TooltipContent>
        </Tooltip>

        {/* 프로젝트 관리 모달 */}
        <ProjectManageModal
          isOpen={isProjectManageOpen}
          onClose={() => setIsProjectManageOpen(false)}
        />
      </div>
    </TooltipProvider>
  );
};
