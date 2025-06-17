import { Request, Response } from 'express';
import ProjectModel from '../models/Project';
import { Sentry } from '../config/sentry';
import { CacheManager, createCacheKey, cached } from '../config/cache';

const projectController = {
  // 모든 프로젝트 조회
  async getAllProjects(req: Request, res: Response): Promise<void> {
    try {
      const cacheKey = createCacheKey('projects', 'all');
      
      // 캐시에서 먼저 확인
      const cachedProjects = await CacheManager.get(cacheKey);
      if (cachedProjects) {
        res.set('X-Cache', 'HIT');
        res.status(200).json({ projects: cachedProjects });
        return;
      }
      
      const projects = await ProjectModel.findAll();
      
      // 결과를 캐시에 저장 (10분)
      await CacheManager.set(cacheKey, projects, { ttl: 600, tags: ['projects'] });
      
      res.set('X-Cache', 'MISS');
      res.status(200).json({ projects });
    } catch (error) {
      console.error('Get all projects error:', error);
      
      Sentry.withScope((scope) => {
        scope.setTag('controller', 'project');
        scope.setTag('action', 'getAllProjects');
        scope.setLevel('error');
        Sentry.captureException(error as Error);
      });
      
      res.status(500).json({ 
        success: false,
        message: '서버 오류가 발생했습니다.',
        timestamp: new Date().toISOString()
      });
    }
  },
  
  // 특정 프로젝트 조회
  async getProject(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const cacheKey = createCacheKey('projects', 'single', id);
      
      // 캐시에서 먼저 확인
      const cachedProject = await CacheManager.get(cacheKey);
      if (cachedProject) {
        res.set('X-Cache', 'HIT');
        res.status(200).json({ project: cachedProject });
        return;
      }
      
      const project = await ProjectModel.findById(id);
      
      if (!project) {
        res.status(404).json({ 
          success: false,
          message: '프로젝트를 찾을 수 없습니다.',
          timestamp: new Date().toISOString()
        });
        return;
      }
      
      // 결과를 캐시에 저장 (15분)
      await CacheManager.set(cacheKey, project, { ttl: 900, tags: ['projects'] });
      
      res.set('X-Cache', 'MISS');
      res.status(200).json({ project });
    } catch (error) {
      console.error('Get project error:', error);
      
      Sentry.withScope((scope) => {
        scope.setTag('controller', 'project');
        scope.setTag('action', 'getProject');
        scope.setContext('request', { projectId: req.params.id });
        scope.setLevel('error');
        Sentry.captureException(error as Error);
      });
      
      res.status(500).json({ 
        success: false,
        message: '서버 오류가 발생했습니다.',
        timestamp: new Date().toISOString()
      });
    }
  },
  
  // 프로젝트 생성
  async createProject(req: Request, res: Response): Promise<void> {
    try {
      const { name, description, color } = req.body;
      
      if (!name || !color) {
        res.status(400).json({ 
          success: false,
          message: '이름과 색상은 필수 입력 항목입니다.',
          timestamp: new Date().toISOString()
        });
        return;
      }
      
      const newProject = await ProjectModel.create({ name, description, color });
      
      // 캐시 무효화 (새 프로젝트 추가되었으므로)
      await CacheManager.invalidateByTag('projects');
      
      Sentry.addBreadcrumb({
        message: 'Project created',
        level: 'info',
        data: { projectId: newProject.id, name }
      });
      
      res.status(201).json({ 
        success: true,
        project: newProject,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Create project error:', error);
      
      Sentry.withScope((scope) => {
        scope.setTag('controller', 'project');
        scope.setTag('action', 'createProject');
        scope.setContext('request', { body: req.body });
        scope.setLevel('error');
        Sentry.captureException(error as Error);
      });
      
      res.status(500).json({ 
        success: false,
        message: '서버 오류가 발생했습니다.',
        timestamp: new Date().toISOString()
      });
    }
  },
  
  // 프로젝트 업데이트
  async updateProject(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { name, description, color } = req.body;
      
      if (!name || !color) {
        res.status(400).json({ 
          success: false,
          message: '이름과 색상은 필수 입력 항목입니다.',
          timestamp: new Date().toISOString()
        });
        return;
      }
      
      const updatedProject = await ProjectModel.update(id, { name, description, color });
      
      if (!updatedProject) {
        res.status(404).json({ 
          success: false,
          message: '프로젝트를 찾을 수 없습니다.',
          timestamp: new Date().toISOString()
        });
        return;
      }
      
      // 캐시 무효화
      await CacheManager.invalidateByTag('projects');
      await CacheManager.del(createCacheKey('projects', 'single', id));
      
      Sentry.addBreadcrumb({
        message: 'Project updated',
        level: 'info',
        data: { projectId: id, name }
      });
      
      res.status(200).json({ 
        success: true,
        project: updatedProject,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Update project error:', error);
      
      Sentry.withScope((scope) => {
        scope.setTag('controller', 'project');
        scope.setTag('action', 'updateProject');
        scope.setContext('request', { projectId: req.params.id, body: req.body });
        scope.setLevel('error');
        Sentry.captureException(error as Error);
      });
      
      res.status(500).json({ 
        success: false,
        message: '서버 오류가 발생했습니다.',
        timestamp: new Date().toISOString()
      });
    }
  },
  
  // 프로젝트 삭제
  async deleteProject(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      
      const result = await ProjectModel.delete(id);
      
      if (!result) {
        res.status(404).json({ 
          success: false,
          message: '프로젝트를 찾을 수 없습니다.',
          timestamp: new Date().toISOString()
        });
        return;
      }
      
      // 캐시 무효화
      await CacheManager.invalidateByTag('projects');
      await CacheManager.del(createCacheKey('projects', 'single', id));
      
      Sentry.addBreadcrumb({
        message: 'Project deleted',
        level: 'info',
        data: { projectId: id }
      });
      
      res.status(200).json({ 
        success: true,
        message: '프로젝트가 성공적으로 삭제되었습니다.',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Delete project error:', error);
      
      Sentry.withScope((scope) => {
        scope.setTag('controller', 'project');
        scope.setTag('action', 'deleteProject');
        scope.setContext('request', { projectId: req.params.id });
        scope.setLevel('error');
        Sentry.captureException(error as Error);
      });
      
      res.status(500).json({ 
        success: false,
        message: '서버 오류가 발생했습니다.',
        timestamp: new Date().toISOString()
      });
    }
  }
};

export default projectController;