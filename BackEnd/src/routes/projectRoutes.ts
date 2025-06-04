import { Router } from 'express';
import ProjectController from '../controllers/projectController';
import auth from '../middleware/auth';

const router = Router();

// 모든 프로젝트 조회
router.get('/', auth, ProjectController.getAllProjects);

// 특정 프로젝트 조회
router.get('/:id', auth, ProjectController.getProject);

// 프로젝트 생성
router.post('/', auth, ProjectController.createProject);

// 프로젝트 업데이트
router.put('/:id', auth, ProjectController.updateProject);

// 프로젝트 삭제
router.delete('/:id', auth, ProjectController.deleteProject);

export default router;
