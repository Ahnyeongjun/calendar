import { useState } from 'react';
import { Plus, FolderOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useProjectStore } from '@/stores/useProjectStore';
import { Badge } from '@/components/ui/badge';
import { ProjectManageModal } from '@/components/ProjectManageModal';

interface ProjectSelectorProps {
  selectedProjectId?: string;
  onProjectChange: (projectId?: string) => void;
}

export const ProjectSelector = ({ selectedProjectId, onProjectChange }: ProjectSelectorProps) => {
  const { projects, getProject } = useProjectStore();
  const selectedProject = selectedProjectId ? getProject(selectedProjectId) : null;
  const [isManageModalOpen, setIsManageModalOpen] = useState(false);

  const handleValueChange = (value: string) => {
    if (value === 'none') {
      onProjectChange(undefined);
    } else {
      onProjectChange(value);
    }
  };

  return (
    <div className="space-y-3">
      <Select
        value={selectedProjectId || 'none'}
        onValueChange={handleValueChange}
      >
        <SelectTrigger>
          <SelectValue placeholder="프로젝트를 선택하세요">
            {selectedProject ? (
              <div className="flex items-center space-x-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: selectedProject.color }}
                />
                <span>{selectedProject.name}</span>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <FolderOpen size={14} className="text-gray-400" />
                <span>프로젝트 없음</span>
              </div>
            )}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="none">
            <div className="flex items-center space-x-2">
              <FolderOpen size={14} className="text-gray-400" />
              <span>프로젝트 없음</span>
            </div>
          </SelectItem>
          {projects.map((project) => (
            <SelectItem key={project.id} value={project.id}>
              <div className="flex items-center space-x-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: project.color }}
                />
                <span>{project.name}</span>
                {project.description && (
                  <span className="text-xs text-gray-500">- {project.description}</span>
                )}
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* 선택된 프로젝트 미리보기 */}
      {selectedProject && (
        <div className="p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Badge
                variant="secondary"
                style={{ backgroundColor: selectedProject.color + '20', color: selectedProject.color }}
              >
                {selectedProject.name}
              </Badge>
            </div>
          </div>
          {selectedProject.description && (
            <p className="text-sm text-gray-600 mt-1">{selectedProject.description}</p>
          )}
        </div>
      )}

      {/* 프로젝트 관리 버튼 */}
      <div className="flex justify-end">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="text-xs"
          onClick={() => setIsManageModalOpen(true)}
        >
          <Plus size={12} className="mr-1" />
          프로젝트 관리
        </Button>
      </div>

      {/* 프로젝트 관리 모달 */}
      <ProjectManageModal
        isOpen={isManageModalOpen}
        onClose={() => setIsManageModalOpen(false)}
      />
    </div>
  );
};
