import { Request, Response, NextFunction } from 'express';
import ProjectController from '../../src/controllers/projectController';
import ProjectModel from '../../src/models/Project';
import ValidationService from '../../src/services/validationService';
import { ValidationError, NotFoundError } from '../../src/middleware/errorHandler';
import { validProjectData, invalidProjectData } from '../fixtures/data';

// Mocks
jest.mock('../../src/models/Project');
jest.mock('../../src/services/validationService');
jest.mock('../../src/services/logger', () => require('../__mocks__/loggerMocks'));

const MockProjectModel = ProjectModel as jest.Mocked<typeof ProjectModel>;
const MockValidationService = ValidationService as jest.Mocked<typeof ValidationService>;

describe('ProjectController', () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: jest.MockedFunction<NextFunction>;
  let jsonSpy: jest.SpyInstance;
  let statusSpy: jest.SpyInstance;

  beforeEach(() => {
    req = {
      params: {},
      body: {},
      query: {}
    };

    jsonSpy = jest.fn();
    statusSpy = jest.fn().mockReturnValue({ json: jsonSpy });
    next = jest.fn();

    res = {
      json: jsonSpy as unknown as Response['json'],
      status: statusSpy as unknown as Response['status']
    };

    jest.clearAllMocks();
  });

  describe('getAllProjects', () => {
    it('모든 프로젝트를 성공적으로 반환해야 한다', async () => {
      const mockProjects = [
        {
          id: 'project-1',
          name: 'Project 1',
          description: 'Description 1',
          color: '#FF0000',
          userId: 'user-1',
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: 'project-2',
          name: 'Project 2',
          description: 'Description 2',
          color: '#00FF00',
          userId: 'user-1',
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];

      MockProjectModel.findAll.mockResolvedValue(mockProjects);

      await ProjectController.getAllProjects(req as Request, res as Response, next);

      expect(MockProjectModel.findAll).toHaveBeenCalled();
      expect(jsonSpy).toHaveBeenCalledWith({
        success: true,
        projects: mockProjects
      });
    });

    it('빈 프로젝트 배열을 반환해야 한다', async () => {
      MockProjectModel.findAll.mockResolvedValue([]);

      await ProjectController.getAllProjects(req as Request, res as Response, next);

      expect(jsonSpy).toHaveBeenCalledWith({
        success: true,
        projects: []
      });
    });
  });

  describe('getProject', () => {
    beforeEach(() => {
      req.params = { id: 'project-id' };
    });

    it('존재하는 프로젝트를 성공적으로 반환해야 한다', async () => {
      const mockProject = {
        id: 'project-id',
        name: 'Test Project',
        description: 'Test Description',
        color: '#FF0000',
        userId: 'user-id',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      MockValidationService.validateId.mockReturnValue('project-id');
      MockProjectModel.findById.mockResolvedValue(mockProject);

      await ProjectController.getProject(req as Request, res as Response, next);

      expect(MockValidationService.validateId).toHaveBeenCalledWith('project-id');
      expect(MockProjectModel.findById).toHaveBeenCalledWith('project-id');
      expect(jsonSpy).toHaveBeenCalledWith({
        success: true,
        project: mockProject
      });
    });

    it('존재하지 않는 프로젝트에 대해 NotFoundError를 발생시켜야 한다', async () => {
      MockValidationService.validateId.mockReturnValue('project-id');
      MockProjectModel.findById.mockResolvedValue(null);

      await expect(ProjectController.getProject(req as Request, res as Response, next)).rejects.toThrow(
        NotFoundError
      );

      expect(MockProjectModel.findById).toHaveBeenCalledWith('project-id');
    });

    it('잘못된 ID에 대해 ValidationError를 발생시켜야 한다', async () => {
      const validationError = new ValidationError('잘못된 ID입니다.');
      MockValidationService.validateId.mockImplementation(() => {
        throw validationError;
      });

      await expect(ProjectController.getProject(req as Request, res as Response, next)).rejects.toThrow(
        ValidationError
      );
    });
  });

  describe('createProject', () => {
    it('유효한 데이터로 프로젝트를 성공적으로 생성해야 한다', async () => {
      const mockProject = {
        id: 'new-project-id',
        name: validProjectData.name,
        description: validProjectData.description,
        color: validProjectData.color,
        userId: validProjectData.userId,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const chainedJson = jest.fn();
      statusSpy.mockReturnValue({ json: chainedJson });

      MockValidationService.validateCreateProjectData.mockReturnValue(validProjectData);
      MockProjectModel.findByNameCaseInsensitive.mockResolvedValue(null);
      MockProjectModel.create.mockResolvedValue(mockProject);

      req.body = validProjectData;

      await ProjectController.createProject(req as Request, res as Response, next);

      expect(MockValidationService.validateCreateProjectData).toHaveBeenCalledWith(validProjectData);
      expect(MockProjectModel.findByNameCaseInsensitive).toHaveBeenCalledWith(validProjectData.name.trim());
      expect(MockProjectModel.create).toHaveBeenCalledWith({
        name: validProjectData.name.trim(),
        description: validProjectData.description,
        color: validProjectData.color,
        userId: validProjectData.userId
      });

      expect(statusSpy).toHaveBeenCalledWith(201);
      expect(chainedJson).toHaveBeenCalledWith({
        success: true,
        project: mockProject
      });
    });

    it('중복된 프로젝트명에 대해 ValidationError를 발생시켜야 한다', async () => {
      const existingProject = {
        id: 'existing-id',
        name: validProjectData.name,
        description: 'Description',
        color: '#FF0000',
        userId: 'user-id',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      MockValidationService.validateCreateProjectData.mockReturnValue(validProjectData);
      MockProjectModel.findByNameCaseInsensitive.mockResolvedValue(existingProject);

      req.body = validProjectData;

      await expect(ProjectController.createProject(req as Request, res as Response, next)).rejects.toThrow(
        '이미 존재하는 프로젝트 이름입니다.'
      );

      expect(MockProjectModel.create).not.toHaveBeenCalled();
    });

    it('빈 설명이 null로 처리되어야 한다', async () => {
      const dataWithEmptyDescription = {
        ...validProjectData,
        description: '   '
      };

      const mockProject = {
        id: 'new-project-id',
        name: validProjectData.name,
        description: null,
        color: validProjectData.color,
        userId: validProjectData.userId,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const chainedJson = jest.fn();
      statusSpy.mockReturnValue({ json: chainedJson });

      MockValidationService.validateCreateProjectData.mockReturnValue(dataWithEmptyDescription);
      MockProjectModel.findByNameCaseInsensitive.mockResolvedValue(null);
      MockProjectModel.create.mockResolvedValue(mockProject);

      req.body = dataWithEmptyDescription;

      await ProjectController.createProject(req as Request, res as Response, next);

      expect(MockProjectModel.create).toHaveBeenCalledWith({
        name: validProjectData.name.trim(),
        description: null,
        color: validProjectData.color,
        userId: validProjectData.userId
      });
    });

    it('ValidationService에서 에러가 발생하면 에러를 전파해야 한다', async () => {
      const validationError = new ValidationError('Validation failed');

      MockValidationService.validateCreateProjectData.mockImplementation(() => {
        throw validationError;
      });

      req.body = invalidProjectData.emptyName;

      await expect(ProjectController.createProject(req as Request, res as Response, next)).rejects.toThrow(
        ValidationError
      );

      expect(MockProjectModel.create).not.toHaveBeenCalled();
    });
  });

  describe('updateProject', () => {
    beforeEach(() => {
      req.params = { id: 'project-id' };
    });

    it('프로젝트를 성공적으로 업데이트해야 한다', async () => {
      const updateData = {
        name: 'Updated Project',
        description: 'Updated Description',
        color: '#00FF00'
      };

      const existingProject = {
        id: 'project-id',
        name: 'Original Project',
        description: 'Original Description',
        color: '#FF0000',
        userId: 'user-id',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const updatedProject = {
        ...existingProject,
        ...updateData
      };

      MockValidationService.validateId.mockReturnValue('project-id');
      MockValidationService.validateUpdateProjectData.mockReturnValue(updateData);
      MockProjectModel.findById.mockResolvedValue(existingProject);
      MockProjectModel.findByNameCaseInsensitive.mockResolvedValue(null);
      MockProjectModel.update.mockResolvedValue(updatedProject);

      req.body = updateData;

      await ProjectController.updateProject(req as Request, res as Response, next);

      expect(MockValidationService.validateId).toHaveBeenCalledWith('project-id');
      expect(MockValidationService.validateUpdateProjectData).toHaveBeenCalledWith(updateData);
      expect(MockProjectModel.findById).toHaveBeenCalledWith('project-id');
      expect(MockProjectModel.update).toHaveBeenCalledWith('project-id', {
        name: updateData.name.trim(),
        description: updateData.description,
        color: updateData.color
      });

      expect(jsonSpy).toHaveBeenCalledWith({
        success: true,
        project: updatedProject
      });
    });

    it('존재하지 않는 프로젝트 업데이트 시 NotFoundError를 발생시켜야 한다', async () => {
      MockValidationService.validateId.mockReturnValue('project-id');
      MockProjectModel.findById.mockResolvedValue(null);

      req.body = { name: 'Updated Project' };

      await expect(ProjectController.updateProject(req as Request, res as Response, next)).rejects.toThrow(
        NotFoundError
      );

      expect(MockProjectModel.update).not.toHaveBeenCalled();
    });

    it('다른 프로젝트와 이름이 중복되는 경우 ValidationError를 발생시켜야 한다', async () => {
      const existingProject = {
        id: 'project-id',
        name: 'Original Project',
        description: 'Description',
        color: '#FF0000',
        userId: 'user-id',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const duplicateProject = {
        id: 'other-project-id',
        name: 'Duplicate Name',
        description: 'Description',
        color: '#00FF00',
        userId: 'user-id',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const updateData = { name: 'Duplicate Name' };

      MockValidationService.validateId.mockReturnValue('project-id');
      MockValidationService.validateUpdateProjectData.mockReturnValue(updateData);
      MockProjectModel.findById.mockResolvedValue(existingProject);
      MockProjectModel.findByNameCaseInsensitive.mockResolvedValue(duplicateProject);

      req.body = updateData;

      await expect(ProjectController.updateProject(req as Request, res as Response, next)).rejects.toThrow(
        '이미 존재하는 프로젝트 이름입니다.'
      );

      expect(MockProjectModel.update).not.toHaveBeenCalled();
    });

    it('같은 프로젝트의 이름을 동일하게 유지하는 것은 허용되어야 한다', async () => {
      const existingProject = {
        id: 'project-id',
        name: 'Project Name',
        description: 'Description',
        color: '#FF0000',
        userId: 'user-id',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const updateData = { name: 'Project Name', color: '#00FF00' };

      MockValidationService.validateId.mockReturnValue('project-id');
      MockValidationService.validateUpdateProjectData.mockReturnValue(updateData);
      MockProjectModel.findById.mockResolvedValue(existingProject);
      MockProjectModel.update.mockResolvedValue({ ...existingProject, color: '#00FF00' });

      req.body = updateData;

      await ProjectController.updateProject(req as Request, res as Response, next);

      expect(MockProjectModel.update).toHaveBeenCalled();
      expect(jsonSpy).toHaveBeenCalled();
    });
  });

  describe('deleteProject', () => {
    beforeEach(() => {
      req.params = { id: 'project-id' };
    });

    it('프로젝트를 성공적으로 삭제해야 한다', async () => {
      const existingProject = {
        id: 'project-id',
        name: 'Test Project',
        description: 'Description',
        color: '#FF0000',
        userId: 'user-id',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      MockValidationService.validateId.mockReturnValue('project-id');
      MockProjectModel.findById.mockResolvedValue(existingProject);
      MockProjectModel.delete.mockResolvedValue(true);

      await ProjectController.deleteProject(req as Request, res as Response, next);

      expect(MockValidationService.validateId).toHaveBeenCalledWith('project-id');
      expect(MockProjectModel.findById).toHaveBeenCalledWith('project-id');
      expect(MockProjectModel.delete).toHaveBeenCalledWith('project-id');

      expect(jsonSpy).toHaveBeenCalledWith({
        success: true,
        message: '프로젝트가 삭제되었습니다.'
      });
    });

    it('존재하지 않는 프로젝트 삭제 시 NotFoundError를 발생시켜야 한다', async () => {
      MockValidationService.validateId.mockReturnValue('project-id');
      MockProjectModel.findById.mockResolvedValue(null);

      await expect(ProjectController.deleteProject(req as Request, res as Response, next)).rejects.toThrow(
        NotFoundError
      );

      expect(MockProjectModel.delete).not.toHaveBeenCalled();
    });

    it('보호된 프로젝트 삭제 시 ValidationError를 발생시켜야 한다', async () => {
      const protectedIds = ['personal', 'work', 'study'];

      for (const protectedId of protectedIds) {
        req.params = { id: protectedId };

        const existingProject = {
          id: protectedId,
          name: 'Protected Project',
          description: 'Description',
          color: '#FF0000',
          userId: 'user-id',
          createdAt: new Date(),
          updatedAt: new Date()
        };

        MockValidationService.validateId.mockReturnValue(protectedId);
        MockProjectModel.findById.mockResolvedValue(existingProject);

        await expect(ProjectController.deleteProject(req as Request, res as Response, next)).rejects.toThrow(
          '기본 프로젝트는 삭제할 수 없습니다.'
        );

        expect(MockProjectModel.delete).not.toHaveBeenCalled();
        jest.clearAllMocks();
      }
    });

    it('ModelDelete가 false를 반환하면 NotFoundError를 발생시켜야 한다', async () => {
      const existingProject = {
        id: 'project-id',
        name: 'Test Project',
        description: 'Description',
        color: '#FF0000',
        userId: 'user-id',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      MockValidationService.validateId.mockReturnValue('project-id');
      MockProjectModel.findById.mockResolvedValue(existingProject);
      MockProjectModel.delete.mockResolvedValue(false);

      await expect(ProjectController.deleteProject(req as Request, res as Response, next)).rejects.toThrow(
        NotFoundError
      );
    });
  });

  describe('Error Handling', () => {
    it('Model에서 데이터베이스 에러가 발생하면 에러를 전파해야 한다', async () => {
      const databaseError = new Error('Database connection failed');

      MockProjectModel.findAll.mockRejectedValue(databaseError);

      await expect(ProjectController.getAllProjects(req as Request, res as Response, next)).rejects.toThrow(
        'Database connection failed'
      );
    });

    it('ValidationService에서 에러가 발생하면 에러를 전파해야 한다', async () => {
      const validationError = new ValidationError('Invalid input');

      req.params = { id: 'invalid-id' };
      MockValidationService.validateId.mockImplementation(() => {
        throw validationError;
      });

      await expect(ProjectController.getProject(req as Request, res as Response, next)).rejects.toThrow(
        ValidationError
      );
    });
  });
});
