import { Router } from 'express';
import projectController from '../controllers/projectController';
import auth from '../middleware/auth';

const router = Router();

// 모든 프로젝트 조회
router.get('/', auth, projectController.getAllProjects);

// 특정 프로젝트 조회
router.get('/:id', auth, projectController.getProject);

// 프로젝트 생성
router.post('/', auth, projectController.createProject);

// 프로젝트 업데이트
router.put('/:id', auth, projectController.updateProject);

// 프로젝트 삭제
router.delete('/:id', auth, projectController.deleteProject);

export default router;