import express from 'express';

const router = express.Router();

// 간단한 테스트 라우트들
router.get('/', (req, res) => {
    res.json({
        message: 'Sentry Test Routes',
        available_tests: [
            'GET /test/sentry/simple-error - 간단한 에러 테스트',
            'GET /test/sentry/simple-message - 간단한 메시지 테스트'
        ]
    });
});

// 가장 간단한 에러 테스트
router.get('/simple-error', (req, res) => {
    throw new Error('간단한 테스트 에러입니다!');
});

// 간단한 메시지 테스트 (Sentry 없이)
router.get('/simple-message', (req, res) => {
    console.log('테스트 메시지 - Sentry 없이 실행');
    res.json({
        message: '테스트 성공',
        timestamp: new Date().toISOString()
    });
});

// Sentry를 사용한 에러 테스트 (조건부)
router.get('/sentry-error', (req, res) => {
    try {
        // Sentry 설정이 있는지 확인
        const hasSentry = process.env.SENTRY_DSN;

        if (hasSentry) {
            // Sentry가 설정되어 있으면 동적으로 import
            import('../config/sentry').then(({ sentryHelpers }) => {
                try {
                    throw new Error('Sentry 에러 테스트');
                } catch (error) {
                    sentryHelpers.captureError(error as Error);
                    res.status(500).json({
                        message: 'Error sent to Sentry',
                        error: (error as Error).message
                    });
                }
            }).catch(() => {
                // Sentry 설정 실패시 일반 에러 처리
                throw new Error('Sentry 설정 에러');
            });
        } else {
            throw new Error('SENTRY_DSN이 설정되지 않음');
        }
    } catch (error) {
        res.status(500).json({
            message: 'Error occurred',
            error: (error as Error).message,
            sentry: 'not configured'
        });
    }
});

export default router;