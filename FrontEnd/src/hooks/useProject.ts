import { useProjectStore } from '@/stores/useProjectStore';
import { Project } from '@/types/schedule';

interface ProjectBadgeStyle {
  backgroundColor: string;
  color: string;
  borderColor: string;
}

export const useProject = () => {
  const { projects, getProject } = useProjectStore();

  const getProjectColor = (projectId?: string): string => {
    if (!projectId) return '#6b7280';
    const project = getProject(projectId);
    return project?.color || '#6b7280';
  };

  const getProjectName = (projectId?: string): string => {
    if (!projectId) return '프로젝트 없음';
    const project = getProject(projectId);
    return project?.name || '알 수 없는 프로젝트';
  };

  const getProjectBadgeStyle = (projectId?: string): ProjectBadgeStyle => {
    const color = getProjectColor(projectId);
    return {
      backgroundColor: `${color}20`,
      color: color,
      borderColor: `${color}40`
    };
  };

  const findProjectByName = (name: string): Project | undefined => {
    return projects.find(project => 
      project.name.toLowerCase() === name.toLowerCase()
    );
  };

  const getProjectsByColor = (color: string): Project[] => {
    return projects.filter(project => project.color === color);
  };

  return {
    projects,
    getProject,
    getProjectColor,
    getProjectName,
    getProjectBadgeStyle,
    findProjectByName,
    getProjectsByColor
  };
};
