// 모든 Mock 객체들을 한 곳에서 export
export { authMocks } from './authMocks';
export { prismaMocks } from './prismaMocks';
export { loggerMocks } from './loggerMocks';
export { errorHandlerMocks } from './errorHandlerMocks';
export { userModelMocks } from './userModelMocks';
export { validationServiceMocks } from './validationServiceMocks';

// 편의를 위한 통합 객체
export const allMocks = {
  auth: () => require('./authMocks').authMocks,
  prisma: () => require('./prismaMocks').prismaMocks,
  logger: () => require('./loggerMocks').loggerMocks,
  errorHandler: () => require('./errorHandlerMocks').errorHandlerMocks,
  userModel: () => require('./userModelMocks').userModelMocks,
  validationService: () => require('./validationServiceMocks').validationServiceMocks
};
