// 새 스키마에 맞는 간단한 유틸리티 함수들

// 날짜 관련 유틸리티 함수들
export const dateUtils = {
  // 날짜를 YYYY-MM-DD 형식으로 변환
  formatDate: (date: any): string => {
    if (!date) return '';
    
    if (date instanceof Date) {
      return date.toISOString().split('T')[0];
    }
    
    if (typeof date === 'string') {
      return new Date(date).toISOString().split('T')[0];
    }
    
    return '';
  },

  // 현재 날짜를 YYYY-MM-DD 형식으로
  today: (): string => {
    return new Date().toISOString().split('T')[0];
  },

  // 날짜 유효성 검증
  isValidDate: (dateStr: string): boolean => {
    const date = new Date(dateStr);
    return !isNaN(date.getTime());
  }
};

// 새 스키마에서는 startDate, endDate가 DateTime 필드이므로 
// 복잡한 변환 없이 직접 사용 가능
export const convertScheduleDate = (schedule: any) => {
  return {
    ...schedule,
    // ISO 문자열로 변환 (필요한 경우)
    startDate: schedule.startDate instanceof Date ? schedule.startDate.toISOString() : schedule.startDate,
    endDate: schedule.endDate instanceof Date ? schedule.endDate.toISOString() : schedule.endDate
  };
};

// Kafka 이벤트용 데이터 변환 (새 스키마용)
export const convertKafkaDate = (schedule: any) => {
  return {
    startDate: schedule.startDate instanceof Date ? schedule.startDate.toISOString() : schedule.startDate,
    endDate: schedule.endDate instanceof Date ? schedule.endDate.toISOString() : schedule.endDate
  };
};

// endDate 정보 저장 함수 (새 스키마에서는 불필요하지만 호환성 유지)
export const storeEndDateInfo = (scheduleId: string, endDatetime: string) => {
  // 새 스키마에서는 필요 없음
  console.log('storeEndDateInfo is deprecated in new schema');
};

// 프론트엔드 호환성을 위한 변환 함수
export const convertForFrontend = (schedule: any) => {
  return {
    ...schedule,
    // 프론트엔드에서 기대하는 형식으로 변환
    project_id: schedule.projectId,
    user_id: schedule.userId,
    created_at: schedule.createdAt,
    updated_at: schedule.updatedAt,
    start_date: schedule.startDate,
    end_date: schedule.endDate
  };
};
