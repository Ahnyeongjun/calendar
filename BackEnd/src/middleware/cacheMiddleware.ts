import { Request, Response, NextFunction } from 'express';
import { CacheManager, createCacheKey } from '../config/cache';
import { Sentry } from '../config/sentry';

// 캐시 미들웨어 옵션
interface CacheMiddlewareOptions {
  ttl?: number; // 캐시 유지 시간 (초)
  keyGenerator?: (req: Request) => string; // 커스텀 키 생성 함수
  condition?: (req: Request) => boolean; // 캐시 조건
  skipCache?: (req: Request) => boolean; // 캐시 스킵 조건
  tags?: string[]; // 캐시 태그
}

// HTTP 캐시 미들웨어
export const cacheMiddleware = (options: CacheMiddlewareOptions = {}) => {
  const {
    ttl = 300, // 기본 5분
    keyGenerator,
    condition = () => true,
    skipCache = () => false,
    tags = []
  } = options;

  return async (req: Request, res: Response, next: NextFunction) => {
    // GET 요청이 아니거나 조건에 맞지 않으면 캐시 스킵
    if (req.method !== 'GET' || !condition(req) || skipCache(req)) {
      return next();
    }

    try {
      // 캐시 키 생성
      const cacheKey = keyGenerator 
        ? keyGenerator(req)
        : createCacheKey('http', req.method, req.originalUrl, JSON.stringify(req.query));

      // 캐시에서 확인
      const cachedResponse = await CacheManager.get<any>(cacheKey);
      
      if (cachedResponse) {
        // 캐시 히트
        res.set('X-Cache', 'HIT');
        res.set('X-Cache-Key', cacheKey);
        return res.json(cachedResponse);
      }

      // 캐시 미스 - 응답을 가로채서 캐시에 저장
      const originalJson = res.json;
      res.json = function(body: any) {
        // 성공적인 응답만 캐시
        if (res.statusCode >= 200 && res.statusCode < 300) {
          CacheManager.set(cacheKey, body, { ttl, tags })
            .catch(error => {
              console.error('캐시 저장 실패:', error);
              Sentry.captureException(error);
            });
        }
        
        res.set('X-Cache', 'MISS');
        res.set('X-Cache-Key', cacheKey);
        return originalJson.call(this, body);
      };

      next();
    } catch (error) {
      console.error('캐시 미들웨어 에러:', error);
      Sentry.captureException(error as Error, {
        tags: { component: 'cache-middleware' }
      });
      next(); // 에러가 있어도 계속 진행
    }
  };
};

// 프로젝트별 캐시 설정
export const projectCacheMiddleware = cacheMiddleware({
  ttl: 600, // 10분
  keyGenerator: (req) => {
    const userId = req.user?.id || 'anonymous';
    return createCacheKey('projects', userId, req.originalUrl);
  },
  condition: (req) => req.method === 'GET',
  tags: ['projects']
});

// 스케줄별 캐시 설정
export const scheduleCacheMiddleware = cacheMiddleware({
  ttl: 300, // 5분
  keyGenerator: (req) => {
    const userId = req.user?.id || 'anonymous';
    return createCacheKey('schedules', userId, req.originalUrl);
  },
  condition: (req) => req.method === 'GET',
  tags: ['schedules']
});

// 사용자별 캐시 설정
export const userCacheMiddleware = cacheMiddleware({
  ttl: 1800, // 30분
  keyGenerator: (req) => {
    const userId = req.user?.id || 'anonymous';
    return createCacheKey('users', userId, req.originalUrl);
  },
  condition: (req) => req.method === 'GET',
  tags: ['users']
});

// 캐시 무효화 미들웨어
export const invalidateCacheMiddleware = (tags: string[]) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    // 원본 응답 메서드들을 저장
    const originalJson = res.json;
    const originalSend = res.send;
    const originalEnd = res.end;

    // 응답 완료 후 캐시 무효화
    const invalidateCache = async () => {
      if (res.statusCode >= 200 && res.statusCode < 300) {
        try {
          for (const tag of tags) {
            await CacheManager.invalidateByTag(tag);
          }
          
          // 사용자별 캐시도 무효화
          if (req.user?.id) {
            await CacheManager.delPattern(`*:${req.user.id}:*`);
          }
        } catch (error) {
          console.error('캐시 무효화 실패:', error);
          Sentry.captureException(error as Error, {
            tags: { component: 'cache-invalidation' }
          });
        }
      }
    };

    // 응답 메서드 오버라이드
    res.json = function(body: any) {
      const result = originalJson.call(this, body);
      invalidateCache();
      return result;
    };

    res.send = function(body: any) {
      const result = originalSend.call(this, body);
      invalidateCache();
      return result;
    };

    res.end = function(chunk?: any, encoding?: any) {
      const result = originalEnd.call(this, chunk, encoding);
      invalidateCache();
      return result;
    };

    next();
  };
};

// 캐시 상태 확인 엔드포인트
export const cacheStatusMiddleware = async (req: Request, res: Response) => {
  try {
    const stats = await CacheManager.getStats();
    res.json({
      success: true,
      cache: stats,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    Sentry.captureException(error as Error);
    res.status(500).json({
      success: false,
      message: 'Failed to get cache status',
      error: error.message
    });
  }
};

// 캐시 플러시 엔드포인트 (개발/관리용)
export const cacheFlushMiddleware = async (req: Request, res: Response) => {
  try {
    const { pattern } = req.query;
    
    if (pattern && typeof pattern === 'string') {
      await CacheManager.delPattern(pattern);
      res.json({
        success: true,
        message: `Cache cleared for pattern: ${pattern}`
      });
    } else {
      // 전체 캐시 플러시는 위험하므로 개발 환경에서만
      if (process.env.NODE_ENV === 'development') {
        await CacheManager.delPattern('*');
        res.json({
          success: true,
          message: 'All cache cleared'
        });
      } else {
        res.status(403).json({
          success: false,
          message: 'Cache flush not allowed in production'
        });
      }
    }
  } catch (error) {
    Sentry.captureException(error as Error);
    res.status(500).json({
      success: false,
      message: 'Failed to flush cache',
      error: error.message
    });
  }
};
