import { useProjectStore } from '@/stores/useProjectStore';
import { Project } from '@/types/schedule';

export const useProject = () => {
  const { projects, getProject } = useProjectStore();

  const getProjectColor = (projectId?: string): string => {
    if (!projectId) return '#6b7280'; // 기본 회색
    const project = getProject(projectId);
    return project?.color || '#6b7280';
  };

  const getProjectName = (projectId?: string): string => {
    if (!projectId) return '프로젝트 없음';
    const project = getProject(projectId);
    return project?.name || '알 수 없는 프로젝트';
  };

  const getProjectBadgeStyle = (projectId?: string) => {
    const color = getProjectColor(projectId);
    return {
      backgroundColor: color + '20',
      color: color,
      borderColor: color + '40'
    };
  };

  return {
    projects,
    getProject,
    getProjectColor,
    getProjectName,
    getProjectBadgeStyle
  };
};
