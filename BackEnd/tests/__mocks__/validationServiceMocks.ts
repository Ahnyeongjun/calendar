export const validationServiceMocks = {
  validateCreateUserData: jest.fn(),
  validateUpdateUserData: jest.fn(),
  validateLoginData: jest.fn(),
  validatePassword: jest.fn(),
  validateEmail: jest.fn(),
  validateUsername: jest.fn(),

  // Default export
  default: {
    validateCreateUserData: jest.fn(),
    validateUpdateUserData: jest.fn(),
    validateLoginData: jest.fn(),
    validatePassword: jest.fn(),
    validateEmail: jest.fn(),
    validateUsername: jest.fn()
  }
};

export default validationServiceMocks;