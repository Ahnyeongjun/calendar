// Mock for Project Model
const mockProjects: any[] = [];

const ProjectModelMock = {
  create: jest.fn().mockImplementation(async (data: any) => {
    const project = {
      id: `project-${mockProjects.length + 1}`,
      ...data,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    mockProjects.push(project);
    return project;
  }),

  findAll: jest.fn().mockImplementation(async () => {
    return [...mockProjects].sort((a, b) => a.name.localeCompare(b.name));
  }),

  findById: jest.fn().mockImplementation(async (id: string) => {
    return mockProjects.find(p => p.id === id) || null;
  }),

  findByName: jest.fn().mockImplementation(async (name: string) => {
    return mockProjects.find(p => p.name === name) || null;
  }),

  findByNameCaseInsensitive: jest.fn().mockImplementation(async (name: string) => {
    return mockProjects.find(p => p.name.toLowerCase() === name.toLowerCase()) || null;
  }),

  update: jest.fn().mockImplementation(async (id: string, data: any) => {
    const projectIndex = mockProjects.findIndex(p => p.id === id);
    if (projectIndex === -1) return null;
    
    mockProjects[projectIndex] = {
      ...mockProjects[projectIndex],
      ...data,
      updatedAt: new Date()
    };
    return mockProjects[projectIndex];
  }),

  delete: jest.fn().mockImplementation(async (id: string) => {
    const projectIndex = mockProjects.findIndex(p => p.id === id);
    if (projectIndex === -1) return false;
    
    mockProjects.splice(projectIndex, 1);
    return true;
  }),

  // Test helper to clear mock data
  __clearMockData: () => {
    mockProjects.length = 0;
  }
};

module.exports = ProjectModelMock;
