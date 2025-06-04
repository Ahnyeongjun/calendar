import { Router } from 'express';
import AuthController from '../controllers/authController';
import auth from '../middleware/auth';

const router = Router();

// 로그인
router.post('/login', AuthController.login);

// 사용자 정보 조회 (인증 필요)
router.get('/me', auth, AuthController.getProfile);
router.get('/profile', auth, AuthController.getProfile);

export default router;
