import { create } from 'zustand';
import { Project } from '@/types/schedule';
import { projectService, ProjectCreateData, ProjectUpdateData } from '@/services/projectService';

interface ProjectState {
  projects: Project[];
  isLoading: boolean;
  error: string | null;
  
  // Actions
  fetchProjects: () => Promise<void>;
  addProject: (project: ProjectCreateData) => Promise<Project>;
  updateProject: (id: string, updates: ProjectUpdateData) => Promise<Project>;
  deleteProject: (id: string) => Promise<void>;
  
  // Getters
  getProject: (id: string) => Project | undefined;
  getProjectByName: (name: string) => Project | undefined;
  
  // State setters
  setProjects: (projects: Project[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
}

export const useProjectStore = create<ProjectState>((set, get) => ({
  projects: [],
  isLoading: false,
  error: null,
  
  setProjects: (projects) => set({ projects }),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
  clearError: () => set({ error: null }),
  
  fetchProjects: async () => {
    try {
      set({ isLoading: true, error: null });
      const projects = await projectService.getAllProjects();
      set({ projects, isLoading: false });
    } catch (error) {
      const errorMessage = error instanceof Error 
        ? error.message 
        : '프로젝트를 불러오는데 실패했습니다.';
      set({ error: errorMessage, isLoading: false });
      throw error;
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
      const errorMessage = error instanceof Error 
        ? error.message 
        : '프로젝트 생성에 실패했습니다.';
      set({ error: errorMessage, isLoading: false });
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
      const errorMessage = error instanceof Error 
        ? error.message 
        : '프로젝트 수정에 실패했습니다.';
      set({ error: errorMessage, isLoading: false });
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
      const errorMessage = error instanceof Error 
        ? error.message 
        : '프로젝트 삭제에 실패했습니다.';
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },
  
  getProject: (id) => {
    return get().projects.find(project => project.id === id);
  },
  
  getProjectByName: (name) => {
    return get().projects.find(project => 
      project.name.toLowerCase() === name.toLowerCase()
    );
  }
}));
