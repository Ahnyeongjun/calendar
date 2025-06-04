import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { testConnection, seedDatabase } from './config/prisma';
import authRoutes from './routes/authRoutes';
import projectRoutes from './routes/projectRoutes';
import scheduleRoutes from './routes/scheduleRoutes';

dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

// 미들웨어
app.use(cors());
app.use(express.json());

// 로그는 개발 환경에서만
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('combined'));
}

// 라우트
app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/schedules', scheduleRoutes);

app.get('/', (_req, res) => {
  res.json({ message: 'Calendar API Server' });
});

async function startServer(): Promise<void> {
  try {
    const isConnected = await testConnection();
    
    if (!isConnected) {
      console.error('Database connection failed');
      process.exit(1);
    }
    
    await seedDatabase();
    
    app.listen(port, () => {
      console.log(`Server running on http://localhost:${port}`);
    });
  } catch (error) {
    console.error('Server startup failed:', error);
    process.exit(1);
  }
}

startServer();
