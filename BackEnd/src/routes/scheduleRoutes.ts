import { Router } from 'express';
import ScheduleController from '../controllers/scheduleController';
import auth from '../middleware/auth';

const router = Router();

// 모든 일정 조회 (필터링 가능)
router.get('/', auth, ScheduleController.getAllSchedules);

// 특정 일정 조회
router.get('/:id', auth, ScheduleController.getSchedule);

// 일정 생성
router.post('/', auth, ScheduleController.createSchedule);

// 일정 업데이트
router.put('/:id', auth, ScheduleController.updateSchedule);

// 일정 삭제
router.delete('/:id', auth, ScheduleController.deleteSchedule);

export default router;
