import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Project } from '@/types/schedule';

interface ProjectState {
  projects: Project[];
  addProject: (project: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateProject: (id: string, updates: Partial<Omit<Project, 'id' | 'createdAt' | 'updatedAt'>>) => void;
  deleteProject: (id: string) => void;
  getProject: (id: string) => Project | undefined;
}

// 기본 프로젝트 데이터
const DEFAULT_PROJECTS: Project[] = [
  {
    id: 'personal',
    name: '개인',
    description: '개인적인 일정 및 할일',
    color: '#10b981',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'work',
    name: '업무',
    description: '회사 업무 관련',
    color: '#3b82f6',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'study',
    name: '학습',
    description: '공부 및 자기계발',
    color: '#8b5cf6',
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

export const useProjectStore = create<ProjectState>()(
  persist(
    (set, get) => ({
      projects: DEFAULT_PROJECTS,
      
      addProject: (projectData) => {
        const newProject: Project = {
          id: Date.now().toString(),
          ...projectData,
          createdAt: new Date(),
          updatedAt: new Date()
        };
        
        set((state) => ({
          projects: [...state.projects, newProject]
        }));
      },
      
      updateProject: (id, updates) => {
        set((state) => ({
          projects: state.projects.map(project =>
            project.id === id
              ? { ...project, ...updates, updatedAt: new Date() }
              : project
          )
        }));
      },
      
      deleteProject: (id) => {
        set((state) => ({
          projects: state.projects.filter(project => project.id !== id)
        }));
      },
      
      getProject: (id) => {
        return get().projects.find(project => project.id === id);
      }
    }),
    {
      name: 'project-storage'
    }
  )
);
