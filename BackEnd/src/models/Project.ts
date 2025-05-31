import { pool } from '../config/db';
import { Project } from '../types';

class ProjectModel {
  static async findAll(): Promise<Project[]> {
    let conn;
    try {
      conn = await pool.getConnection();
      const projects = await conn.query('SELECT * FROM projects ORDER BY name');
      return projects as Project[];
    } catch (error) {
      console.error('Project.findAll error:', error);
      throw error;
    } finally {
      if (conn) conn.release();
    }
  }
  
  static async findById(id: string): Promise<Project | null> {
    let conn;
    try {
      conn = await pool.getConnection();
      const projects = await conn.query('SELECT * FROM projects WHERE id = ?', [id]);
      
      if (projects.length === 0) {
        return null;
      }
      
      return projects[0] as Project;
    } catch (error) {
      console.error('Project.findById error:', error);
      throw error;
    } finally {
      if (conn) conn.release();
    }
  }
  
  static async create(projectData: Omit<Project, 'id' | 'created_at' | 'updated_at'>): Promise<Project> {
    let conn;
    try {
      conn = await pool.getConnection();
      
      // ID 생성
      const id = Date.now().toString();
      
      await conn.query(
        'INSERT INTO projects (id, name, description, color) VALUES (?, ?, ?, ?)',
        [id, projectData.name, projectData.description || null, projectData.color]
      );
      
      return {
        id,
        ...projectData
      };
    } catch (error) {
      console.error('Project.create error:', error);
      throw error;
    } finally {
      if (conn) conn.release();
    }
  }
  
  static async update(id: string, projectData: Omit<Project, 'id' | 'created_at' | 'updated_at'>): Promise<Project | null> {
    let conn;
    try {
      conn = await pool.getConnection();
      
      // 프로젝트 존재 확인
      const existingProject = await this.findById(id);
      if (!existingProject) {
        return null;
      }
      
      // 업데이트 쿼리 실행
      await conn.query(
        'UPDATE projects SET name = ?, description = ?, color = ? WHERE id = ?',
        [projectData.name, projectData.description || null, projectData.color, id]
      );
      
      return {
        id,
        ...projectData
      };
    } catch (error) {
      console.error('Project.update error:', error);
      throw error;
    } finally {
      if (conn) conn.release();
    }
  }
  
  static async delete(id: string): Promise<boolean> {
    let conn;
    try {
      conn = await pool.getConnection();
      
      // 프로젝트 존재 확인
      const existingProject = await this.findById(id);
      if (!existingProject) {
        return false;
      }
      
      // 삭제 쿼리 실행
      await conn.query('DELETE FROM projects WHERE id = ?', [id]);
      
      return true;
    } catch (error) {
      console.error('Project.delete error:', error);
      throw error;
    } finally {
      if (conn) conn.release();
    }
  }
}

export default ProjectModel;