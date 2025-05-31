import { prisma } from '../config/prisma';
import { Project } from '@prisma/client';

class ProjectModel {
  static async findAll(): Promise<Project[]> {
    try {
      return await prisma.project.findMany({
        orderBy: { name: 'asc' }
      });
    } catch (error) {
      console.error('Project.findAll error:', error);
      throw error;
    }
  }
  
  static async findById(id: string): Promise<Project | null> {
    try {
      return await prisma.project.findUnique({
        where: { id }
      });
    } catch (error) {
      console.error('Project.findById error:', error);
      throw error;
    }
  }
  
  static async create(projectData: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>): Promise<Project> {
    try {
      return await prisma.project.create({
        data: projectData
      });
    } catch (error) {
      console.error('Project.create error:', error);
      throw error;
    }
  }
  
  static async update(id: string, projectData: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>): Promise<Project | null> {
    try {
      // 프로젝트 존재 확인
      const existingProject = await this.findById(id);
      if (!existingProject) {
        return null;
      }
      
      // 업데이트 실행
      return await prisma.project.update({
        where: { id },
        data: projectData
      });
    } catch (error) {
      console.error('Project.update error:', error);
      throw error;
    }
  }
  
  static async delete(id: string): Promise<boolean> {
    try {
      // 프로젝트 존재 확인
      const existingProject = await this.findById(id);
      if (!existingProject) {
        return false;
      }
      
      // 삭제 실행
      await prisma.project.delete({
        where: { id }
      });
      
      return true;
    } catch (error) {
      console.error('Project.delete error:', error);
      throw error;
    }
  }
}

export default ProjectModel;