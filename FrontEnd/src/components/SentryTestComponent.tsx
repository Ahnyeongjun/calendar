import React, { useState } from 'react';
import { 
  reportError, 
  reportMessage, 
  trackUserAction, 
  setSentryUser,
  clearSentryUser 
} from '@/util/sentryUtils';
import { sentryFetch } from '@/util/sentryHttpUtils';

/**
 * Sentry 테스트용 컴포넌트
 * 개발 환경에서 Sentry 기능을 테스트할 수 있습니다.
 */
export const SentryTestComponent: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);

  // 의도적으로 에러 발생시키기
  const triggerError = () => {
    trackUserAction('test_error_triggered');
    throw new Error('Test error for Sentry!');
  };

  // 커스텀 에러 보고
  const reportCustomError = () => {
    const error = new Error('Custom reported error');
    reportError(error, { 
      component: 'SentryTestComponent',
      action: 'manual_error_report',
      timestamp: new Date().toISOString()
    });
    trackUserAction('custom_error_reported');
  };

  // 커스텀 메시지 보고
  const reportCustomMessage = () => {
    reportMessage('Test message from React component', 'info', {
      component: 'SentryTestComponent',
      feature: 'message_testing'
    });
    trackUserAction('custom_message_sent');
  };

  // API 요청 테스트 (Sentry 헤더 포함)
  const testApiRequest = async () => {
    setIsLoading(true);
    trackUserAction('api_test_started');
    
    try {
      // 존재하지 않는 엔드포인트로 테스트 (에러 발생 예상)
      await sentryFetch('/api/test-sentry-headers', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });
    } catch (error) {
      console.log('Expected API error for testing:', error);
      // 이 에러는 sentryFetch에서 자동으로 Sentry에 보고됩니다
    } finally {
      setIsLoading(false);
      trackUserAction('api_test_completed');
    }
  };

  // 사용자 정보 설정 테스트
  const setTestUser = () => {
    setSentryUser({
      id: 'test-user-123',
      email: 'test@example.com',
      username: 'testuser'
    });
    trackUserAction('user_info_set');
    reportMessage('Test user information set in Sentry', 'info');
  };

  // 사용자 정보 초기화 테스트
  const clearTestUser = () => {
    clearSentryUser();
    trackUserAction('user_info_cleared');
    reportMessage('User information cleared from Sentry', 'info');
  };

  // 성능 테스트
  const testPerformance = () => {
    trackUserAction('performance_test_started');
    
    // 가짜 긴 작업 시뮬레이션
    const startTime = performance.now();
    
    // 동기적 작업 시뮬레이션
    let result = 0;
    for (let i = 0; i < 1000000; i++) {
      result += Math.random();
    }
    
    const endTime = performance.now();
    const duration = endTime - startTime;
    
    reportMessage(`Performance test completed in ${duration.toFixed(2)}ms`, 'info', {
      operation: 'sync_calculation',
      duration,
      iterations: 1000000
    });
    
    trackUserAction('performance_test_completed', { duration });
  };

  if (import.meta.env.MODE !== 'development') {
    return null; // 개발 환경에서만 표시
  }

  return (
    <div className="fixed bottom-4 right-4 bg-white border-2 border-gray-300 rounded-lg p-4 shadow-lg max-w-sm">
      <h3 className="font-bold text-lg mb-3 text-gray-800">🔍 Sentry 테스트</h3>
      <div className="space-y-2">
        <button
          onClick={triggerError}
          className="w-full px-3 py-2 bg-red-500 text-white rounded hover:bg-red-600 text-sm"
        >
          에러 발생시키기
        </button>
        
        <button
          onClick={reportCustomError}
          className="w-full px-3 py-2 bg-orange-500 text-white rounded hover:bg-orange-600 text-sm"
        >
          커스텀 에러 보고
        </button>
        
        <button
          onClick={reportCustomMessage}
          className="w-full px-3 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm"
        >
          메시지 보고
        </button>
        
        <button
          onClick={testApiRequest}
          disabled={isLoading}
          className="w-full px-3 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50 text-sm"
        >
          {isLoading ? '테스트 중...' : 'API 요청 테스트'}
        </button>
        
        <button
          onClick={setTestUser}
          className="w-full px-3 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 text-sm"
        >
          테스트 사용자 설정
        </button>
        
        <button
          onClick={clearTestUser}
          className="w-full px-3 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 text-sm"
        >
          사용자 정보 초기화
        </button>
        
        <button
          onClick={testPerformance}
          className="w-full px-3 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600 text-sm"
        >
          성능 테스트
        </button>
      </div>
      
      <p className="text-xs text-gray-500 mt-3">
        Sentry 대시보드에서 이벤트를 확인하세요
      </p>
    </div>
  );
};

export default SentryTestComponent;
