import { Router } from 'express';
import authController from '../controllers/authController';
import auth from '../middleware/auth';

const router = Router();

// 로그인
router.post('/login', authController.login);

// 사용자 정보 조회 (인증 필요)
router.get('/me', auth, authController.getProfile);

export default router;