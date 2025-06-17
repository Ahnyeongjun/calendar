import Redis from 'ioredis';
import NodeCache from 'node-cache';
import { Sentry } from './sentry';

// Redis 클라이언트 (프로덕션용)
let redisClient: Redis | null = null;

// 메모리 캐시 (개발용 또는 Redis 없을 때 fallback)
const memoryCache = new NodeCache({
  stdTTL: 600, // 기본 10분
  checkperiod: 120, // 2분마다 만료된 키 정리
  useClones: false, // 성능 향상
});

// Redis 초기화
export const initRedis = async (): Promise<void> => {
  if (!process.env.REDIS_URL && process.env.NODE_ENV === 'production') {
    console.warn('Production 환경에서 REDIS_URL이 설정되지 않았습니다. 메모리 캐시를 사용합니다.');
    return;
  }
  
  if (!process.env.REDIS_URL) {
    console.log('REDIS_URL이 없습니다. 메모리 캐시를 사용합니다.');
    return;
  }

  try {
    redisClient = new Redis(process.env.REDIS_URL, {
      retryDelayOnFailover: 100,
      maxRetriesPerRequest: 3,
      lazyConnect: true,
      connectTimeout: 5000,
      commandTimeout: 5000,
    });

    await redisClient.ping();
    console.log('Redis 연결 성공');

    // Redis 이벤트 핸들러
    redisClient.on('error', (error) => {
      console.error('Redis 에러:', error);
      Sentry.captureException(error, {
        tags: { component: 'redis' }
      });
    });

    redisClient.on('connect', () => {
      console.log('Redis 연결됨');
    });

    redisClient.on('disconnect', () => {
      console.log('Redis 연결 해제됨');
    });

  } catch (error) {
    console.error('Redis 연결 실패:', error);
    Sentry.captureException(error as Error, {
      tags: { component: 'redis-init' }
    });
    redisClient = null;
  }
};

// 캐시 인터페이스
export interface CacheOptions {
  ttl?: number; // seconds
  tags?: string[]; // 캐시 무효화를 위한 태그
}

export class CacheManager {
  // 캐시 저장
  static async set(key: string, value: any, options: CacheOptions = {}): Promise<void> {
    const { ttl = 600 } = options; // 기본 10분
    const serializedValue = JSON.stringify({
      data: value,
      timestamp: Date.now(),
      tags: options.tags || [],
    });

    try {
      if (redisClient) {
        if (ttl > 0) {
          await redisClient.setex(key, ttl, serializedValue);
        } else {
          await redisClient.set(key, serializedValue);
        }
      } else {
        // 메모리 캐시 사용
        memoryCache.set(key, serializedValue, ttl);
      }
    } catch (error) {
      console.error(`캐시 저장 실패 (${key}):`, error);
      Sentry.captureException(error as Error, {
        tags: { component: 'cache-set', key }
      });
    }
  }

  // 캐시 조회
  static async get<T>(key: string): Promise<T | null> {
    try {
      let serializedValue: string | null = null;

      if (redisClient) {
        serializedValue = await redisClient.get(key);
      } else {
        serializedValue = memoryCache.get(key) as string || null;
      }

      if (!serializedValue) {
        return null;
      }

      const cached = JSON.parse(serializedValue);
      return cached.data as T;
    } catch (error) {
      console.error(`캐시 조회 실패 (${key}):`, error);
      Sentry.captureException(error as Error, {
        tags: { component: 'cache-get', key }
      });
      return null;
    }
  }

  // 캐시 삭제
  static async del(key: string): Promise<void> {
    try {
      if (redisClient) {
        await redisClient.del(key);
      } else {
        memoryCache.del(key);
      }
    } catch (error) {
      console.error(`캐시 삭제 실패 (${key}):`, error);
      Sentry.captureException(error as Error, {
        tags: { component: 'cache-del', key }
      });
    }
  }

  // 패턴으로 캐시 삭제 (Redis만 지원)
  static async delPattern(pattern: string): Promise<void> {
    try {
      if (redisClient) {
        const keys = await redisClient.keys(pattern);
        if (keys.length > 0) {
          await redisClient.del(...keys);
        }
      } else {
        // 메모리 캐시에서는 모든 키를 확인
        const keys = memoryCache.keys();
        keys.forEach(key => {
          if (key.includes(pattern.replace('*', ''))) {
            memoryCache.del(key);
          }
        });
      }
    } catch (error) {
      console.error(`캐시 패턴 삭제 실패 (${pattern}):`, error);
      Sentry.captureException(error as Error, {
        tags: { component: 'cache-del-pattern', pattern }
      });
    }
  }

  // 태그로 캐시 무효화
  static async invalidateByTag(tag: string): Promise<void> {
    // 실제 구현에서는 태그 정보를 별도로 관리해야 함
    // 여기서는 간단히 패턴으로 처리
    await this.delPattern(`*${tag}*`);
  }

  // 캐시 통계
  static async getStats(): Promise<any> {
    if (redisClient) {
      try {
        const info = await redisClient.info('memory');
        return {
          type: 'redis',
          info: info
        };
      } catch (error) {
        return { type: 'redis', error: error.message };
      }
    } else {
      return {
        type: 'memory',
        keys: memoryCache.keys().length,
        stats: memoryCache.getStats()
      };
    }
  }
}

// 캐시 키 생성 헬퍼
export const createCacheKey = (prefix: string, ...parts: (string | number)[]): string => {
  return `calendar:${prefix}:${parts.join(':')}`;
};

// 캐시 데코레이터 (TypeScript 데코레이터)
export const cached = (ttl: number = 600, keyPrefix?: string) => {
  return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      // 캐시 키 생성
      const key = createCacheKey(
        keyPrefix || `${target.constructor.name}.${propertyName}`,
        ...args.map(arg => JSON.stringify(arg))
      );

      // 캐시에서 확인
      const cached = await CacheManager.get(key);
      if (cached !== null) {
        return cached;
      }

      // 캐시 미스, 원본 메서드 실행
      const result = await method.apply(this, args);
      
      // 결과 캐시
      await CacheManager.set(key, result, { ttl });
      
      return result;
    };
  };
};

export { redisClient };
