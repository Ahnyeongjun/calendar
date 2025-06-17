import { Router } from 'express';
import scheduleController from '../controllers/scheduleController';
import auth from '../middleware/auth';
import { scheduleCacheMiddleware, invalidateCacheMiddleware } from '../middleware/cacheMiddleware';

const router = Router();

// 모든 일정 조회 (필터링 가능, 캐시 적용)
router.get('/', auth, scheduleCacheMiddleware, scheduleController.getAllSchedules);

// 특정 일정 조회 (캐시 적용)
router.get('/:id', auth, scheduleCacheMiddleware, scheduleController.getSchedule);

// 일정 생성 (캐시 무효화)
router.post('/', auth, invalidateCacheMiddleware(['schedules']), scheduleController.createSchedule);

// 일정 업데이트 (캐시 무효화)
router.put('/:id', auth, invalidateCacheMiddleware(['schedules']), scheduleController.updateSchedule);

// 일정 삭제 (캐시 무효화)
router.delete('/:id', auth, invalidateCacheMiddleware(['schedules']), scheduleController.deleteSchedule);

export default router;