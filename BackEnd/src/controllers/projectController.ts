import { Request, Response } from 'express';
import ProjectModel from '../models/Project';
import { asyncHandler, ValidationError, NotFoundError } from '../middleware/errorHandler';
import ValidationService from '../services/validationService';

interface ProjectCreateData {
  name: string;
  description: string | null;
  color: string;
  userId: string;
}

interface ProjectUpdateData {
  name?: string;
  description?: string | null;
  color?: string;
}

class ProjectController {
  // 헬퍼 메서드 - 문자열을 null로 변환
  private static sanitizeStringToNull(value?: string): string | null {
    if (!value || value.trim() === '') {
      return null;
    }
    return value.trim();
  }

  static getAllProjects = asyncHandler(async (_req: Request, res: Response): Promise<void> => {
    const projects = await ProjectModel.findAll();

    res.json({
      success: true,
      projects
    });
  });

  static getProject = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    ValidationService.validateId(req.params.id);

    const project = await ProjectModel.findById(req.params.id);

    if (!project) {
      throw new NotFoundError('프로젝트를 찾을 수 없습니다.');
    }

    res.json({
      success: true,
      project
    });
  });

  static createProject = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { name, description, color, userId } = req.body;

    // 입력 데이터 검증
    ValidationService.validateCreateProjectData({ name, description, color, userId });

    // 중복 이름 검증
    const existingProject = await ProjectModel.findByNameCaseInsensitive(name.trim());
    if (existingProject) {
      throw new ValidationError('이미 존재하는 프로젝트 이름입니다.');
    }

    const projectData: ProjectCreateData = {
      name: name.trim(),
      description: ProjectController.sanitizeStringToNull(description),
      color,
      userId
    };

    const newProject = await ProjectModel.create(projectData);

    res.status(201).json({
      success: true,
      project: newProject
    });
  });

  static updateProject = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    ValidationService.validateId(req.params.id);

    const { id } = req.params;
    const { name, description, color } = req.body;

    // 입력 데이터 검증
    ValidationService.validateUpdateProjectData({ name, description, color });

    // 프로젝트 존재 확인
    const existingProject = await ProjectModel.findById(id);
    if (!existingProject) {
      throw new NotFoundError('프로젝트를 찾을 수 없습니다.');
    }

    // 이름 중복 검증 (다른 프로젝트와)
    if (name && name.trim() !== existingProject.name) {
      const duplicateProject = await ProjectModel.findByNameCaseInsensitive(name.trim());
      if (duplicateProject && duplicateProject.id !== id) {
        throw new ValidationError('이미 존재하는 프로젝트 이름입니다.');
      }
    }

    const updateData: ProjectUpdateData = {};
    if (name !== undefined) updateData.name = name.trim();
    if (description !== undefined) updateData.description = ProjectController.sanitizeStringToNull(description);
    if (color !== undefined) updateData.color = color;

    const updatedProject = await ProjectModel.update(id, updateData);

    if (!updatedProject) {
      throw new NotFoundError('프로젝트를 찾을 수 없습니다.');
    }

    res.json({
      success: true,
      project: updatedProject
    });
  });

  static deleteProject = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    ValidationService.validateId(req.params.id);

    const { id } = req.params;

    // 프로젝트 존재 확인
    const existingProject = await ProjectModel.findById(id);
    if (!existingProject) {
      throw new NotFoundError('프로젝트를 찾을 수 없습니다.');
    }

    // 기본 프로젝트 삭제 방지
    const protectedProjects = ['personal', 'work', 'study'];
    if (protectedProjects.includes(id)) {
      throw new ValidationError('기본 프로젝트는 삭제할 수 없습니다.');
    }

    const result = await ProjectModel.delete(id);

    if (!result) {
      throw new NotFoundError('프로젝트를 찾을 수 없습니다.');
    }

    res.json({
      success: true,
      message: '프로젝트가 삭제되었습니다.'
    });
  });
}

export default ProjectController;
