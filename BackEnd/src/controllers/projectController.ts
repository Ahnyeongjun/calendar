import { Request, Response } from 'express';
import ProjectModel from '../models/Project';

interface ProjectData {
  name: string;
  description: string;
  color: string;
}

const projectController = {
  async getAllProjects(_req: Request, res: Response): Promise<void> {
    try {
      const projects = await ProjectModel.findAll();
      res.json({ projects });
    } catch (error) {
      res.status(500).json({ message: '서버 오류가 발생했습니다.' });
    }
  },

  async getProject(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const project = await ProjectModel.findById(id);

      if (!project) {
        res.status(404).json({ message: '프로젝트를 찾을 수 없습니다.' });
        return;
      }

      res.json({ project });
    } catch (error) {
      res.status(500).json({ message: '서버 오류가 발생했습니다.' });
    }
  },

  async createProject(req: Request, res: Response): Promise<void> {
    try {
      const { name, description, color }: ProjectData = req.body;

      if (!name || !color) {
        res.status(400).json({ message: '이름과 색상은 필수입니다.' });
        return;
      }

      const newProject = await ProjectModel.create({ name, description, color });

      res.status(201).json({ project: newProject });
    } catch (error) {
      res.status(500).json({ message: '서버 오류가 발생했습니다.' });
    }
  },

  async updateProject(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { name, description, color }: ProjectData = req.body;

      if (!name || !color) {
        res.status(400).json({ message: '이름과 색상은 필수입니다.' });
        return;
      }

      const updatedProject = await ProjectModel.update(id, { name, description, color });

      if (!updatedProject) {
        res.status(404).json({ message: '프로젝트를 찾을 수 없습니다.' });
        return;
      }

      res.json({ project: updatedProject });
    } catch (error) {
      res.status(500).json({ message: '서버 오류가 발생했습니다.' });
    }
  },

  async deleteProject(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const result = await ProjectModel.delete(id);

      if (!result) {
        res.status(404).json({ message: '프로젝트를 찾을 수 없습니다.' });
        return;
      }

      res.json({ message: '프로젝트가 삭제되었습니다.' });
    } catch (error) {
      res.status(500).json({ message: '서버 오류가 발생했습니다.' });
    }
  }
};

export default projectController;
