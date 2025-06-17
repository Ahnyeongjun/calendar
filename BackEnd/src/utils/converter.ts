// 시간 관련 유틸리티 함수들
export const timeUtils = {
  // MySQL TIME 형식(HH:MM:SS)을 HH:MM 형식으로 변환
  formatTimeFromMySQL: (time: any): string | null => {
    if (!time) return null;
    
    if (time instanceof Date) {
      // MySQL TIME 타입이 Date로 변환된 경우, 시간 부분만 추출
      const hours = time.getUTCHours().toString().padStart(2, '0');
      const minutes = time.getUTCMinutes().toString().padStart(2, '0');
      return `${hours}:${minutes}`;
    }
    
    if (typeof time === 'string') {
      // 이미 문자열인 경우 (HH:MM:SS 또는 HH:MM)
      if (time.includes(':')) {
        const parts = time.split(':');
        return `${parts[0].padStart(2, '0')}:${parts[1].padStart(2, '0')}`;
      }
    }
    
    return null;
  },

  // 시간 문자열을 Date 객체로 변환 (HH:MM 형식 또는 ISO datetime 형식 지원)
  parseTimeToDate: (time?: string): Date | null => {
    if (!time) {
      return null;
    }
    
    // ISO datetime 형식인 경우 (YYYY-MM-DDTHH:MM:SS.sssZ 또는 YYYY-MM-DDTHH:MM)
    if (time.includes('T') || time.includes('-')) {
      const date = new Date(time);
      if (isNaN(date.getTime())) {
        return null;
      }
      
      // MySQL TIME 타입을 위해 1970-01-01 기준으로 시간만 저장 (UTC 유지)
      const mysqlTimeDate = new Date('1970-01-01T00:00:00.000Z');
      mysqlTimeDate.setUTCHours(date.getUTCHours());
      mysqlTimeDate.setUTCMinutes(date.getUTCMinutes());
      mysqlTimeDate.setUTCSeconds(date.getUTCSeconds());
      mysqlTimeDate.setUTCMilliseconds(0);
      
      return mysqlTimeDate;
    }
    
    // HH:MM 형식인 경우
    if (time.includes(':')) {
      const [hours, minutes] = time.split(':').map(Number);
      if (isNaN(hours) || isNaN(minutes) || hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
        return null;
      }
      
      // MySQL TIME 타입은 '1970-01-01 HH:MM:SS' 형태로 저장됨
      const date = new Date('1970-01-01T00:00:00.000Z');
      date.setUTCHours(hours);
      date.setUTCMinutes(minutes);
      date.setUTCSeconds(0);
      date.setUTCMilliseconds(0);
      
      return date;
    }
    
    return null;
  },

  // 시간 유효성 검증 (HH:MM 형식 또는 ISO datetime 형식 지원)
  isValidTime: (timeStr: string): boolean => {
    // HH:MM 형식 검증
    const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (timeRegex.test(timeStr)) {
      return true;
    }
    
    // ISO datetime 형식 검증
    if (timeStr.includes('T') || timeStr.includes('-')) {
      const date = new Date(timeStr);
      return !isNaN(date.getTime());
    }
    
    return false;
  }
};

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
  },

  // 날짜와 시간을 합쳐서 ISO 문자열 생성
  combineDateTime: (dateStr: string, timeStr: string | null): string | null => {
    if (!timeStr) return null;
    return `${dateStr}T${timeStr}:00.000Z`;
  }
};

// 백엔드에서 받은 datetime 정보를 저장하기 위한 전역 변수
// (MySQL TIME 타입의 한계로 인한 임시 해결책)
let scheduleEndDateMap = new Map<string, string>();

// 스케줄 데이터 변환 (응답용) - endDate 원본 정보 유지
export const convertScheduleDate = (schedule: any, originalEndDate?: string) => {
  const formattedDate = dateUtils.formatDate(schedule.date);

  // 원본 datetime 정보 복원 (UTC 시간 유지)
  let startDate = null;
  let endDate = null;
  
  if (schedule.startTime) {
    const formattedStartTime = timeUtils.formatTimeFromMySQL(schedule.startTime);
    if (formattedStartTime) {
      startDate = `${formattedDate}T${formattedStartTime}:00.000Z`;
    }
  }
  
  if (schedule.endTime) {
    const formattedEndTime = timeUtils.formatTimeFromMySQL(schedule.endTime);
    if (formattedEndTime) {
      // 저장된 endDate 정보가 있는지 확인
      const storedEndDate = scheduleEndDateMap.get(schedule.id) || originalEndDate;
      if (storedEndDate) {
        endDate = storedEndDate;
      } else {
        // 기본적으로는 같은 날짜로 처리
        endDate = `${formattedDate}T${formattedEndTime}:00.000Z`;
      }
    }
  }

  return {
    ...schedule,
    // 기본 필드들
    date: formattedDate,
    
    // ISO datetime 형식으로 변환된 필드들
    startDate,
    endDate,
    
    // 원본 startTime, endTime 필드는 제거 (1970 문제 해결)
    startTime: undefined,
    endTime: undefined
  };
};

// endDate 정보를 저장하는 헬퍼 함수
export const storeEndDateInfo = (scheduleId: string, endDatetime: string) => {
  scheduleEndDateMap.set(scheduleId, endDatetime);
};

// Kafka 이벤트용 날짜 변환 함수
export const convertKafkaDate = (schedule: any) => {
  const dateStr = dateUtils.formatDate(schedule.date);
  
  let startDateTime = `${dateStr}T00:00:00.000Z`;
  let endDateTime = `${dateStr}T23:59:59.999Z`;
  
  if (schedule.startTime) {
    const startTime = timeUtils.formatTimeFromMySQL(schedule.startTime);
    if (startTime) {
      startDateTime = `${dateStr}T${startTime}:00.000Z`;
    }
  }
  
  if (schedule.endTime) {
    const endTime = timeUtils.formatTimeFromMySQL(schedule.endTime);
    if (endTime) {
      // 저장된 endDate 정보 확인
      const storedEndDate = scheduleEndDateMap.get(schedule.id);
      if (storedEndDate) {
        endDateTime = storedEndDate;
      } else {
        endDateTime = `${dateStr}T${endTime}:00.000Z`;
      }
    }
  }

  return {
    startDate: startDateTime,
    endDate: endDateTime
  };
};

// 프론트엔드 호환성을 위한 추가 변환 함수
export const convertForFrontend = (schedule: any) => {
  const converted = convertScheduleDate(schedule);
  
  return {
    ...converted,
    // 프론트엔드에서 기대하는 형식으로 변환
    project_id: schedule.projectId,
    user_id: schedule.userId,
    created_at: schedule.createdAt,
    updated_at: schedule.updatedAt
  };
};