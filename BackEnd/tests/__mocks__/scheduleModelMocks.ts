// Mock for Schedule Model
const mockSchedules: any[] = [];

const ScheduleModelMock = {
  create: jest.fn().mockImplementation(async (data: any) => {
    const schedule = {
      id: `schedule-${mockSchedules.length + 1}`,
      ...data,
      createdAt: new Date(),
      updatedAt: new Date(),
      project: {
        id: data.projectId,
        name: 'Mock Project',
        color: '#FF0000'
      },
      user: {
        id: data.userId,
        username: 'mockuser',
        name: 'Mock User'
      }
    };
    mockSchedules.push(schedule);
    return schedule;
  }),

  findAll: jest.fn().mockImplementation(async (filters: any = {}) => {
    let filteredSchedules = [...mockSchedules];

    if (filters.userId) {
      filteredSchedules = filteredSchedules.filter(s => s.userId === filters.userId);
    }

    if (filters.date) {
      const targetDate = new Date(filters.date);
      filteredSchedules = filteredSchedules.filter(s => {
        const scheduleDate = new Date(s.date);
        return scheduleDate.toDateString() === targetDate.toDateString();
      });
    }

    if (filters.startDate && filters.endDate) {
      const startDate = new Date(filters.startDate);
      const endDate = new Date(filters.endDate);
      filteredSchedules = filteredSchedules.filter(s => {
        const scheduleDate = new Date(s.date);
        return scheduleDate >= startDate && scheduleDate <= endDate;
      });
    }

    if (filters.status) {
      filteredSchedules = filteredSchedules.filter(s => s.status === filters.status);
    }

    if (filters.priority) {
      filteredSchedules = filteredSchedules.filter(s => s.priority === filters.priority);
    }

    if (filters.projectId) {
      filteredSchedules = filteredSchedules.filter(s => s.projectId === filters.projectId);
    }

    // Sort by date and start time
    return filteredSchedules.sort((a, b) => {
      const dateA = new Date(a.date);
      const dateB = new Date(b.date);
      if (dateA.getTime() !== dateB.getTime()) {
        return dateA.getTime() - dateB.getTime();
      }
      return a.startTime.localeCompare(b.startTime);
    });
  }),

  findById: jest.fn().mockImplementation(async (id: string) => {
    const schedule = mockSchedules.find(s => s.id === id);
    if (!schedule) return null;
    
    return {
      ...schedule,
      project: {
        id: schedule.projectId,
        name: 'Mock Project',
        color: '#FF0000'
      },
      user: {
        id: schedule.userId,
        username: 'mockuser',
        name: 'Mock User'
      }
    };
  }),

  update: jest.fn().mockImplementation(async (id: string, data: any) => {
    const scheduleIndex = mockSchedules.findIndex(s => s.id === id);
    if (scheduleIndex === -1) return null;
    
    mockSchedules[scheduleIndex] = {
      ...mockSchedules[scheduleIndex],
      ...data,
      updatedAt: new Date()
    };
    
    return {
      ...mockSchedules[scheduleIndex],
      project: {
        id: mockSchedules[scheduleIndex].projectId,
        name: 'Mock Project',
        color: '#FF0000'
      },
      user: {
        id: mockSchedules[scheduleIndex].userId,
        username: 'mockuser',
        name: 'Mock User'
      }
    };
  }),

  delete: jest.fn().mockImplementation(async (id: string) => {
    const scheduleIndex = mockSchedules.findIndex(s => s.id === id);
    if (scheduleIndex === -1) return false;
    
    mockSchedules.splice(scheduleIndex, 1);
    return true;
  }),

  // Test helper to clear mock data
  __clearMockData: () => {
    mockSchedules.length = 0;
  }
};

module.exports = ScheduleModelMock;
