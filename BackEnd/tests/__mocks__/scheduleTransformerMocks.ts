// Mock for Schedule Data Transformer
const ScheduleTransformerMock = {
  apiToCreateData: jest.fn().mockImplementation((apiData: any, userId: string) => {
    return {
      title: apiData.title,
      description: apiData.description || null,
      date: new Date(apiData.startDate),
      startTime: new Date(apiData.startDate).toTimeString().substring(0, 5),
      endTime: new Date(apiData.endDate).toTimeString().substring(0, 5),
      status: apiData.status || 'PENDING',
      priority: apiData.priority || 'MEDIUM',
      projectId: apiData.projectId,
      userId
    };
  }),

  partialApiToUpdateData: jest.fn().mockImplementation((apiData: any) => {
    const updateData: any = {};
    
    if (apiData.title !== undefined) updateData.title = apiData.title;
    if (apiData.description !== undefined) updateData.description = apiData.description;
    if (apiData.startDate !== undefined) {
      updateData.date = new Date(apiData.startDate);
      updateData.startTime = new Date(apiData.startDate).toTimeString().substring(0, 5);
    }
    if (apiData.endDate !== undefined) {
      updateData.endTime = new Date(apiData.endDate).toTimeString().substring(0, 5);
    }
    if (apiData.status !== undefined) updateData.status = apiData.status;
    if (apiData.priority !== undefined) updateData.priority = apiData.priority;
    if (apiData.projectId !== undefined) updateData.projectId = apiData.projectId;
    
    return updateData;
  }),

  validateTimes: jest.fn().mockImplementation((startTime: string, endTime: string) => {
    if (startTime >= endTime) {
      throw new Error('Start time must be before end time');
    }
  }),

  validateDate: jest.fn().mockImplementation((date: Date) => {
    if (!(date instanceof Date) || isNaN(date.getTime())) {
      throw new Error('Invalid date');
    }
  }),

  validateUpdateTimes: jest.fn().mockImplementation((updateData: any, existingSchedule: any) => {
    const startTime = updateData.startTime || existingSchedule.startTime;
    const endTime = updateData.endTime || existingSchedule.endTime;
    
    if (startTime >= endTime) {
      throw new Error('Start time must be before end time');
    }
  })
};

module.exports = ScheduleTransformerMock;
