const jwt = require('jsonwebtoken');

// JWT 토큰 생성과 검증 모킹
export const authMiddleware = (req: any, res: any, next: any) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    try {
      const decoded = jwt.verify(token, 'test-secret');
      req.user = decoded;
      next();
    } catch (error) {
      return res.status(401).json({
        success: false,
        error: '유효하지 않은 토큰입니다.',
        timestamp: new Date().toISOString(),
        requestId: req.requestId || 'test-request-id'
      });
    }
  } else {
    return res.status(401).json({
      success: false,
      error: '토큰이 제공되지 않았습니다.',
      timestamp: new Date().toISOString(),
      requestId: req.requestId || 'test-request-id'
    });
  }
};

// 선택적 인증 미들웨어
export const optionalAuthMiddleware = (req: any, res: any, next: any) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    try {
      const decoded = jwt.verify(token, 'test-secret');
      req.user = decoded;
    } catch (error) {
      // 선택적 인증에서는 에러가 발생해도 계속 진행
    }
  }
  next();
};

// 토큰 새로고침 미들웨어
export const refreshTokenIfNeeded = (req: any, res: any, next: any) => {
  // 테스트에서는 단순히 next() 호출
  next();
};

// 역할 기반 권한 확인 (테스트용)
export const requireRole = (roles: string[]) => {
  return (req: any, res: any, next: any) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: '인증이 필요합니다.',
        timestamp: new Date().toISOString(),
        requestId: req.requestId || 'test-request-id'
      });
    }
    next();
  };
};

// 본인 확인 미들웨어
export const requireSelfOrAdmin = (req: any, res: any, next: any) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: '인증이 필요합니다.',
      timestamp: new Date().toISOString(),
      requestId: req.requestId || 'test-request-id'
    });
  }

  const targetUserId = req.params.userId || req.params.id;
  if (req.user.id !== targetUserId) {
    return res.status(401).json({
      success: false,
      error: '본인의 정보만 접근할 수 있습니다.',
      timestamp: new Date().toISOString(),
      requestId: req.requestId || 'test-request-id'
    });
  }

  next();
};

// JWT 토큰 생성
export const generateToken = (user: any) => {
  return jwt.sign(user, 'test-secret', { expiresIn: '1h' });
};

// JWT 토큰 검증
export const verifyToken = (token: string) => {
  try {
    return jwt.verify(token, 'test-secret');
  } catch (error) {
    throw new Error('유효하지 않은 토큰입니다.');
  }
};

// 미들웨어들을 객체로 묶어서 내보내기
export const authMiddlewares = {
  auth: authMiddleware,
  optionalAuth: optionalAuthMiddleware,
  requireRole,
  requireSelfOrAdmin,
  refreshTokenIfNeeded,
  generateToken,
  verifyToken
};

export default authMiddleware;