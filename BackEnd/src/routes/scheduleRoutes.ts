import { Router } from 'express';
import scheduleController from '../controllers/scheduleController';
import auth from '../middleware/auth';

const router = Router();

// 모든 일정 조회 (필터링 가능)
router.get('/', auth, scheduleController.getAllSchedules);

// 특정 일정 조회
router.get('/:id', auth, scheduleController.getSchedule);

// 일정 생성
router.post('/', auth, scheduleController.createSchedule);

// 일정 업데이트
router.put('/:id', auth, scheduleController.updateSchedule);

// 일정 삭제
router.delete('/:id', auth, scheduleController.deleteSchedule);

export default router;