import { Router } from 'express';
import projectController from '../controllers/projectController';
import auth from '../middleware/auth';
import { projectCacheMiddleware, invalidateCacheMiddleware } from '../middleware/cacheMiddleware';

const router = Router();

// 모든 프로젝트 조회 (캐시 적용)
router.get('/', auth, projectCacheMiddleware, projectController.getAllProjects);

// 특정 프로젝트 조회 (캐시 적용)
router.get('/:id', auth, projectCacheMiddleware, projectController.getProject);

// 프로젝트 생성 (캐시 무효화)
router.post('/', auth, invalidateCacheMiddleware(['projects']), projectController.createProject);

// 프로젝트 업데이트 (캐시 무효화)
router.put('/:id', auth, invalidateCacheMiddleware(['projects']), projectController.updateProject);

// 프로젝트 삭제 (캐시 무효화)
router.delete('/:id', auth, invalidateCacheMiddleware(['projects']), projectController.deleteProject);

export default router;