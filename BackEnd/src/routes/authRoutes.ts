import { Router } from 'express';
import AuthController from '../controllers/authController';
import { authMiddleware, optionalAuthMiddleware, refreshTokenIfNeeded } from '../middleware/auth';
import { requestIdMiddleware } from '../middleware/errorHandler';

const router = Router();

// 모든 라우트에 requestId 미들웨어 적용
router.use(requestIdMiddleware);

/**
 * @route   POST /api/auth/register
 * @desc    사용자 회원가입
 * @access  Public
 * @body    { username: string, password: string, name: string }
 */
router.post('/register', AuthController.register);

/**
 * @route   POST /api/auth/login
 * @desc    사용자 로그인
 * @access  Public
 * @body    { username: string, password: string }
 */
router.post('/login', AuthController.login);

/**
 * @route   POST /api/auth/logout
 * @desc    사용자 로그아웃 (클라이언트 토큰 삭제 안내)
 * @access  Private
 */
router.post('/logout', authMiddleware, AuthController.logout);

/**
 * @route   GET /api/auth/me
 * @desc    현재 사용자 프로필 조회
 * @access  Private
 */
router.get('/me', authMiddleware, refreshTokenIfNeeded, AuthController.getProfile);

/**
 * @route   GET /api/auth/profile
 * @desc    현재 사용자 프로필 조회 (별칭)
 * @access  Private
 */
router.get('/profile', authMiddleware, refreshTokenIfNeeded, AuthController.getProfile);

/**
 * @route   PUT /api/auth/profile
 * @desc    사용자 프로필 업데이트
 * @access  Private
 * @body    { name?: string, password?: string }
 */
router.put('/profile', authMiddleware, AuthController.updateProfile);

/**
 * @route   PUT /api/auth/change-password
 * @desc    비밀번호 변경
 * @access  Private
 * @body    { currentPassword: string, newPassword: string }
 */
router.put('/change-password', authMiddleware, AuthController.changePassword);

/**
 * @route   POST /api/auth/refresh
 * @desc    토큰 새로고침
 * @access  Private
 */
router.post('/refresh', authMiddleware, AuthController.refreshToken);

/**
 * @route   DELETE /api/auth/account
 * @desc    계정 삭제
 * @access  Private
 * @body    { password: string }
 */
router.delete('/account', authMiddleware, AuthController.deleteAccount);

export default router;
