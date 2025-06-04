// 공통 날짜 변환 함수
export const convertScheduleDate = (schedule: any) => {
    const dateStr = schedule.date instanceof Date
        ? schedule.date.toISOString().split('T')[0]
        : schedule.date;

    const createFullDateTime = (dateStr: string, timeStr: any) => {
        if (!timeStr) return new Date(dateStr + 'T00:00:00.000Z');

        let timeString = '';
        if (timeStr instanceof Date) {
            timeString = timeStr.toISOString().split('T')[1].split('.')[0];
        } else {
            timeString = timeStr;
        }

        return new Date(dateStr + 'T' + timeString + '.000Z');
    };

    return {
        ...schedule,
        date: dateStr,
        startTime: schedule.startTime ? createFullDateTime(dateStr, schedule.startTime) : null,
        endTime: schedule.endTime ? createFullDateTime(dateStr, schedule.endTime) : null,
        formattedDate: dateStr,
        formattedStartTime: schedule.startTime ? createFullDateTime(dateStr, schedule.startTime).toISOString() : null,
        formattedEndTime: schedule.endTime ? createFullDateTime(dateStr, schedule.endTime).toISOString() : null
    };
};

// Kafka 이벤트용 날짜 변환 함수
export const convertKafkaDate = (schedule: any) => {
    const dateStr = schedule.date instanceof Date
        ? schedule.date.toISOString().split('T')[0]
        : schedule.date;

    const createFullDateTime = (dateStr: string, timeStr: any) => {
        if (!timeStr) return new Date(dateStr + 'T00:00:00.000Z');

        let timeString = '';
        if (timeStr instanceof Date) {
            timeString = timeStr.toISOString().split('T')[1].split('.')[0];
        } else {
            timeString = timeStr;
        }

        return new Date(dateStr + 'T' + timeString + '.000Z');
    };

    const startDateTime = schedule.startTime ? createFullDateTime(dateStr, schedule.startTime) : new Date(dateStr + 'T00:00:00.000Z');
    const endDateTime = schedule.endTime ? createFullDateTime(dateStr, schedule.endTime) : new Date(dateStr + 'T23:59:59.999Z');

    return {
        startDate: startDateTime.toISOString(),
        endDate: endDateTime.toISOString()
    };
};

