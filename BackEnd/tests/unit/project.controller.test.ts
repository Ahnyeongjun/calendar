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

// asyncHandler mock 추가
jest.mock('../../src/middleware/errorHandler', () => {
  const actual = jest.requireActual('../../src/middleware/errorHandler');
  return {
    ...actual,
    asyncHandler: (fn: Function) => {
      return async (req: any, res: any, next: any) => {
        try {
          await fn(req, res, next);
        } catch (error) {
          next(error);
        }
      };
    }
  };
});

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

      await ProjectController.getProject(req as Request, res as Response, next);

      expect(next).toHaveBeenCalledWith(expect.any(NotFoundError));
      expect(MockProjectModel.findById).toHaveBeenCalledWith('project-id');
    });

    it('잘못된 ID에 대해 ValidationError를 발생시켜야 한다', async () => {
      const validationError = new ValidationError('잘못된 ID입니다.');
      MockValidationService.validateId.mockImplementation(() => {
        throw validationError;
      });

      await ProjectController.getProject(req as Request, res as Response, next);

      expect(next).toHaveBeenCalledWith(validationError);
    });
  });

  describe('createProject', () => {
    it('유효한 데이터로 프로젝트를 성공적으로 생성해야 한다', async () => {
      const mockProject = {
        id: 'new-project-id',
        name: validProjectData.name,
        description: validProjectData.description,
        color: validProjectData.color,
        userId: 'user-id',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const chainedJson = jest.fn();
      statusSpy.mockReturnValue({ json: chainedJson });

      MockValidationService.validateCreateProjectData.mockReturnValue(validProjectData);
      MockProjectModel.findByNameCaseInsensitive.mockResolvedValue(null);
      MockProjectModel.create.mockResolvedValue(mockProject);

      // userId 포함한 body 설정
      req.body = { ...validProjectData, userId: 'user-id' };

      await ProjectController.createProject(req as Request, res as Response, next);

      expect(MockValidationService.validateCreateProjectData).toHaveBeenCalledWith(req.body);
      expect(MockProjectModel.findByNameCaseInsensitive).toHaveBeenCalledWith(validProjectData.name.trim());
      expect(MockProjectModel.create).toHaveBeenCalledWith({
        name: validProjectData.name.trim(),
        description: validProjectData.description,
        color: validProjectData.color,
        userId: 'user-id',
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

      req.body = { ...validProjectData, userId: 'user-id' };

      await ProjectController.createProject(req as Request, res as Response, next);

      expect(next).toHaveBeenCalledWith(expect.any(ValidationError));
    });

    it('빈 설명이 null로 처리되어야 한다', async () => {
      const mockProject = {
        id: 'new-project-id',
        name: validProjectData.name,
        description: null,
        color: validProjectData.color,
        userId: 'user-id',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const chainedJson = jest.fn();
      statusSpy.mockReturnValue({ json: chainedJson });

      const dataWithEmptyDescription = { ...validProjectData, description: '', userId: 'user-id' };

      MockValidationService.validateCreateProjectData.mockReturnValue(dataWithEmptyDescription);
      MockProjectModel.findByNameCaseInsensitive.mockResolvedValue(null);
      MockProjectModel.create.mockResolvedValue(mockProject);

      req.body = dataWithEmptyDescription;

      await ProjectController.createProject(req as Request, res as Response, next);

      expect(MockProjectModel.create).toHaveBeenCalledWith({
        name: validProjectData.name.trim(),
        description: null,
        color: validProjectData.color,
        userId: 'user-id',
      });

      expect(statusSpy).toHaveBeenCalledWith(201);
      expect(chainedJson).toHaveBeenCalledWith({
        success: true,
        project: mockProject
      });
    });

    it('ValidationService에서 에러가 발생하면 에러를 전파해야 한다', async () => {
      const validationError = new ValidationError('유효하지 않은 데이터입니다.');
      MockValidationService.validateCreateProjectData.mockImplementation(() => {
        throw validationError;
      });

      req.body = invalidProjectData.emptyName;

      await ProjectController.createProject(req as Request, res as Response, next);

      expect(next).toHaveBeenCalledWith(validationError);
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
        ...updateData,
        name: updateData.name.trim()
      };

      MockValidationService.validateId.mockReturnValue('project-id');
      MockValidationService.validateUpdateProjectData.mockReturnValue(updateData);
      MockProjectModel.findById.mockResolvedValue(existingProject);
      MockProjectModel.findByNameCaseInsensitive.mockResolvedValue(null);
      MockProjectModel.update.mockResolvedValue(updatedProject);

      req.body = updateData;

      await ProjectController.updateProject(req as Request, res as Response, next);

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
      MockValidationService.validateUpdateProjectData.mockReturnValue({ name: 'Updated Project' });
      MockProjectModel.findById.mockResolvedValue(null);

      req.body = { name: 'Updated Project' };

      await ProjectController.updateProject(req as Request, res as Response, next);

      expect(next).toHaveBeenCalledWith(expect.any(NotFoundError));
    });

    it('다른 프로젝트와 이름이 중복되는 경우 ValidationError를 발생시켜야 한다', async () => {
      const updateData = { name: 'Duplicate Name' };
      
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

      MockValidationService.validateId.mockReturnValue('project-id');
      MockValidationService.validateUpdateProjectData.mockReturnValue(updateData);
      MockProjectModel.findById.mockResolvedValue(existingProject);
      MockProjectModel.findByNameCaseInsensitive.mockResolvedValue(duplicateProject);

      req.body = updateData;

      await ProjectController.updateProject(req as Request, res as Response, next);

      expect(next).toHaveBeenCalledWith(expect.any(ValidationError));
    });

    it('같은 프로젝트의 이름을 동일하게 유지하는 것은 허용되어야 한다', async () => {
      const updateData = { description: 'Updated Description' };
      
      const existingProject = {
        id: 'project-id',
        name: 'Same Project',
        description: 'Original Description',
        color: '#FF0000',
        userId: 'user-id',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const updatedProject = {
        ...existingProject,
        description: updateData.description
      };

      MockValidationService.validateId.mockReturnValue('project-id');
      MockValidationService.validateUpdateProjectData.mockReturnValue(updateData);
      MockProjectModel.findById.mockResolvedValue(existingProject);
      MockProjectModel.update.mockResolvedValue(updatedProject);

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

      expect(MockProjectModel.delete).toHaveBeenCalledWith('project-id');

      expect(jsonSpy).toHaveBeenCalledWith({
        success: true,
        message: '프로젝트가 삭제되었습니다.'
      });
    });

    it('존재하지 않는 프로젝트 삭제 시 NotFoundError를 발생시켜야 한다', async () => {
      MockValidationService.validateId.mockReturnValue('project-id');
      MockProjectModel.findById.mockResolvedValue(null);

      await ProjectController.deleteProject(req as Request, res as Response, next);

      expect(next).toHaveBeenCalledWith(expect.any(NotFoundError));
    });

    it('보호된 프로젝트 삭제 시 ValidationError를 발생시켜야 한다', async () => {
      const protectedProjects = ['personal', 'work', 'study'];
      
      for (const protectedId of protectedProjects) {
        jest.clearAllMocks();
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

        await ProjectController.deleteProject(req as Request, res as Response, next);

        expect(next).toHaveBeenCalledWith(expect.any(ValidationError));
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

      await ProjectController.deleteProject(req as Request, res as Response, next);

      expect(next).toHaveBeenCalledWith(expect.any(NotFoundError));
    });
  });

  describe('Error Handling', () => {
    it('Model에서 데이터베이스 에러가 발생하면 에러를 전파해야 한다', async () => {
      const databaseError = new Error('Database connection failed');
      MockProjectModel.findAll.mockRejectedValue(databaseError);

      await ProjectController.getAllProjects(req as Request, res as Response, next);

      expect(next).toHaveBeenCalledWith(databaseError);
    });

    it('ValidationService에서 에러가 발생하면 에러를 전파해야 한다', async () => {
      const validationError = new ValidationError('잘못된 ID입니다.');
      req.params = { id: 'invalid-id' };
      
      MockValidationService.validateId.mockImplementation(() => {
        throw validationError;
      });

      await ProjectController.getProject(req as Request, res as Response, next);

      expect(next).toHaveBeenCalledWith(validationError);
    });
  });
});
