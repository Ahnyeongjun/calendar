import { Filter } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useProject } from '@/hooks/useProject';

interface ProjectFilterProps {
  selectedProjectId?: string;
  onProjectChange: (projectId?: string) => void;
}

export const ProjectFilter = ({ selectedProjectId, onProjectChange }: ProjectFilterProps) => {
  const { projects, getProject } = useProject();
  const selectedProject = selectedProjectId ? getProject(selectedProjectId) : null;

  const handleValueChange = (value: string) => {
    if (value === 'all') {
      onProjectChange(undefined);
    } else if (value === 'none') {
      onProjectChange('none');
    } else {
      onProjectChange(value);
    }
  };

  return (
    <div className="flex items-center space-x-2">
      <Select
        value={selectedProjectId === 'none' ? 'none' : selectedProjectId || 'all'}
        onValueChange={handleValueChange}
      >
        <SelectTrigger className="w-40">
          <SelectValue placeholder="전체 프로젝트">
            {selectedProject ? (
              <div className="flex items-center space-x-2">
                <div
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: selectedProject.color }}
                />
                <span>{selectedProject.name}</span>
              </div>
            ) : selectedProjectId === 'none' ? (
              <span className="text-gray-500">프로젝트 없음</span>
            ) : (
              <span>전체 프로젝트</span>
            )}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">
            <span>전체 프로젝트</span>
          </SelectItem>
          {projects.map((project) => (
            <SelectItem key={project.id} value={project.id}>
              <div className="flex items-center space-x-2">
                <div
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: project.color }}
                />
                <span>{project.name}</span>
              </div>
            </SelectItem>
          ))}
          <SelectItem value="none">
            <span className="text-gray-500">프로젝트 없음</span>
          </SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
};
