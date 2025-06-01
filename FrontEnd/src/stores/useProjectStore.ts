import { create } from 'zustand';
import { Project } from '@/types/schedule';
import { projectService } from '@/services/projectService';

interface ProjectState {
  projects: Project[];
  isLoading: boolean;
  error: string | null;
  
  // Actions
  fetchProjects: () => Promise<void>;
  addProject: (project: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Project>;
  updateProject: (id: string, updates: Partial<Omit<Project, 'id' | 'createdAt' | 'updatedAt'>>) => Promise<Project>;
  deleteProject: (id: string) => Promise<void>;
  getProject: (id: string) => Project | undefined;
  setProjects: (projects: Project[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useProjectStore = create<ProjectState>((set, get) => ({
  projects: [],
  isLoading: false,
  error: null,
  
  setProjects: (projects) => set({ projects }),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
  
  fetchProjects: async () => {
    try {
      set({ isLoading: true, error: null });
      const projects = await projectService.getAllProjects();
      set({ projects, isLoading: false });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '프로젝트를 불러오는데 실패했습니다.';
      set({ error: errorMessage, isLoading: false });
      console.error('Failed to fetch projects:', error);
    }
  },
  
  addProject: async (projectData) => {
    try {
      set({ isLoading: true, error: null });
      const newProject = await projectService.createProject(projectData);
      
      set((state) => ({
        projects: [...state.projects, newProject],
        isLoading: false
      }));
      
      return newProject;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '프로젝트 생성에 실패했습니다.';
      set({ error: errorMessage, isLoading: false });
      console.error('Failed to create project:', error);
      throw error;
    }
  },
  
  updateProject: async (id, updates) => {
    try {
      set({ isLoading: true, error: null });
      const updatedProject = await projectService.updateProject(id, updates);
      
      set((state) => ({
        projects: state.projects.map(project =>
          project.id === id ? updatedProject : project
        ),
        isLoading: false
      }));
      
      return updatedProject;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '프로젝트 수정에 실패했습니다.';
      set({ error: errorMessage, isLoading: false });
      console.error('Failed to update project:', error);
      throw error;
    }
  },
  
  deleteProject: async (id) => {
    try {
      set({ isLoading: true, error: null });
      await projectService.deleteProject(id);
      
      set((state) => ({
        projects: state.projects.filter(project => project.id !== id),
        isLoading: false
      }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '프로젝트 삭제에 실패했습니다.';
      set({ error: errorMessage, isLoading: false });
      console.error('Failed to delete project:', error);
      throw error;
    }
  },
  
  getProject: (id) => {
    return get().projects.find(project => project.id === id);
  }
}));
