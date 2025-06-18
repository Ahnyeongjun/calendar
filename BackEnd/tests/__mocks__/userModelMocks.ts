export const userModelMocks = {
  findByUsername: jest.fn(),
  findById: jest.fn(),
  findByIdOrThrow: jest.fn(),
  checkUsernameExists: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
  authenticate: jest.fn(),
  changePassword: jest.fn(),
  findMany: jest.fn(),
  getStats: jest.fn(),

  // Default export
  default: {
    findByUsername: jest.fn(),
    findById: jest.fn(),
    findByIdOrThrow: jest.fn(),
    checkUsernameExists: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    authenticate: jest.fn(),
    changePassword: jest.fn(),
    findMany: jest.fn(),
    getStats: jest.fn()
  }
};


export default userModelMocks;