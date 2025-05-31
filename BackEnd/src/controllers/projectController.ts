import { Request, Response } from 'express';
import ProjectModel from '../models/Project';

const projectController = {
  // 모든 프로젝트 조회
  async getAllProjects(_req: Request, res: Response): Promise<void> {
    try {
      const projects = await ProjectModel.findAll();
      res.status(200).json({ projects });
    } catch (error) {
      console.error('Get all projects error:', error);
      res.status(500).json({ message: '서버 오류가 발생했습니다.' });
    }
  },
  
  // 특정 프로젝트 조회
  async getProject(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const project = await ProjectModel.findById(id);
      
      if (!project) {
        res.status(404).json({ message: '프로젝트를 찾을 수 없습니다.' });
        return;
      }
      
      res.status(200).json({ project });
    } catch (error) {
      console.error('Get project error:', error);
      res.status(500).json({ message: '서버 오류가 발생했습니다.' });
    }
  },
  
  // 프로젝트 생성
  async createProject(req: Request, res: Response): Promise<void> {
    try {
      const { name, description, color } = req.body;
      
      if (!name || !color) {
        res.status(400).json({ message: '이름과 색상은 필수 입력 항목입니다.' });
        return;
      }
      
      const newProject = await ProjectModel.create({ name, description, color });
      
      res.status(201).json({ project: newProject });
    } catch (error) {
      console.error('Create project error:', error);
      res.status(500).json({ message: '서버 오류가 발생했습니다.' });
    }
  },
  
  // 프로젝트 업데이트
  async updateProject(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { name, description, color } = req.body;
      
      if (!name || !color) {
        res.status(400).json({ message: '이름과 색상은 필수 입력 항목입니다.' });
        return;
      }
      
      const updatedProject = await ProjectModel.update(id, { name, description, color });
      
      if (!updatedProject) {
        res.status(404).json({ message: '프로젝트를 찾을 수 없습니다.' });
        return;
      }
      
      res.status(200).json({ project: updatedProject });
    } catch (error) {
      console.error('Update project error:', error);
      res.status(500).json({ message: '서버 오류가 발생했습니다.' });
    }
  },
  
  // 프로젝트 삭제
  async deleteProject(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      
      const result = await ProjectModel.delete(id);
      
      if (!result) {
        res.status(404).json({ message: '프로젝트를 찾을 수 없습니다.' });
        return;
      }
      
      res.status(200).json({ message: '프로젝트가 성공적으로 삭제되었습니다.' });
    } catch (error) {
      console.error('Delete project error:', error);
      res.status(500).json({ message: '서버 오류가 발생했습니다.' });
    }
  }
};

export default projectController;