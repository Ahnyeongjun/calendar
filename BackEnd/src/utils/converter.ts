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

  // HH:MM 형식의 시간을 Date 객체로 변환 (MySQL TIME 타입용)
  parseTimeToDate: (time?: string): Date | null => {
    if (!time || !time.includes(':')) {
      return null;
    }
    
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
  },

  // 시간 유효성 검증
  isValidTime: (timeStr: string): boolean => {
    const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
    return timeRegex.test(timeStr);
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

// 스케줄 데이터 변환 (응답용)
export const convertScheduleDate = (schedule: any) => {
  const formattedDate = dateUtils.formatDate(schedule.date);
  const formattedStartTime = timeUtils.formatTimeFromMySQL(schedule.startTime);
  const formattedEndTime = timeUtils.formatTimeFromMySQL(schedule.endTime);

  return {
    ...schedule,
    // 기본 필드들
    date: formattedDate,
    start_date: formattedStartTime,
    end_date: formattedEndTime,
    
    // 편의를 위한 추가 필드들
    formattedStartDateTime: dateUtils.combineDateTime(formattedDate, formattedStartTime),
    formattedEndDateTime: dateUtils.combineDateTime(formattedDate, formattedEndTime),
    
    // 원본 startTime, endTime 필드는 제거 (1970 문제 해결)
    startTime: undefined,
    endTime: undefined
  };
};

// Kafka 이벤트용 날짜 변환 함수
export const convertKafkaDate = (schedule: any) => {
  const dateStr = dateUtils.formatDate(schedule.date);
  const startTime = timeUtils.formatTimeFromMySQL(schedule.startTime);
  const endTime = timeUtils.formatTimeFromMySQL(schedule.endTime);
  
  const startDateTime = startTime 
    ? `${dateStr}T${startTime}:00.000Z`
    : `${dateStr}T00:00:00.000Z`;
  
  const endDateTime = endTime 
    ? `${dateStr}T${endTime}:00.000Z`
    : `${dateStr}T23:59:59.999Z`;

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