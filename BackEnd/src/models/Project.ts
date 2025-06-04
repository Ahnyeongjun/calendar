import { prisma } from '../config/prisma';
import { Project } from '@prisma/client';

// Prisma 생성/업데이트에 사용할 타입들
type ProjectCreateInput = Omit<Project, 'id' | 'createdAt' | 'updatedAt'>;
type ProjectUpdateInput = Partial<ProjectCreateInput>;

class ProjectModel {
  static async findByName(name: string): Promise<Project | null> {
    try {
      return await prisma.project.findFirst({
        where: { 
          name: {
            equals: name
          }
        }
      });
    } catch (error) {
      console.error('Project.findByName error:', error);
      throw error;
    }
  }

  // 대소문자 구분 없이 이름 검색 (효율적인 방법)
  static async findByNameCaseInsensitive(name: string): Promise<Project | null> {
    try {
      // MySQL에서 LOWER 함수를 사용한 대소문자 구분 없는 검색
      const result = await prisma.$queryRaw<Project[]>`
        SELECT * FROM projects 
        WHERE LOWER(name) = LOWER(${name}) 
        LIMIT 1
      `;
      
      return result.length > 0 ? result[0] : null;
    } catch (error) {
      console.error('Project.findByNameCaseInsensitive error:', error);
      // Raw query 실패 시 JavaScript 방식으로 fallback
      return this.findByNameJavaScript(name);
    }
  }

  // Fallback: JavaScript에서 대소문자 구분 없는 검색
  private static async findByNameJavaScript(name: string): Promise<Project | null> {
    try {
      const projects = await prisma.project.findMany();
      return projects.find(project => 
        project.name.toLowerCase() === name.toLowerCase()
      ) || null;
    } catch (error) {
      console.error('Project.findByNameJavaScript error:', error);
      throw error;
    }
  }
  
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
  
  static async create(projectData: ProjectCreateInput): Promise<Project> {
    try {
      return await prisma.project.create({
        data: projectData
      });
    } catch (error) {
      console.error('Project.create error:', error);
      throw error;
    }
  }
  
  static async update(id: string, projectData: ProjectUpdateInput): Promise<Project | null> {
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
export type { ProjectCreateInput, ProjectUpdateInput };
