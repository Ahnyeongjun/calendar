import express, { Express } from 'express';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { testConnection, initDatabase } from './config/db';

// 라우트 가져오기
import authRoutes from './routes/authRoutes';
import projectRoutes from './routes/projectRoutes';
import scheduleRoutes from './routes/scheduleRoutes';

// 환경 변수 로드
dotenv.config();

const app: Express = express();
const port = process.env.PORT || 3001;

// 미들웨어 설정
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// 라우트 설정
app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/schedules', scheduleRoutes);

// 기본 라우트
app.get('/', (_req, res) => {
  res.json({ message: 'Calendar API 서버에 오신 것을 환영합니다!' });
});

// 서버 시작
const startServer = async () => {
  try {
    // 데이터베이스 연결 테스트
    const isConnected = await testConnection();
    
    if (!isConnected) {
      console.error('데이터베이스 연결에 실패했습니다. 서버를 종료합니다.');
      process.exit(1);
    }
    
    // 데이터베이스 초기화
    await initDatabase();
    
    // 서버 시작
    app.listen(port, () => {
      console.log(`서버가 http://localhost:${port} 에서 실행 중입니다.`);
    });
  } catch (error) {
    console.error('서버 시작 중 오류 발생:', error);
    process.exit(1);
  }
};

startServer();