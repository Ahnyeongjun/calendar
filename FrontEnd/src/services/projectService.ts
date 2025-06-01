import ApiService from './api';
import { Project, ProjectsResponse, ProjectResponse } from '@/types/schedule';

export const projectService = {
  async getAllProjects(): Promise<Project[]> {
    const response = await ApiService.get<ProjectsResponse>('/projects');
    return response.projects;
  },

  async getProject(id: string): Promise<Project> {
    const response = await ApiService.get<ProjectResponse>(`/projects/${id}`);
    return response.project;
  },

  async createProject(projectData: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>): Promise<Project> {
    const response = await ApiService.post<ProjectResponse>('/projects', projectData);
    return response.project;
  },

  async updateProject(id: string, projectData: Partial<Omit<Project, 'id' | 'createdAt' | 'updatedAt'>>): Promise<Project> {
    const response = await ApiService.put<ProjectResponse>(`/projects/${id}`, projectData);
    return response.project;
  },

  async deleteProject(id: string): Promise<void> {
    await ApiService.delete(`/projects/${id}`);
  }
};
