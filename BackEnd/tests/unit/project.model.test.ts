import ProjectModel, { ProjectCreateInput, ProjectUpdateInput } from '../../src/models/Project';
import { TestDatabase } from '../helpers/database';
import { validProjectData, invalidProjectData } from '../fixtures/data';
import { Project } from '@prisma/client';

jest.mock('../../src/config/prisma', () => require('../__mocks__/prismaMocks'));
jest.mock('../../src/services/logger', () => require('../__mocks__/loggerMocks'));

describe('ProjectModel', () => {
  let prisma: any;

  beforeAll(async () => {
    prisma = await TestDatabase.setup();
  });

  beforeEach(async () => {
    await TestDatabase.cleanup();
  });

  afterAll(async () => {
    await TestDatabase.teardown();
  });

  describe('create', () => {
    it('새 프로젝트를 성공적으로 생성해야 한다', async () => {
      const project = await ProjectModel.create(validProjectData as ProjectCreateInput);

      expect(project).toBeDefined();
      expect(project.id).toBeDefined();
      expect(project.name).toBe(validProjectData.name);
      expect(project.description).toBe(validProjectData.description);
      expect(project.color).toBe(validProjectData.color);
      expect(project.userId).toBe(validProjectData.userId);
      expect(project.createdAt).toBeDefined();
      expect(project.updatedAt).toBeDefined();
    });

    it('필수 필드만으로 프로젝트를 생성해야 한다', async () => {
      const minimalProjectData: ProjectCreateInput = {
        name: 'Minimal Project',
        description: null,
        color: '#FF0000',
        userId: 'user-id'
      };

      const project = await ProjectModel.create(minimalProjectData);

      expect(project).toBeDefined();
      expect(project.name).toBe(minimalProjectData.name);
      expect(project.description).toBeNull();
      expect(project.color).toBe(minimalProjectData.color);
    });

    it('중복된 프로젝트명으로 생성 시 에러를 발생시켜야 한다', async () => {
      await ProjectModel.create(validProjectData as ProjectCreateInput);

      await expect(ProjectModel.create(validProjectData as ProjectCreateInput)).rejects.toThrow();
    });
  });

  describe('findAll', () => {
    it('모든 프로젝트를 이름 순으로 반환해야 한다', async () => {
      // 여러 프로젝트 생성 (알파벳 역순으로)
      const projectZ = await ProjectModel.create({ ...validProjectData, name: 'Z Project' } as ProjectCreateInput);
      const projectA = await ProjectModel.create({ ...validProjectData, name: 'A Project', userId: 'user-2' } as ProjectCreateInput);
      const projectM = await ProjectModel.create({ ...validProjectData, name: 'M Project', userId: 'user-3' } as ProjectCreateInput);

      const projects = await ProjectModel.findAll();

      expect(projects).toHaveLength(3);
      expect(projects[0].name).toBe('A Project');
      expect(projects[1].name).toBe('M Project');
      expect(projects[2].name).toBe('Z Project');
    });

    it('빈 배열을 반환해야 한다 (프로젝트가 없는 경우)', async () => {
      const projects = await ProjectModel.findAll();
      expect(projects).toHaveLength(0);
    });
  });

  describe('findById', () => {
    it('존재하는 프로젝트 ID로 조회 시 프로젝트 정보를 반환해야 한다', async () => {
      const createdProject = await ProjectModel.create(validProjectData as ProjectCreateInput);
      const foundProject = await ProjectModel.findById(createdProject.id);

      expect(foundProject).toBeDefined();
      expect(foundProject!.id).toBe(createdProject.id);
      expect(foundProject!.name).toBe(createdProject.name);
      expect(foundProject!.description).toBe(createdProject.description);
      expect(foundProject!.color).toBe(createdProject.color);
      expect(foundProject!.userId).toBe(createdProject.userId);
    });

    it('존재하지 않는 프로젝트 ID로 조회 시 null을 반환해야 한다', async () => {
      const foundProject = await ProjectModel.findById('non-existent-id');
      expect(foundProject).toBeNull();
    });
  });

  describe('findByName', () => {
    it('존재하는 프로젝트명으로 조회 시 프로젝트 정보를 반환해야 한다', async () => {
      await ProjectModel.create(validProjectData as ProjectCreateInput);
      const foundProject = await ProjectModel.findByName(validProjectData.name);

      expect(foundProject).toBeDefined();
      expect(foundProject!.name).toBe(validProjectData.name);
    });

    it('존재하지 않는 프로젝트명으로 조회 시 null을 반환해야 한다', async () => {
      const foundProject = await ProjectModel.findByName('non-existent-project');
      expect(foundProject).toBeNull();
    });

    it('대소문자를 구분하여 조회해야 한다', async () => {
      await ProjectModel.create(validProjectData as ProjectCreateInput);
      const foundProject = await ProjectModel.findByName(validProjectData.name.toUpperCase());

      expect(foundProject).toBeNull();
    });
  });

  describe('findByNameCaseInsensitive', () => {
    beforeEach(async () => {
      await ProjectModel.create({ ...validProjectData, name: 'Test Project' } as ProjectCreateInput);
    });

    it('대소문자 구분 없이 프로젝트를 찾아야 한다', async () => {
      const testCases = [
        'Test Project',
        'test project',
        'TEST PROJECT',
        'Test PROJECT',
        'tEsT pRoJeCt'
      ];

      for (const testName of testCases) {
        const foundProject = await ProjectModel.findByNameCaseInsensitive(testName);
        expect(foundProject).toBeDefined();
        expect(foundProject!.name).toBe('Test Project');
      }
    });

    it('존재하지 않는 프로젝트명에 대해 null을 반환해야 한다', async () => {
      const foundProject = await ProjectModel.findByNameCaseInsensitive('Non Existent Project');
      expect(foundProject).toBeNull();
    });

    it('Raw Query 실패 시 JavaScript fallback을 사용해야 한다', async () => {
      // Raw query를 실패하게 만들기 위해 prisma.$queryRaw를 mock
      const originalQueryRaw = prisma.$queryRaw;
      prisma.$queryRaw = jest.fn().mockRejectedValue(new Error('Raw query failed'));

      const foundProject = await ProjectModel.findByNameCaseInsensitive('test project');

      expect(foundProject).toBeDefined();
      expect(foundProject!.name).toBe('Test Project');

      // 원래 함수 복원
      prisma.$queryRaw = originalQueryRaw;
    });
  });

  describe('update', () => {
    it('프로젝트 정보를 성공적으로 업데이트해야 한다', async () => {
      const createdProject = await ProjectModel.create(validProjectData as ProjectCreateInput);
      
      const updateData: ProjectUpdateInput = {
        name: 'Updated Project',
        description: 'Updated Description',
        color: '#00FF00'
      };

      const updatedProject = await ProjectModel.update(createdProject.id, updateData);

      expect(updatedProject).toBeDefined();
      expect(updatedProject!.id).toBe(createdProject.id);
      expect(updatedProject!.name).toBe(updateData.name);
      expect(updatedProject!.description).toBe(updateData.description);
      expect(updatedProject!.color).toBe(updateData.color);
      expect(updatedProject!.userId).toBe(createdProject.userId); // 변경되지 않음
    });

    it('부분 업데이트를 성공적으로 수행해야 한다', async () => {
      const createdProject = await ProjectModel.create(validProjectData as ProjectCreateInput);
      
      const partialUpdateData: ProjectUpdateInput = {
        name: 'Partially Updated Project'
      };

      const updatedProject = await ProjectModel.update(createdProject.id, partialUpdateData);

      expect(updatedProject).toBeDefined();
      expect(updatedProject!.name).toBe(partialUpdateData.name);
      expect(updatedProject!.description).toBe(createdProject.description); // 기존 값 유지
      expect(updatedProject!.color).toBe(createdProject.color); // 기존 값 유지
    });

    it('존재하지 않는 프로젝트 ID로 업데이트 시 null을 반환해야 한다', async () => {
      const updateData: ProjectUpdateInput = {
        name: 'Updated Project'
      };

      const result = await ProjectModel.update('non-existent-id', updateData);
      expect(result).toBeNull();
    });

    it('빈 업데이트 데이터로도 작동해야 한다', async () => {
      const createdProject = await ProjectModel.create(validProjectData as ProjectCreateInput);
      
      const updatedProject = await ProjectModel.update(createdProject.id, {});

      expect(updatedProject).toBeDefined();
      expect(updatedProject!.name).toBe(createdProject.name);
      expect(updatedProject!.description).toBe(createdProject.description);
      expect(updatedProject!.color).toBe(createdProject.color);
    });
  });

  describe('delete', () => {
    it('프로젝트를 성공적으로 삭제해야 한다', async () => {
      const createdProject = await ProjectModel.create(validProjectData as ProjectCreateInput);

      const result = await ProjectModel.delete(createdProject.id);
      expect(result).toBe(true);

      // 삭제 확인
      const foundProject = await ProjectModel.findById(createdProject.id);
      expect(foundProject).toBeNull();
    });

    it('존재하지 않는 프로젝트 ID로 삭제 시 false를 반환해야 한다', async () => {
      const result = await ProjectModel.delete('non-existent-id');
      expect(result).toBe(false);
    });

    it('이미 삭제된 프로젝트를 다시 삭제하려고 하면 false를 반환해야 한다', async () => {
      const createdProject = await ProjectModel.create(validProjectData as ProjectCreateInput);

      // 첫 번째 삭제
      const firstDeleteResult = await ProjectModel.delete(createdProject.id);
      expect(firstDeleteResult).toBe(true);

      // 두 번째 삭제 시도
      const secondDeleteResult = await ProjectModel.delete(createdProject.id);
      expect(secondDeleteResult).toBe(false);
    });
  });

  describe('Database Operations', () => {
    it('대량의 프로젝트 생성과 조회가 정상 작동해야 한다', async () => {
      const projects: Project[] = [];
      
      // 10개의 프로젝트 생성
      for (let i = 0; i < 10; i++) {
        const project = await ProjectModel.create({
          ...validProjectData,
          name: `Project ${i.toString().padStart(2, '0')}`,
          userId: `user-${i}`
        } as ProjectCreateInput);
        projects.push(project);
      }

      // 모든 프로젝트 조회
      const allProjects = await ProjectModel.findAll();
      expect(allProjects).toHaveLength(10);

      // 이름 순으로 정렬되어 있는지 확인
      for (let i = 0; i < 9; i++) {
        expect(allProjects[i].name <= allProjects[i + 1].name).toBe(true);
      }

      // 각 프로젝트 개별 조회
      for (const project of projects) {
        const foundProject = await ProjectModel.findById(project.id);
        expect(foundProject).toBeDefined();
        expect(foundProject!.name).toBe(project.name);
      }
    });

    it('복합 작업이 정상 작동해야 한다', async () => {
      // 프로젝트 생성
      const project = await ProjectModel.create(validProjectData as ProjectCreateInput);

      // 이름으로 검색
      const foundByName = await ProjectModel.findByName(project.name);
      expect(foundByName).toBeDefined();
      expect(foundByName!.id).toBe(project.id);

      // 대소문자 구분 없이 검색
      const foundCaseInsensitive = await ProjectModel.findByNameCaseInsensitive(project.name.toUpperCase());
      expect(foundCaseInsensitive).toBeDefined();
      expect(foundCaseInsensitive!.id).toBe(project.id);

      // 업데이트
      const updatedProject = await ProjectModel.update(project.id, {
        name: 'Updated Project Name',
        description: 'Updated Description'
      });
      expect(updatedProject).toBeDefined();
      expect(updatedProject!.name).toBe('Updated Project Name');

      // 업데이트 후 검색 (기존 이름으로는 찾을 수 없어야 함)
      const notFoundByOldName = await ProjectModel.findByName(project.name);
      expect(notFoundByOldName).toBeNull();

      // 새 이름으로는 찾을 수 있어야 함
      const foundByNewName = await ProjectModel.findByName('Updated Project Name');
      expect(foundByNewName).toBeDefined();

      // 삭제
      const deleteResult = await ProjectModel.delete(project.id);
      expect(deleteResult).toBe(true);

      // 삭제 후 검색 (찾을 수 없어야 함)
      const notFoundAfterDelete = await ProjectModel.findById(project.id);
      expect(notFoundAfterDelete).toBeNull();
    });

    it('동시 접근 상황을 시뮬레이션해야 한다', async () => {
      // 동일한 프로젝트명으로 동시에 생성 시도
      const promises = [
        ProjectModel.create({ ...validProjectData, name: 'Concurrent Project', userId: 'user-1' } as ProjectCreateInput),
        ProjectModel.create({ ...validProjectData, name: 'Concurrent Project', userId: 'user-2' } as ProjectCreateInput)
      ];

      // 하나만 성공하고 하나는 실패해야 함
      const results = await Promise.allSettled(promises);
      const successful = results.filter(result => result.status === 'fulfilled');
      const failed = results.filter(result => result.status === 'rejected');

      expect(successful).toHaveLength(1);
      expect(failed).toHaveLength(1);
    });

    it('트랜잭션처럼 작동하는 업데이트가 정상 작동해야 한다', async () => {
      const project1 = await ProjectModel.create({ ...validProjectData, name: 'Project 1' } as ProjectCreateInput);
      const project2 = await ProjectModel.create({ ...validProjectData, name: 'Project 2', userId: 'user-2' } as ProjectCreateInput);

      // Project 1을 업데이트
      const updatedProject1 = await ProjectModel.update(project1.id, {
        name: 'Updated Project 1',
        color: '#00FF00'
      });

      expect(updatedProject1).toBeDefined();
      expect(updatedProject1!.name).toBe('Updated Project 1');
      expect(updatedProject1!.color).toBe('#00FF00');

      // Project 2는 영향받지 않아야 함
      const unchangedProject2 = await ProjectModel.findById(project2.id);
      expect(unchangedProject2).toBeDefined();
      expect(unchangedProject2!.name).toBe('Project 2');
      expect(unchangedProject2!.color).toBe(validProjectData.color);
    });
  });

  describe('Error Handling', () => {
    it('데이터베이스 연결 오류를 적절히 처리해야 한다', async () => {
      // Prisma 메서드를 실패하게 만들기
      const originalCreate = prisma.project.create;
      prisma.project.create = jest.fn().mockRejectedValue(new Error('Database connection failed'));

      await expect(ProjectModel.create(validProjectData as ProjectCreateInput)).rejects.toThrow('Database connection failed');

      // 원래 함수 복원
      prisma.project.create = originalCreate;
    });

    it('findAll에서 데이터베이스 오류를 적절히 처리해야 한다', async () => {
      const originalFindMany = prisma.project.findMany;
      prisma.project.findMany = jest.fn().mockRejectedValue(new Error('Database error'));

      await expect(ProjectModel.findAll()).rejects.toThrow('Database error');

      prisma.project.findMany = originalFindMany;
    });

    it('update에서 데이터베이스 오류를 적절히 처리해야 한다', async () => {
      const project = await ProjectModel.create(validProjectData as ProjectCreateInput);

      const originalUpdate = prisma.project.update;
      prisma.project.update = jest.fn().mockRejectedValue(new Error('Update failed'));

      await expect(ProjectModel.update(project.id, { name: 'New Name' })).rejects.toThrow('Update failed');

      prisma.project.update = originalUpdate;
    });

    it('delete에서 데이터베이스 오류를 적절히 처리해야 한다', async () => {
      const project = await ProjectModel.create(validProjectData as ProjectCreateInput);

      const originalDelete = prisma.project.delete;
      prisma.project.delete = jest.fn().mockRejectedValue(new Error('Delete failed'));

      await expect(ProjectModel.delete(project.id)).rejects.toThrow('Delete failed');

      prisma.project.delete = originalDelete;
    });
  });

  describe('Edge Cases', () => {
    it('매우 긴 프로젝트명을 처리할 수 있어야 한다', async () => {
      const longName = 'A'.repeat(255); // 255자 프로젝트명
      const projectData: ProjectCreateInput = {
        ...validProjectData,
        name: longName
      } as ProjectCreateInput;

      const project = await ProjectModel.create(projectData);
      expect(project.name).toBe(longName);
    });

    it('특수 문자가 포함된 프로젝트명을 처리할 수 있어야 한다', async () => {
      const specialCharName = '프로젝트 @#$%^&*()';
      const projectData: ProjectCreateInput = {
        ...validProjectData,
        name: specialCharName
      } as ProjectCreateInput;

      const project = await ProjectModel.create(projectData);
      expect(project.name).toBe(specialCharName);

      const foundProject = await ProjectModel.findByName(specialCharName);
      expect(foundProject).toBeDefined();
    });

    it('null 설명을 올바르게 처리해야 한다', async () => {
      const projectData: ProjectCreateInput = {
        ...validProjectData,
        description: null
      } as ProjectCreateInput;

      const project = await ProjectModel.create(projectData);
      expect(project.description).toBeNull();

      const updatedProject = await ProjectModel.update(project.id, {
        description: 'New Description'
      });
      expect(updatedProject!.description).toBe('New Description');

      const revertedProject = await ProjectModel.update(project.id, {
        description: null
      });
      expect(revertedProject!.description).toBeNull();
    });
  });
});
